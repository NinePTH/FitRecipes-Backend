/* eslint-disable no-console */
import { prisma } from '../src/utils/database';

const USER_ID = 'cmhbkj5pb0000hiyl6uwue35i'; // Target user ID

// Sample recipe data templates
const recipeTemplates = [
  {
    title: 'Classic Margherita Pizza',
    description:
      'A traditional Italian pizza with fresh tomatoes, mozzarella, and basil',
    mainIngredient: 'tomato',
    cuisineType: 'Italian',
    difficulty: 'MEDIUM',
    mealType: ['LUNCH', 'DINNER'],
    cookingTime: 20,
    servings: 4,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['gluten', 'dairy'],
  },
  {
    title: 'Spicy Thai Basil Chicken',
    description:
      'Quick and flavorful Thai stir-fry with holy basil and chilies',
    mainIngredient: 'chicken',
    cuisineType: 'Thai',
    difficulty: 'EASY',
    mealType: ['DINNER'],
    cookingTime: 15,
    servings: 2,
    isVegetarian: false,
    isVegan: false,
    isKeto: false,
    isGlutenFree: true, // Added
    isPaleo: false,
    allergies: ['soy'],
  },
  {
    title: 'Creamy Mushroom Risotto',
    description: 'Rich and creamy Italian rice dish with porcini mushrooms',
    mainIngredient: 'rice',
    cuisineType: 'Italian',
    difficulty: 'HARD',
    mealType: ['DINNER'],
    cookingTime: 35,
    servings: 4,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['dairy'],
  },
  {
    title: 'Greek Breakfast Bowl',
    description: 'Healthy Mediterranean breakfast with eggs, feta, and olives',
    mainIngredient: 'eggs',
    cuisineType: 'Mediterranean',
    difficulty: 'EASY',
    mealType: ['BREAKFAST'],
    cookingTime: 10,
    servings: 1,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['eggs', 'dairy'],
  },
  {
    title: 'Chocolate Lava Cake',
    description: 'Decadent molten chocolate dessert with a gooey center',
    mainIngredient: 'chocolate',
    cuisineType: 'French',
    difficulty: 'MEDIUM',
    mealType: ['DESSERT'],
    cookingTime: 12,
    servings: 2,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['eggs', 'dairy', 'gluten'],
  },
  {
    title: 'Keto Cauliflower Fried Rice',
    description: 'Low-carb alternative to fried rice using cauliflower',
    mainIngredient: 'cauliflower',
    cuisineType: 'Chinese',
    difficulty: 'EASY',
    mealType: ['LUNCH', 'DINNER'],
    cookingTime: 15,
    servings: 3,
    isVegetarian: false,
    isVegan: false,
    isKeto: true,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['soy', 'eggs'],
  },
  {
    title: 'Salmon Teriyaki Bowl',
    description: 'Grilled salmon with teriyaki glaze over rice with vegetables',
    mainIngredient: 'salmon',
    cuisineType: 'Japanese',
    difficulty: 'MEDIUM',
    mealType: ['LUNCH', 'DINNER'],
    cookingTime: 25,
    servings: 2,
    isVegetarian: false,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: true, // Added
    allergies: ['fish', 'soy'],
  },
  {
    title: 'Vegan Buddha Bowl',
    description:
      'Colorful bowl with quinoa, roasted vegetables, and tahini dressing',
    mainIngredient: 'quinoa',
    cuisineType: 'Mediterranean',
    difficulty: 'EASY',
    mealType: ['LUNCH', 'DINNER'],
    cookingTime: 30,
    servings: 2,
    isVegetarian: true,
    isVegan: true,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['sesame'],
  },
  {
    title: 'Mexican Street Tacos',
    description: 'Authentic tacos with seasoned beef, cilantro, and lime',
    mainIngredient: 'beef',
    cuisineType: 'Mexican',
    difficulty: 'EASY',
    mealType: ['LUNCH', 'DINNER', 'SNACK'],
    cookingTime: 20,
    servings: 4,
    isVegetarian: false,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: true, // Added
    allergies: ['gluten'],
  },
  {
    title: 'French Onion Soup',
    description:
      'Classic French soup with caramelized onions and melted cheese',
    mainIngredient: 'onion',
    cuisineType: 'French',
    difficulty: 'MEDIUM',
    mealType: ['LUNCH', 'DINNER'],
    cookingTime: 45,
    servings: 4,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['dairy', 'gluten'],
  },
  {
    title: 'Protein Pancakes',
    description: 'High-protein breakfast pancakes with banana and oats',
    mainIngredient: 'banana',
    cuisineType: 'American',
    difficulty: 'EASY',
    mealType: ['BREAKFAST'],
    cookingTime: 15,
    servings: 2,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['eggs', 'dairy'],
  },
  {
    title: 'Caprese Salad',
    description:
      'Simple Italian salad with fresh mozzarella, tomatoes, and basil',
    mainIngredient: 'tomato',
    cuisineType: 'Italian',
    difficulty: 'EASY',
    mealType: ['LUNCH', 'SNACK'],
    cookingTime: 5,
    servings: 2,
    isVegetarian: true,
    isVegan: false,
    isKeto: false,
    isGlutenFree: true, // Added
    isPaleo: false,
    allergies: ['dairy'],
  },
  {
    title: 'Beef Pho',
    description: 'Vietnamese noodle soup with beef and aromatic herbs',
    mainIngredient: 'beef',
    cuisineType: 'Other',
    difficulty: 'HARD',
    mealType: ['LUNCH', 'DINNER'],
    cookingTime: 60,
    servings: 4,
    isVegetarian: false,
    isVegan: false,
    isKeto: false,
    isGlutenFree: true, // Added (rice noodles)
    isPaleo: false,
    allergies: ['gluten'],
  },
  {
    title: 'Energy Balls',
    description: 'No-bake snack balls with dates, nuts, and chocolate',
    mainIngredient: 'dates',
    cuisineType: 'American',
    difficulty: 'EASY',
    mealType: ['SNACK', 'DESSERT'],
    cookingTime: 10,
    servings: 12,
    isVegetarian: true,
    isVegan: true,
    isKeto: false,
    isGlutenFree: false,
    isPaleo: false,
    allergies: ['nuts'],
  },
];

// Helper function to generate ingredients
function generateIngredients(mainIngredient: string) {
  return [
    { name: mainIngredient, amount: '2', unit: 'cups' },
    { name: 'olive oil', amount: '2', unit: 'tbsp' },
    { name: 'garlic', amount: '3', unit: 'cloves' },
    { name: 'salt', amount: '1', unit: 'tsp' },
    { name: 'black pepper', amount: '1/2', unit: 'tsp' },
  ];
}

// Helper function to generate instructions
function generateInstructions() {
  return [
    'Prepare all ingredients and gather necessary cooking equipment.',
    'Heat oil in a large pan over medium heat.',
    'Add main ingredients and cook until properly done.',
    'Season with salt, pepper, and other spices to taste.',
    'Serve hot and garnish as desired.',
  ];
}

// Helper function to generate dietary info
function generateDietaryInfo(
  isVegetarian: boolean,
  isVegan: boolean,
  isKeto: boolean,
  isGlutenFree: boolean = false,
  isPaleo: boolean = false
) {
  return {
    isVegetarian,
    isVegan,
    isGlutenFree,
    isDairyFree: isVegan,
    isKeto,
    isPaleo,
  };
}

// Helper function to generate nutrition info
function generateNutritionInfo(difficulty: string) {
  const baseCalories =
    difficulty === 'EASY' ? 350 : difficulty === 'MEDIUM' ? 450 : 550;
  return {
    calories: baseCalories,
    protein: Math.floor((baseCalories * 0.15) / 4),
    carbs: Math.floor((baseCalories * 0.5) / 4),
    fat: Math.floor((baseCalories * 0.35) / 9),
    fiber: Math.floor(Math.random() * 5) + 3,
    sodium: Math.floor(Math.random() * 500) + 300,
  };
}

async function createTestRecipes() {
  try {
    console.log('🔍 Verifying user exists...');

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
    });

    if (!user) {
      console.error(`❌ User with ID ${USER_ID} not found!`);
      console.log('💡 Tip: Make sure the user exists in the database first.');
      return;
    }

    console.log(
      `✅ User found: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`📝 User role: ${user.role}`);

    if (user.role !== 'CHEF' && user.role !== 'ADMIN') {
      console.warn(
        '⚠️  Warning: User role is not CHEF or ADMIN. Only CHEF and ADMIN can submit recipes.'
      );
      console.log('💡 Consider updating user role to CHEF first.');
      return;
    }

    // Find admin user for approval/rejection
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.warn(
        '⚠️  Warning: No ADMIN user found. Cannot create approved/rejected recipes.'
      );
      console.log('💡 Will only create pending recipes.');
    } else {
      console.log(
        `✅ Admin found for approvals: ${adminUser.firstName} ${adminUser.lastName}`
      );
    }

    console.log('\n🍳 Creating test recipes...\n');

    // Create 10 PENDING recipes
    console.log('📌 Creating 10 PENDING recipes...');
    for (let i = 0; i < 10; i++) {
      const template = recipeTemplates[i % recipeTemplates.length];
      const recipe = await prisma.recipe.create({
        data: {
          title: `${template.title} - Pending ${i + 1}`,
          description: template.description,
          mainIngredient: template.mainIngredient,
          ingredients: generateIngredients(template.mainIngredient),
          instructions: generateInstructions(),
          prepTime: 10,
          cookingTime: template.cookingTime,
          servings: template.servings,
          difficulty: template.difficulty as any,
          mealType: template.mealType as any,
          cuisineType: template.cuisineType,
          dietaryInfo: generateDietaryInfo(
            template.isVegetarian,
            template.isVegan,
            template.isKeto,
            template.isGlutenFree,
            template.isPaleo
          ),
          nutritionInfo: generateNutritionInfo(template.difficulty),
          allergies: template.allergies,
          imageUrls: [],
          status: 'PENDING',
          authorId: USER_ID,
        },
      });
      console.log(`  ✅ Created: ${recipe.title}`);
    }

    // Create 2 APPROVED recipes
    if (adminUser) {
      console.log('\n✅ Creating 2 APPROVED recipes...');
      for (let i = 10; i < 12; i++) {
        const template = recipeTemplates[i % recipeTemplates.length];
        const recipe = await prisma.recipe.create({
          data: {
            title: `${template.title} - Approved ${i - 9}`,
            description: template.description,
            mainIngredient: template.mainIngredient,
            ingredients: generateIngredients(template.mainIngredient),
            instructions: generateInstructions(),
            prepTime: 10,
            cookingTime: template.cookingTime,
            servings: template.servings,
            difficulty: template.difficulty as any,
            mealType: template.mealType as any,
            cuisineType: template.cuisineType,
            dietaryInfo: generateDietaryInfo(
              template.isVegetarian,
              template.isVegan,
              template.isKeto,
              template.isGlutenFree,
              template.isPaleo
            ),
            nutritionInfo: generateNutritionInfo(template.difficulty),
            allergies: template.allergies,
            imageUrls: [],
            status: 'APPROVED',
            authorId: USER_ID,
            approvedAt: new Date(),
            approvedById: adminUser.id,
            adminNote: 'Great recipe! Approved for publication.',
            averageRating: 4.5,
            totalRatings: 3,
          },
        });
        console.log(`  ✅ Created: ${recipe.title}`);
      }
    }

    // Create 2 REJECTED recipes
    if (adminUser) {
      console.log('\n❌ Creating 2 REJECTED recipes...');
      for (let i = 12; i < 14; i++) {
        const template = recipeTemplates[i % recipeTemplates.length];
        const recipe = await prisma.recipe.create({
          data: {
            title: `${template.title} - Rejected ${i - 11}`,
            description: template.description,
            mainIngredient: template.mainIngredient,
            ingredients: generateIngredients(template.mainIngredient),
            instructions: generateInstructions(),
            prepTime: 10,
            cookingTime: template.cookingTime,
            servings: template.servings,
            difficulty: template.difficulty as any,
            mealType: template.mealType as any,
            cuisineType: template.cuisineType,
            dietaryInfo: generateDietaryInfo(
              template.isVegetarian,
              template.isVegan,
              template.isKeto,
              template.isGlutenFree,
              template.isPaleo
            ),
            nutritionInfo: generateNutritionInfo(template.difficulty),
            allergies: template.allergies,
            imageUrls: [],
            status: 'REJECTED',
            authorId: USER_ID,
            rejectedAt: new Date(),
            rejectedById: adminUser.id,
            rejectionReason:
              i === 12
                ? 'Missing nutritional information. Please add complete nutrition data.'
                : 'Instructions are not clear enough. Please provide more detailed steps.',
            adminNote: 'Please revise and resubmit.',
          },
        });
        console.log(`  ✅ Created: ${recipe.title}`);
      }
    }

    console.log('\n✅ Test recipes created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - 10 PENDING recipes`);
    console.log(
      `   - 2 APPROVED recipes ${adminUser ? '✅' : '(skipped - no admin)'}`
    );
    console.log(
      `   - 2 REJECTED recipes ${adminUser ? '✅' : '(skipped - no admin)'}`
    );
    console.log(`   - Total: 14 recipes\n`);
    console.log(`🔗 All recipes belong to user: ${user.email} (${USER_ID})\n`);
  } catch (error) {
    console.error('❌ Error creating test recipes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRecipes();
