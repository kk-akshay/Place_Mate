export type CodingQuestionSummary = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  topic: string;
};

export type CodingQuestionList = {
  questions:
    CodingQuestionSummary[];
  total: number;
};

export type CodingSampleTestCase = {
  position: number;
  input_data: string;
  expected_output: string;
};

export type CodingQuestion = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  topic: string;
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  starter_code: string;
  sample_test_cases:
    CodingSampleTestCase[];
};

export type CodingExecutionStatus =
  | "passed"
  | "failed"
  | "runtime_error"
  | "timeout"
  | "runner_error";

export type CodingVisibleTestResult = {
  position: number;
  passed: boolean;
  status:
    CodingExecutionStatus;
  input_data: string;
  expected_output: string;
  actual_output: string;
  error: string | null;
  execution_time_ms: number;
};

export type CodingExecutionResult = {
  mode:
    | "run"
    | "submit";
  passed_tests: number;
  total_tests: number;
  all_passed: boolean;
  visible_tests:
    CodingVisibleTestResult[];
  hidden_passed: number;
  hidden_total: number;
  execution_time_ms: number;
  message: string | null;
};

export type CodingProgress = {
  total_questions: number;
  attempted_questions: number;
  solved_questions: number;
  submissions: number;
  solve_percent: number;
};