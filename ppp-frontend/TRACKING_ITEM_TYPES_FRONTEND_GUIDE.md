# Tracking Item Types - Frontend Service Guide

## Overview

The `trackingItemTypeService` provides a complete interface for interacting with the Tracking Item Types API from the frontend React application.

## File Location

```
ppp-frontend/
└── src/
    └── services/
        └── projectServices/
            ├── trackingItemTypeService.js  (NEW)
            └── index.js                     (UPDATED)
```

---

## Installation

The service is already created and exported. You can import it in your React components:

```javascript
// Option 1: Direct import
import { trackingItemTypeService } from '../../services/projectServices/trackingItemTypeService';

// Option 2: From index (recommended)
import { trackingItemTypeService } from '../../services/projectServices';
```

---

## Available Methods

### 1. Get All Tracking Item Types (with Filters)

```javascript
const getTypes = async () => {
  try {
    const response = await trackingItemTypeService.getTrackingItemTypes({
      page: 1,
      limit: 50,
      search: '',
      isActive: true,
      isWbs: null,    // null = no filter, true/false = filter by WBS capability
      isLeaf: null,   // null = no filter, true/false = filter by leaf status
    });
    
    console.log(response.data.trackingItemTypes); // Array of types
    console.log(response.data.pagination);        // Pagination info
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Response Structure**:
```javascript
{
  success: true,
  data: {
    trackingItemTypes: [
      {
        id: "uuid",
        code: "PILLAR",
        name: "Pillar",
        description: "Top-level project pillar",
        is_wbs: true,
        is_leaf: false,
        sort_order: 1,
        default_weight: 1.00,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z"
      },
      // ... more types
    ],
    pagination: {
      total: 3,
      page: 1,
      limit: 50,
      totalPages: 1
    }
  },
  message: "Tracking item types retrieved successfully"
}
```

---

### 2. Get Active Types (For Dropdowns)

```javascript
const getActiveTypes = async () => {
  try {
    const response = await trackingItemTypeService.getActiveTrackingItemTypes();
    
    // response.data is array of active types
    const types = response.data;
    
    // Use in a dropdown
    return types.map(type => ({
      value: type.id,
      label: type.name,
      code: type.code
    }));
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Example with React State**:
```javascript
const [trackingTypes, setTrackingTypes] = useState([]);

useEffect(() => {
  const fetchTypes = async () => {
    const response = await trackingItemTypeService.getActiveTrackingItemTypes();
    setTrackingTypes(response.data || []);
  };
  fetchTypes();
}, []);
```

---

### 3. Get WBS-Capable Types (Parent Types)

```javascript
const getParentTypes = async () => {
  try {
    const response = await trackingItemTypeService.getWbsCapableTypes();
    
    // Only returns types that can have children
    console.log(response.data); // [Pillar, Phase]
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Use Case**: When creating a new tracking item that needs a parent type.

---

### 4. Get Leaf Types (Final Types)

```javascript
const getFinalTypes = async () => {
  try {
    const response = await trackingItemTypeService.getLeafTypes();
    
    // Only returns types that cannot have children
    console.log(response.data); // [Task]
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Use Case**: When creating a leaf/final tracking item (no children allowed).

---

### 5. Get Single Type by ID

```javascript
const getTypeDetails = async (id) => {
  try {
    const response = await trackingItemTypeService.getTrackingItemTypeById(id);
    console.log(response.data); // Single type object
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

### 6. Check if Type Can Have Children

```javascript
const checkCanHaveChildren = async (typeId) => {
  try {
    const response = await trackingItemTypeService.canHaveChildren(typeId);
    
    if (response.data.canHaveChildren) {
      console.log('This type can have children');
    } else {
      console.log('This type cannot have children');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Use Case**: Before allowing user to add child items under a tracking item.

---

### 7. Check if Type is Leaf

```javascript
const checkIsLeaf = async (typeId) => {
  try {
    const response = await trackingItemTypeService.isLeafNode(typeId);
    
    if (response.data.isLeaf) {
      console.log('This is a final type - no children allowed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

### 8. Get Default Weight

```javascript
const getWeight = async (typeId) => {
  try {
    const response = await trackingItemTypeService.getDefaultWeight(typeId);
    console.log('Default weight:', response.data.defaultWeight); // e.g., 1.50
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Use Case**: Pre-populate weight field when creating a tracking item.

---

### 9. Create New Type (Admin Only)

```javascript
const createType = async () => {
  try {
    const response = await trackingItemTypeService.createTrackingItemType({
      code: 'MILESTONE',
      name: 'Milestone',
      description: 'Project milestone checkpoint',
      isWbs: false,
      isLeaf: true,
      sortOrder: 4,
      defaultWeight: 1.00
    });
    
    console.log('Created:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

### 10. Update Type (Admin Only)

```javascript
const updateType = async (id) => {
  try {
    const response = await trackingItemTypeService.updateTrackingItemType(id, {
      defaultWeight: 1.50,
      description: 'Updated description'
    });
    
    console.log('Updated:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

### 11. Delete Type (Admin Only)

```javascript
const deleteType = async (id) => {
  try {
    const response = await trackingItemTypeService.deleteTrackingItemType(id);
    console.log(response.data.message); // "Tracking item type deleted successfully"
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

### 12. Restore Deleted Type (Admin Only)

```javascript
const restoreType = async (id) => {
  try {
    const response = await trackingItemTypeService.restoreTrackingItemType(id);
    console.log('Restored:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## Complete React Component Examples

### Example 1: Dropdown with Active Types

```javascript
import React, { useState, useEffect } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { trackingItemTypeService } from '../../services/projectServices';

export const TrackingTypeDropdown = ({ value, onChange }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await trackingItemTypeService.getActiveTrackingItemTypes();
        setTypes(response.data || []);
      } catch (error) {
        console.error('Failed to load types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <TextField
      select
      label="Tracking Type"
      value={value}
      onChange={onChange}
      fullWidth
    >
      <MenuItem value="">Select Type</MenuItem>
      {types.map((type) => (
        <MenuItem key={type.id} value={type.id}>
          {type.name}
        </MenuItem>
      ))}
    </TextField>
  );
};
```

---

### Example 2: Type List with Actions

```javascript
import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip 
} from '@mui/material';
import { trackingItemTypeService } from '../../services/projectServices';
import { useSnackbar } from 'notistack';

export const TrackingTypesList = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchTypes = async () => {
    try {
      const response = await trackingItemTypeService.getTrackingItemTypes({
        page: 1,
        limit: 50,
        isActive: true
      });
      setTypes(response.data.trackingItemTypes || []);
    } catch (error) {
      enqueueSnackbar('Failed to load types', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleDelete = async (id) => {
    try {
      await trackingItemTypeService.deleteTrackingItemType(id);
      enqueueSnackbar('Type deleted successfully', { variant: 'success' });
      fetchTypes(); // Refresh list
    } catch (error) {
      enqueueSnackbar('Failed to delete type', { variant: 'error' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>WBS</TableCell>
            <TableCell>Leaf</TableCell>
            <TableCell>Weight</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {types.map((type) => (
            <TableRow key={type.id}>
              <TableCell>
                <Chip label={type.code} size="small" />
              </TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell>
                {type.is_wbs ? '✓ Can have children' : '✗ No children'}
              </TableCell>
              <TableCell>
                {type.is_leaf ? '✓ Final type' : '✗ Not final'}
              </TableCell>
              <TableCell>{type.default_weight}</TableCell>
              <TableCell>
                <Button 
                  size="small" 
                  onClick={() => handleDelete(type.id)}
                  color="error"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

---

### Example 3: Create Type Form

```javascript
import React, { useState } from 'react';
import { 
  Box, TextField, Button, Switch, FormControlLabel 
} from '@mui/material';
import { trackingItemTypeService } from '../../services/projectServices';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

export const CreateTrackingTypeForm = () => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isWbs: false,
    isLeaf: false,
    sortOrder: 0,
    defaultWeight: 1.00
  });
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await trackingItemTypeService.createTrackingItemType(formData);
      enqueueSnackbar('Tracking type created successfully', { variant: 'success' });
      navigate('/admin/tracking-types');
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to create type', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
      <TextField
        required
        fullWidth
        label="Code"
        value={formData.code}
        onChange={handleChange('code')}
        margin="normal"
        placeholder="e.g., MILESTONE"
      />
      
      <TextField
        required
        fullWidth
        label="Name"
        value={formData.name}
        onChange={handleChange('name')}
        margin="normal"
        placeholder="e.g., Milestone"
      />
      
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={formData.description}
        onChange={handleChange('description')}
        margin="normal"
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.isWbs}
            onChange={handleChange('isWbs')}
          />
        }
        label="Can have children (WBS-capable)"
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.isLeaf}
            onChange={handleChange('isLeaf')}
          />
        }
        label="Is leaf node (final, no children)"
      />

      <TextField
        fullWidth
        type="number"
        label="Sort Order"
        value={formData.sortOrder}
        onChange={handleChange('sortOrder')}
        margin="normal"
      />

      <TextField
        fullWidth
        type="number"
        label="Default Weight"
        value={formData.defaultWeight}
        onChange={handleChange('defaultWeight')}
        margin="normal"
        inputProps={{ step: 0.01, min: 0 }}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/admin/tracking-types')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Creating...' : 'Create Type'}
        </Button>
      </Box>
    </Box>
  );
};
```

---

### Example 4: Conditional Child Addition

```javascript
import React, { useState, useEffect } from 'react';
import { Button, Alert } from '@mui/material';
import { trackingItemTypeService } from '../../services/projectServices';

export const AddChildButton = ({ parentTypeId }) => {
  const [canHaveChildren, setCanHaveChildren] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCapability = async () => {
      try {
        const response = await trackingItemTypeService.canHaveChildren(parentTypeId);
        setCanHaveChildren(response.data.canHaveChildren);
      } catch (error) {
        console.error('Error checking capability:', error);
      } finally {
        setLoading(false);
      }
    };
    checkCapability();
  }, [parentTypeId]);

  if (loading) return <div>Checking...</div>;

  if (!canHaveChildren) {
    return (
      <Alert severity="info">
        This type cannot have children (it's a leaf node)
      </Alert>
    );
  }

  return (
    <Button variant="contained" color="primary">
      Add Child Item
    </Button>
  );
};
```

---

## Error Handling

All methods throw errors that should be caught:

```javascript
try {
  const response = await trackingItemTypeService.getActiveTrackingItemTypes();
  // Handle success
} catch (error) {
  // error.message contains the error message
  // error.response?.status contains HTTP status code
  console.error('Error:', error.message);
  enqueueSnackbar(error.message, { variant: 'error' });
}
```

---

## Common Patterns

### Pattern 1: Load types for dropdown on mount
```javascript
const [types, setTypes] = useState([]);

useEffect(() => {
  trackingItemTypeService.getActiveTrackingItemTypes()
    .then(res => setTypes(res.data || []))
    .catch(err => console.error(err));
}, []);
```

### Pattern 2: Refresh list after create/update/delete
```javascript
const [types, setTypes] = useState([]);

const fetchTypes = async () => {
  const response = await trackingItemTypeService.getTrackingItemTypes();
  setTypes(response.data.trackingItemTypes || []);
};

const handleCreate = async (data) => {
  await trackingItemTypeService.createTrackingItemType(data);
  fetchTypes(); // Refresh
};

const handleDelete = async (id) => {
  await trackingItemTypeService.deleteTrackingItemType(id);
  fetchTypes(); // Refresh
};
```

### Pattern 3: Pre-fill form with default weight
```javascript
const [weight, setWeight] = useState(1.00);

useEffect(() => {
  if (selectedTypeId) {
    trackingItemTypeService.getDefaultWeight(selectedTypeId)
      .then(res => setWeight(res.data.defaultWeight))
      .catch(err => console.error(err));
  }
}, [selectedTypeId]);
```

---

## API Response Format

All responses follow this structure:

```javascript
{
  success: true,
  data: { /* response data */ },
  message: "Success message"
}
```

Errors are thrown and can be caught:
```javascript
{
  success: false,
  error: "Error message"
}
```

---

## Type Definitions (for TypeScript/JSDoc)

```typescript
interface TrackingItemType {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_wbs: boolean;
  is_leaf: boolean;
  sort_order: number;
  default_weight: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface CreateTrackingItemTypePayload {
  code: string;
  name: string;
  description?: string;
  isWbs: boolean;
  isLeaf: boolean;
  sortOrder?: number;
  defaultWeight?: number;
}

interface UpdateTrackingItemTypePayload {
  code?: string;
  name?: string;
  description?: string;
  isWbs?: boolean;
  isLeaf?: boolean;
  sortOrder?: number;
  defaultWeight?: number;
  isActive?: boolean;
}
```

---

## Summary

✅ **Created**: `trackingItemTypeService.js` with 12 methods
✅ **Exported**: Added to `index.js` for easy imports
✅ **Validated**: Frontend builds successfully
✅ **Ready**: Can be used in React components immediately

**File Location**: `ppp-frontend/src/services/projectServices/trackingItemTypeService.js`

**Import Statement**:
```javascript
import { trackingItemTypeService } from '../../services/projectServices';
```

**Next Steps**:
1. Create UI components (list, form, dropdown)
2. Add to admin navigation menu
3. Connect to tracking items creation workflow
4. Implement permissions/role-based access
