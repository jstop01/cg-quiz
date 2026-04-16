// 문제 하나 (정답 후보 여러 개 + 오답 후보 여러 개)
export interface Question {
  id: number;
  question: string;
  correctAnswers: string[];  // 매번 1개 랜덤 선택
  wrongAnswers: string[];    // 매번 4개 랜덤 선택
  explanation: string;
  hint: string;
}

// 세션용 문제 (뽑힌 직후 확정된 보기 5개)
export interface QuizQuestion {
  poolIndex: number;
  choices: string[];   // 확정된 5개 보기 (이미 셔플됨)
  answerIdx: number;   // 정답 위치 (0-4)
}

// 사용자 답안 기록
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
  quizQuestions: QuizQuestion[];
}
