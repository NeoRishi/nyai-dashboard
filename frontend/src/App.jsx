import React, { useState, useEffect, useRef, useCallback } from 'react'

// ── API helper ──────────────────────────────────────────────────
const API = '/api'
const fetchJSON = async (url) => {
  const res = await fetch(`${API}${url}`)
  return res.json()
}
const postJSON = async (url, data) => {
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// ── Color system ────────────────────────────────────────────────
const VERDICT_COLORS = {
  accepted:  { bg: '#E1F5EE', text: '#085041', dot: '#1D9E75', label: 'Accepted' },
  rejected:  { bg: '#FCEBEB', text: '#791F1F', dot: '#E24B4A', label: 'Rejected' },
  suspended: { bg: '#FAEEDA', text: '#633806', dot: '#EF9F27', label: 'Suspended' },
  revised:   { bg: '#E6F1FB', text: '#0C447C', dot: '#378ADD', label: 'Revised' },
  uncertain: { bg: '#F1EFE8', text: '#444441', dot: '#888780', label: 'Uncertain' },
}

const PRAMANA_COLORS = {
  pratyaksha: { bg: '#E1F5EE', text: '#085041', label: 'Pratyaksha — direct perception' },
  anumana:    { bg: '#E6F1FB', text: '#0C447C', label: 'Anumāna — inference' },
  shabda:     { bg: '#EEEDFE', text: '#3C3489', label: 'Śabda — testimony' },
  upamana:    { bg: '#FAEEDA', text: '#633806', label: 'Upamāna — analogy' },
}

// ── Shared components ───────────────────────────────────────────
function VerdictTag({ verdict }) {
  const c = VERDICT_COLORS[verdict] || VERDICT_COLORS.uncertain
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 10,
      background: c.bg, color: c.text,
    }}>{c.label}</span>
  )
}

function PramanaPill({ type, short }) {
  const c = PRAMANA_COLORS[type]
  if (!c) return null
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 500,
      padding: '2px 8px', borderRadius: 10,
      background: c.bg, color: c.text,
    }}>{short ? type : c.label}</span>
  )
}

// ── Pancavayava Chain (animated) ─────────────────────────────────
function PancavayavaChain({ steps, animate, onComplete }) {
  const [visibleSteps, setVisibleSteps] = useState(animate ? 0 : steps.length)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!animate) { setVisibleSteps(steps.length); return }
    setVisibleSteps(0)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setVisibleSteps(i)
      if (i >= steps.length) {
        clearInterval(timerRef.current)
        onComplete?.()
      }
    }, 800)
    return () => clearInterval(timerRef.current)
  }, [steps, animate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, idx) => {
        const visible = idx < visibleSteps
        const isFallacy = step.is_fallacy_step
        const accentColor = isFallacy ? '#A32D2D' : '#534AB7'
        const dotBg = isFallacy ? '#FCEBEB' : '#EEEDFE'
        const dotColor = isFallacy ? '#A32D2D' : '#534AB7'

        return (
          <div key={idx} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            position: 'relative', padding: '8px 0',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, flexShrink: 0, marginTop: 2,
              background: dotBg, color: dotColor,
            }}>{isFallacy ? '!' : step.step_number}</div>
            {idx < steps.length - 1 && (
              <div style={{
                position: 'absolute', left: 10, top: 30,
                width: 1, height: 'calc(100% - 14px)',
                background: accentColor, opacity: 0.2,
              }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: accentColor, letterSpacing: 0.3,
              }}>
                {step.sanskrit_name}
                <span style={{ fontWeight: 400, opacity: 0.7 }}> ({step.english_name})</span>
              </div>
              <div style={{
                fontSize: 12.5, color: 'var(--text-secondary)',
                lineHeight: 1.5, marginTop: 3,
              }}>{step.content}</div>
              {step.pramana_used && (
                <div style={{ marginTop: 4 }}>
                  <PramanaPill type={step.pramana_used} short />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Naive Agent Panel ────────────────────────────────────────────
function NaivePanel({ result }) {
  const missed = result?.what_it_missed || []
  return (
    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#E1F5EE', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 10l3.5 3.5L15 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8, color: '#085041' }}>
        Accepted
      </div>
      <div style={{
        fontSize: 12, color: 'var(--text-tertiary)',
        marginTop: 6, lineHeight: 1.5,
      }}>
        {result?.explanation || 'No source evaluation. No fallacy check.'}
      </div>
      {missed.length > 0 && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 8,
          background: 'var(--surface-secondary)',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: 'var(--text-tertiary)',
            letterSpacing: 0.5, marginBottom: 6,
          }}>WHAT IT MISSED</div>
          {missed.map((m, i) => (
            <div key={i} style={{
              fontSize: 11.5, color: '#A32D2D',
              lineHeight: 1.5, marginBottom: 4,
            }}>• {m}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Scenario Sidebar ─────────────────────────────────────────────
function ScenarioSidebar({ scenarios, activeId, onSelect, onCustom }) {
  return (
    <div style={{
      borderRight: '0.5px solid var(--border)',
      padding: 16, minWidth: 210,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
        letterSpacing: 0.8, marginBottom: 14,
      }}>SCENARIOS</div>
      {scenarios.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            padding: '10px 12px', borderRadius: 8,
            marginBottom: 4, cursor: 'pointer',
            border: activeId === s.id ? '0.5px solid #AFA9EC' : '0.5px solid transparent',
            background: activeId === s.id ? '#EEEDFE' : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            S{s.number} / {s.domain}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, margin: '2px 0' }}>{s.title}</div>
          <VerdictTag verdict={s.expected_verdict} />
        </div>
      ))}
      <div
        onClick={onCustom}
        style={{
          borderTop: '0.5px solid var(--border)',
          marginTop: 12, paddingTop: 12, cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>
          CUSTOM INPUT
        </div>
        <div style={{ fontSize: 12, color: '#534AB7', marginTop: 4 }}>
          + Enter your own claim...
        </div>
      </div>
    </div>
  )
}

// ── Custom Claim Form ────────────────────────────────────────────
function CustomClaimForm({ onSubmit, loading }) {
  const [claim, setClaim] = useState('')
  const [evidenceItems, setEvidenceItems] = useState([
    { content: '', pramana_type: 'pratyaksha', source: '', tags: '', age_days: 0 },
  ])

  const addEvidence = () => {
    setEvidenceItems(prev => [...prev, { content: '', pramana_type: 'shabda', source: '', tags: '', age_days: 0 }])
  }

  const updateEvidence = (idx, field, value) => {
    setEvidenceItems(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const removeEvidence = (idx) => {
    if (evidenceItems.length > 1) setEvidenceItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    if (!claim.trim()) return
    onSubmit({
      claim,
      evidence: evidenceItems.map(e => ({
        ...e,
        tags: e.tags.split(',').map(t => t.trim()).filter(Boolean),
        age_days: parseInt(e.age_days) || 0,
      })),
    })
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{
        fontSize: 18, fontWeight: 500,
        fontFamily: "'Crimson Pro', serif",
        marginBottom: 16,
      }}>Evaluate a custom claim</div>

      <label style={labelStyle}>Claim</label>
      <input
        value={claim} onChange={e => setClaim(e.target.value)}
        placeholder="e.g., Turmeric milk helps with inflammation"
        style={inputStyle}
      />

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Evidence ({evidenceItems.length})</label>
        {evidenceItems.map((ev, idx) => (
          <div key={idx} style={{
            background: 'var(--surface-secondary)', borderRadius: 10,
            padding: 14, marginBottom: 8, position: 'relative',
          }}>
            {evidenceItems.length > 1 && (
              <button onClick={() => removeEvidence(idx)} style={{
                position: 'absolute', top: 8, right: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: 'var(--text-tertiary)',
              }}>×</button>
            )}
            <input
              value={ev.content} onChange={e => updateEvidence(idx, 'content', e.target.value)}
              placeholder="Evidence content..."
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ ...labelStyle, fontSize: 10 }}>Pramāṇa type</label>
                <select
                  value={ev.pramana_type}
                  onChange={e => updateEvidence(idx, 'pramana_type', e.target.value)}
                  style={inputStyle}
                >
                  <option value="pratyaksha">Pratyaksha (perception)</option>
                  <option value="anumana">Anumāna (inference)</option>
                  <option value="shabda">Śabda (testimony)</option>
                  <option value="upamana">Upamāna (analogy)</option>
                </select>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: 10 }}>Source</label>
                <input
                  value={ev.source} onChange={e => updateEvidence(idx, 'source', e.target.value)}
                  placeholder="Source name" style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 8 }}>
              <div>
                <label style={{ ...labelStyle, fontSize: 10 }}>Tags (comma-separated)</label>
                <input
                  value={ev.tags} onChange={e => updateEvidence(idx, 'tags', e.target.value)}
                  placeholder="pitta, ginger, heating" style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: 10 }}>Age (days)</label>
                <input
                  type="number" value={ev.age_days}
                  onChange={e => updateEvidence(idx, 'age_days', e.target.value)}
                  style={inputStyle} min={0}
                />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addEvidence} style={btnOutlineStyle}>+ Add evidence</button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !claim.trim()}
        style={{ ...btnPrimaryStyle, marginTop: 16, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Evaluating...' : 'Evaluate claim'}
      </button>
    </div>
  )
}

// ── Comparison Table View ────────────────────────────────────────
function CompareView({ allResults }) {
  if (!allResults) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
  const { results, summary } = allResults
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 500, marginBottom: 4 }}>
        NyAI vs Naive — comparison across all scenarios
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        NyAI diverges from the naive baseline in {summary.divergent} out of {summary.total} scenarios.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['#', 'Scenario', 'Domain', 'NyAI verdict', 'Naive verdict', 'Diverges?'].map(h => (
                <th key={h} style={{
                  padding: '10px 12px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.scenario.id} style={{
                borderBottom: '0.5px solid var(--border)',
                background: r.diverges ? 'rgba(83, 74, 183, 0.04)' : 'transparent',
              }}>
                <td style={cellStyle}>S{r.scenario.number}</td>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 500 }}>{r.scenario.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.scenario.subtitle}</div>
                </td>
                <td style={cellStyle}>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: r.scenario.domain === 'wellness' ? '#EEEDFE' : '#F1EFE8',
                    color: r.scenario.domain === 'wellness' ? '#3C3489' : '#5F5E5A',
                    fontWeight: 500,
                  }}>{r.scenario.domain}</span>
                </td>
                <td style={cellStyle}><VerdictTag verdict={r.nyai_result.verdict} /></td>
                <td style={cellStyle}><VerdictTag verdict={r.naive_result.verdict} /></td>
                <td style={cellStyle}>
                  {r.diverges ? (
                    <span style={{ color: '#534AB7', fontWeight: 600, fontSize: 12 }}>Yes</span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginTop: 24,
      }}>
        {[
          { label: 'Total scenarios', value: summary.total },
          { label: 'NyAI catches problems', value: summary.divergent, accent: true },
          { label: 'Both agree', value: summary.agreement },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--surface-secondary)', borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{m.label}</div>
            <div style={{
              fontSize: 28, fontWeight: 600, marginTop: 4,
              color: m.accent ? '#534AB7' : 'var(--text-primary)',
            }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── About View ───────────────────────────────────────────────────
function AboutView() {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 680 }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 26, fontWeight: 500, marginBottom: 6 }}>
        NyAI™ — Nyāya-Grounded Reasoning
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
        An Artificial Human-Like Reasoning Agent built on Nyāya Darshan — India's 2,500-year-old school of logic and epistemology.
      </div>

      <Section title="How does NyAI reason?">
        <p>Every claim is evaluated through a pipeline grounded in classical Indian logic:</p>
        <ol>
          <li><strong>Pramāṇa labeling</strong> — every piece of evidence is tagged with its epistemic source type (perception, inference, testimony, or analogy)</li>
          <li><strong>Hetvābhāsa detection</strong> — five fallacy checks scan for overgeneralization, contradiction, stale evidence, and more</li>
          <li><strong>Pramāṇa gate</strong> — requires diverse, strong sources before accepting a claim</li>
          <li><strong>Pañcāvayava trace</strong> — generates a 5-step reasoning chain that any non-programmer can inspect</li>
        </ol>
      </Section>

      <Section title="Key insight">
        <p>Western XAI is <em>explainable by afterthought</em> — a black box decides first, then an explanation is added. NyAI is <em>explainable by design</em> — the reasoning IS the process.</p>
      </Section>

      <Section title="Philosophical framework">
        <p>Built within the Naiyāyika tradition (4 pramāṇas). Kālātīta is an acknowledged extension of classical Bādhita for practical AI freshness checks. The agent cannot truly have Pratyaksha — it uses user-reported data as a proxy.</p>
      </Section>

      <div style={{
        marginTop: 28, padding: 16, borderRadius: 10,
        background: '#EEEDFE', color: '#3C3489',
      }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Built by Hrishikesh — NeoRishi</div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
          Unriddling Inference 2026 · IIT Delhi · Problem Statement P2
        </div>
        <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>
          EPBA-14, IIM Calcutta · neorishi.io
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 15, fontWeight: 600, marginBottom: 8,
        fontFamily: "'Crimson Pro', serif",
      }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

// ── Walkthrough View ─────────────────────────────────────────────
function WalkthroughView({ scenarios, onNavigate }) {
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const autoRef = useRef(null)

  // Show scenarios S1, S3 (the two demo scenarios from pitch script)
  const demoScenarios = scenarios.filter(s => ['s1', 's3'].includes(s.id))
  const totalSteps = 4 // intro, s1, s3, summary

  const loadScenario = useCallback(async (id) => {
    setLoading(true)
    const data = await fetchJSON(`/scenarios/${id}`)
    setResult(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (step === 1) loadScenario('s1')
    else if (step === 2) loadScenario('s3')
    else setResult(null)
  }, [step, loadScenario])

  useEffect(() => {
    if (!autoplay) { clearInterval(autoRef.current); return }
    autoRef.current = setInterval(() => {
      setStep(prev => {
        if (prev >= totalSteps - 1) { setAutoplay(false); return prev }
        return prev + 1
      })
    }, 6000)
    return () => clearInterval(autoRef.current)
  }, [autoplay])

  const content = () => {
    if (step === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 32,
            fontWeight: 500, marginBottom: 12, lineHeight: 1.3,
          }}>
            "How do you know?"
          </div>
          <div style={{
            fontSize: 15, color: 'var(--text-secondary)',
            maxWidth: 480, margin: '0 auto', lineHeight: 1.7,
          }}>
            Every AI recommendation carries an implicit claim.
            NyAI makes the reasoning visible — so you can challenge it, trust it, or reject it.
          </div>
          <div style={{ marginTop: 32 }}>
            <button onClick={() => setStep(1)} style={btnPrimaryStyle}>
              Begin walkthrough →
            </button>
          </div>
        </div>
      )
    }

    if (step === totalSteps - 1) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 24,
            fontWeight: 500, marginBottom: 16,
          }}>
            We don't need to import Explainable AI from the West.
          </div>
          <div style={{
            fontFamily: "'Crimson Pro', serif", fontSize: 22,
            fontWeight: 600, color: '#534AB7', marginBottom: 24,
          }}>
            We have Nyāya Darshan.
          </div>
          <div style={{
            fontSize: 13, color: 'var(--text-secondary)',
            maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.7,
          }}>
            NyAI caught problems in 4 out of 5 scenarios that a source-agnostic agent missed — including a recommendation that could cause harm. Every decision comes with a 5-step reasoning trace that any non-programmer can inspect.
          </div>
          <button onClick={() => onNavigate('playground')} style={btnPrimaryStyle}>
            Explore all scenarios →
          </button>
        </div>
      )
    }

    if (loading) {
      return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading scenario...</div>
    }

    if (!result) return null

    const s = result.scenario
    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          background: 'var(--surface-secondary)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
            letterSpacing: 0.5, marginBottom: 6,
          }}>
            SCENARIO {s.number} — {s.domain.toUpperCase()} {step === 2 ? '• THE MONEY MOMENT' : '• HAPPY PATH'}
          </div>
          <div style={{
            fontSize: 17, fontWeight: 500,
            fontFamily: "'Crimson Pro', serif", lineHeight: 1.4,
          }}>"{s.claim}"</div>
          {result.nyai_result.belief?.evidence && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
              {result.nyai_result.belief.evidence.map((ev, i) => (
                <PramanaPill key={i} type={ev.pramana_type} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <AgentPanel title="NyAI agent" badge="Source-aware" badgeStyle="nyai">
            <PancavayavaChain steps={result.nyai_result.pancavayava || []} animate={true} />
            <VerdictBar verdict={result.nyai_result.verdict} />
          </AgentPanel>
          <AgentPanel title="Naive agent" badge="Source-agnostic" badgeStyle="naive">
            <NaivePanel result={result.naive_result} />
            <VerdictBar verdict={result.naive_result.verdict} />
          </AgentPanel>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 24px', borderBottom: '0.5px solid var(--border)',
      }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            width: i === step ? 32 : 8, height: 8, borderRadius: 4,
            background: i === step ? '#534AB7' : 'var(--surface-secondary)',
            cursor: 'pointer', transition: 'all 0.3s',
          }} />
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setAutoplay(!autoplay)}
          style={{ ...btnOutlineStyle, fontSize: 12, padding: '4px 12px' }}
        >{autoplay ? 'Pause' : 'Auto-play'}</button>
        <button
          onClick={() => setStep(prev => Math.min(prev + 1, totalSteps - 1))}
          disabled={step >= totalSteps - 1}
          style={{ ...btnPrimaryStyle, fontSize: 12, padding: '4px 12px' }}
        >Next →</button>
      </div>
      {content()}
    </div>
  )
}

function AgentPanel({ title, badge, badgeStyle, children }) {
  const isNyai = badgeStyle === 'nyai'
  return (
    <div style={{
      border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        <span style={{
          fontSize: 10, padding: '3px 10px', borderRadius: 10, fontWeight: 500,
          background: isNyai ? '#EEEDFE' : '#F1EFE8',
          color: isNyai ? '#3C3489' : '#5F5E5A',
        }}>{badge}</span>
      </div>
      <div style={{ flex: 1, padding: 16 }}>
        {children}
      </div>
    </div>
  )
}

function VerdictBar({ verdict }) {
  const c = VERDICT_COLORS[verdict] || VERDICT_COLORS.uncertain
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 0', marginTop: 8,
      borderTop: '0.5px solid var(--border)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{c.label}</span>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('walkthrough')
  const [scenarios, setScenarios] = useState([])
  const [activeScenario, setActiveScenario] = useState('s3')
  const [scenarioResult, setScenarioResult] = useState(null)
  const [allResults, setAllResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [customResult, setCustomResult] = useState(null)

  useEffect(() => {
    fetchJSON('/scenarios').then(d => setScenarios(d.scenarios || []))
  }, [])

  useEffect(() => {
    if (view === 'compare' && !allResults) {
      fetchJSON('/scenarios/all/compare').then(setAllResults)
    }
  }, [view])

  const loadScenario = useCallback(async (id) => {
    setCustomMode(false)
    setActiveScenario(id)
    setLoading(true)
    const data = await fetchJSON(`/scenarios/${id}`)
    setScenarioResult(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (view === 'playground' && !scenarioResult) {
      loadScenario(activeScenario)
    }
  }, [view])

  const handleCustomSubmit = async (input) => {
    setLoading(true)
    const data = await postJSON('/evaluate', input)
    setCustomResult(data)
    setLoading(false)
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      color: 'var(--text-primary)',
      minHeight: '100vh',
      background: 'var(--surface-primary)',
    }}>
      <style>{`
        :root {
          --text-primary: #1a1a1a;
          --text-secondary: #555;
          --text-tertiary: #888;
          --surface-primary: #fafaf8;
          --surface-secondary: #f2f1ec;
          --border: #ddd;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --text-primary: #e5e5e0;
            --text-secondary: #aaa;
            --text-tertiary: #777;
            --surface-primary: #141413;
            --surface-secondary: #1e1e1c;
            --border: #333;
          }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--surface-primary); }
        input, select, textarea {
          font-family: inherit; font-size: 13px;
          background: var(--surface-primary);
          border: 0.5px solid var(--border);
          border-radius: 6px; padding: 8px 10px;
          color: var(--text-primary); width: 100%;
          outline: none; transition: border-color 0.15s;
        }
        input:focus, select:focus { border-color: #534AB7; }
        ol, ul { padding-left: 20px; }
        li { margin-bottom: 6px; }
        p { margin-bottom: 8px; }
        strong { font-weight: 600; }
        em { font-style: italic; }
      `}</style>

      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--surface-primary)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #26215C, #534AB7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              color: '#AFA9EC', fontSize: 13, fontWeight: 600,
              fontFamily: "'Crimson Pro', serif",
            }}>Ny</span>
          </div>
          <div>
            <div style={{
              fontSize: 17, fontWeight: 600, letterSpacing: -0.3,
            }}>
              <span style={{ color: '#534AB7' }}>NyAI</span>
            </div>
            <div style={{
              fontSize: 9, color: 'var(--text-tertiary)',
              letterSpacing: 1, fontWeight: 500,
            }}>NYĀYA-GROUNDED REASONING</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 2 }}>
          {[
            { id: 'walkthrough', label: 'Walkthrough' },
            { id: 'playground', label: 'Playground' },
            { id: 'compare', label: 'Compare' },
            { id: 'about', label: 'About' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                fontSize: 13, border: 'none', cursor: 'pointer',
                background: view === tab.id ? '#EEEDFE' : 'transparent',
                color: view === tab.id ? '#534AB7' : 'var(--text-secondary)',
                fontWeight: view === tab.id ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      {view === 'walkthrough' && (
        <WalkthroughView scenarios={scenarios} onNavigate={setView} />
      )}

      {view === 'playground' && (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
          <ScenarioSidebar
            scenarios={scenarios}
            activeId={customMode ? null : activeScenario}
            onSelect={loadScenario}
            onCustom={() => { setCustomMode(true); setCustomResult(null) }}
          />
          <div style={{ flex: 1 }}>
            {customMode ? (
              customResult ? (
                <PlaygroundResult result={customResult} />
              ) : (
                <CustomClaimForm onSubmit={handleCustomSubmit} loading={loading} />
              )
            ) : loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                Running reasoning pipeline...
              </div>
            ) : scenarioResult ? (
              <PlaygroundResult result={scenarioResult} />
            ) : null}
          </div>
        </div>
      )}

      {view === 'compare' && <CompareView allResults={allResults} />}
      {view === 'about' && <AboutView />}
    </div>
  )
}

// ── Playground Result View ───────────────────────────────────────
function PlaygroundResult({ result }) {
  const nyai = result.nyai_result
  const naive = result.naive_result
  const scenario = result.scenario

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Claim header */}
      <div style={{
        background: 'var(--surface-secondary)', borderRadius: 12,
        padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
          letterSpacing: 0.5, marginBottom: 6,
        }}>CLAIM UNDER EVALUATION</div>
        <div style={{
          fontSize: 16, fontWeight: 500,
          fontFamily: "'Crimson Pro', serif", lineHeight: 1.4,
        }}>"{scenario?.claim || nyai?.claim}"</div>
        {nyai?.belief?.evidence && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
            {nyai.belief.evidence.map((ev, i) => (
              <PramanaPill key={i} type={ev.pramana_type} />
            ))}
          </div>
        )}
      </div>

      {/* Split panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <AgentPanel title="NyAI agent" badge="Source-aware" badgeStyle="nyai">
          {nyai?.pancavayava ? (
            <PancavayavaChain steps={nyai.pancavayava} animate={false} />
          ) : nyai?.revision ? (
            <div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#534AB7',
                marginBottom: 8,
              }}>Belief revision</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {nyai.revision.explanation}
              </div>
              {nyai.pancavayava && (
                <div style={{ marginTop: 12 }}>
                  <PancavayavaChain steps={nyai.pancavayava} animate={false} />
                </div>
              )}
            </div>
          ) : null}

          {/* Pramana gate */}
          {nyai?.pramana_gate && (
            <div style={{
              marginTop: 12, padding: 10, borderRadius: 8,
              background: nyai.pramana_gate.passed ? 'rgba(29,158,117,0.08)' : 'rgba(226,75,74,0.08)',
              fontSize: 11, color: nyai.pramana_gate.passed ? '#085041' : '#791F1F',
            }}>
              <span style={{ fontWeight: 600 }}>Pramāṇa gate: </span>
              {nyai.pramana_gate.explanation}
            </div>
          )}

          {/* Fallacy details */}
          {nyai?.detected_fallacies?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {nyai.detected_fallacies.map((f, i) => (
                <div key={i} style={{
                  padding: 10, borderRadius: 8, marginBottom: 6,
                  background: 'rgba(226,75,74,0.06)',
                  borderLeft: '3px solid #E24B4A',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#A32D2D' }}>
                    {f.fallacy_type} ({f.fallacy_english})
                    {f.is_extension && <span style={{ fontWeight: 400, opacity: 0.7 }}> — extension</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#791F1F', marginTop: 3 }}>
                    {f.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}

          <VerdictBar verdict={nyai?.verdict} />
        </AgentPanel>

        <AgentPanel title="Naive agent" badge="Source-agnostic" badgeStyle="naive">
          <NaivePanel result={naive} />
          <VerdictBar verdict={naive?.verdict} />
        </AgentPanel>
      </div>

      {result.diverges && (
        <div style={{
          padding: '10px 16px', borderRadius: 8,
          background: 'rgba(83, 74, 183, 0.06)',
          border: '0.5px solid rgba(83, 74, 183, 0.15)',
          fontSize: 12, color: '#534AB7',
        }}>
          <span style={{ fontWeight: 600 }}>Divergence detected: </span>
          NyAI reached a different conclusion than the naive agent. This is where source-aware reasoning changes outcomes.
        </div>
      )}
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-tertiary)', letterSpacing: 0.3,
  marginBottom: 4,
}
const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '0.5px solid var(--border)',
  background: 'var(--surface-primary)',
  color: 'var(--text-primary)',
  fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
}
const btnPrimaryStyle = {
  padding: '8px 20px', borderRadius: 8,
  background: '#534AB7', color: '#fff',
  fontSize: 13, fontWeight: 600, border: 'none',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
}
const btnOutlineStyle = {
  padding: '8px 16px', borderRadius: 8,
  background: 'transparent', color: 'var(--text-secondary)',
  fontSize: 13, border: '0.5px solid var(--border)',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
}
const cellStyle = {
  padding: '10px 12px', verticalAlign: 'top',
}
