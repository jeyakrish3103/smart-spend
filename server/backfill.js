const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOrCreateGroupCategory(userId, group) {
  let cat = await prisma.category.findFirst({
    where: { userId, name: `Group: ${group.name}` }
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: { userId, name: `Group: ${group.name}`, icon: '👥' }
    });
  }
  return cat;
}

async function main() {
  console.log('Starting backfill of Group Expenses to Personal Expenses...');

  const groupExpenses = await prisma.groupExpense.findMany({
    include: {
      splits: true,
      group: true
    }
  });

  let createdCount = 0;

  for (const expense of groupExpenses) {
    for (const split of expense.splits) {
      if (Number(split.amountOwed) > 0) {
        // Check if an expense for this split already exists (safety check)
        const existing = await prisma.expense.findUnique({
          where: { groupExpenseSplitId: split.id }
        });

        if (!existing) {
          const cat = await getOrCreateGroupCategory(split.userId, expense.group);
          await prisma.expense.create({
            data: {
              userId: split.userId,
              amount: split.amountOwed,
              categoryId: cat.id,
              date: expense.date,
              note: expense.description,
              paymentMethod: expense.paidByUserId === split.userId ? 'Paid by you' : 'Group Split',
              groupExpenseSplitId: split.id,
              createdAt: expense.createdAt
            }
          });
          createdCount++;
        }
      }
    }
  }

  console.log(`Backfill complete. Created ${createdCount} personal expenses.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
