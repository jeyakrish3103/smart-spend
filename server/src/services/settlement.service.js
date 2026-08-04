// =============================================================================
// Settlement Service — Pure Business Logic
// =============================================================================
// This file contains NO database calls and NO HTTP handling.
// It's a "pure function" — give it data, get results back.
//
// WHY SEPARATE THIS?
// 1. Testable: You can test with fake data without a database
// 2. Reusable: The same algorithm works regardless of delivery (API, CLI, mobile)
// 3. Readable: Route handlers stay clean, just calling this service
//
// THE ALGORITHM (Greedy Net Settlement):
// 1. For each user, compute: (total they paid) - (total they owe) = net balance
// 2. Positive balance → they are OWED money (creditor)
//    Negative balance → they OWE money (debtor)
// 3. Subtract any existing settlements (debts already paid off)
// 4. Greedily match the biggest creditor with the biggest debtor
// 5. The transfer amount = min(creditor's balance, debtor's debt)
// 6. Repeat until all balances are zero
//
// This minimizes the number of transactions needed to settle all debts.
// =============================================================================

/**
 * Compute net balances for each user in a group.
 *
 * @param {Array} expenses - Group expenses, each with:
 *   { paidByUserId, amount, splits: [{ userId, amountOwed }] }
 * @param {Array} settlements - Existing settlements, each with:
 *   { fromUserId, toUserId, amount }
 * @returns {Map<string, number>} userId → net balance
 *   Positive = owed money, Negative = owes money
 */
function computeNetBalances(expenses, settlements = []) {
  const balances = new Map();

  // Helper: ensure a user exists in the map
  const ensure = (userId) => {
    if (!balances.has(userId)) balances.set(userId, 0);
  };

  // Step 1: Process each expense
  // The PAYER gets credit (+amount), each SPLIT participant gets debt (-amountOwed)
  for (const expense of expenses) {
    const paidBy = expense.paidByUserId;
    const totalPaid = parseFloat(expense.amount);

    ensure(paidBy);
    balances.set(paidBy, balances.get(paidBy) + totalPaid);

    for (const split of expense.splits) {
      const owedBy = split.userId;
      const owed = parseFloat(split.amountOwed);

      ensure(owedBy);
      balances.set(owedBy, balances.get(owedBy) - owed);
    }
  }

  // Step 2: Apply existing settlements
  // When fromUser pays toUser, fromUser's debt decreases (+) and toUser's credit decreases (-)
  for (const s of settlements) {
    const amount = parseFloat(s.amount);

    ensure(s.fromUserId);
    ensure(s.toUserId);
    balances.set(s.fromUserId, balances.get(s.fromUserId) + amount);
    balances.set(s.toUserId, balances.get(s.toUserId) - amount);
  }

  return balances;
}

/**
 * Given net balances, compute the minimum set of transfers to settle all debts.
 *
 * Uses a GREEDY ALGORITHM:
 * - Sort creditors (positive balance) descending
 * - Sort debtors (negative balance) ascending (most debt first)
 * - Match biggest creditor with biggest debtor
 * - Transfer amount = min(credit, |debt|)
 * - Repeat
 *
 * @param {Map<string, number>} balances - userId → net balance
 * @returns {Array<{from: string, to: string, amount: number}>}
 */
function computeOptimizedTransfers(balances) {
  // Separate into creditors and debtors
  const creditors = []; // people owed money (positive balance)
  const debtors = [];   // people who owe money (negative balance)

  for (const [userId, balance] of balances) {
    // Round to 2 decimal places to avoid floating-point weirdness
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    }
    // If ~0, they're settled — skip
  }

  // Sort: biggest amounts first for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let ci = 0; // creditor index
  let di = 0; // debtor index

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    // Transfer the smaller of the two amounts
    const transferAmount = Math.min(creditor.amount, debtor.amount);
    const rounded = Math.round(transferAmount * 100) / 100;

    if (rounded > 0) {
      transfers.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: rounded,
      });
    }

    // Reduce both balances
    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    // Move to next person if their balance is settled
    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return transfers;
}

/**
 * Main entry point: compute everything needed for the balance view.
 *
 * @param {Array} expenses - Group expenses with splits
 * @param {Array} settlements - Existing settlements
 * @param {Array} members - Group members [{ userId, userName }]
 * @returns {{ balances: Array, transfers: Array }}
 */
function computeSettlements(expenses, settlements = [], members = []) {
  const netBalances = computeNetBalances(expenses, settlements);
  const transfers = computeOptimizedTransfers(netBalances);

  // Convert balances map to a friendly array with member names
  const memberMap = new Map(members.map((m) => [m.userId, m.userName]));

  const balanceList = [];
  for (const [userId, balance] of netBalances) {
    balanceList.push({
      userId,
      userName: memberMap.get(userId) || 'Unknown',
      balance: Math.round(balance * 100) / 100,
    });
  }

  // Enrich transfers with names
  const enrichedTransfers = transfers.map((t) => ({
    ...t,
    fromName: memberMap.get(t.from) || 'Unknown',
    toName: memberMap.get(t.to) || 'Unknown',
  }));

  return {
    balances: balanceList,
    transfers: enrichedTransfers,
  };
}

module.exports = { computeNetBalances, computeOptimizedTransfers, computeSettlements };
