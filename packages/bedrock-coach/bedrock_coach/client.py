"""AWS Bedrock client for GhostTrainer AI fitness coaching."""

import asyncio
import json
import logging
import os
from typing import Optional, Dict, Any
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import ValidationError

from .models import (
    RealtimeCueRequest,
    RealtimeCueResponse,
    WorkoutSessionData,
    RecoveryBriefResponse,
)
from .prompts import (
    SYSTEM_PROMPT_COACH,
    format_realtime_prompt,
    format_recovery_prompt,
)

logger = logging.getLogger(__name__)


class BedrockCoachClient:
    """Client for invoking Anthropic Claude (Sonnet 5.5 / 3.5) on AWS Bedrock."""

    def __init__(
        self,
        region_name: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> None:
        self.region_name = region_name or os.getenv("AWS_REGION", "us-east-1")
        self.model_id = model_id or os.getenv(
            "BEDROCK_MODEL_ID", "global.anthropic.claude-sonnet-5-5"
        )
        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        """Lazily initialize boto3 bedrock-runtime client."""
        if self._client is None:
            self._client = boto3.client(
                service_name="bedrock-runtime",
                region_name=self.region_name,
            )
        return self._client

    async def generate_realtime_cue(self, request: RealtimeCueRequest) -> RealtimeCueResponse:
        """Generate a punchy real-time corrective or motivational voice cue."""
        user_prompt = format_realtime_prompt(
            exercise_name=request.exercise_name,
            current_rep=request.current_rep,
            target_reps=request.target_reps,
            depth=request.latest_depth_percentage,
            detected_issue=request.detected_issue,
        )

        urgency = "normal"
        if request.detected_issue:
            urgency = "corrective"
        elif request.current_rep == request.target_reps:
            urgency = "milestone"

        try:
            client = self._get_client()
            response = await asyncio.to_thread(
                client.converse,
                modelId=self.model_id,
                system=[{"text": SYSTEM_PROMPT_COACH}],
                messages=[{"role": "user", "content": [{"text": user_prompt}]}],
                inferenceConfig={"maxTokens": 60, "temperature": 0.5},
            )
            output_text = response["output"]["message"]["content"][0]["text"].strip()
            return RealtimeCueResponse(cue_text=output_text, urgency=urgency)
        except (BotoCoreError, ClientError) as e:
            logger.warning("AWS Bedrock call failed, falling back to rule-based cue: %s", str(e))
            # Fallback deterministic rules for zero-failure ambient experience
            if request.detected_issue == "chest_sag":
                cue = "Keep your chest high and eyes forward!"
            elif request.detected_issue == "knee_cave":
                cue = "Push knees outward over toes!"
            elif request.detected_issue == "hip_sag":
                cue = "Engage your core, don't let your hips sag!"
            elif request.detected_issue == "elbow_flare":
                cue = "Tuck your elbows to 45 degrees!"
            elif request.latest_depth_percentage < 80.0:
                cue = "Go a little deeper for full range of motion!"
            elif request.current_rep == request.target_reps:
                cue = f"Final rep finished! Outstanding job, {request.user_name}!"
            else:
                cue = f"Looking sharp! Rep {request.current_rep} locked in."

            return RealtimeCueResponse(cue_text=cue, urgency=urgency)

    async def generate_recovery_brief(self, session: WorkoutSessionData) -> RecoveryBriefResponse:
        """Generate structured post-workout recovery brief."""
        session_json = session.model_dump_json(indent=2)
        user_prompt = format_recovery_prompt(session_json)

        try:
            client = self._get_client()
            response = await asyncio.to_thread(
                client.converse,
                modelId=self.model_id,
                system=[{"text": SYSTEM_PROMPT_COACH}],
                messages=[{"role": "user", "content": [{"text": user_prompt}]}],
                inferenceConfig={"maxTokens": 400, "temperature": 0.3},
            )
            output_text = response["output"]["message"]["content"][0]["text"].strip()
            # Clean up potential markdown formatting code blocks
            if output_text.startswith("```"):
                lines = output_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                output_text = "\n".join(lines).strip()

            parsed = json.loads(output_text)
            return RecoveryBriefResponse(**parsed)
        except (BotoCoreError, ClientError, json.JSONDecodeError, ValidationError) as e:
            logger.warning("AWS Bedrock call failed for recovery brief, generating baseline: %s", str(e))
            avg_depth = (
                sum(r.depth_percentage for r in session.reps) / len(session.reps)
                if session.reps
                else 85.0
            )
            score = min(100, int(avg_depth * (session.completed_reps / session.target_reps)))
            return RecoveryBriefResponse(
                summary=f"Great session completing {session.completed_reps} of {session.target_reps} {session.exercise_name}s.",
                overall_score=max(40, score),
                strengths=[f"Completed {session.completed_reps} repetitions", f"Maintained {avg_depth:.1f}% depth consistency"],
                areas_for_improvement=["Maintain consistent tempo during later reps"],
                recovery_recommendations=["5 minutes quad and hip flexor stretching", "Drink 500ml water with electrolytes"],
            )
