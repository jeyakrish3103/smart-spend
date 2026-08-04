import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const ranges = [
  { key: 'week', label: '7D' },
  { key: 'month', label: '30D' },
  { key: 'quarter', label: '90D' },
];

export default function SpendChart({ data = [], range, onRangeChange, loading }) {
  const labels = data.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  });
  const values = data.map((d) => parseFloat(d.total || d.amount || 0));
  const maxVal = Math.max(...values, 1);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: '#34d399',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#34d399',
        pointBorderColor: 'rgba(5, 10, 24, 0.9)',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#34d399',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
        ticks: { color: 'var(--color-base-500)', font: { size: 11 }, maxTicksLimit: 7 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        suggestedMax: maxVal * 1.15,
        grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
        ticks: {
          color: 'var(--color-base-500)',
          font: { size: 11 },
          callback: (v) => `₹${v.toLocaleString('en-IN')}`,
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#bcc7da',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => `Spent: ₹${parseFloat(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      },
      legend: { display: false },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-base-100)', fontFamily: 'var(--font-heading)' }}>
          Spend Over Time
        </h3>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => onRangeChange(r.key)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-200"
              style={
                range === r.key
                  ? { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent-400)' }
                  : { color: 'var(--color-base-400)' }
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[260px]">
          <div className="spinner" style={{ width: 28, height: 28 }}></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[260px] gap-3">
          <div className="text-4xl opacity-50">📈</div>
          <p className="text-sm" style={{ color: 'var(--color-base-500)' }}>
            No spending data yet
          </p>
        </div>
      ) : (
        <div className="h-[260px]">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
