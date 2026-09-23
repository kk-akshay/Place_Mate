export type ResumeAnalysis = {
  id: string;
  original_filename: string;
  target_role: string;
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  suggestions: string[];
  improved_summary: string;
  created_at: string;
};

export type ResumeAnalysisList = {
  analyses:
    ResumeAnalysis[];
};