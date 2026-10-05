"""Unit tests for Bedrock Coach package."""

import pytest
from bedrock_coach.models import (
    RepMetric,
    WorkoutSessionData,
    RealtimeCueRequest,
    RealtimeCueResponse,
    RecoveryBriefResponse,
)
from bedrock_coach.prompts import (
    format_realtime_prompt,
    format_recovery_prompt,
)
from bedrock_coach.client import BedrockCoachClient


def test_rep_metric_validation() -> None:
    rep = RepMetric(
        rep_number=1,
        depth_percentage=94.5,
        duration_seconds=1.8,
        detected_issue=None,
    )
    assert rep.rep_number == 1
    assert rep.depth_percentage == 94.5
    assert rep.detected_issue is None


def test_rep_metric_detected_issue_roundtrip() -> None:
    rep = RepMetric(
        rep_number=2,
        depth_percentage=88.0,
        duration_seconds=1.6,
        detected_issue="chest_sag",
    )
    assert rep.detected_issue == "chest_sag"
    dumped = rep.model_dump()
    assert dumped["detected_issue"] == "chest_sag"
    restored = RepMetric(**dumped)
    assert restored.detected_issue == "chest_sag"



def test_workout_session_data_serialization() -> None:
    session = WorkoutSessionData(
        user_name="Alex",
        exercise_name="Squat",
        target_reps=10,
        completed_reps=10,
        reps=[
            RepMetric(rep_number=1, depth_percentage=90.0, duration_seconds=1.5),
            RepMetric(rep_number=2, depth_percentage=95.0, duration_seconds=1.7),
        ],
        total_duration_seconds=30.0,
    )
    dump = session.model_dump()
    assert dump["target_reps"] == 10
    assert len(dump["reps"]) == 2


def test_format_realtime_prompt() -> None:
    prompt = format_realtime_prompt(
        exercise_name="Squat",
        current_rep=5,
        target_reps=10,
        depth=92.0,
        detected_issue="chest_sag",
    )
    assert "Rep 5/10" in prompt
    assert "chest_sag" in prompt


@pytest.mark.asyncio
async def test_bedrock_client_fallback() -> None:
    """When AWS credentials are dummy or missing, client falls back gracefully."""
    client = BedrockCoachClient(region_name="us-east-1")
    req = RealtimeCueRequest(
        current_rep=4,
        target_reps=10,
        latest_depth_percentage=75.0,
        detected_issue="knee_cave",
    )
    res = await client.generate_realtime_cue(req)
    assert isinstance(res, RealtimeCueResponse)
    assert res.urgency == "corrective"
    assert "knees" in res.cue_text.lower()


@pytest.mark.asyncio
async def test_bedrock_client_schema_invalid_json_fallback() -> None:
    """When Bedrock returns JSON that fails Pydantic schema validation, fallback is returned."""
    client = BedrockCoachClient(region_name="us-east-1")

    class FakeBotoClient:
        def converse(self, **kwargs: object) -> dict:
            return {
                "output": {
                    "message": {
                        "content": [{"text": '{"invalid_field": 123}'}]
                    }
                }
            }

    client._get_client = lambda: FakeBotoClient()

    session = WorkoutSessionData(
        user_name="Alex",
        exercise_name="Squat",
        target_reps=10,
        completed_reps=10,
        reps=[RepMetric(rep_number=1, depth_percentage=90.0, duration_seconds=1.5)],
        total_duration_seconds=30.0,
    )
    brief = await client.generate_recovery_brief(session)
    assert isinstance(brief, RecoveryBriefResponse)
    assert brief.overall_score >= 40
    assert "completing 10 of 10" in brief.summary

