// 문제 하나
export interface Question {
  id: number;
  question: string;
  choices: string[];
  answer: number; // 0-based index
  explanation: string;
  hint: string;
}

// 사용자 답안 기록 (문제 1개)
export interface AnswerRecord {
  questionId: number;
  chosen: number;
  isCorrect: boolean;
  noteCompleted: boolean;
}

// 오답노트 1개
export interface WrongNote {
  questionId: number;
  question: string;
  myAnswer: string;
  correctAnswer: string;
  explanation: string;
  hint: string;
  memo: string;
}

// 퀴즈 모드
export type QuizMode = "note" | "simple";

// 전체 퀴즈 상태
export interface QuizState {
  screen: "start" | "quiz" | "result";
  mode: QuizMode;
  currentIndex: number;
  submitted: boolean;
  chosen: number | null;
  noteCompleted: boolean;
  answers: AnswerRecord[];
  wrongNotes: WrongNote[];
  questionOrder: number[]; // 셔플된 문제 인덱스 배열
}
