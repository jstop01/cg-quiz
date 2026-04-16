import { useState } from "react";
import type { Question } from "../types";

interface Props {
  question: Question;
  chosen: number;
  onComplete: (memo: string) => void;
}

const labels = ["①", "②", "③", "④", "⑤"];

export default function WrongNote({ question, chosen, onComplete }: Props) {
  const [memo, setMemo] = useState("");
  const [checked, setChecked] = useState(false);

  const canComplete = memo.trim().length > 0 && checked;

  return (
    <div className="mt-6 border-2 border-gold rounded-xl p-5 bg-amber-50">
      <h3 className="text-lg font-bold text-gold mb-4">📒 오답노트</h3>

      <div className="space-y-3 text-sm">
        <div className="flex gap-2">
          <span className="font-medium text-red-600 shrink-0">내 답:</span>
          <span className="text-red-600">
            {labels[chosen]} {question.choices[chosen]}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium text-green-700 shrink-0">정답:</span>
          <span className="text-green-700">
            {labels[question.answer]} {question.choices[question.answer]}
          </span>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">해설</p>
          <p className="text-gray-600">{question.explanation}</p>
        </div>

        <div className="bg-amber-100 rounded-lg p-3 border border-gold">
          <p className="font-medium text-gold mb-1">💡 핵심 암기 포인트</p>
          <p className="text-amber-800 font-medium">{question.hint}</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          나만의 메모 (필수)
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이 문제를 왜 틀렸는지, 어떻게 기억할지 적어보세요..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-24
                     focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      <label className="flex items-center gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="w-4 h-4 accent-gold"
        />
        <span className="text-sm text-gray-700">
          정답과 해설을 확인했습니다
        </span>
      </label>

      <button
        onClick={() => onComplete(memo)}
        disabled={!canComplete}
        className={`mt-4 w-full py-3 rounded-xl font-semibold transition-colors ${
          canComplete
            ? "bg-gold text-white hover:bg-yellow-600"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        오답노트 완료
      </button>
    </div>
  );
}
