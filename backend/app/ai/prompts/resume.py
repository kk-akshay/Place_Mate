def build_resume_prompts(
    *,
    target_role: str,
    resume_text: str,
) -> tuple[
    str,
    str,
]:
    system_prompt = (
        "You are a placement resume "
        "reviewer. Assess resumes for "
        "clarity, relevance, skills, "
        "achievements, ATS keywords and "
        "fit for the specified role. "
        "Do not invent experience that "
        "is not present in the resume."
    )

    user_prompt = (
        f"Target role: {target_role}\n\n"
        "Resume text:\n"
        f"{resume_text}\n\n"
        "Provide a fair score from 0 to "
        "100, concise summary, strengths, "
        "weaknesses, missing keywords, "
        "specific improvements, and an "
        "improved professional summary "
        "using only information supported "
        "by the resume."
    )

    return (
        system_prompt,
        user_prompt,
    )