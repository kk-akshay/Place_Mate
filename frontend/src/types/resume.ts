export type ResumeAnalysis = {
  id: string | null;
  original_filename: string;
  target_role: string;
  is_resume: boolean;
  rejection_reason: string | null;
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  suggestions: string[];
  improved_summary: string;
  created_at: string | null;
};

export type ResumeAnalysisList = {
  analyses:
    ResumeAnalysis[];
};