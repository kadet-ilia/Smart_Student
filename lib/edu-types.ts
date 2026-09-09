export type StudentProfile = {
  nickname: string;
  parent_code: string;
  student_code: string;
  current_math_topic: string;
  current_russian_topic: string;
  xp: number;
  created_at: string;
  has_pin: boolean;
  current_grade: 4 | 5;
};

export type ProgressRecord = {
  subject: "math" | "russian";
  topic_id: string;
  attempts: number;
  correct: number;
  mastery: number;
  streak: number;
  best_difficulty: number;
  last_practiced_at: string | null;
};

export type StudentSummary = {
  total_attempts: number;
  total_correct: number;
  accuracy: number;
  active_days: number;
  current_day_streak: number;
  last_activity: string | null;
};

export type ActivityDay = {
  day: string;
  attempts: number;
  correct: number;
  accuracy: number;
};

export type BootstrapData = {
  profile: StudentProfile;
  progress: ProgressRecord[];
  summary: StudentSummary;
  activity: ActivityDay[];
};

export type AttemptResult = {
  attempts: number;
  correct: number;
  mastery: number;
  streak: number;
  best_difficulty: number;
  xp: number;
};
