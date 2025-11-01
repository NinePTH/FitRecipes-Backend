# Frontend Integration Guide - My Recipes Feature

This guide provides complete implementation details for the **My Recipes** page where chefs and admins can view and manage their submitted recipes.

## Quick Overview

**Endpoint**: `GET /api/v1/recipes/my-recipes`  
**Method**: GET  
**Authentication**: Required (JWT Bearer token)  
**Authorization**: CHEF and ADMIN roles only  
**Query Parameters**: `status` (optional) - Filter by `PENDING`, `APPROVED`, or `REJECTED`

---

## Basic Implementation

### 1. Fetch User's Recipes

```typescript
async function fetchMyRecipes(status?: string) {
  const token = localStorage.getItem('token'); // or from your auth context
  const url = status 
    ? `http://localhost:3000/api/v1/recipes/my-recipes?status=${status}`
    : 'http://localhost:3000/api/v1/recipes/my-recipes';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data; // { recipes: [...], meta: {...} }
}
```

---

## Complete React Component Example

```tsx
import React, { useState, useEffect } from 'react';

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  prepTime: number;
  cookingTime: number;
  servings: number;
  mainIngredient: string;
  cuisineType: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  createdAt: string;
  updatedAt: string;
}

interface MyRecipesData {
  recipes: Recipe[];
  meta: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

export default function MyRecipesPage() {
  const [data, setData] = useState<MyRecipesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    loadRecipes(activeFilter === 'all' ? undefined : activeFilter);
  }, [activeFilter]);

  async function loadRecipes(status?: string) {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = status 
        ? `http://localhost:3000/api/v1/recipes/my-recipes?status=${status.toUpperCase()}`
        : 'http://localhost:3000/api/v1/recipes/my-recipes';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Please login to continue');
      }

      if (response.status === 403) {
        throw new Error('You need CHEF or ADMIN role to access this page');
      }

      if (!response.ok) {
        throw new Error('Failed to load recipes');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading your recipes...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error">{error}</p>
        <button onClick={() => loadRecipes()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="my-recipes-page">
      <h1>My Recipes</h1>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard label="Total Recipes" value={data.meta.total} color="blue" />
        <StatCard label="Approved" value={data.meta.approved} color="green" />
        <StatCard label="Pending" value={data.meta.pending} color="yellow" />
        <StatCard label="Rejected" value={data.meta.rejected} color="red" />
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={activeFilter === 'all' ? 'active' : ''}
          onClick={() => setActiveFilter('all')}
        >
          All Recipes
        </button>
        <button
          className={activeFilter === 'pending' ? 'active' : ''}
          onClick={() => setActiveFilter('pending')}
        >
          Pending ({data.meta.pending})
        </button>
        <button
          className={activeFilter === 'approved' ? 'active' : ''}
          onClick={() => setActiveFilter('approved')}
        >
          Approved ({data.meta.approved})
        </button>
        <button
          className={activeFilter === 'rejected' ? 'active' : ''}
          onClick={() => setActiveFilter('rejected')}
        >
          Rejected ({data.meta.rejected})
        </button>
      </div>

      {/* Recipe Grid */}
      {data.recipes.length === 0 ? (
        <div className="empty-state">
          {activeFilter === 'all' 
            ? "No recipes yet - Start sharing your culinary creations!"
            : `No ${activeFilter} recipes`
          }
        </div>
      ) : (
        <div className="recipe-grid">
          {data.recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

// Statistics Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// Recipe Card Component
function RecipeCard({ recipe }: { recipe: Recipe }) {
  const getStatusBadge = () => {
    const badges = {
      APPROVED: { color: 'green', icon: '✓', text: 'Approved' },
      PENDING: { color: 'yellow', icon: '⏳', text: 'Pending Review' },
      REJECTED: { color: 'red', icon: '✕', text: 'Rejected' },
    };
    const badge = badges[recipe.status];
    
    return (
      <span className={`status-badge status-${badge.color}`}>
        <span className="badge-icon">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const totalTime = recipe.prepTime + recipe.cookingTime;

  return (
    <div className="recipe-card">
      {/* Image */}
      <div className="recipe-image">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>

      {/* Content */}
      <div className="recipe-content">
        <div className="recipe-header">
          <h3>{recipe.title}</h3>
          {getStatusBadge()}
        </div>

        <p className="recipe-description">{recipe.description}</p>

        {/* Metadata */}
        <div className="recipe-meta">
          <span>⏱️ {totalTime} min</span>
          <span>🍽️ {recipe.servings} servings</span>
          {recipe.status === 'APPROVED' && recipe.totalRatings > 0 && (
            <span>⭐ {recipe.averageRating.toFixed(1)} ({recipe.totalRatings})</span>
          )}
        </div>

        {/* Rejection Reason */}
        {recipe.status === 'REJECTED' && recipe.rejectionReason && (
          <div className="rejection-alert">
            <strong>✕ Rejection Reason:</strong>
            <p>{recipe.rejectionReason}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="recipe-dates">
          <small>Created: {new Date(recipe.createdAt).toLocaleDateString()}</small>
          {recipe.createdAt !== recipe.updatedAt && (
            <small>Updated: {new Date(recipe.updatedAt).toLocaleDateString()}</small>
          )}
        </div>

        {/* Action Buttons */}
        <div className="recipe-actions">
          {recipe.status === 'APPROVED' && (
            <button className="btn-view">View Recipe</button>
          )}
          {(recipe.status === 'PENDING' || recipe.status === 'REJECTED') && (
            <button className="btn-edit">Edit Recipe</button>
          )}
          <button className="btn-delete">Delete</button>
        </div>
      </div>
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// API Response Type
interface MyRecipesResponse {
  status: 'success' | 'error';
  data: {
    recipes: Recipe[];
    meta: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
    };
  };
  message: string;
}

// Recipe Type
interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  prepTime: number;
  cookingTime: number;
  servings: number;
  mainIngredient: string;
  cuisineType: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  createdAt: string;
  updatedAt: string;
}

// Filter Type
type RecipeFilter = 'all' | 'pending' | 'approved' | 'rejected';
```

---

## Status Badge Implementation

### Status Colors and Icons

```typescript
const STATUS_CONFIG = {
  APPROVED: {
    color: 'green',
    bgColor: '#10b981',
    textColor: '#ffffff',
    icon: '✓',
    label: 'Approved',
  },
  PENDING: {
    color: 'yellow',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    icon: '⏳',
    label: 'Pending Review',
  },
  REJECTED: {
    color: 'red',
    bgColor: '#ef4444',
    textColor: '#ffffff',
    icon: '✕',
    label: 'Rejected',
  },
};

function StatusBadge({ status }: { status: Recipe['status'] }) {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
```

---

## Error Handling

### Handle Different Error Responses

```typescript
async function fetchMyRecipes(status?: string) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue');
    }

    const url = status 
      ? `http://localhost:3000/api/v1/recipes/my-recipes?status=${status.toUpperCase()}`
      : 'http://localhost:3000/api/v1/recipes/my-recipes';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle specific error codes
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 403) {
      // Not CHEF or ADMIN role
      throw new Error('You need CHEF or ADMIN role to access this page');
    }

    if (response.status === 500) {
      throw new Error('Server error. Please try again later.');
    }

    if (!response.ok) {
      throw new Error('Failed to load recipes');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
}
```

---

## Action Buttons Logic

### View, Edit, Delete Actions

```typescript
function RecipeActions({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate(); // React Router

  const handleView = () => {
    // Only for APPROVED recipes
    navigate(`/recipes/${recipe.id}`);
  };

  const handleEdit = () => {
    // Only for PENDING or REJECTED recipes
    navigate(`/recipes/${recipe.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/v1/recipes/${recipe.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      // Refresh the list
      window.location.reload(); // or use state management
    } catch (error) {
      alert('Error deleting recipe: ' + error.message);
    }
  };

  return (
    <div className="recipe-actions">
      {recipe.status === 'APPROVED' && (
        <button onClick={handleView} className="btn-view">
          View Recipe
        </button>
      )}
      
      {(recipe.status === 'PENDING' || recipe.status === 'REJECTED') && (
        <button onClick={handleEdit} className="btn-edit">
          Edit Recipe
        </button>
      )}
      
      <button onClick={handleDelete} className="btn-delete">
        Delete
      </button>
    </div>
  );
}
```

---

## Filter Implementation

### Filter Recipes by Status

```typescript
function MyRecipesPage() {
  const [activeFilter, setActiveFilter] = useState<RecipeFilter>('all');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    loadRecipes();
  }, [activeFilter]);

  async function loadRecipes() {
    try {
      const status = activeFilter === 'all' ? undefined : activeFilter.toUpperCase();
      const data = await fetchMyRecipes(status);
      setRecipes(data.recipes);
      setMeta(data.meta);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="filter-tabs">
        <FilterButton
          label="All Recipes"
          count={meta?.total}
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        <FilterButton
          label="Pending"
          count={meta?.pending}
          active={activeFilter === 'pending'}
          onClick={() => setActiveFilter('pending')}
        />
        <FilterButton
          label="Approved"
          count={meta?.approved}
          active={activeFilter === 'approved'}
          onClick={() => setActiveFilter('approved')}
        />
        <FilterButton
          label="Rejected"
          count={meta?.rejected}
          active={activeFilter === 'rejected'}
          onClick={() => setActiveFilter('rejected')}
        />
      </div>

      {/* Recipe List */}
      <div className="recipe-grid">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

function FilterButton({ label, count, active, onClick }) {
  return (
    <button
      className={`filter-btn ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );
}
```

---

## Rejection Reason Display

### Show Rejection Alert for Rejected Recipes

```tsx
function RejectionAlert({ reason }: { reason: string }) {
  return (
    <div
      style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        padding: '12px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ color: '#ef4444', fontSize: '18px' }}>✕</span>
        <div>
          <strong style={{ color: '#991b1b' }}>Rejection Reason:</strong>
          <p style={{ color: '#7f1d1d', margin: '4px 0 0' }}>{reason}</p>
        </div>
      </div>
    </div>
  );
}

// Usage in RecipeCard
{recipe.status === 'REJECTED' && recipe.rejectionReason && (
  <RejectionAlert reason={recipe.rejectionReason} />
)}
```

---

## Empty State Messages

```typescript
function EmptyState({ filter }: { filter: RecipeFilter }) {
  const messages = {
    all: "No recipes yet - Start sharing your culinary creations!",
    pending: "No pending recipes",
    approved: "No approved recipes",
    rejected: "No rejected recipes",
  };

  return (
    <div className="empty-state">
      <div className="empty-icon">📝</div>
      <p>{messages[filter]}</p>
      {filter === 'all' && (
        <button onClick={() => navigate('/recipes/new')}>
          Create Your First Recipe
        </button>
      )}
    </div>
  );
}
```

---

## Sample CSS Styling

```css
/* Statistics Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  color: white;
}

.stat-blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.stat-yellow { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.stat-red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

.stat-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.filter-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: #111827;
}

.filter-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Recipe Grid */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.recipe-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.recipe-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
}

.recipe-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}

.recipe-content {
  padding: 16px;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.recipe-header h3 {
  margin: 0;
  font-size: 18px;
  color: #111827;
  flex: 1;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.status-green {
  background: #10b981;
  color: white;
}

.status-yellow {
  background: #f59e0b;
  color: white;
}

.status-red {
  background: #ef4444;
  color: white;
}

/* Rejection Alert */
.rejection-alert {
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.rejection-alert strong {
  color: #991b1b;
  display: block;
  margin-bottom: 4px;
}

.rejection-alert p {
  color: #7f1d1d;
  margin: 0;
  font-size: 14px;
}

/* Action Buttons */
.recipe-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.recipe-actions button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view {
  background: #3b82f6;
  color: white;
}

.btn-view:hover {
  background: #2563eb;
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
```

---

## DO's ✅

1. **DO** use `Authorization: Bearer {token}` header for authentication
2. **DO** handle 401 (redirect to login) and 403 (show access denied) errors
3. **DO** show loading state while fetching recipes
4. **DO** use the `status` query parameter to filter recipes
5. **DO** display rejection reason for REJECTED recipes
6. **DO** show statistics cards (total, approved, pending, rejected)
7. **DO** disable "View" button for PENDING/REJECTED recipes
8. **DO** disable "Edit" button for APPROVED recipes
9. **DO** format dates using `new Date().toLocaleDateString()`
10. **DO** show average rating only for APPROVED recipes with ratings

---

## DON'Ts ❌

1. **DON'T** forget to include the Authorization header
2. **DON'T** expose the JWT token in URLs or query parameters
3. **DON'T** allow editing APPROVED recipes (must be handled by admin workflow)
4. **DON'T** show ratings/comments for PENDING or REJECTED recipes
5. **DON'T** forget to handle empty states for each filter
6. **DON'T** forget to refresh the list after deleting a recipe
7. **DON'T** capitalize the status query parameter incorrectly (use UPPERCASE)

---

## Testing Checklist

### Before Deployment
- [ ] User can see all their recipes
- [ ] Statistics cards show correct counts
- [ ] Filter tabs work correctly (all, pending, approved, rejected)
- [ ] APPROVED recipes show "View" button
- [ ] PENDING/REJECTED recipes show "Edit" button
- [ ] All recipes show "Delete" button
- [ ] Rejection reason displays correctly for REJECTED recipes
- [ ] Empty state shows when no recipes match filter
- [ ] Loading state displays while fetching
- [ ] 401 error redirects to login
- [ ] 403 error shows appropriate message
- [ ] Recipe cards display all required information
- [ ] Dates format correctly
- [ ] Images display correctly or show placeholder
- [ ] Status badges show correct colors and icons

---

## API Endpoints Reference

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/api/v1/recipes/my-recipes` | GET | ✅ | CHEF/ADMIN | Get user's recipes |
| `/api/v1/recipes/my-recipes?status=PENDING` | GET | ✅ | CHEF/ADMIN | Filter by status |
| `/api/v1/recipes/:id` | GET | ✅ | Any | View recipe details |
| `/api/v1/recipes/:id` | DELETE | ✅ | CHEF/ADMIN | Delete recipe |

---

## Environment Variables

```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Or for production
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

Then use in code:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const url = `${API_BASE_URL}/recipes/my-recipes`;
```

---

## Summary

The My Recipes endpoint returns:
- ✅ Array of user's recipes with all necessary fields
- ✅ Statistics meta object (total, approved, pending, rejected counts)
- ✅ Filter support via `status` query parameter
- ✅ Sorted by creation date (newest first)
- ✅ Includes comments count, ratings, and rejection reasons
- ✅ Only accessible to CHEF and ADMIN roles

**Authentication**: Always include `Authorization: Bearer {token}` header

**Typical Flow**:
1. Fetch all recipes → Display with statistics
2. User clicks filter → Fetch with `?status=PENDING`
3. User clicks "View" → Navigate to recipe detail page
4. User clicks "Edit" → Navigate to edit form
5. User clicks "Delete" → Confirm → Call DELETE endpoint → Refresh list

Now your frontend team can implement the My Recipes page! 🚀
