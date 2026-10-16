type Segment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
};

export default function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {total > 0 && data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-2xl font-bold text-slate-900">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-slate-400 font-medium">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="space-y-2.5 w-full sm:w-auto">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3 min-w-[140px]">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-slate-600 flex-1">{d.label}</span>
            <span className="text-sm font-semibold text-slate-900">
              {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
