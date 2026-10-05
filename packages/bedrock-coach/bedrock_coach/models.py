"""Data models for Bedrock Coach biomechanical analysis and feedback."""

from typing import List, Optional
from pydantic import BaseModel, Field


class RepMetric(BaseModel):
    """Metric for an individual exercise repetition."""
    rep_number: int = Field(..., description="1-indexed repetition count")
    depth_percentage: float = Field(..., ge=0.0, le=100.0, description="Squat depth percentage (100% = parallel or below)")
    duration_seconds: float = Field(..., gt=0.0, description="Duration of repetition in seconds")
    detected_issue: Optional[str] = Field(None, description="Any detected form flaw (e.g. 'chest_sag', 'knee_cave', 'hip_sag')")


class WorkoutSessionData(BaseModel):
    """Aggregated session telemetry data from Fire TV."""
    user_name: str = Field("Alex", description="Name of the user")
    exercise_name: str = Field("Squat", description="Exercise performed")
    target_reps: int = Field(..., gt=0, description="Target repetitions")
    completed_reps: int = Field(..., ge=0, description="Completed repetitions")
    reps: List[RepMetric] = Field(default_factory=list, description="Per-rep telemetry")
    total_duration_seconds: float = Field(..., ge=0.0, description="Elapsed workout time")


class RealtimeCueRequest(BaseModel):
    """Realtime cue generation payload sent mid-workout."""
    user_name: str = "Alex"
    exercise_name: str = "Squat"
    current_rep: int
    target_reps: int
    latest_depth_percentage: float
    detected_issue: Optional[str] = None


class RealtimeCueResponse(BaseModel):
    """Motivational and corrective audio/visual cue."""
    cue_text: str
    urgency: str = Field("normal", description="'normal', 'corrective', or 'milestone'")


class RecoveryBriefResponse(BaseModel):
    """Post-workout AI analysis brief."""
    summary: str
    overall_score: int = Field(..., ge=0, le=100)
    strengths: List[str]
    areas_for_improvement: List[str]
    recovery_recommendations: List[str]
