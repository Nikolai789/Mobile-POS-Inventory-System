# Mobile POS and Inventory System

Members
John Nikolai Camarillo<
>
Yoren Angelo Infante< 
>
Jethro Estelloso

An Expo SDK 57 application for product inventory, barcode lookup, cash checkout, receipts, and shop analytics. The React Native app supports Android, iOS, and web. Its Express API stores data with sql.js.

## Local setup

Use Node.js 22.13 or later; CI uses Node.js 24. Install both projects with their lockfiles:

```sh
npm ci
npm ci --prefix backend
```

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to the complete `/api` URL reachable from your device. For a physical phone, use your computer's LAN IP. An Android emulator commonly uses `http://10.0.2.2:5000/api`; a browser on the same computer can use `http://localhost:5000/api`. Restart Expo after changing the value.

Start the API and Expo in separate terminals:

```sh
npm start --prefix backend
npm start
```

The API defaults to port `5000`; set `PORT` to change it. `DATABASE_PATH` defaults to `backend/pos.sqlite`. Use a separate database path for experiments. Importing `backend/app.js` or `backend/server.js` does not start the server or initialize the database.

Native camera and date selection require a development build containing the configured modules. Follow [Expo's development build documentation](https://docs.expo.dev/develop/development-builds/introduction/). Configure native behavior through Expo configuration and plugins.

## Project layout

```text
src/app/                 Expo Router routes and drawer layout
src/features/            dashboard, catalog, checkout, history, analytics
src/shared/              API transport and clients, hooks, receipts, utilities, theme
shared/contracts.ts      Type-only HTTP contracts for frontend and backend
backend/                 Express routes, controllers, services, database infrastructure
tests/                   Frontend unit/integration and cross-timezone date tests
backend/test/            Backend integration and database regression tests
docs/                    Architecture and feature behavior
```

Screens compose views and feature hooks. Shared frontend code does not depend on features. Backend services own business rules and SQL; controllers translate HTTP requests and responses. See [architecture](docs/architecture.md), [analytics](docs/analytics.md), and [purchase history](docs/purchase-history.md).

## Quality checks

```sh
npm run check
```

This runs repository-wide lint, strict frontend TypeScript, checked backend JavaScript, frontend tests, backend tests, and date tests in multiple timezones. Tests use mocked HTTP or temporary databases, never the shop database.

Individual commands are `npm run lint`, `npm run typecheck`, `npm run typecheck:backend`, `npm run test:frontend`, `npm run test:backend`, and `npm run test:history`. Use `npx expo export --platform all` to check Android, iOS, and web bundling. The GitHub workflow runs these checks on pushes and pull requests.

Install new application or testing dependencies with `npx expo install <package>` (add `--dev` for development tools) so Expo can select SDK-compatible versions. Keep both package lockfiles committed.

## Device acceptance checks

After automated checks, use development builds on Android and iOS and the web app to check:

- All six drawer destinations and returning to a screen with its filters intact.
- Inventory search, paging, create/edit, archiving, restoration with fresh stock, and permitted permanent deletion.
- Camera permission denial, barcode lookup, scan-next, and closing a scanner during lookup.
- Cart quantities, cash, change, rapid finalize taps, lost-connection retries, and stock/price conflicts.
- Cash input visibility with the native keyboard open.
- Receipt loading/closing, date Apply/Cancel, sorting, and clearing the date.
- Analytics periods, chart interaction, refresh, foreground return, and Philippine midnight.
- Narrow 320/375-pixel layouts and long product names.

Bundle exports and mocked component tests do not verify real cameras, native dialogs, or operating-system keyboards.
