"""GhostTrainer Bedrock Coach package."""

from .client import BedrockCoachClient
from .models import (
    RepMetric,
    WorkoutSessionData,
    RealtimeCueRequest,
    RealtimeCueResponse,
    RecoveryBriefResponse,
)

__all__ = [
    "BedrockCoachClient",
    "RepMetric",
    "WorkoutSessionData",
    "RealtimeCueRequest",
    "RealtimeCueResponse",
    "RecoveryBriefResponse",
]
