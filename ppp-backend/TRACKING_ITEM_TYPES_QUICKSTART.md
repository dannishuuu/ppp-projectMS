# Tracking Item Types - Quick Start Guide

## What Was Created?

A complete backend system for managing hierarchical project tracking types (Pillars, Phases, Tasks) with Work Breakdown Structure (WBS) support.

## Files Created

| File | Purpose |
|------|---------|
| `migrations/create_tracking_item_types_table.sql` | Database schema & seeding |
| `models/trackingItemType.model.js` | Database queries |
| `services/projectService/trackingItemType.service.js` | Business logic |
| `controllers/projectController/trackingItemType.controller.js` | HTTP handlers |
| `routes/projectController/trackingItemType.routes.js` | API endpoints |
| `docs/TRACKING_ITEM_TYPES_API.md` | Full API documentation |
| `server.js` | Updated with route registration |

---

## Installation Steps

### 1. Run Database Migration
```sql
-- Execute this in your PostgreSQL database
-- File: migrations/create_tracking_item_types_table.sql

CREATE TABLE public.tracking_item_types (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  code character varying(20) NOT NULL,
  name character varying(100) NOT NULL,
  ...
);
-- (see full migration file for complete schema)
```

### 2. Restart Backend Server
```bash
cd ppp-backend
npm start
# or: npm run dev
```

### 3. Verify Installation
```bash
# Should return 3 pre-loaded types (Pillar, Phase, Task)
curl http://localhost:5000/api/v1/tracking-item-types/active
```

---

## Quick API Usage

### Get All Types
```bash
curl http://localhost:5000/api/v1/tracking-item-types
```

**Response**:
```json
{
  "success": true,
  "data": {
    "trackingItemTypes": [
      { "id": "...", "code": "PILLAR", "name": "Pillar", ... },
      { "id": "...", "code": "PHASE", "name": "Phase", ... },
      { "id": "...", "code": "TASK", "name": "Task", ... }
    ],
    "pagination": { "total": 3, "page": 1, "limit": 50, "totalPages": 1 }
  }
}
```

### Get Only Parent-Capable Types
```bash
curl http://localhost:5000/api/v1/tracking-item-types/wbs-capable
```

**Response**:
```json
{
  "success": true,
  "data": [
    { "id": "...", "code": "PILLAR", "name": "Pillar", "sort_order": 1 },
    { "id": "...", "code": "PHASE", "name": "Phase", "sort_order": 2 }
  ]
}
```

### Create New Type (Requires Auth)
```bash
curl -X POST http://localhost:5000/api/v1/tracking-item-types \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MILESTONE",
    "name": "Milestone",
    "description": "Project milestone",
    "isWbs": false,
    "isLeaf": true,
    "sortOrder": 4,
    "defaultWeight": 1.00
  }'
```

### Update Type
```bash
curl -X PUT http://localhost:5000/api/v1/tracking-item-types/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "defaultWeight": 1.50 }'
```

### Delete Type
```bash
curl -X DELETE http://localhost:5000/api/v1/tracking-item-types/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Pre-Loaded Types

The system comes with 3 default types:

### 1. Pillar
- Can have children ✓
- Cannot be leaf ✓
- Parent level (Sort: 1)

### 2. Phase
- Can have children ✓
- Cannot be leaf ✓
- Middle level (Sort: 2)

### 3. Task
- Cannot have children ✓
- Is leaf ✓
- Final level (Sort: 3)

---

## Key Concepts

### WBS (Work Breakdown Structure)
- A type with `is_wbs = true` can have children
- Allows hierarchical project structures

### Leaf Nodes
- A type with `is_leaf = true` cannot have children
- Represents final items (no children allowed)

### Constraint
- A type **cannot** be both WBS-capable AND leaf at the same time

### Example Hierarchy
```
Pillar (WBS: true, Leaf: false)
  └─ Phase (WBS: true, Leaf: false)
      └─ Task (WBS: false, Leaf: true)
```

---

## API Endpoints Reference

### Read (No Auth Required)
| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/tracking-item-types` | List all types |
| `GET /api/v1/tracking-item-types/active` | Get active types |
| `GET /api/v1/tracking-item-types/wbs-capable` | Get parent types |
| `GET /api/v1/tracking-item-types/leaf` | Get leaf types |
| `GET /api/v1/tracking-item-types/:id` | Get single type |

### Write (Auth Required)
| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/api/v1/tracking-item-types` | Create type | POST |
| `/api/v1/tracking-item-types/:id` | Update type | PUT |
| `/api/v1/tracking-item-types/:id` | Delete type | DELETE |
| `/api/v1/tracking-item-types/:id/restore` | Restore deleted | POST |

---

## Database Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `code` | VARCHAR(20) | Unique, uppercase (e.g., 'PILLAR') |
| `name` | VARCHAR(100) | Unique, readable name |
| `description` | TEXT | Optional description |
| `is_wbs` | BOOLEAN | Can have children? |
| `is_leaf` | BOOLEAN | Cannot have children? |
| `sort_order` | INTEGER | Display order |
| `default_weight` | NUMERIC(5,2) | Default percentage (1-100) |
| `is_active` | BOOLEAN | Active status |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `deleted_at` | TIMESTAMP | Deletion timestamp |
| `created_by` | UUID | Creator user ID |
| `updated_by` | UUID | Updater user ID |
| `deleted_by` | UUID | Deleter user ID |

---

## Common Tasks

### Add New Tracking Type
```bash
curl -X POST http://localhost:5000/api/v1/tracking-item-types \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SPRINT",
    "name": "Sprint",
    "description": "2-week sprint cycle",
    "isWbs": true,
    "isLeaf": false,
    "sortOrder": 2
  }'
```

### Deactivate a Type
```bash
curl -X PUT http://localhost:5000/api/v1/tracking-item-types/{id} \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "isActive": false }'
```

### Check if Type Can Have Children
```bash
curl http://localhost:5000/api/v1/tracking-item-types/{id}/can-have-children
```

### Get Default Weight
```bash
curl http://localhost:5000/api/v1/tracking-item-types/{id}/default-weight
```

---

## Validation Rules

### Creating a Type
- ✓ `code` is required, must be unique, will be uppercased
- ✓ `name` is required, must be unique
- ✓ `description` is optional
- ✓ Cannot be both WBS-capable and leaf
- ✓ `sortOrder` optional (default: 0)
- ✓ `defaultWeight` optional (default: 1.00)

### Updating a Type
- ✓ All fields optional
- ✓ Cannot create duplicate code or name
- ✓ Still cannot be both WBS-capable and leaf

---

## Error Handling

### 400 Bad Request
```json
{ "success": false, "error": "Code is required." }
```

### 404 Not Found
```json
{ "success": false, "error": "Tracking item type not found." }
```

### 409 Conflict
```json
{ "success": false, "error": "Code 'PILLAR' already exists." }
```

---

## Integration with Frontend

### Get Types for Dropdown
```javascript
const response = await fetch('/api/v1/tracking-item-types/active');
const { data } = await response.json();
// data is array of [{ id, code, name, ... }, ...]
```

### Check if Type Can Have Children
```javascript
const response = await fetch(`/api/v1/tracking-item-types/${typeId}/can-have-children`);
const { data } = await response.json();
// data.canHaveChildren is true/false
```

### Create Tracking Type
```javascript
const response = await fetch('/api/v1/tracking-item-types', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'MILESTONE',
    name: 'Milestone',
    isWbs: false,
    isLeaf: true
  })
});
```

---

## Next: Create Tracking Items

The `tracking_items` table will:
- Reference this `tracking_item_types` table
- Use `type_id` to determine structure constraints
- Use `is_wbs` to check if children allowed
- Use `is_leaf` to prevent children on final items

---

## Full Documentation

See `docs/TRACKING_ITEM_TYPES_API.md` for complete API documentation with all endpoints, examples, and responses.

---

## Support

For detailed information, refer to:
- **API Docs**: `docs/TRACKING_ITEM_TYPES_API.md`
- **Implementation**: `TRACKING_ITEM_TYPES_IMPLEMENTATION.md`
- **Model Code**: `models/trackingItemType.model.js`
- **Service Code**: `services/projectService/trackingItemType.service.js`
