import type { Dispatch } from "react";
import type { Action } from "../hooks/useQuizState";

interface Props {
  dispatch: Dispatch<Action>;
  hasProgress: boolean;
}

export default function StartScreen({ dispatch, hasProgress }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-lg w-full text-center">
        <div className="text-5xl mb-4">📝</div>
        <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">
          컴퓨터 그래픽스
        </h1>
        <h2 className="text-lg md:text-xl text-navy-light mb-2">
          중간고사 객관식 연습
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          20문항 · 문항당 5점 · 총 100점 · 5지선다
        </p>

        <p className="text-sm font-semibold text-gray-600 mb-3">모드 선택</p>

        <div className="flex flex-col gap-3 mb-6">
          {/* 오답노트 모드 */}
          <button
            onClick={() => dispatch({ type: "START", payload: "note" })}
            className="w-full bg-navy text-white font-semibold py-4 px-6 rounded-xl
                       hover:bg-navy-light transition-colors text-left flex items-start gap-3"
          >
            <span className="text-2xl">📒</span>
            <div>
              <p className="font-bold text-base">오답노트 모드</p>
              <p className="text-xs text-blue-200 mt-0.5">
                오답 시 해설 확인 + 메모 작성 후 다음 문제로
              </p>
            </div>
          </button>

          {/* 일반 모드 */}
          <button
            onClick={() => dispatch({ type: "START", payload: "simple" })}
            className="w-full bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl
                       hover:bg-gray-600 transition-colors text-left flex items-start gap-3"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-base">일반 모드</p>
              <p className="text-xs text-gray-300 mt-0.5">
                정오 확인 후 바로 다음 문제로 (오답노트 없음)
              </p>
            </div>
          </button>
        </div>

        {hasProgress && (
          <button
            onClick={() => {
              dispatch({ type: "RESET_ALL" });
            }}
            className="w-full mt-1 bg-gray-100 text-gray-500 font-medium py-2.5 px-6 rounded-xl
                       hover:bg-gray-200 transition-colors text-sm"
          >
            진행 기록 초기화
          </button>
        )}
      </div>
    </div>
  );
}
