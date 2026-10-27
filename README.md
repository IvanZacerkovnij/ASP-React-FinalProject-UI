# Threads frontend

React and TypeScript application built with Vite. The supported Chirp features
from the source checkout are integrated into feature modules using TanStack Query.
See [the migration report](docs/migration/remaining-migration.md) for completed
batches, API decisions, verification, and backend limitations, and
[the source mapping](docs/migration/source-to-target.md) for module locations.
Authentication contracts and session handling are documented in
`src/features/auth/README.md`.

## Development

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Use `.env.example` as the configuration reference. Set `VITE_PATH_TO_SERVER` to
the absolute HTTP(S) backend URL and `VITE_PATH_TO_API` to its API prefix (for
example, `api/`). Both are required and validated at application startup.
The centralized `src/shared/config/env.ts` combines them, normalizes slashes,
and avoids repeating the API prefix if the server URL already includes it.
It also validates numeric limits and preserves feature flags: only the literal
`false` disables a feature. Optional identity and numeric settings retain the
template defaults; an empty Google client ID disables Google sign-in.

Vite reads `.env`, `.env.local`, and mode-specific files such as
`.env.production.local`; deployment variables can also be supplied by CI before
building. Restart the development server or rebuild after changes. All `VITE_`
values are public build-time configuration. Never put signing keys, credentials,
or API secrets in them. Local environment files are ignored by Git; keep only
safe example values in `.env.example`. Tests disable environment-file loading.
Run `npm run build`, `npm run lint`, and `npm run test` before review.
Production hosting must serve `index.html` for frontend route URLs.

## Styling

Tailwind CSS is integrated through the Vite plugin. Use utility classes directly
in JSX. Global styles and CSS-based theme customization belong in
`src/app/styles/global.css`. Keep custom base and component styles in their
respective layers so Tailwind utilities can override them.

## Structure and dependencies

- `src/app`: entry composition, providers, query client, route configuration, global styles.
- `src/pages`: route components composing widgets and features.
- `src/widgets`: reusable UI compositions, including the application layout.
- `src/features`: domain modules; see its README for implementation rules.
- `src/shared`: domain-independent HTTP transport and environment configuration.

Dependencies flow from app to pages, widgets, features, and shared. Pages compose
widgets and features; widgets compose features and shared. Shared must never
import from higher layers. Features must never import app, pages, or widgets.
Use explicit file imports within modules and avoid broad barrel files. Add UI,
hooks, types, schemas, or utilities only when actual implementations need them.

## API integration

Use `api` from `src/shared/api/client.ts` inside feature API modules. Methods take
an existing backend path beginning with `/` and options including `body`,
`headers`, and `signal`. Supply the response type as a generic argument; this
is a compile-time contract, not runtime validation. JSON and FormData uploads
are supported, along with text and empty responses. Upload requests leave
multipart boundary generation to the browser.

`ApiError` exposes normalized `message`, HTTP `status`, original response
`details` (including ASP.NET validation errors), and the underlying `cause`.
Problem Details responses use `detail` or `title`. Cancellation remains an abort
instead of being converted to a network error.

The HTTP client retains its credentials/header configuration and now accepts an
injected authentication adapter. AuthProvider connects bearer authentication,
coordinated token refresh, session checks, and unauthorized cleanup. Shared
transport never imports authentication features. The configured API base URL
includes `VITE_PATH_TO_API`; auth adapters append paths such as `/auth/login`.
Mock mode is disabled: `VITE_USE_MOCK` is ignored and `env.useMock` is always
`false`. The application always uses the backend; the legacy `VITE_MOCK_USER_ROLE`
setting does not affect backend authentication or authorization.

Authentication uses the ASP.NET Core JSON token contract. With Web Locks,
credentials persist in one localStorage record and refresh/revocation is
serialized across tabs. Without Web Locks, credentials use sessionStorage and
refresh is coordinated within the tab. Tokens are never query data. Browser
storage remains JavaScript-readable; the backend does not implement token cookies.
Set the optional `VITE_GOOGLE_CLIENT_ID` to enable Google Identity Services;
configure the matching origin/client ID with Google and the backend.

## State ownership

React Query owns fetched server data, caching, retries, and mutation lifecycles.
The provider creates one query client per mounted application. Queries stay
fresh for 30 seconds; client errors are not retried, and other failures retry
at most twice. Mutations do not automatically retry.

Keep feature query hooks and keys inside their feature. Forward query abort
signals and invalidate related keys after successful mutations. Keep transient
UI state local; add shared client providers only when a concrete consumer needs
them. Authentication integration must clear private query data on logout or
identity changes.
