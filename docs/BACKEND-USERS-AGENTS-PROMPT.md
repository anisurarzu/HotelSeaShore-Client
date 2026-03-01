# Backend prompt: Users & Agents (Agent Information)

Use this prompt to implement or update the backend so it works with the **Users & Agents** frontend page (`component/AgentInformation.js`).

---

## Copy-paste prompt below

---

**Context:** We have a **Users & Agents** dashboard page that lists users, and allows creating, editing, and deleting users. Each user has profile fields, a **role**, a **permission** (role template for page-wise access), and assigned **hotels**. Implement or adjust the backend so the following APIs and data shapes are supported.

---

### 1. User model (database schema)

Each **User** document/row should support at least:

| Field           | Type           | Notes |
|----------------|----------------|-------|
| `id` or `_id`  | string (PK)    | Required. Frontend uses it for edit/delete and `rowKey`. |
| `key`          | string         | Optional. Unique key for new users (e.g. UUID). Frontend may send on create. |
| `username`     | string         | Required. |
| `email`        | string         | Required. |
| `phoneNumber`  | string         | Optional. |
| `loginID`      | string         | Required. User ID / login identifier. |
| `password`     | string         | Stored hashed. Required on create; optional on update (leave unchanged if not sent). |
| `plainPassword`| string         | Optional. If you accept it, do not store; use only for validation or sync. |
| `currentAddress` | string       | Optional. |
| `gender`       | string         | Optional. Values: `"male"`, `"female"`, `"other"`. |
| `image`        | string         | Optional. URL of profile picture. |
| `role`         | object or ref  | Required. See below. |
| `permission`   | object or ref  | Optional. Permission (role template) document. See below. |
| `hotelID`      | array          | Optional. Array of objects `{ hotelID: string }` or similar. |

**Role** (embedded or populated):

- Frontend sends: `role: { id, value, label }` (e.g. `{ id: 1, value: "hoteladmin", label: "Hotel Admin" }`).
- API responses must return **role as an object** with at least `value` and `label` so the table can show `role.label` and the form can show `role.value`.
- Example: `role: { value: "hoteladmin", label: "Hotel Admin" }`.

**Permission** (reference or populated):

- Frontend sends `permission` as the full Permission document (or only `permissionID`); backend may accept either.
- API responses must return **permission as an object** with at least `_id` and `permissionName` (e.g. for table and dropdown). If you use page-wise permissions, include `permissions` array for dashboard filtering.
- Example: `permission: { _id: "...", permissionName: "Reception", permissions: [...] }`.

**hotelID**:

- Frontend sends: `hotelID: [ { hotelID: "id1" }, { hotelID: "id2" } ]` (array of objects with `hotelID`).
- API responses must return **hotelID as an array** of objects that have at least `hotelID` and, for display, `hotelName` (or `name`). Populate from Hotels collection if needed.
- Example: `hotelID: [ { hotelID: "1", hotelName: "Hotel Sea Shore" } ]`.

---

### 2. API endpoints

#### 2.1 GET /users (or GET /api/users)

- **Frontend calls:** `GET /users` (with axios baseURL including API prefix, e.g. `/api`, so full URL is `/api/users`).

- **Auth:** Protected (e.g. JWT). Only allowed for admin/superadmin or users with “Users” page access.
- **Response:** Either:
  - **Option A:** `{ users: [ ... ] }` (array of user objects).
  - **Option B:** `[ ... ]` (array of user objects directly).
- Each user object must include:
  - `id` or `_id`
  - `username`, `email`, `phoneNumber`, `loginID`, `currentAddress`, `gender`, `image`
  - `role` as object with `value` and `label`
  - `permission` as object with `_id` and `permissionName` (and optionally `permissions` for dashboard)
  - `hotelID` as array of objects with `hotelID` and, for display, `hotelName` (or `name`)
  - `key` if you store it (optional for frontend)

---

#### 2.2 POST /users (create user)

- **Auth:** Protected. Only for admins (or users with insert permission on Users page).
- **Body (JSON):**
  - `username` (string, required)
  - `email` (string, required)
  - `phoneNumber` (string, optional)
  - `loginID` (string, required)
  - `password` (string, required)
  - `plainPassword` (string, optional; do not store)
  - `currentAddress` (string, optional)
  - `gender` (string, optional)
  - `image` (string, optional – URL)
  - `role` (object, required): `{ id, value, label }`
  - `permission` (object, optional): full Permission document or `{ _id: "..." }`
  - `hotelID` (array, optional): `[ { hotelID: "id1" }, ... ]`
  - `key` (string, optional): unique key for the user (e.g. UUID from frontend)
- **Response:** 201 with created user object (same shape as in GET /auth/users), or 200 with message.
- **Validation:** Unique `email` and/or `loginID` if required; validate role and permission exist.

---

#### 2.3 PUT /users/:id (update user)

- **Auth:** Protected. Only for admins or users with edit permission on Users page.
- **Params:** `id` – user `id` or `_id`.
- **Body (JSON):** Same fields as in POST /auth/register. All optional; only update fields that are sent. Do not require `password`; if missing, keep existing hashed password.
- **Response:** 200 with updated user object (same shape as in GET /auth/users).
- **Validation:** If `email` or `loginID` is sent, ensure uniqueness for other users.

---

#### 2.4 DELETE /users/:id

- **Auth:** Protected. Only for admins or users with delete permission on Users page.
- **Params:** `id` – user `id` or `_id`.
- **Response:** 200 with a success message (e.g. `{ message: "User deleted" }`). Do not return the deleted user in the body if not needed.
- **Side effects:** Remove or soft-delete the user; revoke tokens/sessions if applicable.

---

### 3. Supporting APIs (used by the same page)

#### 3.1 GET /hotels

- **Auth:** Protected.
- **Response:** Array of hotels. Each hotel must have at least:
  - `hotelID` or `_id` (used as value in “Hotels” multi-select)
  - `hotelName` or `name` (used as label)
- Frontend also accepts: `{ hotels: [...] }` or `{ data: { hotels: [...] } }` and will normalize to an array.

#### 3.2 GET /permission

- **Auth:** Protected.
- **Response:** Array of Permission (role template) documents. Each must have:
  - `_id`
  - `permissionName` (label in “Permission” dropdown)
- Used to populate the “Permission (role template)” dropdown when creating/editing a user. If you use page-wise permissions, each document may also have a `permissions` array (see BACKEND-PERMISSION-UPDATE-PROMPT.md).

---

### 4. Image upload (optional)

- The frontend may upload the profile image to a separate endpoint (e.g. `POST /api/upload` or `POST /upload`) with `multipart/form-data` and `file` field, and then send the returned URL in the `image` field when creating/updating the user.
- If you provide this endpoint, return a JSON body with the file URL, e.g. `{ url: "https://..." }`.
- If you do not provide it, the frontend can still send a base64 or URL string in `image` if you accept it.

---

### 5. Summary checklist

- [ ] **User model** has: id/_id, username, email, phoneNumber, loginID, password (hashed), currentAddress, gender, image, role (object with value/label), permission (object with _id, permissionName), hotelID (array of { hotelID, hotelName? }).
- [ ] **GET /users** (or **GET /api/users**) returns array (or `{ users: [] }`) with role and permission as objects and hotelID populated for display.
- [ ] **POST /users** accepts the body above; returns 201 and created user in the same shape.
- [ ] **PUT /users/:id** accepts same fields; password optional; returns 200 and updated user.
- [ ] **DELETE /users/:id** returns 200 and removes (or soft-deletes) the user.
- [ ] **GET /hotels** returns array of { hotelID or _id, hotelName or name }.
- [ ] **GET /permission** returns array of { _id, permissionName, ... }.
- [ ] All these routes are protected and restricted by role/permission where applicable.

Implement the above so that the **Users & Agents** frontend page (list, search, add, edit, delete, role/permission/hotels dropdowns) works without changes.
