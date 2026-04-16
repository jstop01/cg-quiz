import { useReducer, useEffect } from "react";
import type { QuizState, QuizMode, AnswerRecord, WrongNote } from "../types";
import { QUESTION_POOL, QUIZ_SIZE } from "../data/questions";

const STORAGE_KEY = "cg_quiz_v1";

/** 풀에서 QUIZ_SIZE개를 랜덤 추출한 인덱스 배열 반환 */
function pickRandom(): number[] {
  const indices = Array.from({ length: QUESTION_POOL.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, QUIZ_SIZE);
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
  questionOrder: pickRandom(),
};

function init(): QuizState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.questionOrder || parsed.questionOrder.length !== QUIZ_SIZE) {
        localStorage.removeItem(STORAGE_KEY);
        return { ...defaultState, questionOrder: pickRandom() };
      }
      return parsed;
    } catch {
      return { ...defaultState, questionOrder: pickRandom() };
    }
  }
  return { ...defaultState, questionOrder: pickRandom() };
}

function quizReducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        screen: "quiz",
        mode: action.payload,
        questionOrder: state.answers.length > 0 ? state.questionOrder : pickRandom(),
      };

    case "SELECT":
      if (state.submitted) return state;
      return { ...state, chosen: action.payload };

    case "SUBMIT": {
      if (state.chosen === null || state.submitted) return state;
      const q = QUESTION_POOL[state.questionOrder[state.currentIndex]];
      const isCorrect = state.chosen === q.answer;

      const record: AnswerRecord = {
        questionId: q.id,
        chosen: state.chosen,
        isCorrect,
        // 일반 모드는 오답도 바로 완료 처리
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
      const q = QUESTION_POOL[state.questionOrder[state.currentIndex]];
      const choiceLabels = ["①", "②", "③", "④", "⑤"];

      const wrongNote: WrongNote = {
        questionId: q.id,
        question: q.question,
        myAnswer: `${choiceLabels[state.chosen!]} ${q.choices[state.chosen!]}`,
        correctAnswer: `${choiceLabels[q.answer]} ${q.choices[q.answer]}`,
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
      return {
        ...state,
        currentIndex: nextIndex,
        submitted: false,
        chosen: null,
        noteCompleted: false,
      };
    }

    case "RESET":
      localStorage.removeItem(STORAGE_KEY);
      return { ...defaultState, questionOrder: pickRandom() };

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
