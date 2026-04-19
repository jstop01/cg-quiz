interface Props {
  choices: string[];
  chosen: number | null;
  submitted: boolean;
  answer: number;
  whyWrong?: (string | null)[];
  onSelect: (index: number) => void;
}

const labels = ["①", "②", "③", "④", "⑤"];

export default function ChoiceList({
  choices,
  chosen,
  submitted,
  answer,
  whyWrong,
  onSelect,
}: Props) {
  function getStyle(index: number): string {
    const base =
      "w-full text-left p-4 rounded-xl border-2 transition-all duration-200";

    if (!submitted) {
      if (chosen === index) {
        return `${base} border-navy bg-blue-50 font-medium`;
      }
      return `${base} border-gray-200 hover:border-navy-light hover:bg-gray-50 cursor-pointer`;
    }

    // 제출 후
    if (index === answer) {
      return `${base} border-green-500 bg-green-50 font-medium`;
    }
    if (index === chosen && chosen !== answer) {
      return `${base} border-red-500 bg-red-50`;
    }
    return `${base} border-gray-200 opacity-60`;
  }

  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice, i) => (
        <div key={i}>
          <button
            onClick={() => !submitted && onSelect(i)}
            className={getStyle(i)}
            disabled={submitted}
          >
            <span className="mr-2 text-gray-400">{labels[i]}</span>
            {choice}
          </button>
          {submitted && whyWrong && whyWrong[i] && (
            <p className="mt-1 ml-8 text-xs text-red-400">
              → {whyWrong[i]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
