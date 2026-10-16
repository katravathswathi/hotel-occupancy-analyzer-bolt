type Point = {
  label: string;
  value: number;
};

type Props = {
  data: Point[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
};

export default function LineChart({ data, height = 220, color = '#0891b2', formatValue }: Props) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;

  const width = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - 30 - ((d.value - minVal) / range) * (height - 50);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${width} ${height - 30} L 0 ${height - 30} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1="0" y1={height - 30 - p * (height - 50)}
            x2={width} y2={height - 30 - p * (height - 50)}
            stroke="#f1f5f9"
            strokeWidth="0.3"
          />
        ))}
        {/* Area */}
        <path d={areaD} fill="url(#lineGradient)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="1.2" fill={color} className="opacity-70" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-slate-400 font-medium" style={{ minWidth: '30px', textAlign: 'center' }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
