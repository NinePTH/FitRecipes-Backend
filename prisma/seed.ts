/* eslint-disable no-console */
/**
 * Database Seeding Script
 * 
 * Creates test users and sample recipes for development/testing
 * Run with: bun run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('');

  // ========================================
  // SEED USERS
  // ========================================
  console.log('👥 Creating test users...');

  // 1. Standard User
  const user = await prisma.user.upsert({
    where: { email: 'user@fitrecipes.com' },
    update: {},
    create: {
      email: 'user@fitrecipes.com',
      password: await hashPassword('User123!'),
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      termsAccepted: true,
      isEmailVerified: true,
    },
  });
  console.log('  ✅ Standard User: user@fitrecipes.com / User123!');

  // 2. Chef User
  const chef = await prisma.user.upsert({
    where: { email: 'chef@fitrecipes.com' },
    update: {},
    create: {
      email: 'chef@fitrecipes.com',
      password: await hashPassword('Chef123!'),
      firstName: 'Chef',
      lastName: 'Gordon',
      role: 'CHEF',
      termsAccepted: true,
      isEmailVerified: true,
    },
  });
  console.log('  ✅ Chef User: chef@fitrecipes.com / Chef123!');

  // 3. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitrecipes.com' },
    update: {},
    create: {
      email: 'admin@fitrecipes.com',
      password: await hashPassword('Admin123!'),
      firstName: 'Admin',
      lastName: 'Administrator',
      role: 'ADMIN',
      termsAccepted: true,
      isEmailVerified: true,
    },
  });
  console.log('  ✅ Admin User: admin@fitrecipes.com / Admin123!');

  // 4. General Test User
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: await hashPassword('Test123!'),
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      termsAccepted: true,
      isEmailVerified: true,
    },
  });
  console.log('  ✅ Test User: test@example.com / Test123!');

  // 5. Blocked User (for testing account lockout)
  await prisma.user.upsert({
    where: { email: 'blocked@example.com' },
    update: {
      failedLoginAttempts: 5,
      blockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    },
    create: {
      email: 'blocked@example.com',
      password: await hashPassword('Blocked123!'),
      firstName: 'Blocked',
      lastName: 'User',
      role: 'USER',
      termsAccepted: true,
      isEmailVerified: true,
      failedLoginAttempts: 5,
      blockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  console.log('  ✅ Blocked User: blocked@example.com (locked for 15min)');

  console.log('');
  console.log('📊 Total users created: 5');
  console.log('');

  // ========================================
  // SEED RECIPES
  // ========================================
  console.log('🍳 Creating sample recipes...');

  // Sample Recipe 1: Approved Recipe by Chef
  const recipe1 = await prisma.recipe.upsert({
    where: { id: 'recipe-1' },
    update: {},
    create: {
      id: 'recipe-1',
      title: 'Classic Margherita Pizza',
      description: 'A simple and delicious homemade pizza with fresh mozzarella, tomatoes, and basil. Perfect for beginners!',
      mainIngredient: 'Pizza Dough',
      ingredients: [
        { name: 'Pizza dough', amount: '1', unit: 'ball' },
        { name: 'Tomato sauce', amount: '1/2', unit: 'cup' },
        { name: 'Fresh mozzarella', amount: '8', unit: 'oz' },
        { name: 'Fresh basil leaves', amount: '10', unit: 'leaves' },
        { name: 'Olive oil', amount: '2', unit: 'tbsp' },
        { name: 'Salt', amount: '1', unit: 'pinch' },
      ],
      instructions: [
        'Preheat oven to 475°F (245°C) with a pizza stone inside',
        'Roll out pizza dough on a floured surface to 12-inch circle',
        'Spread tomato sauce evenly over dough, leaving 1-inch border',
        'Tear mozzarella and distribute over sauce',
        'Drizzle with olive oil and add salt',
        'Bake for 12-15 minutes until crust is golden and cheese is bubbly',
        'Remove from oven and top with fresh basil leaves',
        'Let cool for 2 minutes, slice and serve hot',
      ],
      prepTime: 20,
      cookingTime: 15,
      servings: 4,
      mealType: ['LUNCH', 'DINNER'],
      difficulty: 'EASY',
      cuisineType: 'ITALIAN',
      dietaryInfo: {
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        isDairyFree: false,
        isKeto: false,
        isPaleo: false,
      },
      nutritionInfo: {
        calories: 285,
        protein: 12,
        carbs: 36,
        fat: 10,
        fiber: 2,
        sodium: 590,
      },
      allergies: ['gluten', 'dairy'],
      imageUrls: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'],
      status: 'APPROVED',
      authorId: chef.id,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });
  console.log('  ✅ Recipe 1: Classic Margherita Pizza (APPROVED)');

  // Sample Recipe 2: Pending Recipe by Chef
  await prisma.recipe.upsert({
    where: { id: 'recipe-2' },
    update: {},
    create: {
      id: 'recipe-2',
      title: 'Grilled Chicken Caesar Salad',
      description: 'Crispy romaine lettuce topped with grilled chicken, parmesan cheese, and homemade Caesar dressing.',
      mainIngredient: 'Chicken Breast',
      ingredients: [
        { name: 'Chicken breast', amount: '2', unit: 'pieces' },
        { name: 'Romaine lettuce', amount: '1', unit: 'head' },
        { name: 'Parmesan cheese', amount: '1/2', unit: 'cup' },
        { name: 'Caesar dressing', amount: '1/3', unit: 'cup' },
        { name: 'Croutons', amount: '1', unit: 'cup' },
        { name: 'Olive oil', amount: '2', unit: 'tbsp' },
      ],
      instructions: [
        'Season chicken breasts with salt, pepper, and olive oil',
        'Grill chicken for 6-7 minutes per side until fully cooked',
        'Let chicken rest for 5 minutes, then slice',
        'Chop romaine lettuce and place in large bowl',
        'Add Caesar dressing and toss to coat',
        'Top with sliced chicken, parmesan, and croutons',
        'Serve immediately',
      ],
      prepTime: 15,
      cookingTime: 15,
      servings: 2,
      mealType: ['LUNCH', 'DINNER'],
      difficulty: 'EASY',
      cuisineType: 'AMERICAN',
      dietaryInfo: {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isDairyFree: false,
        isKeto: true,
        isPaleo: false,
      },
      nutritionInfo: {
        calories: 425,
        protein: 38,
        carbs: 18,
        fat: 24,
        fiber: 3,
        sodium: 890,
      },
      allergies: ['gluten', 'dairy', 'eggs'],
      imageUrls: ['https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800'],
      status: 'PENDING',
      authorId: chef.id,
    },
  });
  console.log('  ✅ Recipe 2: Grilled Chicken Caesar Salad (PENDING)');

  // Sample Recipe 3: Vegan Recipe (APPROVED)
  await prisma.recipe.upsert({
    where: { id: 'recipe-3' },
    update: {},
    create: {
      id: 'recipe-3',
      title: 'Vegan Buddha Bowl',
      description: 'A nutritious and colorful bowl with quinoa, roasted vegetables, chickpeas, and tahini dressing.',
      mainIngredient: 'Quinoa',
      ingredients: [
        { name: 'Quinoa', amount: '1', unit: 'cup' },
        { name: 'Sweet potato', amount: '1', unit: 'medium' },
        { name: 'Chickpeas', amount: '1', unit: 'can' },
        { name: 'Kale', amount: '2', unit: 'cups' },
        { name: 'Avocado', amount: '1', unit: 'whole' },
        { name: 'Tahini', amount: '3', unit: 'tbsp' },
        { name: 'Lemon juice', amount: '2', unit: 'tbsp' },
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'Cube sweet potato and roast at 400°F for 25 minutes',
        'Drain and rinse chickpeas, then roast with spices',
        'Massage kale with olive oil and lemon juice',
        'Make tahini dressing by mixing tahini, lemon juice, water, and garlic',
        'Assemble bowl with quinoa, roasted sweet potato, chickpeas, and kale',
        'Top with sliced avocado and drizzle with tahini dressing',
        'Season with salt, pepper, and red pepper flakes',
      ],
      prepTime: 15,
      cookingTime: 30,
      servings: 2,
      mealType: ['LUNCH', 'DINNER'],
      difficulty: 'MEDIUM',
      cuisineType: 'MEDITERRANEAN',
      dietaryInfo: {
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        isDairyFree: true,
        isKeto: false,
        isPaleo: false,
      },
      nutritionInfo: {
        calories: 520,
        protein: 18,
        carbs: 68,
        fat: 22,
        fiber: 14,
        sodium: 320,
      },
      allergies: ['sesame'],
      imageUrls: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
      status: 'APPROVED',
      authorId: chef.id,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });
  console.log('  ✅ Recipe 3: Vegan Buddha Bowl (APPROVED)');

  // Sample Recipe 4: Breakfast Recipe (APPROVED)
  await prisma.recipe.upsert({
    where: { id: 'recipe-4' },
    update: {},
    create: {
      id: 'recipe-4',
      title: 'Blueberry Protein Pancakes',
      description: 'Fluffy pancakes packed with protein and fresh blueberries. Perfect post-workout breakfast!',
      mainIngredient: 'Protein Powder',
      ingredients: [
        { name: 'Protein powder', amount: '1', unit: 'scoop' },
        { name: 'Oat flour', amount: '1/2', unit: 'cup' },
        { name: 'Banana', amount: '1', unit: 'medium' },
        { name: 'Eggs', amount: '2', unit: 'whole' },
        { name: 'Blueberries', amount: '1', unit: 'cup' },
        { name: 'Almond milk', amount: '1/4', unit: 'cup' },
        { name: 'Baking powder', amount: '1', unit: 'tsp' },
      ],
      instructions: [
        'Mash banana in a large bowl',
        'Add eggs, protein powder, oat flour, baking powder, and almond milk',
        'Mix until smooth batter forms',
        'Fold in half of the blueberries',
        'Heat non-stick pan over medium heat',
        'Pour 1/4 cup batter per pancake',
        'Cook for 2-3 minutes until bubbles form',
        'Flip and cook another 2 minutes',
        'Serve with remaining blueberries and maple syrup',
      ],
      prepTime: 10,
      cookingTime: 15,
      servings: 3,
      mealType: ['BREAKFAST'],
      difficulty: 'EASY',
      cuisineType: 'AMERICAN',
      dietaryInfo: {
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        isDairyFree: true,
        isKeto: false,
        isPaleo: false,
      },
      nutritionInfo: {
        calories: 285,
        protein: 22,
        carbs: 38,
        fat: 6,
        fiber: 5,
        sodium: 210,
      },
      allergies: ['eggs'],
      imageUrls: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'],
      status: 'APPROVED',
      authorId: chef.id,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });
  console.log('  ✅ Recipe 4: Blueberry Protein Pancakes (APPROVED)');

  // Sample Recipe 5: Dessert Recipe (REJECTED - for testing)
  await prisma.recipe.upsert({
    where: { id: 'recipe-5' },
    update: {},
    create: {
      id: 'recipe-5',
      title: 'Chocolate Lava Cake',
      description: 'Decadent molten chocolate cake with a gooey center.',
      mainIngredient: 'Dark Chocolate',
      ingredients: [
        { name: 'Dark chocolate', amount: '4', unit: 'oz' },
        { name: 'Butter', amount: '1/2', unit: 'cup' },
        { name: 'Eggs', amount: '2', unit: 'whole' },
        { name: 'Sugar', amount: '1/4', unit: 'cup' },
        { name: 'Flour', amount: '2', unit: 'tbsp' },
      ],
      instructions: [
        'Preheat oven to 425°F',
        'Melt chocolate and butter together',
        'Beat eggs and sugar until thick',
        'Fold in chocolate mixture and flour',
        'Pour into greased ramekins',
        'Bake for 12-14 minutes',
      ],
      prepTime: 10,
      cookingTime: 15,
      servings: 2,
      mealType: ['DESSERT'],
      difficulty: 'MEDIUM',
      cuisineType: 'FRENCH',
      dietaryInfo: {
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        isDairyFree: false,
        isKeto: false,
        isPaleo: false,
      },
      nutritionInfo: {
        calories: 520,
        protein: 8,
        carbs: 45,
        fat: 36,
        fiber: 3,
        sodium: 180,
      },
      allergies: ['gluten', 'dairy', 'eggs'],
      imageUrls: ['https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800'],
      status: 'REJECTED',
      authorId: chef.id,
      rejectedById: admin.id,
      rejectedAt: new Date(),
      rejectionReason: 'Recipe does not align with healthy eating guidelines. Consider reducing sugar content and adding nutritional alternatives.',
    },
  });
  console.log('  ✅ Recipe 5: Chocolate Lava Cake (REJECTED)');

  console.log('');
  console.log('📊 Total recipes created: 5');
  console.log('   • 3 APPROVED');
  console.log('   • 1 PENDING');
  console.log('   • 1 REJECTED');
  console.log('');

  // ========================================
  // SEED COMMENTS & RATINGS
  // ========================================
  console.log('💬 Creating sample comments and ratings...');

  // Comments on Recipe 1 (Pizza)
  await prisma.comment.upsert({
    where: { id: 'comment-1' },
    update: {},
    create: {
      id: 'comment-1',
      content: 'This pizza recipe is amazing! The crust came out perfectly crispy. Will definitely make again!',
      recipeId: recipe1.id,
      userId: user.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment-2' },
    update: {},
    create: {
      id: 'comment-2',
      content: 'Great recipe! I added some garlic and it was even better. Thanks for sharing!',
      recipeId: recipe1.id,
      userId: admin.id,
    },
  });

  // Ratings on Recipe 1
  await prisma.rating.upsert({
    where: { 
      userId_recipeId: {
        userId: user.id,
        recipeId: recipe1.id,
      },
    },
    update: {},
    create: {
      rating: 5,
      recipeId: recipe1.id,
      userId: user.id,
    },
  });

  await prisma.rating.upsert({
    where: { 
      userId_recipeId: {
        userId: admin.id,
        recipeId: recipe1.id,
      },
    },
    update: {},
    create: {
      rating: 5,
      recipeId: recipe1.id,
      userId: admin.id,
    },
  });

  console.log('  ✅ Added 2 comments and 2 ratings to Pizza recipe');
  console.log('');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    SEEDING SUMMARY                        ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('👥 USERS CREATED: 5');
  console.log('   └─ 1 Admin, 1 Chef, 3 Regular Users');
  console.log('');
  console.log('🍳 RECIPES CREATED: 5');
  console.log('   ├─ 3 Approved (ready to view)');
  console.log('   ├─ 1 Pending (awaiting admin approval)');
  console.log('   └─ 1 Rejected (for testing rejection flow)');
  console.log('');
  console.log('💬 ENGAGEMENT: 2 comments + 2 ratings');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                 TEST CREDENTIALS                          ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔑 ADMIN ACCOUNT');
  console.log('   Email:    admin@fitrecipes.com');
  console.log('   Password: Admin123!');
  console.log('   Access:   Full system access');
  console.log('');
  console.log('👨‍🍳 CHEF ACCOUNT');
  console.log('   Email:    chef@fitrecipes.com');
  console.log('   Password: Chef123!');
  console.log('   Access:   Submit/manage recipes');
  console.log('');
  console.log('👤 USER ACCOUNT');
  console.log('   Email:    user@fitrecipes.com');
  console.log('   Password: User123!');
  console.log('   Access:   View recipes, comment, rate');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ You can now start the server: bun run dev');
  console.log('✅ View data in Prisma Studio: bun run db:studio');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
