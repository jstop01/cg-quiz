import { useState } from "react";
import type { Dispatch } from "react";
import type { QuizState } from "../types";
import type { Action } from "../hooks/useQuizState";
import { QUESTION_POOL } from "../data/questions";

interface Props {
  state: QuizState;
  dispatch: Dispatch<Action>;
}

export default function ResultScreen({ state, dispatch }: Props) {
  const [expandedNote, setExpandedNote] = useState<number | null>(null);

  const correctCount = state.answers.filter((a) => a.isCorrect).length;
  const wrongCount = state.answers.length - correctCount;
  const totalScore = correctCount * 5;

  const getScoreColor = () => {
    if (totalScore >= 80) return "text-green-600";
    if (totalScore >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto">
        {/* 점수 카드 */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 text-center mb-6">
          <h1 className="text-2xl font-bold text-navy mb-4">시험 결과</h1>
          <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
            {totalScore}
            <span className="text-2xl text-gray-400">/100</span>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <span className="text-green-600 font-medium">
              정답 {correctCount}문제
            </span>
            <span className="text-red-600 font-medium">
              오답 {wrongCount}문제
            </span>
          </div>
        </div>

        {/* 문항별 결과 */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-6">
          <h2 className="text-lg font-bold text-navy mb-4">문항별 결과</h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {state.answers.map((a, i) => (
              <div
                key={a.questionId}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium ${
                  a.isCorrect
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <span className="text-xs text-gray-500">Q{i + 1}</span>
                <span>{a.isCorrect ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오답노트 목록 */}
        {state.wrongNotes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-gold mb-4">
              📒 오답노트 ({state.wrongNotes.length}개)
            </h2>
            <div className="space-y-3">
              {state.wrongNotes.map((note) => {
                const qIndex = state.answers.findIndex(
                  (a) => a.questionId === note.questionId
                );
                const isExpanded = expandedNote === note.questionId;

                return (
                  <div
                    key={note.questionId}
                    className="border border-gold rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedNote(isExpanded ? null : note.questionId)
                      }
                      className="w-full flex justify-between items-center p-4 text-left
                                 hover:bg-amber-50 transition-colors"
                    >
                      <span className="font-medium text-gray-800 text-sm">
                        Q{qIndex + 1}. {note.question}
                      </span>
                      <span className="text-gray-400 ml-2 shrink-0">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 text-sm border-t border-amber-200">
                        <div className="pt-3">
                          <span className="text-red-600 font-medium">
                            내 답: {note.myAnswer}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">
                            정답: {note.correctAnswer}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600">{note.explanation}</p>
                        </div>
                        <div className="bg-amber-100 rounded-lg p-3 border border-gold">
                          <p className="text-amber-800 font-medium">
                            💡 {note.hint}
                          </p>
                        </div>
                        {note.memo && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs text-blue-500 mb-1">
                              나의 메모
                            </p>
                            <p className="text-blue-800">{note.memo}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 다시 풀기 */}
        <button
          onClick={() => {
            dispatch({ type: "RESET" });
            dispatch({ type: "START" });
          }}
          className="w-full bg-navy text-white font-semibold py-3 rounded-xl
                     hover:bg-navy-light transition-colors text-lg mb-8"
        >
          다시 풀기
        </button>
      </div>
    </div>
  );
}
