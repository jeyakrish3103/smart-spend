import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
  '#34d399', '#60a5fa', '#c084fc', '#fbbf24',
  '#fb7185', '#2dd4bf', '#a78bfa', '#f97316',
  '#38bdf8', '#e879f9',
];

const periods = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export default function PieChart({ breakdown = [], period, onPeriodChange, loading }) {
  const hasData = breakdown.length > 0;

  const chartData = {
    labels: breakdown.map((item) => item.categoryName || item.name),
    datasets: [
      {
        data: breakdown.map((item) => parseFloat(item.total || item.amount || 0)),
        backgroundColor: CHART_COLORS.slice(0, breakdown.length),
        borderColor: 'rgba(5, 10, 24, 0.8)',
        borderWidth: 3,
        hoverBorderColor: 'rgba(5, 10, 24, 0.6)',
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#bcc7da',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => ` ₹${parseFloat(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-base-100)', fontFamily: 'var(--font-heading)' }}>
          Category Breakdown
        </h3>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-200"
              style={
                period === p.key
                  ? { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent-400)' }
                  : { color: 'var(--color-base-400)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[260px]">
          <div className="spinner" style={{ width: 28, height: 28 }}></div>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center h-[260px] gap-3">
          <div className="text-4xl opacity-50">📊</div>
          <p className="text-sm" style={{ color: 'var(--color-base-500)' }}>
            No spending data yet
          </p>
          <p className="text-xs" style={{ color: 'var(--color-base-600)' }}>
            Add your first expense to see the breakdown
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-[180px] h-[180px] shrink-0">
            <Doughnut data={chartData} options={options} />
          </div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {breakdown.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: CHART_COLORS[i] }}
                />
                <span className="text-xs truncate flex-1" style={{ color: 'var(--color-base-300)' }}>
                  {item.categoryName || item.name}
                </span>
                <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--color-base-200)' }}>
                  ₹{parseFloat(item.total || item.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
