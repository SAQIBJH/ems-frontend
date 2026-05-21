# EMS — Design System

> **Visual identity:** Enterprise luxury. Calm, dense, confident. Closer to Linear and Vercel than to Bootstrap admin templates.
> **Engineering identity:** Configuration-driven. Build engines once, reuse everywhere. Every component supports loading, empty, error, and success states by default.

---

## 1. Design Principles

| Principle                                    | What it means in practice                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Clarity over decoration**                  | A pixel exists only if it carries information. No gradient backgrounds on cards, no shadow-on-shadow.                       |
| **Density with breathing room**              | Show more data per screen than a consumer app, but never let two unrelated elements touch. 8px / 12px / 16px is the rhythm. |
| **One primary action per view**              | The single most important action is high-contrast. Everything else is secondary or tertiary.                                |
| **Motion serves comprehension**              | Animation only to communicate state change (entering, leaving, loading). Never to entertain. Default duration 150–200ms.    |
| **Empty states are features**                | Every list, table, and chart has a designed empty state with a call to action.                                              |
| **Accessibility is baseline, not a feature** | WCAG AA contrast minimum; keyboard navigation on every interactive element; focus rings visible.                            |

---

## 2. Design Tokens

All tokens live in `apps/web/src/styles/tokens.css` as CSS variables. Tailwind reads them via `tailwind.config.ts`. This makes dark mode and tenant theming a CSS-only switch.

### Color

Defined in HSL components so opacity composition works cleanly.

```css
:root {
  /* Surfaces */
  --bg-canvas: 220 14% 98%; /* page background */
  --bg-surface: 0 0% 100%; /* card */
  --bg-surface-2: 220 14% 96%; /* nested card / hover */
  --bg-overlay: 220 30% 8%; /* modal scrim, dark behind */

  /* Borders */
  --border-subtle: 220 13% 91%;
  --border-default: 220 13% 84%;
  --border-strong: 220 13% 65%;

  /* Text */
  --text-primary: 222 47% 11%;
  --text-secondary: 220 9% 38%;
  --text-tertiary: 220 9% 55%;
  --text-disabled: 220 9% 72%;
  --text-on-primary: 0 0% 100%;

  /* Brand */
  --brand-50: 222 100% 97%;
  --brand-100: 222 95% 92%;
  --brand-500: 222 80% 52%; /* primary action */
  --brand-600: 222 75% 46%;
  --brand-700: 222 70% 40%;

  /* Semantic */
  --success-500: 152 60% 40%;
  --warning-500: 38 92% 50%;
  --danger-500: 0 75% 50%;
  --info-500: 210 90% 50%;

  /* Focus */
  --focus-ring: 222 90% 56%;
}

[data-theme='dark'] {
  --bg-canvas: 222 20% 8%;
  --bg-surface: 222 18% 11%;
  --bg-surface-2: 222 16% 14%;
  --bg-overlay: 222 30% 4%;

  --border-subtle: 222 14% 18%;
  --border-default: 222 14% 24%;
  --border-strong: 222 12% 38%;

  --text-primary: 220 14% 96%;
  --text-secondary: 220 10% 72%;
  --text-tertiary: 220 9% 58%;
  --text-disabled: 220 8% 40%;

  --brand-500: 222 85% 62%;
  --brand-600: 222 80% 55%;
}
```

### Typography

Single typeface: **Inter** (variable). Monospace: **JetBrains Mono** for codes, IDs, payslip references.

| Token           | Size / line-height                               | Use                              |
| --------------- | ------------------------------------------------ | -------------------------------- |
| `text-display`  | 32 / 40, weight 600                              | Page title in rare hero contexts |
| `text-h1`       | 24 / 32, weight 600                              | Page title                       |
| `text-h2`       | 20 / 28, weight 600                              | Section title                    |
| `text-h3`       | 16 / 24, weight 600                              | Card title                       |
| `text-body`     | 14 / 20, weight 400                              | Default body                     |
| `text-body-sm`  | 13 / 18, weight 400                              | Table cells, dense forms         |
| `text-caption`  | 12 / 16, weight 500                              | Labels, helper text              |
| `text-overline` | 11 / 14, weight 600, uppercase, +0.05em tracking | Section overlines                |

### Spacing scale

`0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96` (px). Use Tailwind's `space-*`. **No arbitrary values like `space-[13px]`** — if you need it, the scale is wrong or your design is.

### Radius

```
--radius-sm:  4px    /* badges, chips */
--radius-md:  8px    /* inputs, buttons */
--radius-lg:  12px   /* cards */
--radius-xl:  16px   /* modals, drawers */
--radius-full: 9999px
```

### Shadows

```
--shadow-xs:   0 1px 2px hsl(220 30% 10% / 0.04)
--shadow-sm:   0 2px 4px hsl(220 30% 10% / 0.06)
--shadow-md:   0 4px 12px hsl(220 30% 10% / 0.08)
--shadow-lg:   0 12px 32px hsl(220 30% 10% / 0.12)
--shadow-focus: 0 0 0 3px hsl(var(--focus-ring) / 0.25)
```

Shadows are subtle by design. Anything heavier looks like a 2014 dashboard.

### Motion

```
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1)
--dur-fast:     120ms
--dur-base:     180ms
--dur-slow:     280ms
```

Framer Motion presets:

- `fadeUp`: opacity 0 → 1, y 8 → 0, duration `dur-base`, ease `ease-out`.
- `scaleIn`: opacity 0 → 1, scale 0.96 → 1, duration `dur-base`.
- `slideRight`: x 16 → 0, opacity 0 → 1 (drawer enter).

**Restraint rule:** no animation on data updates inside tables. Only on layout transitions (route, modal, drawer, accordion).

### Glassmorphism (used sparingly)

Reserved for **floating overlays** only: command palette, notification center, search dropdown.

```css
.glass {
  background: hsl(var(--bg-surface) / 0.72);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid hsl(var(--border-subtle) / 0.6);
}
```

Never on cards, never on the sidebar, never on the page background.

---

## 3. Layout Primitives

### AppShell (authenticated)

```
┌────────────────────────────────────────────────────────────────┐
│ Topbar (64px)                                                  │
├────────┬───────────────────────────────────────────────────────┤
│        │                                                       │
│  Side  │  PageHeader (sticky)                                  │
│  bar   │  ───────────────────────────────────────────────────  │
│ 240px  │                                                       │
│        │  Page content (max-w-screen-2xl, px-6, py-6)          │
│        │                                                       │
│        │                                                       │
└────────┴───────────────────────────────────────────────────────┘
```

- Sidebar: collapsible to 64px (icon-only). State in Zustand, persisted to localStorage.
- Topbar: tenant switcher (if user belongs to multiple), global search, notifications, user menu.
- PageHeader: breadcrumbs, page title, primary action button, secondary actions overflow.

### AuthShell (unauthenticated)

Single centered card, 480px max width, on a `bg-canvas` page. Logo at top-left of the page (not card). Subtle product highlight panel on the right (≥1024px).

---

## 4. Reusable Engines (the system's heart)

Build these first. Every feature module consumes them. **No screen builds its own table.**

### 4.1 DynamicTable

Config-driven table, generic over row type. Wraps TanStack Table.

```ts
type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'badge'
  | 'avatar'
  | 'avatar-text'
  | 'tag-list'
  | 'boolean'
  | 'progress'
  | 'actions'
  | 'custom';

interface ColumnConfig<T> {
  key: keyof T | string;
  label: string;
  type: ColumnType;
  width?: number | 'auto';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  // Conditional cell render. Receives full row.
  condition?: (row: T) => boolean;
  // Override renderer for `type: 'custom'`.
  render?: (row: T) => React.ReactNode;
  // Format raw value before display.
  format?: (value: any, row: T) => string;
  // Hide based on permission or role.
  permission?: string;
}

interface DynamicTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  loading?: boolean;
  error?: Error | null;
  emptyState?: { title: string; description?: string; action?: React.ReactNode };
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  selection?: { mode: 'single' | 'multi'; onChange: (rows: T[]) => void };
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  virtualized?: boolean; // auto-on when data.length > 100
  density?: 'comfortable' | 'compact';
  stickyHeader?: boolean;
}
```

**Usage:**

```tsx
const columns: ColumnConfig<Employee>[] = [
  { key: 'employeeCode', label: 'ID', type: 'text', width: 100 },
  { key: 'name', label: 'Employee', type: 'avatar-text', sortable: true },
  { key: 'department', label: 'Dept', type: 'text', filterable: true },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    condition: (r) => r.status !== 'inactive', // hide cell for inactive
  },
  { key: 'joinedAt', label: 'Joined', type: 'date', sortable: true },
  {
    key: 'actions',
    label: '',
    type: 'actions',
    permission: 'employees:write',
  },
];

<DynamicTable columns={columns} data={employees} pagination={pagination} />;
```

**Built-in behaviors:**

- Loading: skeleton rows matching column count.
- Empty: shows `emptyState` config.
- Error: shows `ErrorState` with retry.
- Virtualization: auto-enabled above 100 rows.
- Column visibility: user can hide/show; persisted per-user per-table in localStorage.
- Density toggle in table toolbar.
- CSV / Excel export button (calls server endpoint).

### 4.2 DynamicForm

Generic schema-driven form. Reads a Zod schema + a field config array.

```ts
interface FieldConfig {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'textarea'
    | 'select'
    | 'multi-select'
    | 'combobox'
    | 'date'
    | 'date-range'
    | 'time'
    | 'datetime'
    | 'checkbox'
    | 'switch'
    | 'radio-group'
    | 'file'
    | 'rich-text'
    | 'currency'
    | 'phone'
    | 'avatar'
    | 'custom';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean | ((values: any) => boolean);
  hidden?: boolean | ((values: any) => boolean); // conditional rendering
  options?: { label: string; value: string }[] | ((values: any) => Promise<Option[]>);
  permission?: string;
  // Layout
  colSpan?: 1 | 2 | 3 | 4 | 6 | 12; // 12-col grid
  // Custom render for type: 'custom'
  render?: (field: ControllerRenderProps, methods: UseFormReturn) => React.ReactNode;
}

interface DynamicFormProps<TSchema extends ZodSchema> {
  schema: TSchema;
  sections: { title?: string; description?: string; fields: FieldConfig[] }[];
  defaultValues?: Partial<z.infer<TSchema>>;
  onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
  submitLabel?: string;
  cancelHref?: string;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}
```

**Key behaviors:**

- Async options (e.g. department dropdown) are fetched and cached via React Query.
- `disabled` and `hidden` accept functions — enables conditional UI without manual `watch()` plumbing.
- Submit is debounced against double-clicks; button shows spinner while pending.
- Errors from the server (422 with field-level details) are mapped back to RHF errors.

### 4.3 FilterEngine

Generic filter bar bound to URL search params (via `nuqs`). Filters survive reload and are shareable as links.

```ts
interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'text' | 'boolean';
  options?: Option[] | (() => Promise<Option[]>);
}

<FilterEngine
  filters={[
    { key: 'department', label: 'Department', type: 'multi-select', options: fetchDepartments },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { key: 'joinedAt', label: 'Joined', type: 'date-range' },
  ]}
  onChange={(values) => /* values is typed */}
/>
```

Behaviors: clear-all chip, applied filter chips with x to remove, "Save view" → stores filter set as a named view per user.

### 4.4 ModalEngine & DrawerEngine

Imperative + declarative API. Most teams pick one and regret it; offer both.

```ts
// Declarative
<Modal open={open} onClose={...} title="..." size="md" footer={...}>...</Modal>

// Imperative
const { openModal } = useModal();
openModal({
  title: 'Delete employee?',
  description: 'This action is irreversible.',
  size: 'sm',
  variant: 'danger',
  confirmLabel: 'Delete',
  onConfirm: async () => { await mutate(); },
});
```

Sizes: `sm (400)`, `md (560)`, `lg (760)`, `xl (960)`, `full`. Drawer sides: `right` (default), `left`. Focus is trapped; ESC closes; scroll is locked on body.

### 4.5 ChartEngine

Wraps Recharts. Config-driven so dashboards are JSON-configurable.

```ts
interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'stacked-bar';
  data: any[];
  xKey: string;
  series: { key: string; label: string; color?: string; stack?: string }[];
  height?: number;
  legend?: boolean;
  tooltip?: boolean;
  emptyState?: React.ReactNode;
}
```

All charts share: consistent palette, consistent tooltip style, axis number formatting, locale-aware date formatting.

### 4.6 PermissionWrapper

```tsx
<PermissionWrapper permission="employees:write" fallback={null}>
  <Button>Add Employee</Button>
</PermissionWrapper>

<PermissionWrapper anyOf={['leave:approve', 'leave:manage']}>
  <ApproveButton />
</PermissionWrapper>
```

Pulls user abilities from `useAuth()`. Never use this as a security boundary — it's a UI affordance only.

### 4.7 StatsCard

```tsx
<StatsCard
  label="Total Employees"
  value={1240}
  delta={{ value: 12, direction: 'up', period: 'vs last month' }}
  icon={<Users />}
  loading={isLoading}
  href="/employees"
/>
```

Built-in skeleton when `loading`. Click navigates if `href`. Delta chip is semantic-colored.

### 4.8 Standard state components

Every list / detail screen composes these:

| Component              | Use                                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| `<Skeleton />`         | Loading state. Match the shape of the content, not a generic spinner.    |
| `<EmptyState />`       | Title, description, illustration, primary action.                        |
| `<ErrorState />`       | Title, message, retry button, request ID for support.                    |
| `<ConfirmDialog />`    | Destructive actions. Requires the user to acknowledge consequence.       |
| `<ActivityTimeline />` | Audit log view per entity.                                               |
| `<FileUploader />`     | Drag-drop, multi-file, presigned-S3 upload, progress, virus-scan status. |
| `<PageHeader />`       | Breadcrumb + title + actions. Sticky.                                    |

---

## 5. Component Contracts (rules every component obeys)

1. **Loading, empty, error, success — all four states must be designed.** A component that doesn't handle one of these is incomplete, not "good enough for now."
2. **Props are typed with generics where the component is reusable across data shapes.** No `any`. No `unknown` unless deliberate.
3. **Accessibility:** every interactive element is keyboard-reachable, has a focus ring, has an accessible name. Color is never the only signal of state.
4. **Themability:** components consume tokens via CSS variables. No hex codes inline.
5. **No business logic inside presentational components.** A `DynamicTable` doesn't know what an "employee" is. A `EmployeeTable` wraps `DynamicTable` with column config.
6. **Composable, not configurable past a point.** When a config object grows beyond ~8 props, expose `slots` / `render` props instead.

---

## 6. Form Patterns

### Validation

```ts
// packages/types/src/schemas/employee.schema.ts
export const employeeCreateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  employeeCode: z.string().min(2).max(20),
  departmentId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  joinedAt: z.coerce.date(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
});
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
```

Same schema is imported by:

- The frontend form via `zodResolver(employeeCreateSchema)`.
- The backend controller via a `ZodValidationPipe(employeeCreateSchema)`.

There is no way for them to drift. If you change the schema, the build fails on whichever side is out of date.

### Server error mapping

Backend 422 errors are returned as:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "email", "message": "Email already in use" }]
  }
}
```

The form mutation handler maps these to `form.setError(field, { message })`.

---

## 7. Notification System

| Channel           | Component                          | Use                                                               |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Toast (transient) | `<Toaster />` (Sonner)             | Confirmation of an action; auto-dismiss 4s.                       |
| In-app inbox      | `<NotificationCenter />` in topbar | Persistent: approvals waiting, documents expiring, system alerts. |
| Email             | Server-side via templates          | Account creation, password reset, leave decisions.                |

Toast variants: `success`, `error`, `warning`, `info`. Always include the action being confirmed in past tense: "Employee created", not "Success".

---

## 8. Iconography

- Library: Lucide React. One icon family for the entire app — no mixing.
- Sizes: 14, 16, 18, 20, 24 (px). Default 16 inline, 20 in buttons.
- Color: always inherits text color via `currentColor`. Never set fill directly.

---

## 9. Accessibility Baseline

- WCAG 2.1 AA contrast for all text/background pairs (4.5:1 body, 3:1 large).
- All form fields have associated `<label>`; placeholder is never the label.
- Focus visible on every interactive element (3px ring at 25% opacity of focus token).
- Modals trap focus; ESC closes; first focusable element receives focus on open.
- Tables: header cells have `scope`; sortable headers announce sort state via `aria-sort`.
- Toasts: `role="status"` for info, `role="alert"` for errors.
- Motion: respect `prefers-reduced-motion` — disable non-essential transitions.

---

## 10. Dark Mode

- Toggle in user menu. Persisted to user profile (server) so it follows them across devices.
- Implementation: `data-theme="dark"` on `<html>`, CSS variables swap.
- Avoid `dark:` Tailwind variants for component styles — they couple light and dark in JSX. Tokens handle it.
- Test every screen in both modes. Most bugs hide in dark mode (low-contrast borders, transparent icons over light overlays).

---

## 11. Configuration-Driven UI — The Discipline

The temptation is to over-configure. The other temptation is to under-configure and duplicate.

**Rule:** Build the third instance of a pattern as an engine. Not the first. Not the second. The third.

- First employee table → write it directly with TanStack Table.
- First department table → notice the duplication.
- Third table (attendance) → extract `DynamicTable`. Now refactor the first two into it.

Premature engines are worse than duplication. They lock in the wrong abstraction. The spec says "engines first" — interpret that as "engines before screen #5", not "engines before screen #1."

---

## 12. Visual References (style North Star)

- **Linear** — color restraint, density, motion discipline.
- **Vercel dashboard** — typography, command palette, empty states.
- **Stripe dashboard** — table density, filter UX, data visualization.
- **Notion** — sidebar nav, modal patterns.

Avoid: SAP, Workday Classic, Oracle Fusion. They're the cautionary tale for what "enterprise" used to mean.

---

## 13. Definition of Done for a Screen

Before marking a screen complete:

- [ ] Renders correctly at 1280, 1440, 1920 px widths.
- [ ] Renders acceptably at 768 px (tablet) — desktop-first, but tablet must work.
- [ ] Light and dark mode both verified.
- [ ] Keyboard navigation works for every action.
- [ ] Loading, empty, error, success states all designed and implemented.
- [ ] Permissions gate all sensitive actions.
- [ ] All API calls handle 401, 403, 422, 500.
- [ ] Lighthouse a11y score ≥ 95.
- [ ] No console errors or React warnings.
- [ ] Storybook story exists for every shared component.
