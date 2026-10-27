# Feature modules

Add a module when its implementation exists. Planned domains are auth, users,
profiles, posts, comments, likes, reposts, follows, bookmarks, polls, search,
and media. No backend contract is currently present in this checkout.

Each module owns its API functions, query keys, hooks, components, types, and
validation. Create only the directories it uses. Keep request paths and backend
DTOs inside the owning feature; use the shared HTTP client for transport.

Features may import shared code, but must not import app, pages, or widgets.
Prefer composition in pages or widgets over feature-to-feature imports. If a
cross-feature dependency is necessary, import an explicit public entry point;
never import another feature's internal implementation or create a cycle.

Keep React Query hooks and invalidation near the feature API. Pass the query
function's AbortSignal to the HTTP client. Scope keys by domain and include all
request parameters. Clear private cached data when the authenticated identity
changes. Use local React state for forms and transient UI; lift shared client
state only when multiple consumers need it. Do not copy query results into a
global client store.
