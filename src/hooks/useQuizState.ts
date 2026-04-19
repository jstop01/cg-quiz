import { useReducer, useEffect } from "react";
import type { QuizState, QuizMode, QuizQuestion, AnswerRecord, WrongNote, WrongAnswer } from "../types";
import { QUESTION_POOL, QUIZ_SIZE } from "../data/questions";

const STORAGE_KEY = "cg_quiz_v5";
const HISTORY_KEY = "cg_quiz_history";

/** crypto 기반 난수 (0 ~ max-1) */
function secureRand(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

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
  const result = [...arr];
  for (let idx = result.length - 1; idx > 0; idx--) {
    const swapIdx = secureRand(idx + 1);
    const tmp = result[idx];
    result[idx] = result[swapIdx];
    result[swapIdx] = tmp;
  }
  return result;
}

function buildChoices(correct: string, wrongs: WrongAnswer[]): { choices: string[]; answerIdx: number; whyWrong: (string | null)[] } {
  const answerIdx = secureRand(5);
  const wrongTexts = wrongs.map(function getText(w) { return w.text; });
  const wrongWhys = wrongs.map(function getWhy(w) { return w.why; });
  const choices = [...wrongTexts];
  choices.splice(answerIdx, 0, correct);
  const whyWrong: (string | null)[] = [...wrongWhys];
  whyWrong.splice(answerIdx, 0, null);
  return { choices, answerIdx, whyWrong };
}

function pickRandom(count: number = QUIZ_SIZE): QuizQuestion[] {
  const history = getHistory();

  const weights = QUESTION_POOL.map(function mapWeight(q, idx) {
    const streak = history[q.id] || 0;
    const w = streak === 0 ? 10 : streak === 1 ? 4 : streak === 2 ? 1 : 0.2;
    return { idx, w };
  });

  const picked: number[] = [];
  const remaining = [...weights];
  for (let step = 0; step < count && remaining.length > 0; step++) {
    const totalW = remaining.reduce(function sum(acc, cur) { return acc + cur.w; }, 0);
    let rand = Math.random() * totalW;
    let chosenIdx = remaining.length - 1;
    for (let k = 0; k < remaining.length; k++) {
      rand -= remaining[k].w;
      if (rand <= 0) { chosenIdx = k; break; }
    }
    picked.push(remaining[chosenIdx].idx);
    remaining.splice(chosenIdx, 1);
  }

  const quizQuestions: QuizQuestion[] = [];
  for (let p = 0; p < picked.length; p++) {
    const poolIndex = picked[p];
    const q = QUESTION_POOL[poolIndex];
    const correct = q.correctAnswers[secureRand(q.correctAnswers.length)];
    const wrongs = shuffleArray(q.wrongAnswers).slice(0, 4);
    const built = buildChoices(correct, wrongs);
    quizQuestions.push({ poolIndex, choices: built.choices, answerIdx: built.answerIdx, whyWrong: built.whyWrong });
  }

  // 디버그: 정답 위치 분포 확인 (배포 확인 후 제거)
  if (typeof console !== "undefined") {
    const dist = [0, 0, 0, 0, 0];
    quizQuestions.forEach(function countPos(qq) { dist[qq.answerIdx]++; });
    console.log("[CG-Quiz v5] 정답 위치 분포:", dist.map(function fmt(d, i) { return (i + 1) + "번:" + d; }).join(", "));
  }

  return quizQuestions;
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
