export type StudentProfile = {
  id: string;
  user_id: string;

  college_name: string;
  degree: string;
  branch: string;

  graduation_year: number;

  target_roles: string[];
  target_companies: string[];

  skills: string[];
  strengths: string[];
  weak_areas: string[];

  preparation_goals: string[];

  weekly_hours: number;

  created_at: string;
  updated_at: string;
};


export type ProfileStatus = {
  onboarding_completed: boolean;
};


export type StudentProfileInput = {
  college_name: string;
  degree: string;
  branch: string;

  graduation_year: number;

  target_roles: string[];
  target_companies: string[];

  skills: string[];
  strengths: string[];
  weak_areas: string[];

  preparation_goals: string[];

  weekly_hours: number;
};