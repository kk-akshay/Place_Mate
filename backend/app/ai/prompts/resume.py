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
        "reviewer. First decide whether the "
        "supplied document text is a "
        "resume/CV written by a job "
        "applicant. Documents such as payment "
        "receipts, invoices, bank statements, "
        "ID documents (for example an Aadhaar "
        "card), certificates, tickets, "
        "letters and articles are NOT "
        "resumes, even if they contain a "
        "person's name. A resume is still a "
        "resume if it is weak, incomplete or "
        "for a different field than the "
        "target role - only mark a document "
        "as not a resume when it is clearly "
        "a different kind of document. "
        "If it is not a resume, set "
        "is_resume to false, name what it "
        "appears to be in detected_document_type "
        "(a short phrase with an article, e.g. "
        "'a bank payment receipt' or 'an Aadhaar "
        "card'), and leave every other field "
        "empty or at its default - do not score "
        "or analyse it. "
        "Only when it is genuinely a resume, "
        "set is_resume to true and assess it "
        "for clarity, relevance, skills, "
        "achievements, ATS keywords and fit "
        "for the specified role. Do not invent "
        "experience that is not present in "
        "the resume."
    )

    user_prompt = (
        f"Target role: {target_role}\n\n"
        "Document text:\n"
        f"{resume_text}\n\n"
        "If this is a resume, provide a fair "
        "score from 0 to 100, concise summary, "
        "strengths, weaknesses, missing "
        "keywords, specific improvements, and "
        "an improved professional summary "
        "using only information supported "
        "by the resume. If it is not a "
        "resume, only set is_resume to false "
        "and detected_document_type."
    )

    return (
        system_prompt,
        user_prompt,
    )