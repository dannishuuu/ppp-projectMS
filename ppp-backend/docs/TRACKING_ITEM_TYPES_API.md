# Tracking Item Types API Documentation

## Overview

The Tracking Item Types system provides a flexible framework for defining hierarchical project structures using Work Breakdown Structure (WBS) principles. It allows different types of tracking items (Pillars, Phases, Tasks) with customizable WBS capabilities and leaf node configurations.

## Database Schema

### Table: `tracking_item_types`

**Purpose**: Lookup table defining the structural types of project tracking and their WBS capabilities.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `code` | VARCHAR(20) | Unique system code (e.g., 'PILLAR', 'PHASE', 'TASK') |
| `name` | VARCHAR(100) | Human-readable name |
| `description` | TEXT | Detailed description of the type |
| `is_wbs` | BOOLEAN | TRUE if can have children (WBS-capable parent) |
| `is_leaf` | BOOLEAN | TRUE if cannot have children (final leaf node) |
| `sort_order` | INTEGER | Display order in dropdowns |
| `default_weight` | NUMERIC(5,2) | Default weight/percentage for items of this type |
| `is_active` | BOOLEAN | Whether type is currently active |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Record last update timestamp |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |
| `created_by` | UUID | User ID of creator |
| `updated_by` | UUID | User ID of last updater |
| `deleted_by` | UUID | User ID who deleted the record |

**Constraints**:
- Primary Key: `id`
- Unique: `code`, `name`
- Check: `NOT (is_deleted = true AND deleted_at IS NULL)` - ensures consistency

**Indexes**:
- `idx_tracking_item_types_active` - Filter by active status
- `idx_tracking_item_types_deleted` - Filter by non-deleted records
- `idx_tracking_item_types_sort` - Sort by order

## API Endpoints

### Base URL
```
/api/v1/tracking-item-types
```

---

## 1. Get All Tracking Item Types

**Endpoint**: `GET /tracking-item-types`

**Query Parameters**:
```javascript
{
  page: 1,              // Page number (default: 1)
  limit: 50,            // Items per page (default: 50)
  search: "",           // Search in code, name, description
  isActive: true,       // Filter by active status (default: true)
  isWbs: null,          // Filter by WBS capability (null = no filter)
  isLeaf: null          // Filter by leaf status (null = no filter)
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "trackingItemTypes": [
      {
        "id": "uuid",
        "code": "PILLAR",
        "name": "Pillar",
        "description": "Top-level project pillar that can contain phases",
        "is_wbs": true,
        "is_leaf": false,
        "sort_order": 1,
        "default_weight": 1.00,
        "is_active": true,
        "is_deleted": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  },
  "message": "Tracking item types retrieved successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types?page=1&limit=50&isActive=true"
```

---

## 2. Get Single Tracking Item Type

**Endpoint**: `GET /tracking-item-types/:id`

**URL Parameters**:
- `id` (required): UUID of the tracking item type

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "PHASE",
    "name": "Phase",
    "description": "Middle-level project phase that can contain tasks",
    "is_wbs": true,
    "is_leaf": false,
    "sort_order": 2,
    "default_weight": 1.00,
    "is_active": true
  },
  "message": "Tracking item type retrieved successfully"
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "Tracking item type not found."
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000"
```

---

## 3. Get Active Tracking Item Types (for Dropdowns)

**Endpoint**: `GET /tracking-item-types/active`

**Description**: Returns only active, non-deleted tracking item types, sorted by display order.

**Response** (Success - 200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PILLAR",
      "name": "Pillar",
      "description": "Top-level project pillar",
      "is_wbs": true,
      "is_leaf": false,
      "sort_order": 1,
      "default_weight": 1.00
    },
    {
      "id": "uuid",
      "code": "PHASE",
      "name": "Phase",
      "description": "Middle-level project phase",
      "is_wbs": true,
      "is_leaf": false,
      "sort_order": 2,
      "default_weight": 1.00
    }
  ],
  "message": "Active tracking item types retrieved successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/active"
```

---

## 4. Get WBS-Capable Types (Parent Types)

**Endpoint**: `GET /tracking-item-types/wbs-capable`

**Description**: Returns tracking item types that can have children (WBS-capable).

**Response** (Success - 200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PILLAR",
      "name": "Pillar",
      "description": "Top-level project pillar",
      "sort_order": 1
    },
    {
      "id": "uuid",
      "code": "PHASE",
      "name": "Phase",
      "description": "Middle-level project phase",
      "sort_order": 2
    }
  ],
  "message": "WBS-capable tracking item types retrieved successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/wbs-capable"
```

---

## 5. Get Leaf Types (Final Types)

**Endpoint**: `GET /tracking-item-types/leaf`

**Description**: Returns tracking item types that cannot have children (leaf/final types).

**Response** (Success - 200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "TASK",
      "name": "Task",
      "description": "Final task or checklist item",
      "sort_order": 3
    }
  ],
  "message": "Leaf tracking item types retrieved successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/leaf"
```

---

## 6. Create Tracking Item Type

**Endpoint**: `POST /tracking-item-types`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "code": "MILESTONE",
  "name": "Milestone",
  "description": "Project milestone checkpoint",
  "isWbs": true,
  "isLeaf": false,
  "sortOrder": 1,
  "defaultWeight": 1.00
}
```

**Validation Rules**:
- `code`: Required, alphanumeric, will be converted to UPPERCASE, must be unique
- `name`: Required, string, must be unique
- `description`: Optional, string
- `isWbs` & `isLeaf`: Cannot both be true
- `sortOrder`: Optional integer (default: 0)
- `defaultWeight`: Optional number (default: 1.00)

**Response** (Success - 201):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "MILESTONE",
    "name": "Milestone",
    "description": "Project milestone checkpoint",
    "is_wbs": true,
    "is_leaf": false,
    "sort_order": 1,
    "default_weight": 1.00,
    "is_active": true,
    "is_deleted": false,
    "created_at": "2024-01-15T10:30:00Z",
    "created_by": "user-uuid"
  },
  "message": "Tracking item type created successfully"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Code is required."
}
```

**Error Response** (409):
```json
{
  "success": false,
  "error": "Code 'MILESTONE' already exists."
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:5000/api/v1/tracking-item-types" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MILESTONE",
    "name": "Milestone",
    "description": "Project milestone checkpoint",
    "isWbs": true,
    "isLeaf": false,
    "sortOrder": 1,
    "defaultWeight": 1.00
  }'
```

---

## 7. Update Tracking Item Type

**Endpoint**: `PUT /tracking-item-types/:id`

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `id` (required): UUID of the tracking item type

**Request Body** (All fields optional):
```json
{
  "code": "MILESTONE",
  "name": "Project Milestone",
  "description": "Updated description",
  "isWbs": true,
  "isLeaf": false,
  "sortOrder": 1,
  "defaultWeight": 1.50,
  "isActive": true
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "MILESTONE",
    "name": "Project Milestone",
    "description": "Updated description",
    "is_wbs": true,
    "is_leaf": false,
    "sort_order": 1,
    "default_weight": 1.50,
    "is_active": true,
    "updated_at": "2024-01-15T11:00:00Z",
    "updated_by": "user-uuid"
  },
  "message": "Tracking item type updated successfully"
}
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Milestone",
    "defaultWeight": 1.50
  }'
```

---

## 8. Delete Tracking Item Type (Soft Delete)

**Endpoint**: `DELETE /tracking-item-types/:id`

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `id` (required): UUID of the tracking item type

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "message": "Tracking item type 'Milestone' deleted successfully."
  },
  "message": "Tracking item type 'Milestone' deleted successfully."
}
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 9. Restore Deleted Tracking Item Type

**Endpoint**: `POST /tracking-item-types/:id/restore`

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `id` (required): UUID of the deleted tracking item type

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "MILESTONE",
    "name": "Milestone",
    "is_deleted": false,
    "deleted_at": null,
    "is_active": true
  },
  "message": "Tracking item type restored successfully"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000/restore" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 10. Check if Type Can Have Children

**Endpoint**: `GET /tracking-item-types/:id/can-have-children`

**URL Parameters**:
- `id` (required): UUID of the tracking item type

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "canHaveChildren": true
  },
  "message": "Check completed successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000/can-have-children"
```

---

## 11. Check if Type is a Leaf Node

**Endpoint**: `GET /tracking-item-types/:id/is-leaf`

**URL Parameters**:
- `id` (required): UUID of the tracking item type

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isLeaf": true
  },
  "message": "Check completed successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000/is-leaf"
```

---

## 12. Get Default Weight for Type

**Endpoint**: `GET /tracking-item-types/:id/default-weight`

**URL Parameters**:
- `id` (required): UUID of the tracking item type

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "defaultWeight": 1.50
  },
  "message": "Default weight retrieved successfully"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000/default-weight"
```

---

## Pre-loaded Data

The system comes with three pre-seeded tracking item types:

### 1. Pillar
```json
{
  "code": "PILLAR",
  "name": "Pillar",
  "description": "Top-level project pillar that can contain phases",
  "is_wbs": true,
  "is_leaf": false,
  "sort_order": 1,
  "default_weight": 1.00
}
```

### 2. Phase
```json
{
  "code": "PHASE",
  "name": "Phase",
  "description": "Middle-level project phase that can contain tasks",
  "is_wbs": true,
  "is_leaf": false,
  "sort_order": 2,
  "default_weight": 1.00
}
```

### 3. Task
```json
{
  "code": "TASK",
  "name": "Task",
  "description": "Final task or checklist item that cannot have children",
  "is_wbs": false,
  "is_leaf": true,
  "sort_order": 3,
  "default_weight": 1.00
}
```

---

## Error Responses

### Common Error Codes

| Status | Message | Description |
|--------|---------|-------------|
| 400 | Validation Error | Missing or invalid required fields |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate code or name |
| 500 | Server Error | Internal server error |

### Example Error Response:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Usage Examples

### Example 1: Create a Milestone Type
```bash
curl -X POST "http://localhost:5000/api/v1/tracking-item-types" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MILESTONE",
    "name": "Milestone",
    "description": "Project milestone checkpoint",
    "isWbs": false,
    "isLeaf": true,
    "sortOrder": 4,
    "defaultWeight": 1.00
  }'
```

### Example 2: Get All WBS-Capable Types for Dropdown
```bash
curl -X GET "http://localhost:5000/api/v1/tracking-item-types/wbs-capable"
```

### Example 3: Deactivate a Type
```bash
curl -X PUT "http://localhost:5000/api/v1/tracking-item-types/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "isActive": false }'
```

---

## Implementation Notes

### WBS Hierarchy Constraints
- A type with `is_wbs = true` can have children (parent node)
- A type with `is_leaf = true` cannot have children (final node)
- A type cannot be both WBS-capable and leaf (validation enforced)

### Soft Deletes
- Deleted types are marked with `is_deleted = true` and `deleted_at` timestamp
- Soft-deleted types are automatically excluded from all queries
- Deleted types can be restored using the restore endpoint

### Audit Trail
- All changes are tracked with `created_by`, `updated_by`, and `deleted_by` user IDs
- Timestamps (`created_at`, `updated_at`, `deleted_at`) track when changes occurred

### Performance
- Indexes optimize queries for active/deleted/sort_order filters
- Pagination support handles large result sets efficiently

---

## Related Tables

The Tracking Item Types system will be used by:
- `tracking_items` - Main table storing individual tracking items
- `tracking_item_hierarchies` - Table storing parent-child relationships between items

---
