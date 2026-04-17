import { useReducer, useEffect } from "react";
import type { QuizState, QuizMode, QuizQuestion, AnswerRecord, WrongNote } from "../types";
import { QUESTION_POOL, QUIZ_SIZE } from "../data/questions";

const STORAGE_KEY = "cg_quiz_v1";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(count = QUIZ_SIZE): QuizQuestion[] {
  const indices = shuffleArray(Array.from({ length: QUESTION_POOL.length }, (_, i) => i));
  return indices.slice(0, count).map((poolIndex) => {
    const q = QUESTION_POOL[poolIndex];
    // 정답 후보 중 1개 랜덤 선택
    const correct = q.correctAnswers[Math.floor(Math.random() * q.correctAnswers.length)];
    // 오답 후보 중 4개 랜덤 선택
    const wrongs = shuffleArray(q.wrongAnswers).slice(0, 4);
    // 5개 합친 뒤 인덱스 배열을 셔플하여 정답 위치 추적
    const items = [correct, ...wrongs];
    const order = shuffleArray([0, 1, 2, 3, 4]);
    const choices = order.map((i) => items[i]);
    const answerIdx = order.indexOf(0); // 0번이 정답(correct)
    return { poolIndex, choices, answerIdx };
  });
}

type Action =
  | { type: "START"; payload: QuizMode }
  | { type: "SELECT"; payload: number }
  | { type: "SUBMIT" }
  | { type: "COMPLETE_NOTE"; payload: string }
  | { type: "NEXT" }
  | { type: "RESET" };

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
        return { ...state, screen: "result" };
      }
      return { ...state, currentIndex: nextIndex, submitted: false, chosen: null, noteCompleted: false };
    }

    case "RESET": {
      localStorage.removeItem(STORAGE_KEY);
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
