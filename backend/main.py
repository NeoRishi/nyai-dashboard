"""
NyAI Dashboard API - FastAPI backend wrapping the NyAI reasoning engine.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import os

from nyai import NyAIAgent, NaiveAgent, Evidence, PramanaType
from nyai.scenarios import get_scenarios, run_scenario, run_all_scenarios

app = FastAPI(title="NyAI Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ──────────────────────────────────────────────

class EvidenceInput(BaseModel):
    content: str
    pramana_type: str  # pratyaksha, anumana, shabda, upamana
    source: str = ""
    tags: List[str] = Field(default_factory=list)
    age_days: int = 0


class ClaimInput(BaseModel):
    claim: str
    evidence: List[EvidenceInput]
    context: Optional[dict] = None


class RevisionInput(BaseModel):
    claim: str
    existing_evidence: List[EvidenceInput]
    new_evidence: EvidenceInput
    context: Optional[dict] = None


# ── API Routes ────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "NyAI v1.0"}


@app.get("/api/scenarios")
def list_scenarios():
    """Return all 5 scenario definitions (without running them)."""
    scenarios = get_scenarios()
    return {"scenarios": [
        {
            "id": s["id"],
            "number": s["number"],
            "domain": s["domain"],
            "title": s["title"],
            "subtitle": s["subtitle"],
            "claim": s["claim"],
            "expected_verdict": s["expected_verdict"],
        }
        for s in scenarios
    ]}


@app.get("/api/scenarios/all/compare")
def compare_all():
    """Run all scenarios and return comparison table."""
    results = run_all_scenarios()
    divergence_count = sum(1 for r in results if r["diverges"])
    return {
        "results": results,
        "summary": {
            "total": len(results),
            "divergent": divergence_count,
            "agreement": len(results) - divergence_count,
        },
    }


@app.get("/api/scenarios/{scenario_id}")
def run_single_scenario(scenario_id: str):
    """Run a specific scenario through both agents."""
    scenarios = get_scenarios()
    scenario = next((s for s in scenarios if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    return run_scenario(scenario)


@app.post("/api/evaluate")
def evaluate_custom_claim(input: ClaimInput):
    """Evaluate a custom claim through both agents."""
    now = datetime.now()

    evidence = [
        Evidence(
            content=e.content,
            pramana_type=PramanaType(e.pramana_type),
            source=e.source,
            tags=e.tags,
            timestamp=now - timedelta(days=e.age_days) if e.age_days else None,
        )
        for e in input.evidence
    ]

    evidence_timestamp = None
    for e in input.evidence:
        if e.age_days and e.pramana_type == "pratyaksha":
            evidence_timestamp = now - timedelta(days=e.age_days)

    nyai = NyAIAgent()
    naive = NaiveAgent()

    nyai_result = nyai.evaluate_claim(
        claim=input.claim,
        evidence=evidence,
        context=input.context,
        evidence_timestamp=evidence_timestamp,
    )
    naive_result = naive.evaluate_claim(input.claim, evidence)

    return {
        "nyai_result": nyai_result,
        "naive_result": naive_result,
        "diverges": nyai_result.get("verdict") != naive_result.get("verdict"),
    }


@app.post("/api/revise")
def revise_belief(input: RevisionInput):
    """Test belief revision with contradicting evidence."""
    existing = [
        Evidence(
            content=e.content,
            pramana_type=PramanaType(e.pramana_type),
            source=e.source,
            tags=e.tags,
        )
        for e in input.existing_evidence
    ]
    new_ev = Evidence(
        content=input.new_evidence.content,
        pramana_type=PramanaType(input.new_evidence.pramana_type),
        source=input.new_evidence.source,
        tags=input.new_evidence.tags,
    )

    nyai = NyAIAgent()
    naive = NaiveAgent()

    nyai_result = nyai.revise_belief(
        claim=input.claim,
        existing_evidence=existing,
        new_evidence=new_ev,
        context=input.context,
    )
    naive_result = naive.evaluate_claim(input.claim, existing + [new_ev])

    return {
        "nyai_result": nyai_result,
        "naive_result": naive_result,
        "diverges": nyai_result.get("verdict") != naive_result.get("verdict"),
    }


@app.get("/api/pramana-types")
def pramana_types():
    """Return available pramana types with descriptions."""
    from nyai import PRAMANA_STRENGTH, PRAMANA_ENGLISH
    return {
        "types": [
            {
                "value": pt.value,
                "english": PRAMANA_ENGLISH[pt],
                "strength": PRAMANA_STRENGTH[pt],
            }
            for pt in PramanaType
        ]
    }


# ── Serve frontend (production) ──────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
