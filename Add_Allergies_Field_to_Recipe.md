# Backend API Request - Add Allergies Field to Recipe

Please add an `allergies` field to the Recipe API to properly track allergen information.

## Required Changes

### 1. Update Recipe Model/Schema

Add a new field:
```typescript
allergies?: string[]  // Array of allergen names
```

**Field Details:**
- **Type**: Array of strings
- **Optional**: Yes
- **Validation**: Each allergen string should be 2-50 characters
- **Example**: `["nuts", "dairy", "eggs", "soy", "shellfish"]`

### 2. Update API Endpoints

Include `allergies` field in these endpoints:

#### POST /api/v1/recipes (Submit Recipe)
**Request Body** (add allergies):
```json
{
  "title": "Almond Butter Cookies",
  "mainIngredient": "Almond Butter",
  "description": "Delicious cookies with almond butter",
  "ingredients": [...],
  "instructions": [...],
  "cookingTime": 25,
  "servings": 12,
  "difficulty": "EASY",
  "cuisineType": "AMERICAN",
  "dietaryInfo": {
    "isVegetarian": true,
    "isVegan": false,
    "isGlutenFree": false,
    "isDairyFree": true,
    "isKeto": false,
    "isPaleo": false
  },
  "nutritionInfo": {
    "calories": 150,
    "protein": 4,
    "carbs": 12,
    "fat": 9,
    "fiber": 2,
    "sodium": 85
  },
  "allergies": ["nuts", "tree nuts", "eggs"],  // ← NEW FIELD
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "cm123abc...",
      "title": "Almond Butter Cookies",
      "allergies": ["nuts", "tree nuts", "eggs"],  // ← RETURNED
      // ... other fields
    }
  },
  "message": "Recipe submitted successfully"
}
```

#### GET /api/v1/recipes/:id (Recipe Detail)
**Response** (include allergies):
```json
{
  "status": "success",
  "data": {
    "recipe": {
      "id": "cm123abc...",
      "title": "Almond Butter Cookies",
      "allergies": ["nuts", "tree nuts", "eggs"],  // ← INCLUDE THIS
      "dietaryInfo": {
        "isVegetarian": true,
        "isVegan": false,
        // ...
      },
      // ... other fields
    }
  }
}
```

#### GET /api/v1/admin/recipes/pending (Admin Pending List)
**Response** (include allergies):
```json
{
  "status": "success",
  "data": {
    "recipes": [
      {
        "id": "cm123abc...",
        "title": "Almond Butter Cookies",
        "allergies": ["nuts", "tree nuts", "eggs"],  // ← INCLUDE THIS
        // ... other fields
      }
    ]
  }
}
```

### 3. Validation Rules

Add validation for the allergies field:
- **Optional**: Field can be null/undefined or empty array
- **Array**: Must be an array if provided
- **String Length**: Each allergen must be 2-50 characters
- **Sanitization**: Trim whitespace, convert to lowercase for consistency
- **Common Allergens**: Consider validating against common allergens list:
  - nuts, peanuts, tree nuts, dairy, milk, eggs, soy, wheat, gluten, fish, shellfish, sesame

**Example Validation (Zod)**:
```typescript
allergies: z.array(
  z.string()
    .min(2, 'Allergen name must be at least 2 characters')
    .max(50, 'Allergen name must be less than 50 characters')
    .transform(val => val.trim().toLowerCase())
).optional()
```

### 4. Database Schema

Update Recipe model:
```typescript
model Recipe {
  id            String   @id @default(cuid())
  title         String
  mainIngredient String
  // ... existing fields ...
  
  allergies     String[]  // ← ADD THIS FIELD
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Frontend Integration

The frontend will send allergies as a comma-separated string from the textarea:
```
User input: "Contains nuts, Contains dairy, May contain traces of eggs"
```

Frontend will transform to:
```json
{
  "allergies": ["nuts", "dairy", "eggs"]
}
```

## Use Cases

1. **Search/Filter**: Users can filter recipes by excluding specific allergens
2. **Recipe Display**: Show allergen warnings prominently on recipe detail page
3. **Safety**: Help users with allergies find safe recipes
4. **Admin Review**: Allow admins to verify allergen information during approval

## Migration (if needed)

If you already have recipes in the database without allergies field:
- Default to empty array `[]` for existing recipes
- No data loss, field is optional

## Testing Checklist

- [ ] Submit recipe with allergies → Stored correctly
- [ ] Submit recipe without allergies → Works (optional field)
- [ ] Get recipe detail → Allergies returned
- [ ] Admin pending list → Allergies included
- [ ] Validate allergen string length (2-50 chars)
- [ ] Handle empty array `[]`
- [ ] Handle null/undefined values

---

**Questions?**

Let me know if you need:
- Different validation rules
- Specific allergen list to validate against
- Different field name (e.g., `allergens` instead of `allergies`)
- Additional endpoints to update