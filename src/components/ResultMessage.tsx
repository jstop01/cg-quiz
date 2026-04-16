interface Props {
  isCorrect: boolean;
  correctText: string;
}

export default function ResultMessage({ isCorrect, correctText }: Props) {
  if (isCorrect) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl">
        <p className="text-green-700 font-semibold text-lg">정답입니다! ✅</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-xl">
      <p className="text-red-700 font-semibold text-lg">오답입니다 ❌</p>
      <p className="text-red-600 text-sm mt-1">
        정답: <span className="font-medium">{correctText}</span>
      </p>
    </div>
  );
}
