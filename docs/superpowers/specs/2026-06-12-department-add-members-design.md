# Add members to a department / sub-department

**Date:** 2026-06-12
**Module:** `modules/departments`
**Status:** Approved — ready for implementation

## Problem

The Departments screen lets HR build the org tree and view each department's
roster, but there is **no way to add a member** (employee) to a department or
sub-department from this screen. Assigning an employee to a department today is
only possible through the employee edit form (`PATCH /employees/:id`). HR needs
to add people to a team directly from the department detail panel.

## Decisions (locked)

1. **Scope:** "Add member" = **bulk-assign existing employees**. A dialog with a
   searchable, multi-select list of existing employees; confirming assigns the
   selected employees to the open department / sub-department. (No "create new
   employee here" deep-link in this iteration — YAGNI.)
2. **Backend contract:** a **new dedicated endpoint** `POST /departments/:id/members`,
   defined frontend-first per `CLAUDE.md §22` — documented in
   `BACKEND_API_REQUESTS.md`, MSW-mocked to the exact shape, typed. (Not reusing
   live `PATCH /employees/:id` per-employee.)

## UI

In `modules/departments/components/DepartmentTree.tsx` → `DepartmentDetailPanel`,
the **Members** card header gains an **"Add member"** button (`size="sm"`,
`PlusIcon`), wrapped in `<PermissionWrapper permission="departments:write">`. This
matches the design mock's `section-card-head` + small-button chrome
(`docs/ems-design-system/.../DepartmentsScreen.jsx`). The existing
`DepartmentEmployeesTable` below is untouched.

New module-scoped component **`AddMembersDialog`**
(`modules/departments/components/AddMembersDialog.tsx`):

- Props: `{ open, onOpenChange, dept: Department }`.
- Title: _"Add members to {dept.name}"_ — works identically for a top-level
  department or a sub-department (the selected node's `:id` is used).
- Debounced search input → `useEmployees({ search, status: 'ACTIVE', limit: 50 })`
  imported from the `@/modules/employees` **public barrel** (no internal reach-in,
  per §6).
- Scrollable **multi-select checkbox list**: avatar/name, employee code,
  designation, and _current department_ (context, so HR sees it is a move).
  Employees whose department leaf already equals `dept.id` are **excluded** from
  the list (already members).
- **Four states** inside the list (§13): skeleton rows (loading) / `EmptyState`
  (no employees or no search match) / `ErrorState` + retry (error) / list (success).
- Footer: **"Add N member(s)"** primary button — disabled when none selected or
  while pending, spinner while pending — plus Cancel.
- On success: toast _"N member(s) added to {dept.name}"_, close the dialog, and
  invalidate `['departments']` and `['departments', dept.id, 'employees']`.

All work: tokens only / no raw hex (§12), dark mode + responsive (§15), keyboard
navigable, permission-gated (§10), no `any`.

## Backend contract — `POST /departments/:id/members`

| Field         | Value                                       |
| ------------- | ------------------------------------------- |
| Method / path | `POST /api/v1/departments/:id/members`      |
| Roles         | HR_ADMIN, SUPER_ADMIN (`departments:write`) |
| Request body  | `{ "employeeIds": ["emp_a", "emp_b"] }`     |

**Success `200`** — `data`:

```json
{
  "id": "dep_eng",
  "added": 2,
  "skipped": 0,
  "employeeIds": ["emp_a", "emp_b"],
  "_count": { "employees": 16 }
}
```

- **Idempotent:** employees already in the department are counted in `skipped`,
  not `added`. `_count.employees` is the department's new total.
- Assigning sets each employee's `departmentId` to the **full root→leaf path**
  ending at `:id` (the server resolves the path; the frontend sends only ids).

**Errors:**

| Code                   | Status | When                                                                 |
| ---------------------- | ------ | -------------------------------------------------------------------- |
| `DEPARTMENT_NOT_FOUND` | 404    | `:id` does not exist                                                 |
| `VALIDATION`           | 422    | empty / invalid `employeeIds`; `error.details: [{ field, message }]` |
| (server)               | 403    | insufficient permission                                              |

## Types / service / hook

In `modules/departments`:

- `types/department.types.ts`: `AddMembersInput { employeeIds: string[] }`,
  `AddMembersResult { id; added; skipped; employeeIds; _count: { employees: number } }`.
- `services/departments.api.ts`: `addMembers({ id, employeeIds })` → unwraps `data`.
- `hooks/useDepartmentMutations.ts`: `useAddDepartmentMembers()` →
  invalidates `['departments']` on success (component also invalidates the
  per-dept employees query).
- Export the hook + types from `modules/departments/index.ts`.

## MSW mock

New `src/mocks/handlers/departments.ts` — departments has **no** handler today,
so this intercepts only `POST /departments/:id/members`. Maintains an in-memory
`Map<deptId, Set<employeeId>>` for idempotency and returns the documented shape
(`added` = newly-added count, `skipped` = already-present count, `_count.employees`
= a base + added). 422 when `employeeIds` is missing/empty. Registered in
`src/mocks/handlers/index.ts`.

## ⚠️ Coherence / live-transition note

Departments **reads** (`GET /departments`, `GET /departments/:id/employees`) are
**live** (no MSW handler); this **write** is MSW-mocked. Until the backend
implements `POST /departments/:id/members` (and persists each employee's
`departmentId` path), an assignment returns a mocked success and toasts, **but the
live member list/count will not change on refetch**. This is the expected
frontend-first tradeoff (§22). When the backend ships the endpoint, removing the
MSW handler makes reads and writes consistent — no app-code change. The frontend
deliberately does **not** fall back to live `PATCH /employees/:id` (that would mix
two contracts).

## Out of scope (YAGNI)

- Removing a member from a department (an employee must always belong to one;
  "remove" is really "move", which is the existing employee-edit flow).
- "Create new employee in this department" deep-link.
- Drag-and-drop between departments.
