const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Food', icon: '🍔' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Gym', icon: '💪' },
  { name: 'Bills', icon: '📄' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health', icon: '🏥' },
  { name: 'Education', icon: '📚' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Other', icon: '📦' },
];

async function main() {
  console.log('Seeding default categories...');

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: cat.name.toLowerCase() },
      update: {},
      create: {
        id: cat.name.toLowerCase(),
        name: cat.name,
        icon: cat.icon,
        userId: null, // global/default
      },
    });
  }

  console.log(`Seeded ${defaultCategories.length} default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
