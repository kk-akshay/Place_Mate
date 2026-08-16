export type AptitudeCategory =
  | "mixed"
  | "quantitative"
  | "logical"
  | "verbal";


export type AptitudeCategorySummary = {
  category: string;
  question_count: number;
};


export type AptitudeCatalog = {
  categories:
    AptitudeCategorySummary[];

  available_question_counts:
    number[];
};


export type AptitudeQuestion = {
  id: string;

  position: number;

  category: string;
  topic: string;
  difficulty: string;

  question_text: string;

  options: string[];
};


export type AptitudeAttempt = {
  id: string;

  category: string;

  question_count: number;

  duration_seconds: number;

  started_at: string;

  expires_at: string;

  questions:
    AptitudeQuestion[];
};


export type AptitudeQuestionResult = {
  question_id: string;

  position: number;

  category: string;
  topic: string;
  difficulty: string;

  question_text: string;

  options: string[];

  selected_option:
    number | null;

  correct_option:
    number;

  is_correct:
    boolean;

  explanation:
    string;
};


export type AptitudeResult = {
  attempt_id: string;

  category: string;

  total_questions: number;

  correct_answers: number;

  score_percent: number;

  timed_out: boolean;

  submitted_at: string;

  questions:
    AptitudeQuestionResult[];
};


export type AptitudeCategoryProgress = {
  category: string;

  attempts: number;

  average_score: number;
};


export type AptitudeProgress = {
  total_attempts: number;

  total_questions: number;

  total_correct: number;

  accuracy_percent: number;

  average_score: number;

  best_score: number;

  categories:
    AptitudeCategoryProgress[];
};