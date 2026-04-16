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
  const qq = state.quizQuestions[state.currentIndex];
  const q = QUESTION_POOL[qq.poolIndex];

  const isCorrect = state.submitted && state.chosen === qq.answerIdx;
  const isWrong = state.submitted && !isCorrect;
  const canGoNext = state.submitted && (isCorrect || state.noteCompleted);
  const isSimpleMode = state.mode === "simple";

  return (
    <div className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isSimpleMode ? "bg-gray-700 text-white" : "bg-gold text-white"}`}>
            {isSimpleMode ? "⚡ 일반 모드" : "📒 오답노트 모드"}
          </span>
          <button onClick={() => dispatch({ type: "RESET" })} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            처음으로
          </button>
        </div>

        <ProgressBar current={state.currentIndex} total={QUIZ_SIZE} />

        <div key={state.currentIndex} className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <div className="mb-6">
            <span className="inline-block bg-navy text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              Q{state.currentIndex + 1}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-relaxed">
              {q.question}
            </h2>
          </div>

          <ChoiceList
            choices={qq.choices}
            chosen={state.chosen}
            submitted={state.submitted}
            answer={qq.answerIdx}
            onSelect={(i) => dispatch({ type: "SELECT", payload: i })}
          />

          {!state.submitted && (
            <button
              onClick={() => dispatch({ type: "SUBMIT" })}
              disabled={state.chosen === null}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
                state.chosen !== null ? "bg-navy text-white hover:bg-navy-light" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              제출하기
            </button>
          )}

          {state.submitted && (
            <ResultMessage
              isCorrect={isCorrect}
              correctText={`${choiceLabels[qq.answerIdx]} ${qq.choices[qq.answerIdx]}`}
            />
          )}

          {isSimpleMode && isWrong && state.submitted && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">해설</p>
              <p>{q.explanation}</p>
              <p className="mt-2 font-medium text-gold">💡 {q.hint}</p>
            </div>
          )}

          {!isSimpleMode && isWrong && !state.noteCompleted && (
            <WrongNote
              question={q}
              myAnswerText={qq.choices[state.chosen!]}
              correctAnswerText={qq.choices[qq.answerIdx]}
              correctAnswerPos={qq.answerIdx}
              chosenPos={state.chosen!}
              onComplete={(memo) => dispatch({ type: "COMPLETE_NOTE", payload: memo })}
            />
          )}

          {canGoNext && (
            <button
              onClick={() => dispatch({ type: "NEXT" })}
              className="mt-6 w-full bg-navy text-white font-semibold py-3 rounded-xl hover:bg-navy-light transition-colors text-lg"
            >
              {state.currentIndex === QUIZ_SIZE - 1 ? "결과 보기" : "다음 문제"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
