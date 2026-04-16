import type { Dispatch } from "react";
import type { QuizState } from "../types";
import type { Action } from "../hooks/useQuizState";
import { QUESTION_POOL, QUIZ_SIZE } from "../data/questions";
import ProgressBar from "./ProgressBar";
import ChoiceList from "./ChoiceList";
import ResultMessage from "./ResultMessage";
import WrongNote from "./WrongNote";

interface Props {
  state: QuizState;
  dispatch: Dispatch<Action>;
}

const choiceLabels = ["①", "②", "③", "④", "⑤"];

export default function QuizScreen({ state, dispatch }: Props) {
  const q = QUESTION_POOL[state.questionOrder[state.currentIndex]];
  const isCorrect = state.submitted && state.chosen === q.answer;
  const isWrong = state.submitted && state.chosen !== q.answer;
  const canGoNext = state.submitted && (isCorrect || state.noteCompleted);

  const isSimpleMode = state.mode === "simple";

  return (
    <div className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto">
        {/* 모드 배지 */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isSimpleMode
                ? "bg-gray-700 text-white"
                : "bg-gold text-white"
            }`}
          >
            {isSimpleMode ? "⚡ 일반 모드" : "📒 오답노트 모드"}
          </span>
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            처음으로
          </button>
        </div>

        <ProgressBar current={state.currentIndex} total={QUIZ_SIZE} />

        <div key={state.currentIndex} className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          {/* 문제 텍스트 */}
          <div className="mb-6">
            <span className="inline-block bg-navy text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              Q{state.currentIndex + 1}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-relaxed">
              {q.question}
            </h2>
          </div>

          {/* 선택지 */}
          <ChoiceList
            choices={q.choices}
            chosen={state.chosen}
            submitted={state.submitted}
            answer={q.answer}
            onSelect={(i) => dispatch({ type: "SELECT", payload: i })}
          />

          {/* 제출 버튼 */}
          {!state.submitted && (
            <button
              onClick={() => dispatch({ type: "SUBMIT" })}
              disabled={state.chosen === null}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
                state.chosen !== null
                  ? "bg-navy text-white hover:bg-navy-light"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              제출하기
            </button>
          )}

          {/* 정오 판정 메시지 */}
          {state.submitted && (
            <ResultMessage
              isCorrect={isCorrect}
              correctText={`${choiceLabels[q.answer]} ${q.choices[q.answer]}`}
            />
          )}

          {/* 일반 모드: 오답일 때도 해설만 간단히 표시 */}
          {isSimpleMode && isWrong && state.submitted && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">해설</p>
              <p>{q.explanation}</p>
              <p className="mt-2 font-medium text-gold">💡 {q.hint}</p>
            </div>
          )}

          {/* 오답노트 모드: 오답 시 오답노트 표시 */}
          {!isSimpleMode && isWrong && !state.noteCompleted && (
            <WrongNote
              question={q}
              chosen={state.chosen!}
              onComplete={(memo) =>
                dispatch({ type: "COMPLETE_NOTE", payload: memo })
              }
            />
          )}

          {/* 다음 문제 / 결과 보기 버튼 */}
          {canGoNext && (
            <button
              onClick={() => dispatch({ type: "NEXT" })}
              className="mt-6 w-full bg-navy text-white font-semibold py-3 rounded-xl
                         hover:bg-navy-light transition-colors text-lg"
            >
              {state.currentIndex === QUIZ_SIZE - 1 ? "결과 보기" : "다음 문제"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
