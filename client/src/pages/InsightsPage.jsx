import { useState, useEffect } from 'react';
import { useInsights } from '../hooks/useInsights';

export default function InsightsPage() {
  const { 
    loadingSummary, 
    loadingForecast, 
    loadingRecommendations, 
    loadingImpulse, 
    error, 
    getSummary, 
    getForecast, 
    getRecommendations, 
    checkImpulse 
  } = useInsights();
  
  const [summary, setSummary] = useState(null);
  const [forecast, setForecast] = useState(null);
  
  // Recommendations state
  const [recPriorities, setRecPriorities] = useState('');
  const [recGoal, setRecGoal] = useState('');
  const [recommendations, setRecommendations] = useState(null);

  // Impulse state
  const [impAmount, setImpAmount] = useState('');
  const [impCategory, setImpCategory] = useState('');
  const [impPriorities, setImpPriorities] = useState('');
  const [impulseVerdict, setImpulseVerdict] = useState(null);

  // Load summary and forecast automatically on mount
  useEffect(() => {
    async function loadInitialInsights() {
      // Run them in parallel for speed
      Promise.all([getSummary(), getForecast()]).then(([summaryText, forecastText]) => {
        if (summaryText) setSummary(summaryText);
        if (forecastText) setForecast(forecastText);
      });
    }
    loadInitialInsights();
  }, [getSummary, getForecast]);

  const handleGetRecommendations = async (e) => {
    e.preventDefault();
    if (!recPriorities || !recGoal) return;
    const res = await getRecommendations(recPriorities, parseFloat(recGoal));
    if (res) setRecommendations(res);
  };

  const handleCheckImpulse = async (e) => {
    e.preventDefault();
    if (!impAmount || !impCategory || !impPriorities) return;
    const res = await checkImpulse(parseFloat(impAmount), impCategory, impPriorities);
    if (res) setImpulseVerdict(res);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            AI Insights
          </h2>
          <p className="text-base-400 text-sm">AI-powered analysis and recommendations</p>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Top row: Summary & Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📝</span>
            <h3 className="text-lg font-bold text-white">Monthly Summary</h3>
          </div>
          {loadingSummary && !summary ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="h-4 bg-white/10 rounded w-4/6"></div>
            </div>
          ) : (
            <div className="text-base-200 whitespace-pre-wrap text-sm leading-relaxed">
              {summary || "Loading summary..."}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔮</span>
            <h3 className="text-lg font-bold text-white">Spending Forecast</h3>
          </div>
          {loadingForecast && !forecast ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="text-base-200 whitespace-pre-wrap text-sm leading-relaxed">
              {forecast || "Loading forecast..."}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Budget Coach & Impulse Checker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Coach */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-bold text-white">Budget Coach</h3>
          </div>
          <p className="text-sm text-base-400 mb-5">
            Tell the AI your savings goal and priorities, and get concrete recommendations on where to cut back.
          </p>

          <form onSubmit={handleGetRecommendations} className="space-y-4">
            <div>
              <label className="label">Savings Goal (₹)</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="5000"
                value={recGoal}
                onChange={(e) => setRecGoal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Your Priorities</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Rent and groceries are non-negotiable. Entertainment is flexible."
                value={recPriorities}
                onChange={(e) => setRecPriorities(e.target.value)}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loadingRecommendations}>
              {loadingRecommendations && !recommendations ? 'Analyzing...' : 'Get Recommendations'}
            </button>
          </form>

          {recommendations && (
            <div className="mt-6 p-4 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <h4 className="text-accent-400 font-semibold mb-2 text-sm">AI Recommendation:</h4>
              <div className="text-base-200 text-sm whitespace-pre-wrap">{recommendations}</div>
            </div>
          )}
        </div>

        {/* Impulse Checker */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🛍️</span>
            <h3 className="text-lg font-bold text-white">Impulse Purchase Checker</h3>
          </div>
          <p className="text-sm text-base-400 mb-5">
            Should you buy it? Ask the AI to check it against your remaining budget and pacing.
          </p>

          <form onSubmit={handleCheckImpulse} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="2000"
                  value={impAmount}
                  onChange={(e) => setImpAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Shopping, Games..."
                  value={impCategory}
                  onChange={(e) => setImpCategory(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Your Priorities</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="I am trying to save for a vacation. No unnecessary shopping."
                value={impPriorities}
                onChange={(e) => setImpPriorities(e.target.value)}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loadingImpulse}>
              {loadingImpulse && !impulseVerdict ? 'Checking...' : 'Check Purchase'}
            </button>
          </form>

          {impulseVerdict && (
            <div className="mt-6 p-4 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <h4 className="text-accent-400 font-semibold mb-2 text-sm">AI Verdict:</h4>
              <div className="text-base-200 text-sm whitespace-pre-wrap">{impulseVerdict}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
