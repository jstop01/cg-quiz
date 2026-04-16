interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>
          문제 {current + 1} / {total}
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-navy h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
