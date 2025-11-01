import { Hono } from 'hono';
import { authMiddleware } from '@/middlewares/auth';
import * as CommunityController from '@/controllers/communityController';

const communityRoutes = new Hono();

communityRoutes.post(
  '/recipes/:recipeId/ratings',
  authMiddleware,
  CommunityController.submitRating
);
communityRoutes.get(
  '/recipes/:recipeId/ratings/me',
  authMiddleware,
  CommunityController.getUserRating
);
communityRoutes.get(
  '/recipes/:recipeId/ratings',
  CommunityController.getRecipeRatings
);
communityRoutes.delete(
  '/recipes/:recipeId/ratings/me',
  authMiddleware,
  CommunityController.deleteRating
);

communityRoutes.post(
  '/recipes/:recipeId/comments',
  authMiddleware,
  CommunityController.addComment
);
communityRoutes.get(
  '/recipes/:recipeId/comments',
  CommunityController.getRecipeComments
);
communityRoutes.put(
  '/recipes/:recipeId/comments/:commentId',
  authMiddleware,
  CommunityController.updateComment
);
communityRoutes.delete(
  '/recipes/:recipeId/comments/:commentId',
  authMiddleware,
  CommunityController.deleteComment
);

export default communityRoutes;
