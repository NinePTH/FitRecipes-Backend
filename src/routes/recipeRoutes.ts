import { Hono } from 'hono'
import { RecipeController } from '@/controllers/recipeController'
import { CommentController } from '@/controllers/commentController'
import { RatingController } from '@/controllers/ratingController'
import { authMiddleware, optionalAuthMiddleware } from '@/middleware/auth'

const recipeRoutes = new Hono()

// Public routes (no authentication required)
recipeRoutes.use('/', optionalAuthMiddleware) // Optional auth for favorites/user-specific data
recipeRoutes.get('/', RecipeController.getRecipes)
recipeRoutes.get('/search', RecipeController.searchRecipes)
recipeRoutes.get('/:id', RecipeController.getRecipeById)

// Protected routes (authentication required)
recipeRoutes.use('/*', authMiddleware)
recipeRoutes.post('/', RecipeController.createRecipe)
recipeRoutes.put('/:id', RecipeController.updateRecipe)
recipeRoutes.delete('/:id', RecipeController.deleteRecipe)

// Comment routes
recipeRoutes.get('/:recipeId/comments', CommentController.getComments)
recipeRoutes.post('/:recipeId/comments', CommentController.createComment)
recipeRoutes.put('/:recipeId/comments/:commentId', CommentController.updateComment)
recipeRoutes.delete('/:recipeId/comments/:commentId', CommentController.deleteComment)

// Rating routes
recipeRoutes.get('/:recipeId/ratings', RatingController.getRecipeRatings)
recipeRoutes.get('/:recipeId/rating', RatingController.getUserRating)
recipeRoutes.post('/:recipeId/rating', RatingController.createOrUpdateRating)
recipeRoutes.delete('/:recipeId/rating', RatingController.deleteRating)

export default recipeRoutes