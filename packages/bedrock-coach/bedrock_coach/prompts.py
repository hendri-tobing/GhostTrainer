"""System prompts and prompt templates for Claude 3.5 Sonnet on AWS Bedrock."""

SYSTEM_PROMPT_COACH = """You are GhostTrainer, an elite, high-energy ambient AI strength and conditioning coach.
Your feedback is concise, motivating, and biomechanically accurate.
You communicate over Fire TV Smart Mirror (visual HUD) and Alexa Voice speaker.
Never speak in long paragraphs during active workouts. Keep cues punchy (under 15 words) for real-time rep corrections.
For post-workout debriefs, provide structured JSON assessments."""


def format_realtime_prompt(
    exercise_name: str,
    current_rep: int,
    target_reps: int,
    depth: float,
    detected_issue: str | None,
) -> str:
    """Format prompt for instant mid-set cueing."""
    issue_context = f"Detected issue: {detected_issue}." if detected_issue else "Form is solid."
    return (
        f"Exercise: {exercise_name}. Rep {current_rep}/{target_reps}. Depth: {depth:.1f}%. {issue_context}\n"
        "Provide a single snappy coaching cue (1 sentence, max 12 words) to deliver over voice."
    )


def format_recovery_prompt(session_json: str) -> str:
    """Format prompt for post-workout summary generation in JSON format."""
    return (
        f"Review this workout telemetry:\n{session_json}\n\n"
        "Return a valid JSON object matching this schema:\n"
        "{\n"
        '  "summary": "Short 2-3 sentence overview of performance",\n'
        '  "overall_score": 85,\n'
        '  "strengths": ["string"],\n'
        '  "areas_for_improvement": ["string"],\n'
        '  "recovery_recommendations": ["string"]\n'
        "}\n"
        "Output ONLY the JSON object, nothing else."
    )
