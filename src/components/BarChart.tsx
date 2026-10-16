type Props = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
  highlightIndex?: number;
};

export default function BarChart({ data, height = 200, formatValue }: Props) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        const isHighlight = d.color !== undefined;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            <div className="relative w-full flex items-end justify-center flex-1">
              <div
                className="absolute -top-7 px-2 py-1 rounded-md bg-slate-900 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
              >
                {formatValue ? formatValue(d.value) : d.value}
              </div>
              <div
                className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${
                  isHighlight ? '' : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                }`}
                style={{
                  height: `${Math.max(h, 2)}%`,
                  backgroundColor: isHighlight ? d.color : undefined,
                }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
