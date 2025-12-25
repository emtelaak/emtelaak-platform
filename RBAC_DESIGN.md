# Role-Based Access Control (RBAC) System Design

## Overview
This document outlines the RBAC system for the Emtelaak platform, allowing Super Admin to manage menu visibility and access control for different user roles.

## Database Schema

### 1. Roles Table
Stores all user roles in the system.

```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default roles
INSERT INTO roles (name, description, is_system_role) VALUES
('super_admin', 'Super Administrator with full system access', TRUE),
('admin', 'Administrator with limited system access', TRUE),
('investor', 'Regular investor user', TRUE),
('guest', 'Guest user with limited access', TRUE);
```

### 2. Permissions Table
Stores all available permissions in the system.

```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('view_dashboard', 'View dashboard page', 'dashboard', 'view'),
('view_properties', 'View properties page', 'properties', 'view'),
('manage_properties', 'Manage properties', 'properties', 'manage'),
('view_portfolio', 'View investment portfolio', 'portfolio', 'view'),
('manage_users', 'Manage system users', 'users', 'manage'),
('manage_roles', 'Manage roles and permissions', 'roles', 'manage'),
('view_transactions', 'View transaction history', 'transactions', 'view'),
('view_reports', 'View system reports', 'reports', 'view');
```

### 3. Role_Permissions Table
Junction table linking roles to permissions.

```sql
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);
```

### 4. Menu_Items Table
Stores all menu items with visibility and permission requirements.

```sql
CREATE TABLE menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  label_ar VARCHAR(100) NOT NULL,
  path VARCHAR(255),
  icon VARCHAR(50),
  parent_id INT NULL,
  order_index INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  permission_required VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_required) REFERENCES permissions(name) ON DELETE SET NULL
);

-- Default menu items
INSERT INTO menu_items (name, label_en, label_ar, path, icon, order_index, permission_required) VALUES
('home', 'Home', 'الرئيسية', '/', 'Home', 1, NULL),
('properties', 'Properties', 'العقارات', '/properties', 'Building2', 2, 'view_properties'),
('how_it_works', 'How It Works', 'كيف يعمل', '/how-it-works', 'HelpCircle', 3, NULL),
('about', 'About', 'من نحن', '/about', 'Info', 4, NULL),
('faq', 'FAQ', 'الأسئلة الشائعة', '/faq', 'MessageCircle', 5, NULL),
('contact', 'Contact', 'اتصل بنا', '/contact', 'Mail', 6, NULL),
('dashboard', 'Dashboard', 'لوحة التحكم', '/dashboard', 'LayoutDashboard', 7, 'view_dashboard'),
('portfolio', 'Portfolio', 'محفظتي', '/portfolio', 'Wallet', 8, 'view_portfolio'),
('transactions', 'Transactions', 'المعاملات', '/transactions', 'Receipt', 9, 'view_transactions'),
('admin', 'Admin Panel', 'لوحة الإدارة', '/admin', 'Shield', 10, 'manage_users');
```

### 5. Role_Menu_Visibility Table
Stores custom menu visibility settings per role (overrides default).

```sql
CREATE TABLE role_menu_visibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_role_menu (role_id, menu_item_id)
);
```

### 6. User_Roles Table (Update existing users table)
Link users to their roles.

```sql
-- Add role_id to existing users table
ALTER TABLE users ADD COLUMN role_id INT DEFAULT 3;
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);

-- Or create separate junction table for multiple roles per user
CREATE TABLE user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_role (user_id, role_id)
);
```

## API Endpoints

### Super Admin Menu Management

#### 1. Get All Menu Items with Role Visibility
```
GET /api/admin/menu-items
Authorization: Bearer <super_admin_token>

Response:
{
  "menuItems": [
    {
      "id": 1,
      "name": "home",
      "labelEn": "Home",
      "labelAr": "الرئيسية",
      "path": "/",
      "icon": "Home",
      "orderIndex": 1,
      "isVisible": true,
      "permissionRequired": null,
      "roleVisibility": {
        "super_admin": true,
        "admin": true,
        "investor": true,
        "guest": true
      }
    },
    ...
  ]
}
```

#### 2. Update Menu Visibility for Role
```
PUT /api/admin/menu-items/:menuItemId/roles/:roleId/visibility
Authorization: Bearer <super_admin_token>

Request Body:
{
  "isVisible": false
}

Response:
{
  "success": true,
  "message": "Menu visibility updated successfully"
}
```

#### 3. Bulk Update Menu Visibility
```
PUT /api/admin/menu-items/bulk-visibility
Authorization: Bearer <super_admin_token>

Request Body:
{
  "updates": [
    {
      "menuItemId": 2,
      "roleId": 4,
      "isVisible": false
    },
    {
      "menuItemId": 7,
      "roleId": 4,
      "isVisible": false
    }
  ]
}

Response:
{
  "success": true,
  "updated": 2
}
```

#### 4. Get User Menu Items
```
GET /api/menu-items
Authorization: Bearer <user_token>

Response:
{
  "menuItems": [
    {
      "name": "home",
      "labelEn": "Home",
      "labelAr": "الرئيسية",
      "path": "/",
      "icon": "Home"
    },
    ...
  ]
}
```

#### 5. Check User Permission
```
GET /api/auth/check-permission/:permission
Authorization: Bearer <user_token>

Response:
{
  "hasPermission": true
}
```

## Frontend Implementation

### 1. Menu Rendering Logic

```typescript
// hooks/useUserMenu.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useUserMenu() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['menu-items', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/menu-items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    enabled: !!user
  });
}
```

### 2. Protected Route Component

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { hasPermission, isLoading: permissionLoading } = usePermission(permission);

  if (isLoading || permissionLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

### 3. Super Admin Dashboard Component

```typescript
// pages/admin/MenuManagement.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function MenuManagement() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('investor');

  const { data: menuData } = useQuery({
    queryKey: ['admin-menu-items'],
    queryFn: async () => {
      const response = await fetch('/api/admin/menu-items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    }
  });

  const updateVisibility = useMutation({
    mutationFn: async ({ menuItemId, roleId, isVisible }) => {
      const response = await fetch(
        `/api/admin/menu-items/${menuItemId}/roles/${roleId}/visibility`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isVisible })
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Menu Visibility Management</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Role</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="investor">Investor</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Menu Item</th>
              <th className="px-6 py-3 text-left">Path</th>
              <th className="px-6 py-3 text-left">Permission Required</th>
              <th className="px-6 py-3 text-center">Visible</th>
            </tr>
          </thead>
          <tbody>
            {menuData?.menuItems.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-6 py-4">{item.labelEn}</td>
                <td className="px-6 py-4">{item.path}</td>
                <td className="px-6 py-4">{item.permissionRequired || 'None'}</td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={item.roleVisibility[selectedRole]}
                    onChange={(e) => {
                      updateVisibility.mutate({
                        menuItemId: item.id,
                        roleId: getRoleId(selectedRole),
                        isVisible: e.target.checked
                      });
                    }}
                    className="w-5 h-5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Security Considerations

1. **Super Admin Only**: Menu management endpoints must verify user has `super_admin` role
2. **Token Validation**: All API requests must include valid JWT token
3. **Permission Caching**: Cache user permissions on login, invalidate on role change
4. **Audit Logging**: Log all menu visibility changes with timestamp and admin user
5. **Rate Limiting**: Implement rate limiting on admin endpoints
6. **Input Validation**: Validate all menu item IDs and role IDs before database operations

## Implementation Steps

1. ✅ Create database migrations for all tables
2. ✅ Implement backend API endpoints
3. ✅ Create Super Admin dashboard UI
4. ✅ Implement frontend hooks and components
5. ✅ Add protected route logic
6. ✅ Test with different user roles
7. ✅ Deploy to production

## Example Usage

### Super Admin Workflow
1. Login as Super Admin
2. Navigate to Admin Panel → Menu Management
3. Select role (e.g., "Guest")
4. Toggle visibility checkboxes for menu items
5. Changes save automatically
6. Guest users immediately see updated menu

### User Experience
1. User logs in with assigned role
2. Frontend fetches menu items based on role permissions
3. Only visible and permitted menu items are displayed
4. Navigation automatically adjusts
5. Protected routes enforce access control
