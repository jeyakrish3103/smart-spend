import { useEffect, useState, useRef } from 'react';

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const startVal = display;
    const diff = value - startVal;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + diff * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export default function SummaryCards({ summary, loading }) {
  const cards = [
    {
      label: 'This Week',
      value: summary?.weekTotal || 0,
      icon: '📅',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.06))',
      border: 'rgba(16, 185, 129, 0.12)',
      iconBg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: 'This Month',
      value: summary?.monthTotal || 0,
      icon: '📊',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.06))',
      border: 'rgba(59, 130, 246, 0.12)',
      iconBg: 'rgba(59, 130, 246, 0.15)',
    },
    {
      label: 'Avg / Day',
      value: summary?.avgPerDay || 0,
      icon: '📈',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(139, 92, 246, 0.06))',
      border: 'rgba(168, 85, 247, 0.12)',
      iconBg: 'rgba(168, 85, 247, 0.15)',
    },
    {
      label: 'Transactions',
      value: summary?.expenseCount || 0,
      icon: '🧾',
      isCount: true,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(234, 179, 8, 0.06))',
      border: 'rgba(245, 158, 11, 0.12)',
      iconBg: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="rounded-2xl p-5 glass-card-hover"
          style={{
            background: card.gradient,
            border: `1px solid ${card.border}`,
            animationDelay: `${i * 100}ms`,
            animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-base-400)' }}>
              {card.label}
            </span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: card.iconBg }}
            >
              {card.icon}
            </div>
          </div>
          <div
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-base-50)' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: 24, height: 24 }}></div>
            ) : card.isCount ? (
              Math.round(card.value)
            ) : (
              <>₹<AnimatedNumber value={card.value} /></>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
