"""Smoke tests for the public API and built-in demonstration scenarios."""

import os
import sys
import unittest

from fastapi import HTTPException


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app, compare_all, health, run_single_scenario  # noqa: E402


class ApiSmokeTests(unittest.TestCase):
    def test_health(self):
        self.assertEqual(health(), {"status": "ok", "engine": "NyAI v1.0"})

    def test_compare_route_precedes_dynamic_scenario_route(self):
        """Prevent /all/compare from being captured as scenario_id='all'."""
        paths = [route.path for route in app.routes]
        self.assertLess(
            paths.index("/api/scenarios/all/compare"),
            paths.index("/api/scenarios/{scenario_id}"),
        )

    def test_all_scenarios_match_expected_verdicts(self):
        payload = compare_all()

        self.assertEqual(payload["summary"], {
            "total": 5,
            "divergent": 4,
            "agreement": 1,
        })
        for result in payload["results"]:
            self.assertEqual(
                result["nyai_result"]["verdict"],
                result["scenario"]["expected_verdict"],
            )

    def test_single_scenario(self):
        result = run_single_scenario("s1")
        self.assertEqual(result["scenario"]["id"], "s1")
        self.assertEqual(result["nyai_result"]["verdict"], "accepted")

    def test_unknown_scenario_returns_not_found(self):
        with self.assertRaises(HTTPException) as raised:
            run_single_scenario("not-real")
        self.assertEqual(raised.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
