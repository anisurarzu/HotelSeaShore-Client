# Backend Permission Update – Prompt for Implementation

Use this prompt with your backend codebase (or an AI assistant) to align your APIs and database with the **frontend permission structure**: role-based and **page-wise** permissions (Settings → Role & Permission Management, dashboard menu filtering, and content permissions per page).

---

## Copy-paste prompt below

---

**Context:** Our frontend uses a **role-based, page-wise permission** model:

1. **Roles** are stored as **Permission** documents: each has `permissionName` (role name) and `permissions` (array of page-wise access).
2. Each **page permission** has: `pageKey` (e.g. `"1"`, `"6"`, `"8"`), `pageName` (label, e.g. `"Dashboard"`, `"Booking Info"`), `viewAccess`, `insertAccess`, `editAccess`, `deleteAccess` (booleans).
3. **User** has a **role** and an optional **permission** (one Permission document) assigned. The dashboard filters menu by `user.permission.permissions` (only pages with `viewAccess: true`) and passes per-page content flags (view/insert/edit/delete) to each page component.

Update the backend to support the following contract (and keep existing behaviour where it matches).

### 1. Permission model (database schema)

- **Permission** collection/table with at least:
  - `_id` (or `id`)
  - `permissionKey` (string, unique) – format: `"resource:action"`, e.g. `"booking:read"`, `"hotel:manage"`
  - `resource` (string, optional) – e.g. `"booking"`, `"hotel"`, `"user"`
  - `action` (string, optional) – e.g. `"read"`, `"create"`, `"update"`, `"delete"`, `"manage"`
  - `permissionName` (string) – human-readable label, e.g. `"View bookings"`
  - `category` (string, optional) – for grouping in UI (can equal `resource`)

- **Role** collection/table (if not already present):
  - `_id`, `name` or `value` (e.g. `"hoteladmin"`), `label` (e.g. `"Hotel Admin"`)
  - `permissionIds` (array of Permission `_id`) or `permissionKeys` (array of strings like `"booking:read"`)

- **User** model must support:
  - `role` (reference to Role or string role value)
  - `permission` or `permissions` – either:
    - single ref: `permissionId` (one Permission `_id`), or
    - multiple: `permissionIds` (array of Permission `_id`) or `permissionKeys` (array of strings)
  - When checking access: user has permissions from **role** plus any **user-level** permission overrides (union of both).

### 2. Page-wise Role (Permission) API (primary for dashboard)

- **Permission** document = one **Role** with:
  - `permissionName` (string) – role display name, e.g. `"Hotel Manager"`, `"Reception"`.
  - `permissions` (array) – each element:
    - `pageKey` (string) – matches dashboard menu key, e.g. `"1"` (Dashboard), `"6"` (Booking Info), `"8"` (Settings). See frontend `config/dashboardPages.js` for full list.
    - `pageName` (string) – human-readable page name, e.g. `"Dashboard"`, `"Booking Info"`.
    - `viewAccess` (boolean) – can see the page (show in menu and open it).
    - `insertAccess` (boolean) – can add new records (e.g. "Add New User").
    - `editAccess` (boolean) – can edit existing records.
    - `deleteAccess` (boolean) – can delete records.

- **GET /permission** – returns array of Permission (role) documents, each with `_id`, `permissionName`, `permissions` (array as above).
- **POST /permission** – body: `{ permissionName, permissions }`. Create new role.
- **PUT /permission/:id** – body: `{ permissionName, permissions }`. Update role.
- **DELETE /permission/:id** – delete role.

- **User** document must include (for dashboard):
  - `role` – e.g. `{ value: "hoteladmin", label: "Hotel Admin" }`.
  - `permission` – the **Permission (role)** document assigned to this user (populate so it includes `permissions` array). If user has a role that implies full access (e.g. superadmin), the frontend may not require `permission`; otherwise the dashboard filters menu and content by `user.permission.permissions`.

### 3. API contract (optional: resource-action permissions)

**GET /permission** (or GET /permissions)

- Response: array of permissions.
- Each item must include at least: `_id`, `permissionName`.
- For the new structure, also include: `permissionKey`, `resource`, `action`, `category` (optional).
- Example:
  ```json
  [
    { "_id": "...", "permissionKey": "booking:read", "resource": "booking", "action": "read", "permissionName": "View bookings", "category": "booking" },
    { "_id": "...", "permissionKey": "booking:create", "resource": "booking", "action": "create", "permissionName": "Create booking", "category": "booking" }
  ]
  ```
- Support both shapes: legacy `{ _id, permissionName }` and full `{ _id, permissionKey, resource, action, permissionName, category }`.

**GET /auth/users**

- Each user object must include:
  - `role` (object with at least `value` and `label`) or equivalent.
  - `permission` (object with `_id`, `permissionName`, and optionally `permissionKey`) when user has a single permission, or `permissions` (array) when multiple.
- So the frontend can display Role and Permission columns and send `permissionID` (or `permissionIds`) on create/update.

**POST /auth/register** (or create-user) and **PUT /auth/users/:id** (or update user)

- Accept:
  - `role` (string, e.g. `"hoteladmin"`).
  - `permissionID` (single Permission `_id`) or `permissionIds` (array of `_id`) for user-level permissions.
- Optionally accept `permissionKey` or `permissionKeys` and resolve to permission IDs server-side.
- Persist so that after update, GET /auth/users returns the updated `role` and `permission`/`permissions`.

### 4. Middleware / authorization

- Add a middleware (e.g. `requirePermission('booking:read')` or `requirePermissionKeys(['booking:read','booking:update'])`) that:
  - Reads the current user (from JWT/session).
  - Resolves user’s effective permissions (role permissions + user permission overrides).
  - Checks if the required permission key(s) are in the effective list.
- Use this middleware on routes that should be protected by permission (e.g. booking routes, user management routes).

### 5. Seed / migration (optional)

- Seed the **Permission** collection with standard entries matching frontend’s `permissionStructure.js`:
  - Resources: `booking`, `hotel`, `user`, `agent`, `expense`, `report`, `dashboard`, `settings`.
  - Actions: `read`, `create`, `update`, `delete`, `manage`.
  - For each resource+action (or at least the ones you use), create a document with `permissionKey` = `"resource:action"`, `resource`, `action`, `permissionName`, `category`.
- Optionally seed **Role** documents with default `permissionIds`/`permissionKeys` for `agentadmin`, `superadmin`, `hoteladmin`, `admin`.

### 6. Summary of what the frontend expects

- **GET /permission** → list of permissions (with `_id`, `permissionName`, and optionally `permissionKey`, `resource`, `action`, `category`).
- **GET /auth/users** → each user has `role` (with `value`, `label`) and `permission` (with `_id`, `permissionName`) or `permissions` array.
- **Create/Update user** → backend accepts `role` and `permissionID` (or `permissionIds`) and persists them; effective permissions = role permissions ∪ user permissions.
- **Authorization** → middleware that checks effective user permissions against required permission keys (e.g. `"booking:read"`).

Implement the above so that the Agent Information page (and any future permission-based UI) works with dynamic permissions and stays in sync with the frontend’s `utils/permissionStructure.js` and role options.
