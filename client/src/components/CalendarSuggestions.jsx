import { useState, useEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import ExpenseForm from './ExpenseForm';

export default function CalendarSuggestions() {
  const { isConnected, checkStatus, suggestions, loadSuggestions, removeSuggestion, loading } = useCalendar();
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    // Check if we are connected first
    checkStatus().then((connected) => {
      if (connected) {
        loadSuggestions();
      }
    });
  }, [checkStatus, loadSuggestions]);

  if (!isConnected || (suggestions.length === 0 && !loading)) {
    return null; // Don't show anything if not connected or no suggestions
  }

  const handleSuggestionClick = (event) => {
    setActiveEvent(event);
  };

  const handleExpenseSubmitted = () => {
    if (activeEvent) {
      removeSuggestion(activeEvent.eventId);
      setActiveEvent(null);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        ✨ Smart Suggestions
      </h3>
      
      {loading ? (
        <div className="flex justify-center p-4">
          <div className="spinner w-8 h-8 border-accent-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.eventId}
              onClick={() => handleSuggestionClick(suggestion)}
              className="card p-4 flex items-center justify-between cursor-pointer border border-white/5 hover:border-accent-500/50 hover:bg-white/5 transition-all"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm text-base-400 mb-1">
                  {new Date(suggestion.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-white font-medium truncate">{suggestion.title}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0">
                +
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense Modal for Suggestion */}
      {activeEvent && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Log Expense</h3>
              <button 
                onClick={() => setActiveEvent(null)}
                className="text-base-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-base-400 mb-4 bg-accent-500/10 p-3 rounded-lg border border-accent-500/20">
              💡 Suggested from calendar: <strong>{activeEvent.title}</strong>
            </p>

            <ExpenseForm 
              initialData={{
                note: activeEvent.title,
                date: new Date(activeEvent.date).toISOString().split('T')[0]
              }}
              onSuccess={handleExpenseSubmitted}
              onCancel={() => setActiveEvent(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
