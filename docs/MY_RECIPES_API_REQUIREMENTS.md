# My Recipes Page - Backend API Requirements

## Overview
The "My Recipes" page displays all recipes submitted by the authenticated user (Chef or Admin), allowing them to track submission status, view stats, edit, and delete their recipes.

---

## API Endpoint Needed

**Endpoint**: `GET /api/v1/recipes/my-recipes`

**Authentication**: Required (JWT Bearer token)

**Authorization**: CHEF and ADMIN roles only

---

## Response Data Required

### Main Recipe List
The page needs an array of recipes with the following information for each recipe:

#### Basic Recipe Info
- `id` - Unique recipe identifier
- `title` - Recipe name
- `description` - Brief recipe description
- `imageUrl` or `images` - At least one image URL for thumbnail display

#### Recipe Metadata
- `prepTime` - Preparation time in minutes
- `cookingTime` - Cooking time in minutes  
- `servings` - Number of servings
- `mainIngredient` - Primary ingredient
- `cuisineType` - Type of cuisine (e.g., "Mediterranean", "Thai", "American")

#### Status Information (Critical)
- `status` - Recipe approval status: `"PENDING"` | `"APPROVED"` | `"REJECTED"`
- `rejectionReason` - String explaining why recipe was rejected (only if status is REJECTED)

#### Engagement Metrics (for approved recipes)
- `averageRating` - Average user rating (0-5)
- `totalRatings` - Number of ratings received
- `totalComments` - Number of comments (optional)

#### Timestamps
- `createdAt` - When recipe was submitted (ISO 8601 format)
- `updatedAt` - When recipe was last modified (ISO 8601 format)

---

## Page Features That Use This Data

### 1. Statistics Cards (Top of Page)
The page displays 4 stat cards showing:
- **Total Recipes**: Count of all user's recipes
- **Approved**: Count of recipes with status "APPROVED"
- **Pending**: Count of recipes with status "PENDING"  
- **Rejected**: Count of recipes with status "REJECTED"

### 2. Filter Tabs
Users can filter recipes by status:
- All Recipes
- Pending (awaiting admin review)
- Approved (published and visible to all users)
- Rejected (not approved, with rejection reason)

### 3. Recipe Cards Display
For each recipe, the page shows:
- Recipe image thumbnail
- Title and description
- Status badge (color-coded: green for approved, yellow for pending, red for rejected)
- Prep + cook time
- Servings count
- Rating (only for approved recipes)
- Submission date and last update date
- Action buttons: View (approved only), Edit (pending/rejected only), Delete (all)
- Rejection reason box (rejected recipes only)

---

## Expected Response Format

```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "recipe-123",
        "title": "Mediterranean Quinoa Bowl",
        "description": "A healthy and colorful bowl packed with protein and fresh vegetables.",
        "imageUrl": "https://example.com/image.jpg",
        "prepTime": 15,
        "cookingTime": 20,
        "servings": 4,
        "mainIngredient": "Quinoa",
        "cuisineType": "Mediterranean",
        "status": "APPROVED",
        "rejectionReason": null,
        "averageRating": 4.5,
        "totalRatings": 12,
        "totalComments": 5,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      },
      {
        "id": "recipe-456",
        "title": "Spicy Thai Basil Chicken",
        "description": "Authentic Thai stir-fry with aromatic basil and chilies.",
        "imageUrl": "https://example.com/image2.jpg",
        "prepTime": 10,
        "cookingTime": 15,
        "servings": 2,
        "mainIngredient": "Chicken",
        "cuisineType": "Thai",
        "status": "PENDING",
        "rejectionReason": null,
        "averageRating": 0,
        "totalRatings": 0,
        "totalComments": 0,
        "createdAt": "2025-01-20T14:30:00Z",
        "updatedAt": "2025-01-20T14:30:00Z"
      },
      {
        "id": "recipe-789",
        "title": "Classic Chocolate Chip Cookies",
        "description": "Perfectly chewy cookies with premium chocolate chips.",
        "imageUrl": "https://example.com/image3.jpg",
        "prepTime": 20,
        "cookingTime": 12,
        "servings": 24,
        "mainIngredient": "Flour",
        "cuisineType": "American",
        "status": "REJECTED",
        "rejectionReason": "Recipe needs more detailed instructions and nutritional accuracy verification.",
        "averageRating": 0,
        "totalRatings": 0,
        "totalComments": 0,
        "createdAt": "2025-01-18T11:20:00Z",
        "updatedAt": "2025-01-21T16:45:00Z"
      }
    ],
    "meta": {
      "total": 3,
      "approved": 1,
      "pending": 1,
      "rejected": 1
    }
  },
  "message": "User recipes retrieved successfully"
}
```

---

## Additional Notes

### Status Badge Colors
- **APPROVED**: Green badge with checkmark icon
- **PENDING**: Yellow badge with alert icon  
- **REJECTED**: Red badge with X icon

### Action Buttons Logic
- **View**: Only shown for APPROVED recipes (links to recipe detail page)
- **Edit**: Only shown for PENDING and REJECTED recipes (links to submission page with edit mode)
- **Delete**: Always shown for all recipes

### Empty State Messages
- If no recipes at all: "No recipes yet - Start sharing your culinary creations!"
- If filter shows no results: "No {status} recipes" (e.g., "No pending recipes")

### Rejection Reason Display
For REJECTED recipes, show the rejection reason in a red alert box below the recipe card with:
- Red background with border
- X icon
- Label: "Rejection Reason:"
- The actual reason text

---

## Error Handling

**401 Unauthorized**: User not authenticated → Redirect to login

**403 Forbidden**: User is not CHEF or ADMIN → Show error message

**500 Internal Server Error**: Show generic error message with retry option

---

## Optional Enhancements (Future)

### Sorting Options
- Sort by: Date (newest first), Date (oldest first), Title (A-Z), Rating (highest first)

### Pagination
- If user has many recipes, consider pagination with:
  - `page` query parameter (default: 1)
  - `limit` query parameter (default: 12)
  - Return `meta.totalPages` and `meta.currentPage`

### Search
- Search recipes by title or ingredients (query parameter: `search`)

---

## Related Endpoints (Not Yet Needed)

These endpoints would be used by action buttons but are not part of the initial page load:

- `DELETE /api/v1/recipes/:id` - Delete a recipe (called when user clicks Delete button)
- `GET /api/v1/recipes/:id` - Get full recipe details (called when user clicks View/Edit button)
- `PUT /api/v1/recipes/:id` - Update recipe (used in edit mode)

---

**Last Updated**: October 29, 2025  
**Status**: Waiting for backend implementation
