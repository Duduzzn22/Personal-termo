import type { PhysicalAssessment } from "@/types/assessment";

type MetricKey = "peso_kg" | "percentual_gordura" | "cintura_cm";

function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

export function AssessmentTrendChart({
  assessments,
  metric,
  label,
  unit,
}: {
  assessments: PhysicalAssessment[];
  metric: MetricKey;
  label: string;
  unit: string;
}) {
  const points = [...assessments]
    .reverse()
    .map((assessment) => ({
      date: assessment.data_avaliacao,
      value: assessment[metric],
    }))
    .filter((point): point is { date: string; value: number } => point.value !== null && point.value !== undefined)
    .slice(-10);

  if (points.length < 2) return null;

  const width = 420;
  const height = 150;
  const paddingX = 24;
  const paddingTop = 18;
  const paddingBottom = 28;
  const values = points.map((point) => Number(point.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  const chartPoints = points.map((point, index) => {
    const x = paddingX + (index / Math.max(points.length - 1, 1)) * usableWidth;
    const y = paddingTop + (1 - (Number(point.value) - minValue) / spread) * usableHeight;
    return { ...point, x, y };
  });

  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const latest = chartPoints[chartPoints.length - 1];

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {Number(latest.value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{unit}
          </p>
        </div>
        <p className="text-xs text-slate-400">Últimas {points.length} avaliações</p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label={`Evolução de ${label.toLowerCase()}`}>
        <line x1={paddingX} y1={height - paddingBottom} x2={width - paddingX} y2={height - paddingBottom} stroke="currentColor" className="text-slate-200" strokeWidth="1" />
        <polyline points={polyline} fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {chartPoints.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="currentColor" className="text-slate-900" />
            {(index === 0 || index === chartPoints.length - 1) && (
              <text x={point.x} y={height - 8} textAnchor={index === 0 ? "start" : "end"} className="fill-slate-400 text-[10px]">
                {shortDate(point.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}