export type ReadinessModuleKey =
  | "aptitude"
  | "coding"
  | "resume"
  | "technical_interview"
  | "hr_interview";

export type ReadinessModuleStatus =
  | "not_started"
  | "active"
  | "coming_soon";

export type RecommendationPriority =
  | "high"
  | "medium"
  | "low";

export type ReadinessModule = {
  key: ReadinessModuleKey;
  label: string;
  weight: number;
  score: number | null;
  status: ReadinessModuleStatus;
  summary: string;
  href: string | null;
};

export type TopicInsight = {
  module: ReadinessModuleKey;
  topic: string;
  score: number;
  sample_size: number;
  detail: string;
};

export type ReadinessRecommendation = {
  module: ReadinessModuleKey;
  priority: RecommendationPriority;
  title: string;
  detail: string;
  href: string | null;
};

export type ReadinessWeekly = {
  budget_seconds: number;
  spent_seconds: number;
  used_percent: number;
};

export type Readiness = {
  overall_score: number | null;
  level: string;
  coverage_percent: number;
  target_roles: string[];
  preparation_goals: string[];
  declared_weak_areas: string[];
  modules: ReadinessModule[];
  strengths: TopicInsight[];
  weaknesses: TopicInsight[];
  gaps: string[];
  recommendations: ReadinessRecommendation[];
  weekly: ReadinessWeekly;
};