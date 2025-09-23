import { PrismaClient, UserRole, RecipeStatus, RecipeDifficulty } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitrecipes.com' },
    update: {},
    create: {
      email: 'admin@fitrecipes.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  })

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@fitrecipes.com' },
    update: {},
    create: {
      email: 'user@fitrecipes.com',
      passwordHash: userPassword,
      name: 'John Doe',
      role: UserRole.USER,
    },
  })

  // Create categories
  const categories = [
    { name: 'Breakfast', description: 'Healthy breakfast recipes' },
    { name: 'Lunch', description: 'Nutritious lunch ideas' },
    { name: 'Dinner', description: 'Wholesome dinner recipes' },
    { name: 'Snacks', description: 'Healthy snack options' },
    { name: 'Smoothies', description: 'Refreshing smoothie recipes' },
    { name: 'Salads', description: 'Fresh and healthy salads' },
  ]

  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
    createdCategories.push(created)
  }

  // Create sample recipes
  const recipes = [
    {
      title: 'Avocado Toast with Eggs',
      description: 'A nutritious and delicious breakfast with whole grain bread, avocado, and eggs.',
      ingredients: [
        { name: 'Whole grain bread', amount: '2 slices' },
        { name: 'Ripe avocado', amount: '1 medium' },
        { name: 'Eggs', amount: '2 large' },
        { name: 'Salt', amount: 'to taste' },
        { name: 'Black pepper', amount: 'to taste' },
        { name: 'Lemon juice', amount: '1 tsp' },
      ],
      instructions: [
        'Toast the bread slices until golden brown.',
        'Meanwhile, mash the avocado with lemon juice, salt, and pepper.',
        'Cook eggs to your preference (poached, fried, or scrambled).',
        'Spread avocado mixture on toast.',
        'Top with cooked eggs and serve immediately.',
      ],
      difficulty: RecipeDifficulty.EASY,
      prepTime: 5,
      cookTime: 10,
      servings: 2,
      caloriesPerServing: 320,
      protein: 14.5,
      carbs: 28.0,
      fat: 18.5,
      categoryId: createdCategories[0].id, // Breakfast
      userId: user.id,
      status: RecipeStatus.APPROVED,
      approvedById: admin.id,
    },
    {
      title: 'Quinoa Buddha Bowl',
      description: 'A colorful and nutritious bowl packed with quinoa, vegetables, and tahini dressing.',
      ingredients: [
        { name: 'Quinoa', amount: '1 cup' },
        { name: 'Chickpeas', amount: '1 can, drained' },
        { name: 'Sweet potato', amount: '1 large, cubed' },
        { name: 'Kale', amount: '2 cups, chopped' },
        { name: 'Avocado', amount: '1 medium, sliced' },
        { name: 'Tahini', amount: '3 tbsp' },
        { name: 'Lemon juice', amount: '2 tbsp' },
        { name: 'Olive oil', amount: '2 tbsp' },
      ],
      instructions: [
        'Cook quinoa according to package directions.',
        'Roast sweet potato cubes with olive oil at 400°F for 25 minutes.',
        'Massage kale with a little olive oil and lemon juice.',
        'Mix tahini with lemon juice and water to make dressing.',
        'Assemble bowls with quinoa, roasted sweet potato, kale, chickpeas, and avocado.',
        'Drizzle with tahini dressing and serve.',
      ],
      difficulty: RecipeDifficulty.MEDIUM,
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      caloriesPerServing: 425,
      protein: 16.2,
      carbs: 52.8,
      fat: 18.9,
      categoryId: createdCategories[1].id, // Lunch
      userId: user.id,
      status: RecipeStatus.APPROVED,
      approvedById: admin.id,
    },
    {
      title: 'Green Smoothie Bowl',
      description: 'A refreshing and nutrient-packed smoothie bowl with tropical flavors.',
      ingredients: [
        { name: 'Spinach', amount: '2 cups' },
        { name: 'Frozen mango', amount: '1 cup' },
        { name: 'Frozen pineapple', amount: '0.5 cup' },
        { name: 'Banana', amount: '1 ripe' },
        { name: 'Coconut milk', amount: '0.5 cup' },
        { name: 'Chia seeds', amount: '1 tbsp' },
        { name: 'Granola', amount: '2 tbsp' },
        { name: 'Fresh berries', amount: '0.25 cup' },
      ],
      instructions: [
        'Blend spinach, mango, pineapple, banana, and coconut milk until smooth.',
        'Pour into a bowl.',
        'Top with chia seeds, granola, and fresh berries.',
        'Serve immediately.',
      ],
      difficulty: RecipeDifficulty.EASY,
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      caloriesPerServing: 285,
      protein: 8.5,
      carbs: 58.2,
      fat: 6.8,
      categoryId: createdCategories[4].id, // Smoothies
      userId: user.id,
      status: RecipeStatus.PENDING,
    },
  ]

  for (const recipe of recipes) {
    await prisma.recipe.create({
      data: recipe,
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: admin@fitrecipes.com / admin123`)
  console.log(`👤 Regular user: user@fitrecipes.com / user123`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })