# Purchase History date filtering

Purchase History opens with **All dates** and **Newest first**. Choose one calendar day to view its receipts, or use **Clear date** to restore all receipts without changing the sort order. Applying or cancelling the picker is explicit; draft changes do not reload the list.

Dates and receipt timestamps on this screen use Philippine time (`Asia/Manila`). Native picker values are converted using device-local calendar fields, preserving the date the user selected even when the device timezone differs from the shop timezone. The server interprets that calendar date as a Philippine business day.

## API

`GET /api/sales?date=2026-10-20&sort=newest`

- `date` is optional. When present, it must be a real calendar date in `YYYY-MM-DD` form.
- `sort` accepts `newest` (default) or `oldest`. Timestamp ties use receipt ID in the same direction.
- Empty, repeated, object-valued, or invalid date/sort parameters return HTTP 400.
- Omitting both parameters retains the existing response: an array of sale summaries, newest first.
- The selected date becomes an inclusive UTC start and exclusive UTC end. Filtering and sorting reuse the existing sale timestamp index; no migration is required.
- The receipt detail endpoint is unchanged.

List fetching is isolated in `usePurchaseHistory`. Requests are cancelled on filter changes or blur; late responses are ignored. Changing filters hides the old results immediately. A failed same-filter refresh retains its results with an error notice and retry control. Filters stay selected while the screen remains mounted, including when reopening it from the drawer.

## Picker dependency

Native date selection uses the SDK-compatible `@expo/ui/community/datetime-picker`, installed through `npx expo install @expo/ui`. Android uses a native confirmation dialog. iOS uses a spinner inside an Apply/Cancel modal. The web component uses a browser date input and does not import native picker code.

Existing development builds need to be rebuilt with `@expo/ui` before testing the native picker. No generated native project files are edited by hand.

## Checks

```sh
npm test --prefix backend
npm run test:history
npm run test:frontend
npm run lint
npm run typecheck
npm run typecheck:backend
```

The frontend date tests use Node's TypeScript stripping support (Node 22.13+ with the supplied flag), with the same minimum Node version required by Expo SDK 57. They check device-local picker conversions in Philippine, Los Angeles, and Kiritimati timezones, plus Philippine midnight boundaries.

Interface checks should cover applying and cancelling dates, empty days, sorting, clearing dates while preserving order, opening receipts, refresh/retry, rapid changes during a delayed request, and 320/375-pixel layouts. Run native picker checks in a development build containing the module; JavaScript bundle exports alone do not verify native dialogs.
