import { useReducer, useEffect } from "react";
import type { QuizState, QuizMode, QuizQuestion, AnswerRecord, WrongNote } from "../types";
import { QUESTION_POOL, QUIZ_SIZE } from "../data/questions";

const STORAGE_KEY = "cg_quiz_v4";
const HISTORY_KEY = "cg_quiz_history";

/** 문제별 정답 이력: { [questionId]: 연속 정답 횟수 } */
function getHistory(): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveHistory(history: Record<number, number>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 가중치 기반 문제 선택: 연속 정답이 많을수록 출제 확률↓ */
function pickRandom(count = QUIZ_SIZE): QuizQuestion[] {
  const history = getHistory();

  // 각 문제에 가중치 부여: 연속정답 0→10, 1→4, 2→1, 3+→0.2
  const weights = QUESTION_POOL.map((q, i) => {
    const streak = history[q.id] || 0;
    if (streak === 0) return { idx: i, w: 10 };
    if (streak === 1) return { idx: i, w: 4 };
    if (streak === 2) return { idx: i, w: 1 };
    return { idx: i, w: 0.2 };
  });

  // 가중치 기반 비복원 추출
  const picked: number[] = [];
  const pool = [...weights];
  for (let n = 0; n < count && pool.length > 0; n++) {
    const totalW = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * totalW;
    let chosen = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r <= 0) { chosen = i; break; }
    }
    picked.push(pool[chosen].idx);
    pool.splice(chosen, 1);
  }

  return picked.map((poolIndex) => {
    const q = QUESTION_POOL[poolIndex];
    const correct = q.correctAnswers[Math.floor(Math.random() * q.correctAnswers.length)];
    const wrongs = shuffleArray(q.wrongAnswers).slice(0, 4);
    const answerIdx = Math.floor(Math.random() * 5);
    const choices: string[] = [];
    let wi = 0;
    for (let i = 0; i < 5; i++) {
      choices.push(i === answerIdx ? correct : wrongs[wi++]);
    }
    return { poolIndex, choices, answerIdx };
  });
}

type Action =
  | { type: "START"; payload: QuizMode }
  | { type: "SELECT"; payload: number }
  | { type: "SUBMIT" }
  | { type: "COMPLETE_NOTE"; payload: string }
  | { type: "NEXT" }
  | { type: "RESET" }
  | { type: "RESET_ALL" };

const defaultState: QuizState = {
  screen: "start",
  mode: "note",
  currentIndex: 0,
  submitted: false,
  chosen: null,
  noteCompleted: false,
  answers: [],
  wrongNotes: [],
  quizQuestions: pickRandom(),
};

function init(): QuizState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.quizQuestions || parsed.quizQuestions.length !== QUIZ_SIZE) {
        localStorage.removeItem(STORAGE_KEY);
        return { ...defaultState, quizQuestions: pickRandom() };
      }
      return parsed;
    } catch {
      return { ...defaultState, quizQuestions: pickRandom() };
    }
  }
  return { ...defaultState, quizQuestions: pickRandom() };
}

function quizReducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "START": {
      if (state.answers.length > 0) {
        return { ...state, screen: "quiz", mode: action.payload };
      }
      return { ...state, screen: "quiz", mode: action.payload, quizQuestions: pickRandom() };
    }

    case "SELECT":
      if (state.submitted) return state;
      return { ...state, chosen: action.payload };

    case "SUBMIT": {
      if (state.chosen === null || state.submitted) return state;
      const qq = state.quizQuestions[state.currentIndex];
      const q = QUESTION_POOL[qq.poolIndex];
      const isCorrect = state.chosen === qq.answerIdx;

      const record: AnswerRecord = {
        questionId: q.id,
        chosen: state.chosen,
        isCorrect,
        noteCompleted: isCorrect || state.mode === "simple",
      };

      return {
        ...state,
        submitted: true,
        noteCompleted: isCorrect || state.mode === "simple",
        answers: [...state.answers, record],
      };
    }

    case "COMPLETE_NOTE": {
      const qq = state.quizQuestions[state.currentIndex];
      const q = QUESTION_POOL[qq.poolIndex];
      const choiceLabels = ["①", "②", "③", "④", "⑤"];

      const wrongNote: WrongNote = {
        questionId: q.id,
        question: q.question,
        myAnswer: `${choiceLabels[state.chosen!]} ${qq.choices[state.chosen!]}`,
        correctAnswer: `${choiceLabels[qq.answerIdx]} ${qq.choices[qq.answerIdx]}`,
        explanation: q.explanation,
        hint: q.hint,
        memo: action.payload,
      };

      const updatedAnswers = state.answers.map((a) =>
        a.questionId === q.id ? { ...a, noteCompleted: true } : a
      );

      return {
        ...state,
        noteCompleted: true,
        wrongNotes: [...state.wrongNotes, wrongNote],
        answers: updatedAnswers,
      };
    }

    case "NEXT": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= QUIZ_SIZE) {
        // 퀴즈 종료 시 문제별 정답 이력 업데이트
        const history = getHistory();
        for (const ans of state.answers) {
          if (ans.isCorrect) {
            history[ans.questionId] = (history[ans.questionId] || 0) + 1;
          } else {
            history[ans.questionId] = 0; // 틀리면 연속 정답 리셋
          }
        }
        saveHistory(history);
        return { ...state, screen: "result" };
      }
      return { ...state, currentIndex: nextIndex, submitted: false, chosen: null, noteCompleted: false };
    }

    case "RESET": {
      localStorage.removeItem(STORAGE_KEY);
      return { ...defaultState, quizQuestions: pickRandom() };
    }

    case "RESET_ALL": {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HISTORY_KEY);
      return { ...defaultState, quizQuestions: pickRandom() };
    }

    default:
      return state;
  }
}

export function useQuizState() {
  const [state, dispatch] = useReducer(quizReducer, undefined, init);

  useEffect(() => {
    if (state.screen !== "start" || state.answers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const hasProgress = (() => {
    const history = localStorage.getItem(HISTORY_KEY);
    if (history && history !== "{}") return true;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      return parsed.answers && parsed.answers.length > 0;
    } catch {
      return false;
    }
  })();

  return { state, dispatch, hasProgress };
}

export type { Action };
