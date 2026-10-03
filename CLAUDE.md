# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository (`apps/admin` and `apps/client`).

It follows the conventions of the SOT-MONOREPO: the code-style rules below are carried over from it unchanged. What differs is the MVP's infrastructure — there is **no Clerk and no database yet**. Both are stand-ins kept behind the same seams the real ones will use, so swapping them in later touches `db/index.ts` and `apps/*/src/lib/server/auth.ts`, nothing else.

## What This System Is

An ERP for a telecom fiber contractor that builds sites for **Mobily** and **STC**. The four specification documents it implements are summarised in `docs/` — read the one for the area you touch:

- `docs/mobily-workflow.md` — Mobily project cycle: design → PO → mobilization → permits → implementation → PAT → site HO → permit HO → remedy → PCR/SDN → RFS/PAC/FAC certificates → invoices → PO closure.
- `docs/stc-workflow.md` — STC's stage cycle: Design → M2 Permit → M3 Implementation/RFS → M4 → M5 → Dashboard.
- `docs/procurement-warehouse-custody.md` — purchase requests, RFQs, POs, receiving, issuing, transfers, stocktakes, write-offs, cash and asset custody.
- `docs/finance.md` — supplier invoices (AP), subcontractor extracts, customer invoices, project budgets, monthly closing.
- `docs/tasks.md` — task management (not from the four documents): giving, seeing, working, handing in and reviewing tasks.

Every numbered "system rule" in those documents is enforced in `packages/services`, and each one has a test in `packages/services/src/**/*.test.ts` that names it.

## Monorepo Architecture

This is a pnpm + Turborepo monorepo built on Next.js 16.

**Apps**

- `apps/admin` — Next.js app for internal staff (the ERP): projects, procurement, warehouse, custody, finance. Runs on `localhost:3001`.
- `apps/client` — a placeholder Next.js app on the same packages and theme, with no screens yet. The four specifications describe an internal system only, so every workflow lives in `apps/admin`; the client app is kept so a later phase (a customer or subcontractor portal) has its home. Runs on `localhost:3000`. Do not add business screens to it unless asked.

**Packages**

- `packages/services` — all business logic lives here as plain, framework-agnostic async functions. No `"use server"`, no request/response objects, and no framework imports — that is why `next/cache` cannot be used here, so revalidation happens in the app layer. Every operation (approve a PR, receive a certificate, post an extract) exists as exactly one function here. It is also the only place the store in `db/` is imported: nothing outside services reads or writes data directly.
- Business **rules** (gates such as "PAC cannot be requested before RFS is received") are pure functions in `packages/services/src/rules/`, so they can be tested without the store and shown in the UI as the reason a button is disabled. A mutation always re-checks the rule itself — the UI hint is a courtesy, never the gate.
- `packages/validators` — zod schemas shared between Server Actions and forms so input validation never drifts.
- `packages/utils` — framework-agnostic helpers (formatters, dates, `generateUuid`) imported from `"utils"`. Browser code imports this, so nothing server-only may go here.
- `packages/ui` — shared React components (`Button`, `Dropdown`, `Input`, `StatusPill`, `DashboardSidebar`, …) used by both apps.

The data layer lives in the repo-root `db/` folder, not in a package — services import it by relative path (`../../../db`). Apps may import `db/enum.ts` and `db/label.ts` (through the `@/db/*` path alias) for option lists and labels, and nothing else from `db/`.

**Calling convention**

- Server Actions (`"use server"`) are the only way admin and client call into services. They stay thin: resolve the caller, validate input, call exactly one `packages/services` function, revalidate, return the result. No business logic inside an action.
- `admin` and `client` never call each other over HTTP — they each import `packages/services` directly.

**Data store (MVP — stands in for MySQL + Drizzle)**

- `db/types.ts` is the schema: one exported type per table. `db/index.ts` keeps every table in one JSON file, `.data/store.json` at the repo root (gitignored), created from `db/seed.ts` the first time it is read. Every process that reads it sees the same data.
- Read with `readStore()`; write only through `transact((store) => …)`, which re-reads the file, applies the change and writes it back atomically. Never hold a store object across an `await` and write it later.
- `pnpm db:reset` (or Settings → Reset demo data in the admin) rebuilds the file from the seed.
- Tests run against an in-memory store (`ERP_DATA_FILE=:memory:`), set in `vitest.config.ts`.

**Auth (MVP — stands in for Clerk)**

- There is no sign-in and no password. The acting user is chosen from the user menu in the navbar and kept in the `erp_user` cookie, read through `apps/admin/src/lib/server/auth.ts` — the one file Clerk will replace. With no cookie, the app acts as the system admin.
- The menu lists the admin and the employees; the other roles fold away under "Other roles", there only so a demo can walk an approval chain.
- Roles still matter: approval chains are enforced in services against the actor's `role`. Switching user is how a demo walks a request through its chain.
- Two kinds of user see two different apps. The **admin** sees every module, all tasks and the team's workload, and has no "My tasks". An **employee** (role `employee`, created with their account on the New employee page) sees only their own dashboard and tasks. `rules/access.ts` (`accessRedirect`) says which pages each may open; the dashboard layout enforces it, from the path `proxy.ts` hands it in a header.

**Hard rules**

- No business logic inside a Server Action or a component — only in `packages/services`.
- No data access from client components or anywhere outside `packages/services`.
- Every state change writes an entry to the activity log through `logActivity` inside the same `transact` call.

## Package Manager

- Always use `pnpm` for installing dependencies and running scripts in this repo — never `npm` or `yarn`. (`npm install <pkg>` → `pnpm add <pkg>`, `npm run <script>` → `pnpm <script>`.)

## Testing

- `pnpm test` runs vitest over `**/*.test.ts`. Rules get a test each, written so that removing the rule makes it fail.
- Service tests use the in-memory store and call `resetStore()` in a `beforeEach`; they never touch `.data/store.json`.

## React

- Never use namespace-qualified React types like `React.ReactNode`, `React.FC`, `React.MouseEvent`, etc.
  Always import the specific type directly from `react`.

  ```tsx
  // ❌ Bad
  const foo: React.ReactNode = null;
  const handler: React.MouseEventHandler = () => {};

  // ✅ Good
  import type { ReactNode, MouseEventHandler } from "react";
  const foo: ReactNode = null;
  const handler: MouseEventHandler = () => {};
  ```

## Components & Functions

- Never use named function declarations. Always use arrow functions.
- When a component or function body is only a `return`, use the implicit arrow return — no curly braces, no `return` keyword. If the returned JSX spans multiple lines, wrap it in `()` instead of using `{ return ... }`.

  ```tsx
  // ❌ Bad
  function MyComponent() {
    return <div>Hello</div>;
  }

  // ❌ Also bad
  const MyComponent = () => {
    return <div>Hello</div>;
  };

  // ❌ Also bad — braces + return for multi-line JSX
  const MyComponent = () => {
    return (
      <div>
        <span>Hello</span>
      </div>
    );
  };

  // ✅ Good (single-line)
  const MyComponent = () => <div>Hello</div>;

  // ✅ Good (multi-line — parens instead of braces + return)
  const MyComponent = () => (
    <div>
      <span>Hello</span>
    </div>
  );
  ```

## Props

- Never define props inline. Always declare a named type above the component.
- All types in a file always live together at the top, above every function/component in that file — not interleaved as one type directly above each function. Where a file holds several declarations, group all their types first, then all the code. (The example below shows the grouping on two components for contrast only — a file holds one component; see One Component Per File.)

  ```tsx
  // ❌ Bad
  const Button = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => <button onClick={onClick}>{label}</button>;

  // ❌ Bad — type placed directly above each function, interleaved
  type ButtonProps = {
    label: string;
    onClick: () => void;
  };

  const Button = ({ label, onClick }: ButtonProps) => (
    <button onClick={onClick}>{label}</button>
  );

  type CardProps = {
    title: string;
  };

  const Card = ({ title }: CardProps) => <div>{title}</div>;

  // ✅ Good — all types grouped together above all components
  type ButtonProps = {
    label: string;
    onClick: () => void;
  };

  type CardProps = {
    title: string;
  };

  const Button = ({ label, onClick }: ButtonProps) => (
    <button onClick={onClick}>{label}</button>
  );

  const Card = ({ title }: CardProps) => <div>{title}</div>;
  ```

## Icons

- Never use inline `<svg>` elements for icons. Always use [`lucide-react`](https://lucide.dev) instead.

  ```tsx
  // ❌ Bad
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="..." stroke="currentColor" />
  </svg>;

  // ✅ Good
  import { Layers } from "lucide-react";
  <Layers size={24} />;
  ```

## Images

- Never use a plain `<img>` tag. Always use `Image` from `next/image` instead.
- Never put a background behind an image — no `bg-white` (or any `bg-*`) plate, box or padded frame around a photo, logo or thumbnail. The image sits directly on the surface it is placed on.

## Dropdowns

- Never use a native `<select>` element. Always use the `Dropdown` component from `@/components/ui/dropdown` instead.

  ```tsx
  // ❌ Bad
  <select {...register("parentUuid")}>
    <option value="">No parent</option>
  </select>;

  // ✅ Good
  import { Dropdown } from "@/components/ui/dropdown";

  <Controller
    control={control}
    name="parentUuid"
    render={({ field }) => (
      <Dropdown
        value={field.value}
        onChange={field.onChange}
        placeholder="No parent"
        options={[{ value: "", label: "No parent" }]}
      />
    )}
  />;
  ```

## Navigation

- Never use a plain `<a>` tag for in-app navigation. Always use `Link` from `next/link` instead.

  ```tsx
  // ❌ Bad
  <a href="/products">Products</a>;

  // ✅ Good
  import Link from "next/link";
  <Link href="/products">Products</Link>;
  ```

- Never navigate imperatively with `useRouter().push()` inside an `onClick` for what is really just a link. Use `Link`. Reserve `useRouter().push()` for navigation that can't be expressed as a link (e.g. after some async work). For a whole clickable element (like a card) that also contains its own buttons, use a stretched `Link` overlay (`absolute inset-0`) plus `relative z-10` on the inner buttons — don't nest a `<button>` inside the `Link`.

  ```tsx
  // ❌ Bad — imperative navigation for a plain link
  const openProduct = (slug: string) => router.push(`/products/${slug}`);
  <article role="button" onClick={() => openProduct(slug)}>
    ...
  </article>;

  // ✅ Good — stretched Link overlay, buttons sit above it
  <article className="relative">
    <Link
      href={`/products/${slug}`}
      aria-label={`View ${name}`}
      className="absolute inset-0"
    />
    <button type="button" onClick={addToCart} className="relative z-10">
      Add
    </button>
  </article>;
  ```

## Linting

- Never disable a lint rule (`eslint-disable`, `eslint-disable-next-line`, etc.) to make a warning or error go away. Fix the underlying code so it satisfies the rule instead.

  ```tsx
  // ❌ Bad
  // eslint-disable-next-line @next/next/no-img-element
  <img src={category.image} alt={category.name} />;

  // ✅ Good — use the tool the rule is steering you toward
  import Image from "next/image";
  <Image src={category.image} alt={category.name} width={40} height={40} />;
  ```

## Tailwind CSS

- Never use arbitrary value syntax for spacing, sizing, or typography when a built-in Tailwind scale exists. Always prefer Tailwind's design tokens.

  ```tsx
  // ❌ Bad
  <p className="text-[22px] mt-[12px] w-[300px]" />

  // ✅ Good
  <p className="text-2xl mt-3 w-72" />
  ```

- Never use arbitrary letter-spacing values like `tracking-[-0.012em]`. Always use the built-in `tracking-*` scale (`tracking-tighter`, `tracking-tight`, `tracking-normal`, `tracking-wide`, etc.).

  ```tsx
  // ❌ Bad
  <h1 className="tracking-[-0.012em]" />

  // ✅ Good
  <h1 className="tracking-tight" />
  ```

- Never use a gradient. No `bg-gradient-to-*`, no `bg-linear-to-*`, no
  `bg-[radial-gradient(...)]`, no `linear-gradient` in an inline style, and no
  gradient-clipped text. Backgrounds and text are flat colour.

  This is not a taste preference, it is the reason the portal looked cheap: a
  gradient behind a button, another behind the headline and a coloured wash
  standing in for every missing photograph meant three things competing to be
  the emphatic one, so none of them was. Flat colour plus a hairline is what
  separates one surface from another.

  ```tsx
  // ❌ Bad
  <div className="bg-gradient-to-r from-amber-400 to-amber-700" />
  <h1 className="text-accent-gradient">Heading</h1>
  <div className="bg-[radial-gradient(circle,rgba(185,146,83,0.35),transparent)]" />
  <div style={{ background: "linear-gradient(135deg, #1a1510, #4a3a1c)" }} />

  // ✅ Good
  <div className="bg-primary-solid" />
  <h1 className="text-ink">Heading</h1>
  <div className="bg-surface-2" />
  ```

- Never use a shadow to separate a surface from the page — use a hairline
  border. `shadow-*` is reserved for something that genuinely floats above the
  page (a menu, a modal, a drawer), and even then it is one restrained value.
  A card that needs a shadow to be seen is a card whose border is missing.

- Text on the primary colour (`bg-primary`) is always `text-white` — never `text-sot-ink`, `text-ink` or any dark text, and not in the disabled or pending state either ("Placing order…"). A disabled button dims as a whole (`disabled:opacity-70`); it does not swap its text to a dark colour.

- Never use the `truncate` class. Handle overflowing text another way (e.g. `line-clamp-*`, or let it wrap).

  ```tsx
  // ❌ Bad
  <p className="truncate" />

  // ✅ Good
  <p className="line-clamp-1" />
  ```

- Never use a weight above medium — not `font-semibold`, `font-bold`, `font-extrabold` or `font-black`, and not their `fontWeight: "600"`/`"700"` equivalents in an inline style or a Clerk `appearance` object. Text is `font-normal`, and `font-medium` is the whole of the emphasis vocabulary. Where medium is not enough separation, get it from size, colour or spacing instead of weight.

  ```tsx
  // ❌ Bad
  <h3 className="font-bold" />
  <h3 className="font-semibold" />
  <span className="font-extrabold" />

  // ✅ Good
  <h3 className="font-medium" />
  <span className="font-medium" />

  // ✅ Good — emphasis without weight
  <h3 className="text-lg text-ink" />
  ```

## Exports

- Regular components use **named exports** — inline on the declaration is fine, just never `export default`.
- Only Next.js pages and layouts use `export default`, and it must be written at the **bottom** of the file, never inline.

  ```tsx
  // ❌ Bad — default export on a regular component
  export default const Card = () => <div />

  // ❌ Bad — default export on a regular component
  export default Card

  // ✅ Good — inline named export on a regular component
  export const Card = () => <div />

  // ✅ Good — page/layout with default export at the bottom
  const DashboardPage = () => (
    <main>...</main>
  )

  export default DashboardPage
  ```

## TypeScript

- Never use the non-null assertion operator (`!`). Always handle the missing case explicitly by throwing an error or returning early.
- Never use the `any` type. Use the actual type, `unknown` with a narrowing check, or a generic instead.
- Never write `type` on the import when the thing being imported is already exported as a type. The `export type` at its definition is what says it is a type; repeating it on every import is the same fact written twice, and the second copy is the one that goes stale.

  ```ts
  // ❌ Bad — `type` on the import of something already exported as a type
  import type { BoqListItem } from "services";
  import { type TableColumn, Table } from "ui";

  // ✅ Good — the export already said so
  import { BoqListItem } from "services";
  import { TableColumn, Table } from "ui";
  ```

  ```ts
  // ❌ Bad
  const value = process.env.API_KEY!;

  // ✅ Good
  const value = process.env.API_KEY;
  if (!value) throw new Error("Missing required environment variable: API_KEY");
  ```

  ```ts
  // ❌ Bad
  const parseData = (data: any) => data.value;

  // ✅ Good
  const parseData = (data: unknown) => {
    if (typeof data !== "object" || data === null || !("value" in data)) {
      throw new Error("Invalid data shape");
    }
    return data.value;
  };
  ```

## Type Placement

- Every `type` in a file lives in one block at the top, directly under the imports and above all the code. This holds for **every** file, not just components — services, actions, hooks, validators, tests. No type may appear below a function, a `const`, or any other statement, even when it is only used by the function right beneath it.
- A re-export of a type (`export type { SelectProducts };`) belongs in that same top block.
- Keep the doc comment with its type when moving it up; the comment explains the type, not the position.

  ```ts
  // ❌ Bad — a type sitting below code because that's where it's used
  const productSummaryColumns = () => {
    // ...
  };

  export type AdminProductFilters = ListParams & {
    categoryUuid?: string;
  };

  export const getProductsPage = async (params: AdminProductFilters = {}) => {
    // ...
  };

  // ✅ Good — every type first, then every function
  export type AdminProductFilters = ListParams & {
    categoryUuid?: string;
  };

  /** Just enough of a product to name it in a picker. */
  export type ProductPickerItem = {
    uuid: SelectProducts["uuid"];
    name: SelectProducts["name"];
  };

  const productSummaryColumns = () => {
    // ...
  };

  export const getProductsPage = async (params: AdminProductFilters = {}) => {
    // ...
  };
  ```

## Control Flow

- Never write a brace-less `if`. Every `if` (and `else`) body must be wrapped in `{}`, even when it's a single statement on its own line or an early `return`/`throw`.

  ```ts
  // ❌ Bad — brace-less single-statement if
  if (!boq) throw new Error("BOQ not found");

  // ❌ Also bad — brace-less early return
  if (!first) return null;

  // ✅ Good
  if (!boq) {
    throw new Error("BOQ not found");
  }

  if (!first) {
    return null;
  }
  ```

## Next.js Server Actions

- Always use Next.js Server Actions for data mutations and queries. Never create a new route handler (route.ts) to duplicate something a Server Action could do.
- If a route handler already exists for an operation (e.g. file upload/download), reuse it from the client (`fetch`) instead of writing a parallel Server Action that does the same thing.
- Server Actions should be defined in `actions.ts` files within feature directories.
- All Server Actions must have the `"use server"` directive at the top of the file.
- Always perform redirects on the server, inside the Server Action itself, using `redirect` from `next/navigation`. Never redirect on the client (e.g. via `router.push` after checking `state.success`).

  ```ts
  // ❌ Bad — using route handlers
  // app/api/addresses/route.ts
  export async function POST(request: Request) {
    const data = await request.json();
    // ...
  }

  // ✅ Good — using Server Actions
  // app/(dashboard)/addresses/actions.ts
  ("use server");

  export const createAddress = async (
    _prevState: ActionResult,
    data: CreateAddressInput,
  ): Promise<ActionResult> => {
    // ...
  };
  ```

  ```ts
  // ❌ Bad — a new Server Action that duplicates an existing route handler
  // app/(dashboard)/categories/action.ts
  ("use server");

  export const uploadCategoryImage = async (formData: FormData) => {
    // ... same upload logic app/api/documents/upload/route.ts already does
  };

  // ✅ Good — reuse the existing route handler from the client
  // app/api/documents/upload/route.ts already exists, so call it directly
  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });
  ```

  ```ts
  // ❌ Bad — redirecting on the client after a successful action
  const [state, dispatch, isPending] = useActionState(createAddress, {});

  useEffect(() => {
    if (state.success) router.push("/addresses");
  }, [state.success]);

  // ✅ Good — redirecting on the server, inside the action
  // app/(dashboard)/addresses/actions.ts
  ("use server");

  import { redirect } from "next/navigation";

  export const createAddress = async (
    _prevState: ActionResult,
    data: CreateAddressInput,
  ): Promise<ActionResult> => {
    // ... perform mutation
    redirect("/addresses");
  };
  ```

## Auth Checks

- Never resolve the caller from a `page.tsx`. A page is layout — it decides what the screen looks like, not who may see it. The caller is resolved where the data is reached: the Server Action (through `runAction`, which calls `requireStaff()`), which passes the actor into the service. Services check roles against that actor; an action never decides by itself whether a role may do something.

## Dynamic Route Params

- Page components for dynamic routes always type `params` as a `Promise` and `await` it to read the route values — never destructure `params` directly as a plain object.

  ```tsx
  // ❌ Bad
  type Props = {
    params: { uuid: string };
  };

  const CategoryEditPage = ({ params }: Props) => {
    const { uuid } = params;
    // ...
  };

  // ✅ Good
  type Props = {
    params: Promise<{ uuid: string }>;
  };

  const CategoryEditPage = async ({ params }: Props) => {
    const { uuid } = await params;
    // ...
  };
  ```

## Loading UI

- Never add route-level `loading.tsx` files. Show loading state with `<Suspense>` boundaries **inside** the page instead, wrapping only the async, data-dependent part (the table/list), with a static skeleton as the `fallback`.
- Give the `<Suspense>` a `key` derived from the relevant search params (e.g. `` key={`${search}-${page}`} ``) so changing the search/filter/page re-shows the fallback while the new data streams in — the fast, param-independent chrome (heading, toolbar, filters) stays mounted and outside the boundary.
- Move the param-dependent data fetch into a small async child component that the boundary wraps; the page component itself only awaits `searchParams` and renders the chrome + the boundary.
- Pair the `<Suspense>` with an error boundary so a thrown fetch shows a retry UI instead of erroring the whole route. In `apps/admin`, use the shared `<AsyncSection reloadKey={...}>` which bundles the keyed Suspense (skeleton fallback) and the error boundary (retry fallback) together — pass the async child as its children.

  ```tsx
  // ❌ Bad — app/(dashboard)/products/loading.tsx
  const Loading = () => <TableSkeleton />;
  export default Loading;

  // ✅ Good — Suspense inside the page, keyed on the params
  const ProductsList = async ({ search, page }: ProductsListProps) => {
    const result = await getProductsPage({ search, page });
    return (
      <>
        <ProductsTable products={result.items} />
        <Pagination {...result} />
      </>
    );
  };

  const ProductsPage = async ({ searchParams }: Props) => {
    const { search, page } = await searchParams;
    return (
      <div>
        <ListSearch placeholder="Search products..." />
        <Suspense key={`${search}-${page}`} fallback={<TableSkeleton />}>
          <ProductsList search={search} page={page} />
        </Suspense>
      </div>
    );
  };
  ```

## Forms: A Page Or A Dialog

- A **large form gets its own page**. Large means more than four fields, or any repeatable lines (`LinesField`). `BankFields` counts as the fields it shows (method, account, cheque number, cheque date). The route is `…/new` for a new record, or `…/[uuid]/<verb>` for an action on one record (`/procurement/orders/[uuid]/receive`). The list or detail page links to it — the `PageHeader` `action`, or a `Link` styled as a button — and the form's Server Action `redirect`s back when it has saved.
- A **small form opens in a dialog** — four fields or fewer, no lines. It sits behind a button where the form would otherwise be, through `FormDialog` (`components/shared/form-dialog.tsx`), with the form component as its child. The form needs no wiring of its own: `ActionForm` closes the dialog once its action succeeds.
- Never put a form inline in a page body — not a card holding a form under a table, not a form at the foot of a detail page. An action with no fields at all stays a single `ActionButton`; a filter or a search is navigation, not a form.
- What is created together is entered together: one record, one form. An employee and their account are one form, not an employee form and an account form.

  ```tsx
  // ❌ Bad — a large form inline, under the list
  <EmployeesTable employees={employees} />
  <Card title="Add an employee">
    <EmployeeForm projects={projects} />
  </Card>

  // ✅ Good — the list links to the form's own page
  <PageHeader title="Employees" action={{ href: "/payroll/employees/new", label: "New employee" }} />

  // ❌ Bad — a small form sitting open on a detail page
  <Card title="Settlement">
    <SettleForm action={settleAction} amount={custody.amount} />
  </Card>

  // ✅ Good — a button opens it in a dialog
  <FormDialog label="Settle custody" title="Settle custody" description="What was spent against receipts">
    <SettleForm action={settleAction} amount={custody.amount} />
  </FormDialog>
  ```

## Form Submissions

- Always use `useActionState` from `react` when a form submits to a server action.
- Always pair it with `react-hook-form` and `zodResolver` for client-side validation.
- Call `dispatch(validatedData)` inside `handleSubmit` — never call the server action directly.
- Use `isPending` to disable the submit button and `state.error` to display server errors. Redirects on success happen inside the Server Action itself (see Server Actions above) — don't branch on `state.success` to redirect from the client.

  ```tsx
  // ❌ Bad — calling server action directly
  const onSubmit = handleSubmit(async (data) => {
    await createAddress({}, data);
  });

  // ✅ Good — routing through useActionState
  const [state, dispatch, isPending] = useActionState(createAddress, {});

  const { handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    dispatch(data);
  });
  ```

- All of that lives in a custom hook, not in the component — see Logic Lives In A Hook below. The snippet above shows the calling convention; the file it belongs in is `use-<thing>-form.ts`.

## Logic Lives In A Hook

- A component renders. Anything it has to **work out** before it can render — `useActionState`, `useForm`, derived values, submit handlers, effects, fetches, anything holding state that another part of the app can see — lives in a custom hook. What is left in the component is the destructuring of that hook and the `return`.
- This is about where a reader has to look. Logic above the markup means somebody after the layout scrolls through forty lines of form wiring to reach the first tag, and somebody after the behaviour reads the whole of the JSX to find out it was in the middle. Split, each is the only thing in its file.
- The hook file is named after what it does — `use-account-form.ts`, `use-compatibility.ts` — kebab-case file, camelCase export, and it carries `"use client"` of its own.
- It lives in that route's own folder in `app/`, beside the `page.tsx` and `actions.ts` it belongs to (see Folder Structure). Never in `components/`, never in a top-level `hooks/`. Two exceptions, neither of which has one route to sit beside: a hook serving a component in `packages/ui` sits beside that component in the package; a hook for a component the whole app uses — a widget in the header, a wrapper around a third-party script — goes in that app's `src/lib/`.
- Return the form object **whole**, plus whatever the markup branches on: `{ form, state, isPending, onSubmit }`. The component pulls the pieces out of it, so adding a field to the hook never changes the hook's signature.

  ```tsx
  // ❌ Bad — the screen's behaviour, in the file about the screen's appearance
  export const AccountForm = ({ user }: AccountFormProps) => {
    const [state, dispatch, isPending] = useActionState(saveAccount, {});
    const type = user.type ?? "individual";
    const { register, handleSubmit, formState: { errors } } = useForm<AccountInput>({
      resolver: zodResolver(accountSchema),
      defaultValues: { type, firstName: user.firstName ?? "" /* … */ },
    });
    const onSubmit = handleSubmit((values) => {
      startTransition(() => dispatch(values));
    });

    return <form onSubmit={onSubmit}>…</form>;
  };

  // ✅ Good — app/(portal)/account/use-account-form.ts
  export const useAccountForm = (user: AuthUser) => {
    // … the same code, and nothing else in the file
    return { form, state, isPending, onSubmit, type };
  };

  // ✅ Good — components/account/account-form.tsx
  export const AccountForm = ({ user }: AccountFormProps) => {
    const {
      form: {
        register,
        formState: { errors },
      },
      state,
      isPending,
      onSubmit,
      type,
    } = useAccountForm(user);

    return <form onSubmit={onSubmit}>…</form>;
  };
  ```

**What stays in the component**, because a hook around it is a file to open for nothing:

- State that is only about appearance and is read nowhere else — an open/closed panel, a hovered row, which tab is showing — where the only writer is a one-line handler.
- Field-level `react-hook-form` wiring inside a component that renders that one field: `useFormContext`, a `useFieldArray` whose rows are the component's own markup. There the wiring **is** the component. The form that calls `useForm` is the one that gets the hook.
- A single `useActionState` on a component that is one button, where the whole of the logic is `dispatch(id)`.

  ```tsx
  // ✅ Fine as it stands — the state is the disclosure and nothing else sees it
  const [open, setOpen] = useState(false);

  // ✅ Fine as it stands — a field renderer's own wiring
  const { control, register } = useFormContext();
  const rows = useFieldArray({ control, name: path });
  ```

## Enums

- Never use TypeScript's `enum`. Always define enums as a `const` array typed with `as const satisfies readonly string[]`, and derive the union type from it with `(typeof arr)[number]`.
- Never define an enum inline inside a database schema file (e.g. inline in the array argument to `mysqlEnum(...)`). Define it in `db/enum.ts` and import the const array into the schema file instead.
- All enums for the app live together in the single `db/enum.ts` file — not scattered across one-file-per-enum.
- Labels never live in `enum.ts`. All label maps live together in the single `db/label.ts` file instead, each exported as a `Record<EnumType, string>`.
- Shared JSON-column shape types (e.g. `SpecField`, `SpecOption`) live in `db/types.ts` and are imported by the schema files via a relative path (e.g. `../types`) rather than redefined inline.

  ```ts
  // ✅ Good — db/enum.ts
  export const productStatuses = [
    "draft",
    "published",
    "archived",
  ] as const satisfies readonly string[];

  export type ProductStatus = (typeof productStatuses)[number];
  ```

  ```ts
  // ✅ Good — db/label.ts
  import { ProductStatus } from "./enum";

  export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  ```

  ```ts
  // ❌ Bad — enum defined inline in the schema file
  // db/schema/products.ts
  status: mysqlEnum("status", ["draft", "published", "archived"]);

  // ✅ Good — import the const array from db/enum.ts
  // db/schema/products.ts
  import { productStatuses } from "../enum";

  status: mysqlEnum("status", productStatuses);
  ```

## Folder Structure

- The `actions.ts` file for a page always lives inside that page's own route folder in `app/`, next to its `page.tsx` — never in a separate top-level actions directory.
- Zod validation schemas and custom hooks for a page also live inside that same route folder in `app/`, next to `page.tsx` and `actions.ts` — not in `components/`, not in a top-level `hooks/` or `schemas/` directory.
- Components never live inside `app/`. All components live under a top-level `components/` folder, grouped into a subfolder named after the page/feature they belong to.

  ```
  // ✅ Good
  app/
    products/
      page.tsx
      actions.ts
      validation.ts (zod schema)
      hooks.ts

  components/
    products/
      product-card.tsx
      product-filters.tsx
  ```

  ```
  // ❌ Bad — components colocated inside app/, validation/hooks pulled out to top-level folders
  app/
    products/
      page.tsx
      actions.ts
      product-card.tsx
      product-filters.tsx

  schemas/
    products.ts

  hooks/
    use-products.ts
  ```

## One Component Per File

- A file holds exactly one component — the one it is named for. Never define a second component beside it, however small, and never inside a `page.tsx` or `layout.tsx`: a page file holds the page and nothing else.
- This includes the async, data-fetching child a `<Suspense>`/`<AsyncSection>` boundary wraps. It is a component like any other, so it lives in `components/<feature>/` and the page imports it.

  ```tsx
  // ❌ Bad — a second component defined in the page file
  // app/(dashboard)/expert-desk/page.tsx
  const Queues = async () => {
    const [designHelp, documentReview] = await Promise.all([...]);
    return <div>...</div>;
  };

  const ExpertDeskPage = () => (
    <AsyncSection reloadKey="expert-desk">
      <Queues />
    </AsyncSection>
  );

  export default ExpertDeskPage;

  // ✅ Good — the child moves to its own file, the page imports it
  // components/expert-desk/queues.tsx
  export const Queues = async () => {
    const [designHelp, documentReview] = await Promise.all([...]);
    return <div>...</div>;
  };

  // app/(dashboard)/expert-desk/page.tsx
  import { Queues } from "@/components/expert-desk/queues";

  const ExpertDeskPage = () => (
    <AsyncSection reloadKey="expert-desk">
      <Queues />
    </AsyncSection>
  );

  export default ExpertDeskPage;
  ```

## Helpers

- Reusable helper/utility functions (formatters, parsers, URL builders, etc.) must never be defined inline at the top of a component file. Import them instead.
- Framework-agnostic helpers shared across apps (formatters like `formatMoney`/`formatPrice`, `slugify`, `generateUuid`, etc.) live in the shared `packages/utils` package and are imported from `"utils"`. This is the single home for cross-app helpers — do not re-add a per-app `src/lib/helpers.ts` that duplicates them.
- Only helpers that are genuinely specific to one app **and** tied to that app's transport/runtime (e.g. `apps/api`'s request/auth helpers that import `next/server`) stay in that app's `src/lib/*.ts`. Never put `next/server`-bound or otherwise app-specific code into `packages/utils`, since that package is imported by browser (client) code too.

  ```tsx
  // ❌ Bad — helper defined inline in the component file
  const formatPrice = (price: string, currency: string | null) =>
    `${currency ?? "SAR"} ${Number(price).toLocaleString("en-US")}`;

  export const ProductCard = ({ product }: ProductCardProps) => (
    <span>{formatPrice(product.price, product.currency)}</span>
  );

  // ❌ Also bad — re-defining a shared helper in a per-app src/lib/helpers.ts
  // apps/client/src/lib/helpers.ts
  export const formatPrice = (price: string, currency: string | null): string =>
    `${currency ?? "SAR"} ${Number(price).toLocaleString("en-US")}`;

  // ✅ Good — shared helper lives in packages/utils, imported from "utils"
  // packages/utils/src/index.ts
  export const formatPrice = (price: string, currency: string | null): string =>
    `${currency ?? "SAR"} ${Number(price).toLocaleString("en-US")}`;

  // product-card.tsx
  import { formatPrice } from "utils";

  export const ProductCard = ({ product }: ProductCardProps) => (
    <span>{formatPrice(product.price, product.currency)}</span>
  );
  ```

## File Naming

- All file names are always kebab-case, regardless of what's exported from them (components, hooks, schemas, etc.) — never PascalCase or camelCase file names.

  ```
  // ❌ Bad
  LocationForm.tsx
  useProducts.ts

  // ✅ Good
  location-form.tsx
  use-products.ts
  ```

## Data Schema

- `db/types.ts` is the only description of the data. Every table is an exported `type` named in PascalCase singular (`Project`, `PurchaseOrder`) and stored under a PascalCase plural key on `Store` (`Projects`, `PurchaseOrders`).
- Never add SQL files, migration folders or a second description of the data. When the MVP moves to MySQL, `db/types.ts` becomes `db/schema/` and the `Select*` types replace these one for one.
- Never modify `db/index.ts` (the store) beyond what the user asks — it is the seam the real database replaces.

## Service DTO Types

- Service DTO/list/detail types derive every field that maps to a stored field from the table's type — via indexed access (`Project["code"]`), `Pick`, or `Omit` — never hand-typed. Only genuinely computed values (sums, counts, derived stages, due dates) may be plain types.

  ```ts
  // ❌ Bad — stored fields re-typed by hand
  export type ProjectRow = { code: string; operator: "mobily" | "stc"; stageLabel: string };

  // ✅ Good — stored fields derived, computed ones plain
  export type ProjectRow = Pick<Project, "uuid" | "code" | "operator"> & {
    stageLabel: string; // derived from the workflow, no field backs it
  };
  ```
