export type PreparationActivity = {
  id: string;

  module: string;

  activity_type: string;

  source_id:
    string | null;

  started_at: string;

  ended_at:
    string | null;

  planned_duration_seconds:
    number | null;

  duration_seconds:
    number | null;
};


export type PreparationModuleSummary = {
  module: string;

  spent_seconds: number;

  percentage_of_spent:
    number;
};


export type WeeklyPreparationSummary = {
  week_start: string;

  week_end: string;

  budget_seconds: number;

  spent_seconds: number;

  remaining_seconds: number;

  used_percent: number;

  modules:
    PreparationModuleSummary[];
};