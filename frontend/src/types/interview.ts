export type InterviewKind = "technical" | "hr";

export type InterviewQuestion = {
  id: string;
  position: number;
  question_text: string;
  answer_text: string | null;
  score: number | null;
  feedback: string | null;
  ideal_points: string[];
};

export type InterviewSession = {
  id: string;
  kind: InterviewKind;
  target_role: string;
  question_count: number;
  status: "in_progress" | "submitted";
  overall_score: number | null;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  created_at: string;
  submitted_at: string | null;
  questions: InterviewQuestion[];
};

export type InterviewSessionSummary = {
  id: string;
  kind: InterviewKind;
  target_role: string;
  question_count: number;
  status: "in_progress" | "submitted";
  overall_score: number | null;
  created_at: string;
  submitted_at: string | null;
};

export type InterviewSessionList = {
  sessions: InterviewSessionSummary[];
};