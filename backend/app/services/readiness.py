from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.exceptions import (
    ResourceNotFoundError,
)
from app.models.user import User
from app.repositories.aptitude import (
    AptitudeRepository,
)
from app.repositories.coding import (
    CodingRepository,
)
from app.repositories.profile import (
    ProfileRepository,
)
from app.repositories.readiness import (
    ReadinessRepository,
)
from app.repositories.resume import (
    ResumeRepository,
)
from app.schemas.readiness import (
    ReadinessModule,
    ReadinessModuleKey,
    ReadinessRead,
    ReadinessRecommendation,
    ReadinessWeekly,
    RecommendationPriority,
    TopicInsight,
)
from app.services.preparation import (
    PreparationService,
)

MODULE_WEIGHTS: dict[
    ReadinessModuleKey,
    float,
] = {
    "aptitude": 0.30,
    "coding": 0.30,
    "resume": 0.20,
    "technical_interview": 0.10,
    "hr_interview": 0.10,
}

MODULE_LABELS: dict[
    ReadinessModuleKey,
    str,
] = {
    "aptitude": "Aptitude",
    "coding": "Coding",
    "resume": "Resume",
    "technical_interview": (
        "Technical Interview"
    ),
    "hr_interview": "HR Interview",
}

MODULE_HREFS: dict[
    ReadinessModuleKey,
    str | None,
] = {
    "aptitude": "/aptitude",
    "coding": "/coding",
    "resume": "/resume",
    "technical_interview": None,
    "hr_interview": None,
}

RECENT_APTITUDE_ATTEMPTS = 5
MIN_TOPIC_SAMPLE = 3
STRENGTH_THRESHOLD = 75.0
WEAKNESS_THRESHOLD = 50.0
RESUME_GOOD_SCORE = 70

PRIORITY_ORDER = {
    "high": 0,
    "medium": 1,
    "low": 2,
}

# Keywords in the student's declared weak areas,
# mapped to the module they relate to.
WEAK_AREA_KEYWORDS: dict[
    ReadinessModuleKey,
    tuple[str, ...],
] = {
    "aptitude": (
        "aptitude",
        "reasoning",
        "verbal",
        "quantitative",
    ),
    "coding": (
        "coding",
        "algorithm",
        "data structure",
        "dynamic",
        "debugging",
    ),
    "resume": (
        "resume",
    ),
    "technical_interview": (
        "technical interview",
        "technical fundamentals",
    ),
    "hr_interview": (
        "hr interview",
        "communication",
        "presentation",
    ),
}


class ReadinessService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

        self.repository = (
            ReadinessRepository(
                session,
            )
        )

        self.profiles = (
            ProfileRepository(
                session,
            )
        )

        self.aptitude = (
            AptitudeRepository(
                session,
            )
        )

        self.coding = (
            CodingRepository(
                session,
            )
        )

        self.resumes = (
            ResumeRepository(
                session,
            )
        )

    async def get_readiness(
        self,
        user: User,
    ) -> ReadinessRead:
        profile = (
            await self.profiles
            .get_by_user_id(
                user.id,
            )
        )

        if profile is None:
            raise ResourceNotFoundError(
                "Complete your student "
                "profile before viewing "
                "your progress."
            )

        attempts = (
            await self.aptitude
            .list_submitted_attempts(
                user.id,
            )
        )

        aptitude_topics = (
            await self.repository
            .aptitude_topic_stats(
                user.id,
            )
        )

        (
            coding_total,
            _coding_attempted,
            coding_solved,
            coding_submissions,
        ) = (
            await self.coding
            .get_progress_counts(
                user.id,
            )
        )

        coding_topics = (
            await self.repository
            .coding_topic_stats(
                user.id,
            )
        )

        analyses = (
            await self.resumes
            .list_analyses(
                user.id,
            )
        )

        weekly_summary = (
            await PreparationService(
                self.session,
            ).get_weekly_summary(
                user,
            )
        )

        declared_modules = (
            self._declared_modules(
                profile.weak_areas,
            )
        )

        # ----------------------------------------
        # Modules
        # ----------------------------------------

        modules: list[
            ReadinessModule
        ] = []

        gaps: list[str] = []

        recommendations: list[
            ReadinessRecommendation
        ] = []

        strengths: list[
            TopicInsight
        ] = []

        weaknesses: list[
            TopicInsight
        ] = []

        # Aptitude

        recent = attempts[
            :RECENT_APTITUDE_ATTEMPTS
        ]

        if recent:
            aptitude_score = round(
                sum(
                    attempt
                    .score_percent
                    or 0
                    for attempt
                    in recent
                )
                / len(recent),
                1,
            )

            modules.append(
                self._module(
                    "aptitude",
                    score=aptitude_score,
                    status="active",
                    summary=(
                        f"Average "
                        f"{aptitude_score:g}% "
                        f"over your last "
                        f"{len(recent)} "
                        f"attempt"
                        f"{'s' if len(recent) != 1 else ''}."
                    ),
                )
            )
        else:
            aptitude_score = None

            modules.append(
                self._module(
                    "aptitude",
                    score=None,
                    status="not_started",
                    summary=(
                        "No aptitude "
                        "attempts yet."
                    ),
                )
            )

            gaps.append(
                "You have not taken any "
                "aptitude tests yet."
            )

            recommendations.append(
                ReadinessRecommendation(
                    module="aptitude",
                    priority=self._priority(
                        "high",
                        "aptitude",
                        declared_modules,
                    ),
                    title=(
                        "Take your first "
                        "aptitude test"
                    ),
                    detail=(
                        "A short mixed test "
                        "gives Place-Mate a "
                        "baseline for your "
                        "quantitative, logical "
                        "and verbal skills."
                    ),
                    href="/aptitude",
                )
            )

        aptitude_weak: list[
            TopicInsight
        ] = []

        for (
            category,
            topic,
            total,
            correct,
        ) in aptitude_topics:
            if total < MIN_TOPIC_SAMPLE:
                continue

            topic_score = round(
                correct / total * 100,
                1,
            )

            insight = TopicInsight(
                module="aptitude",
                topic=topic,
                score=topic_score,
                sample_size=total,
                detail=(
                    f"{category.title()} · "
                    f"{correct} of {total} "
                    f"answers correct"
                ),
            )

            if (
                topic_score
                >= STRENGTH_THRESHOLD
            ):
                strengths.append(insight)

            elif (
                topic_score
                < WEAKNESS_THRESHOLD
            ):
                weaknesses.append(insight)
                aptitude_weak.append(insight)

        aptitude_weak.sort(
            key=lambda item: item.score,
        )

        for insight in aptitude_weak[:3]:
            recommendations.append(
                ReadinessRecommendation(
                    module="aptitude",
                    priority=self._priority(
                        "high",
                        "aptitude",
                        declared_modules,
                    ),
                    title=(
                        f"Practise "
                        f"{insight.topic}"
                    ),
                    detail=(
                        f"You answered "
                        f"{insight.score:g}% "
                        f"correctly across "
                        f"{insight.sample_size} "
                        f"questions. "
                        f"Review the "
                        f"explanations from "
                        f"your past results."
                    ),
                    href="/aptitude",
                )
            )

        if (
            aptitude_score is not None
            and not aptitude_weak
            and aptitude_score < 60
        ):
            recommendations.append(
                ReadinessRecommendation(
                    module="aptitude",
                    priority=self._priority(
                        "medium",
                        "aptitude",
                        declared_modules,
                    ),
                    title=(
                        "Keep practising "
                        "aptitude"
                    ),
                    detail=(
                        "Your recent average "
                        "is below 60%. More "
                        "timed attempts will "
                        "also reveal which "
                        "topics need work."
                    ),
                    href="/aptitude",
                )
            )

        # Coding

        if (
            coding_submissions > 0
            and coding_total > 0
        ):
            coding_score = round(
                coding_solved
                / coding_total
                * 100,
                1,
            )

            modules.append(
                self._module(
                    "coding",
                    score=coding_score,
                    status="active",
                    summary=(
                        f"{coding_solved} of "
                        f"{coding_total} "
                        f"problems solved."
                    ),
                )
            )
        else:
            coding_score = None

            modules.append(
                self._module(
                    "coding",
                    score=None,
                    status="not_started",
                    summary=(
                        "No coding "
                        "submissions yet."
                        if coding_total
                        else (
                            "No coding "
                            "problems are "
                            "available yet."
                        )
                    ),
                )
            )

            if coding_total:
                gaps.append(
                    "You have not "
                    "submitted any coding "
                    "solutions yet."
                )

                recommendations.append(
                    ReadinessRecommendation(
                        module="coding",
                        priority=(
                            self._priority(
                                "high",
                                "coding",
                                declared_modules,
                            )
                        ),
                        title=(
                            "Solve your first "
                            "coding problem"
                        ),
                        detail=(
                            "Start with an "
                            "easy problem and "
                            "submit it to "
                            "begin tracking "
                            "your progress."
                        ),
                        href="/coding",
                    )
                )

        untouched_topics: list[str] = []

        for (
            topic,
            total,
            attempted,
            solved,
        ) in coding_topics:
            if total <= 0:
                continue

            if attempted == 0:
                untouched_topics.append(
                    topic
                )
                continue

            topic_score = round(
                solved / total * 100,
                1,
            )

            insight = TopicInsight(
                module="coding",
                topic=self._label(topic),
                score=topic_score,
                sample_size=total,
                detail=(
                    f"{solved} of {total} "
                    f"problems solved"
                ),
            )

            if (
                topic_score
                >= STRENGTH_THRESHOLD
            ):
                strengths.append(insight)

            elif (
                topic_score
                < WEAKNESS_THRESHOLD
            ):
                weaknesses.append(insight)

                recommendations.append(
                    ReadinessRecommendation(
                        module="coding",
                        priority=(
                            self._priority(
                                "high",
                                "coding",
                                declared_modules,
                            )
                        ),
                        title=(
                            f"Revisit "
                            f"{self._label(topic)} "
                            f"problems"
                        ),
                        detail=(
                            f"You have solved "
                            f"{solved} of "
                            f"{total} problems "
                            f"in this topic."
                        ),
                        href="/coding",
                    )
                )

        if (
            coding_score is not None
            and untouched_topics
        ):
            labels = ", ".join(
                self._label(topic)
                for topic
                in untouched_topics
            )

            gaps.append(
                f"Coding topics not "
                f"attempted yet: {labels}."
            )

            recommendations.append(
                ReadinessRecommendation(
                    module="coding",
                    priority=(
                        self._priority(
                            "medium",
                            "coding",
                            declared_modules,
                        )
                    ),
                    title=(
                        "Try a new coding "
                        "topic"
                    ),
                    detail=(
                        f"You have not tried "
                        f"{labels} yet. "
                        f"Covering more "
                        f"topics prepares you "
                        f"for varied coding "
                        f"rounds."
                    ),
                    href="/coding",
                )
            )

        # Resume

        latest_resume = (
            analyses[0]
            if analyses
            else None
        )

        if latest_resume is not None:
            resume_score = float(
                latest_resume
                .overall_score
            )

            modules.append(
                self._module(
                    "resume",
                    score=resume_score,
                    status="active",
                    summary=(
                        f"Latest score "
                        f"{latest_resume.overall_score}"
                        f"/100 for "
                        f"{latest_resume.target_role}."
                    ),
                )
            )

            resume_insight = TopicInsight(
                module="resume",
                topic="Resume quality",
                score=resume_score,
                sample_size=len(
                    analyses,
                ),
                detail=(
                    f"Latest analysis "
                    f"scored "
                    f"{latest_resume.overall_score}"
                    f"/100"
                ),
            )

            if (
                resume_score
                >= STRENGTH_THRESHOLD
            ):
                strengths.append(
                    resume_insight
                )

            elif (
                resume_score
                < RESUME_GOOD_SCORE
            ):
                weaknesses.append(
                    resume_insight
                )

            keywords = [
                str(keyword)
                for keyword
                in (
                    latest_resume
                    .missing_keywords
                    or []
                )
            ][:5]

            if resume_score < RESUME_GOOD_SCORE:
                keyword_text = (
                    " Missing keywords "
                    "include: "
                    + ", ".join(keywords)
                    + "."
                    if keywords
                    else ""
                )

                recommendations.append(
                    ReadinessRecommendation(
                        module="resume",
                        priority=(
                            self._priority(
                                "high",
                                "resume",
                                declared_modules,
                            )
                        ),
                        title=(
                            "Strengthen your "
                            "resume"
                        ),
                        detail=(
                            f"Your latest "
                            f"score is "
                            f"{latest_resume.overall_score}"
                            f"/100."
                            + keyword_text
                        ),
                        href="/resume",
                    )
                )

            elif keywords:
                recommendations.append(
                    ReadinessRecommendation(
                        module="resume",
                        priority=(
                            self._priority(
                                "low",
                                "resume",
                                declared_modules,
                            )
                        ),
                        title=(
                            "Add missing "
                            "keywords"
                        ),
                        detail=(
                            "Consider adding: "
                            + ", ".join(
                                keywords
                            )
                            + "."
                        ),
                        href="/resume",
                    )
                )
        else:
            resume_score = None

            modules.append(
                self._module(
                    "resume",
                    score=None,
                    status="not_started",
                    summary=(
                        "No resume "
                        "analysed yet."
                    ),
                )
            )

            gaps.append(
                "Your resume has not been "
                "analysed yet."
            )

            recommendations.append(
                ReadinessRecommendation(
                    module="resume",
                    priority=self._priority(
                        "medium",
                        "resume",
                        declared_modules,
                    ),
                    title=(
                        "Analyse your resume"
                    ),
                    detail=(
                        "Upload your resume "
                        "to get a score and "
                        "targeted improvements "
                        "for your target role."
                    ),
                    href="/resume",
                )
            )

        # Interview modules (Phase 6 / 7 hook)

        modules.extend(
            self._interview_modules(),
        )

        # ----------------------------------------
        # Overall score
        # ----------------------------------------

        overall_score, coverage = (
            self._overall(modules)
        )

        recommendations.sort(
            key=lambda item: (
                PRIORITY_ORDER[
                    item.priority
                ]
            ),
        )

        strengths.sort(
            key=lambda item: -item.score,
        )

        weaknesses.sort(
            key=lambda item: item.score,
        )

        return ReadinessRead(
            overall_score=overall_score,
            level=self._level(
                overall_score,
            ),
            coverage_percent=coverage,
            target_roles=list(
                profile.target_roles,
            ),
            preparation_goals=list(
                profile.preparation_goals,
            ),
            declared_weak_areas=list(
                profile.weak_areas,
            ),
            modules=modules,
            strengths=strengths[:6],
            weaknesses=weaknesses[:6],
            gaps=gaps,
            recommendations=(
                recommendations[:8]
            ),
            weekly=ReadinessWeekly(
                budget_seconds=(
                    weekly_summary
                    .budget_seconds
                ),
                spent_seconds=(
                    weekly_summary
                    .spent_seconds
                ),
                used_percent=(
                    weekly_summary
                    .used_percent
                ),
            ),
        )

    # ----------------------------------------
    # Helpers
    # ----------------------------------------

    @staticmethod
    def _interview_modules() -> list[
        ReadinessModule
    ]:
        """
        Phase 6 (Technical Interview) and Phase 7
        (HR Interview) will replace this with real
        results: return status "active" with a
        0-100 score once a student has completed
        an evaluated session, or "not_started" if
        the module exists but is unused. The
        scoring and the page need no other change.
        """

        return [
            ReadinessModule(
                key=key,
                label=MODULE_LABELS[key],
                weight=MODULE_WEIGHTS[key],
                score=None,
                status="coming_soon",
                summary="Coming soon.",
                href=MODULE_HREFS[key],
            )
            for key in (
                "technical_interview",
                "hr_interview",
            )
        ]

    @staticmethod
    def _module(
        key: ReadinessModuleKey,
        *,
        score: float | None,
        status: str,
        summary: str,
    ) -> ReadinessModule:
        return ReadinessModule(
            key=key,
            label=MODULE_LABELS[key],
            weight=MODULE_WEIGHTS[key],
            score=score,
            status=status,  # type: ignore[arg-type]
            summary=summary,
            href=MODULE_HREFS[key],
        )

    @staticmethod
    def _overall(
        modules: list[
            ReadinessModule
        ],
    ) -> tuple[
        float | None,
        float,
    ]:
        available_weight = sum(
            module.weight
            for module in modules
            if module.status
            != "coming_soon"
        )

        scored = [
            module
            for module in modules
            if module.score is not None
        ]

        scored_weight = sum(
            module.weight
            for module in scored
        )

        if (
            not scored
            or scored_weight <= 0
        ):
            return (
                None,
                0.0,
            )

        overall = round(
            sum(
                (module.score or 0)
                * module.weight
                for module in scored
            )
            / scored_weight,
            1,
        )

        coverage = (
            round(
                scored_weight
                / available_weight
                * 100,
                1,
            )
            if available_weight
            else 0.0
        )

        return (
            overall,
            coverage,
        )

    @staticmethod
    def _level(
        score: float | None,
    ) -> str:
        if score is None:
            return "Not started"

        if score < 40:
            return "Getting started"

        if score < 60:
            return "Developing"

        if score < 75:
            return "Almost ready"

        return "Placement ready"

    @staticmethod
    def _declared_modules(
        weak_areas: list[str],
    ) -> set[str]:
        matched: set[str] = set()

        for area in weak_areas:
            lowered = area.lower()

            for (
                module,
                keywords,
            ) in WEAK_AREA_KEYWORDS.items():
                if any(
                    keyword in lowered
                    for keyword
                    in keywords
                ):
                    matched.add(module)

        return matched

    @staticmethod
    def _priority(
        base: RecommendationPriority,
        module: str,
        declared_modules: set[str],
    ) -> RecommendationPriority:
        if module not in declared_modules:
            return base

        if base == "low":
            return "medium"

        if base == "medium":
            return "high"

        return base

    @staticmethod
    def _label(
        value: str,
    ) -> str:
        return (
            value
            .replace("_", " ")
            .title()
        )