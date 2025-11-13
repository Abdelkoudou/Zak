export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
  explanation: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topic: string;
  reference: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: number;
}

export interface ModuleData {
  name: string;
  slug: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  topics: Topic[];
  color: string;
  iconName: string;
}

export interface PracticeSession {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>;
  showExplanation: boolean;
  isCompleted: boolean;
  startTime: Date;
  endTime?: Date;
  score?: number;
}