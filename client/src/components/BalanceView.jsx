// =============================================================================
// BalanceView Component
// =============================================================================
// Visualizes the output of our greedy settlement algorithm.
// Shows two things:
// 1. Overall net balance for each person (You are owed ₹100, or You owe ₹50)
// 2. The suggested optimized transfers (Who should pay whom to settle up)
// =============================================================================

export default function BalanceView({ balances, transfers, onSettleClick, currentUserId }) {
  if (!balances || balances.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-base-400">
        No expenses yet. Add one to see balances!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Net Balances */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Net Balances</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {balances.map((b) => {
            const isMe = b.userId === currentUserId;
            const isOwed = b.balance > 0;
            const owes = b.balance < 0;
            const settled = b.balance === 0;

            return (
              <div key={b.userId} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-base-600 to-base-800 flex items-center justify-center font-bold">
                  {b.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {isMe ? 'You' : b.userName}
                  </p>
                  <p className={`text-xs mt-0.5 ${isOwed ? 'text-accent-400' : owes ? 'text-rose-400' : 'text-base-400'}`}>
                    {settled ? 'Settled up' : isOwed ? `gets back ₹${b.balance.toFixed(2)}` : `owes ₹${Math.abs(b.balance).toFixed(2)}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Suggested Transfers */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">How to Settle Up</h3>
        {transfers.length === 0 ? (
          <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm text-center">
            🎉 Everyone is settled up!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transfers.map((t, i) => {
              const iAmPaying = t.from === currentUserId;
              const iAmReceiving = t.to === currentUserId;

              return (
                <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-medium ${iAmPaying ? 'text-white' : 'text-base-300'}`}>
                      {iAmPaying ? 'You' : t.fromName}
                    </span>
                    <span className="text-base-500">→</span>
                    <span className={`font-medium ${iAmReceiving ? 'text-white' : 'text-base-300'}`}>
                      {iAmReceiving ? 'You' : t.toName}
                    </span>
                    <span className="font-bold text-white ml-2">₹{t.amount.toFixed(2)}</span>
                  </div>
                  
                  {/* If I am involved in this transfer, show a settle button */}
                  {(iAmPaying || iAmReceiving) && (
                    <button 
                      onClick={() => onSettleClick(t)}
                      className="btn btn-sm btn-primary shrink-0"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
