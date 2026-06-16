const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@expensetrack.app' },
    update: {},
    create: {
      name: 'Fahad',
      email: 'demo@expensetrack.app',
      passwordHash,
      emailVerified: true,
    },
  });

  console.log(`  ✓ Created user: ${user.email}`);

  // Create accounts
  const bankAccount = await prisma.account.upsert({
    where: { id: 'seed-bank-account' },
    update: {},
    create: {
      id: 'seed-bank-account',
      userId: user.id,
      name: 'Bank Account',
      type: 'bank',
      balance: 50000,
    },
  });

  const cashAccount = await prisma.account.upsert({
    where: { id: 'seed-cash-account' },
    update: {},
    create: {
      id: 'seed-cash-account',
      userId: user.id,
      name: 'Cash In Hand',
      type: 'cash',
      balance: 5000,
    },
  });

  console.log('  ✓ Created accounts: Bank, Cash');

  // Create categories
  const fahadCat = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: 'Fahad' } },
    update: {},
    create: { userId: user.id, name: 'Fahad' },
  });

  const mrsCat = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: 'Mrs' } },
    update: {},
    create: { userId: user.id, name: 'Mrs' },
  });

  const homeCat = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: 'Home' } },
    update: {},
    create: { userId: user.id, name: 'Home' },
  });

  console.log('  ✓ Created categories: Fahad, Mrs, Home');

  // Create sample transactions
  const sampleTransactions = [
    { accountId: bankAccount.id, categoryId: null, transactionType: 'income', amount: 75000, description: 'Monthly Salary', transactionDate: new Date('2026-06-01') },
    { accountId: cashAccount.id, categoryId: fahadCat.id, transactionType: 'expense', amount: 1500, description: 'Fuel', transactionDate: new Date('2026-06-02') },
    { accountId: cashAccount.id, categoryId: fahadCat.id, transactionType: 'expense', amount: 500, description: 'Mobile Recharge', transactionDate: new Date('2026-06-03') },
    { accountId: bankAccount.id, categoryId: homeCat.id, transactionType: 'expense', amount: 8000, description: 'Grocery', transactionDate: new Date('2026-06-05') },
    { accountId: bankAccount.id, categoryId: homeCat.id, transactionType: 'expense', amount: 3500, description: 'Electricity Bill', transactionDate: new Date('2026-06-07') },
    { accountId: cashAccount.id, categoryId: mrsCat.id, transactionType: 'expense', amount: 2500, description: 'Shopping', transactionDate: new Date('2026-06-08') },
    { accountId: bankAccount.id, categoryId: homeCat.id, transactionType: 'expense', amount: 2000, description: 'Gas Bill', transactionDate: new Date('2026-06-10') },
    { accountId: cashAccount.id, categoryId: fahadCat.id, transactionType: 'expense', amount: 800, description: 'Food', transactionDate: new Date('2026-06-12') },
    { accountId: bankAccount.id, categoryId: mrsCat.id, transactionType: 'expense', amount: 4000, description: 'Clothing', transactionDate: new Date('2026-06-14') },
    { accountId: bankAccount.id, categoryId: fahadCat.id, transactionType: 'expense', amount: 2500, description: 'Internet Bill', transactionDate: new Date('2026-06-15') },
  ];

  for (const txn of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        ...txn,
      },
    });
  }

  console.log(`  ✓ Created ${sampleTransactions.length} sample transactions`);
  console.log('\n✅ Seeding complete!\n');
  console.log('  Demo login:');
  console.log('  Email: demo@expensetrack.app');
  console.log('  Password: demo1234\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
