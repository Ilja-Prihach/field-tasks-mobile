# Field Tasks MVP

Candidate code: `SA-RN-4827`

Expo + React Native + TypeScript MVP for the SalesAutomators RN test task. The app is built for stable Android review and covers task CRUD, validation, offline persistence, local history, local notifications, map markers, theme switching and mock sync with `json-server`.

## Main Features

- Create and edit tasks with required title, description, due date/time, address, status and optional image attachments.
- Keep the location flow simple for the reviewer: manual address entry plus preset map coordinates, without exposing raw coordinates in the normal UI.
- Validate forms with `react-hook-form` + `zod` and show visible user-facing errors.
- View task list with empty state, sorting by `createdAt`, `dueDate`, `status` and task sync status.
- Open task details with full data, attachment preview, location, history, status updates and delete action.
- Assign tasks to one of three mock users, switch the active user in Settings and keep the acting user's name in task history.
- Persist tasks, sync queue, history and theme locally with `AsyncStorage`.
- Work offline for create/edit/delete/view and sync changes later when connectivity returns.
- Schedule local notifications 30 minutes before deadline with fallback scheduling and 45-second demo mode.
- Show tasks on a map using manual coordinates, without paid APIs or external geocoding.
- Toggle light/dark theme in Settings and view About info with candidate code.

## Stack

- Expo SDK 57
- React Native 0.86
- TypeScript
- React Navigation
- Zustand
- AsyncStorage
- React Hook Form + Zod
- expo-image-picker
- expo-notifications
- @react-native-community/netinfo
- react-native-maps
- json-server

## Project Structure

```text
docs/
  architecture.puml
  task-lifecycle.puml
  sync-flow.puml

src/
  app/
  screens/
  components/
  features/
    location/
    notifications/
    sync/
    users/
  storage/
  api/
  theme/
  utils/
  types/
```

## Architecture Diagrams

- [docs/architecture.puml](docs/architecture.puml) - high-level module and dependency overview.
- [docs/task-lifecycle.puml](docs/task-lifecycle.puml) - how task creation/update flows through validation, persistence, notifications and sync.
- [docs/sync-flow.puml](docs/sync-flow.puml) - offline-first sync rules and server interaction.

## Install And Run

Install once:

```bash
npm install
cp .env.example .env
npx expo prebuild
```

For simulator development, use three terminals:

```bash
# Terminal 1: mock API
npm run server

# Terminal 2: Metro for the native development build
npx expo start --dev-client -c

# Terminal 3: choose one platform
npm run android
npm run ios
```

Run only one command from the final two lines at a time. Both simulators can stay installed and connect to the same Metro process.

For Android emulator, use:

```bash
EXPO_PUBLIC_API_BASE_URL_ANDROID=http://10.0.2.2:3001
```

For iOS simulator, use:

```bash
EXPO_PUBLIC_API_BASE_URL_IOS=http://localhost:3001
```

The committed `.env.example` already contains both simulator values. Do not set the shared `EXPO_PUBLIC_API_BASE_URL` for simulator work because Android and iOS require different hostnames.

For a physical device, point the matching platform variable to your machine LAN IP, for example:

```bash
EXPO_PUBLIC_API_BASE_URL_ANDROID=http://192.168.0.20:3001
EXPO_PUBLIC_API_BASE_URL_IOS=http://192.168.0.20:3001
```

## Mock Server

The project uses `json-server` with [data/db.json](data/db.json).

Run it with:

```bash
npm run server
```

Default endpoint:

```text
GET    /tasks
GET    /tasks/:id
POST   /tasks
PUT    /tasks/:id
DELETE /tasks/:id
```

Only one process should listen on port `3001`. If Android reports an HTML response instead of JSON, check for a port conflict with `lsof -nP -iTCP:3001 -sTCP:LISTEN`, stop the unrelated process and restart `npm run server`.

## Architecture Notes

### Storage

- Zustand store persists `tasks`, `history`, `pendingChanges`, sorting and settings to `AsyncStorage`.
- The app remains usable after restart without network.
- Task history is global and filterable by `taskId` on the details screen.
- Mock users are local reference data. A task stores creator and assignee snapshots, while each user action stores the actor ID and name so previous history remains stable after switching users.

### Sync

- Offline changes are queued as simple `upsert` or `delete` operations.
- When online, the app pushes pending changes to `json-server`.
- Sync resolution is endpoint-based:
  - new local task -> `POST /tasks`
  - existing remote task -> `PUT /tasks/:serverId`
  - delete missing remote task -> treated as already synced
- `json-server` 1.x generates its own ID on `POST`. The app keeps a stable local task ID for navigation/history and persists the returned server ID for later `PUT` and `DELETE` requests. A `clientId` field reconnects the two sides after restart.
- Conflict strategy is **last write wins**: the latest local update overwrites older server state.
- Remote tasks are merged back only when there is no local pending change for the same task.
- Repeated identical sync errors for the same unchanged pending operation are deduplicated in local history to avoid log spam.
- Manual sync from Settings shows a compact success/failure summary instead of silently flipping internal flags.
- Manual sync also pulls remote records even when the local queue is empty; automatic sync runs after hydration, network restoration and every new local mutation.

### Notifications

- Reminder target is 30 minutes before task deadline.
- If the deadline is already too close, the app schedules a 60-second fallback reminder instead of silently failing.
- Demo mode in Settings force-schedules the same reminder flow in 45 seconds for video verification, regardless of the actual due time.

### Map / Location

- Manual address input is required; coordinates are resolved only after an explicit map search or quick-location selection.
- The form can search Russian or English city/street addresses through the free OpenStreetMap Nominatim service. A city-only query resolves to its center; failed searches show a validation error instead of silently using stale coordinates.
- Minsk, Riga and Warsaw presets are available to speed up testing and provide a predictable fallback when geocoding is unavailable.
- Coordinates are kept internal for map placement; normal task screens focus on address and map preview instead of raw latitude/longitude.
- iOS renders markers with `react-native-maps` and MapKit. Android renders the OpenStreetMap-based CARTO basemap with an in-app marker overlay because native Google Maps requires an external API key, which this assignment intentionally avoids.

### State Management

- UI state and business state are kept in one small Zustand store for simplicity.
- Notification scheduling and mock sync stay in separate service modules.

## Android APK Build

For a debug APK used with the local Metro server:

```bash
cd android
./gradlew app:assembleDebug
```

The verified debug APK output is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Build this file before running `adb install`; otherwise ADB will report that the APK was not found. For a standalone review build that does not depend on Metro:

```bash
npx expo prebuild -p android
cd android
NODE_ENV=production ./gradlew app:assembleRelease
```

Expected APK output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

If you prefer a cloud build, `eas build -p android` is also possible, but it requires Expo account setup.

## Verification Commands

```bash
npm run typecheck
npm test -- --runInBand
```

## Known Limitations

- Dynamic address search requires internet access and depends on the public Nominatim service. Minsk, Riga and Warsaw remain available as deterministic fallback locations.
- Android map tiles require an internet connection, while tasks, addresses and marker coordinates remain available offline.
- Sync is intentionally simple and optimized for assignment scope, not for multi-user collaboration.
- Attachment files rely on local device URIs; if the underlying file is removed by the OS/user, the app handles the missing preview gracefully but cannot restore the asset.
- Local notification scheduling is implemented on both platforms, but exact delivery timing is controlled by the operating system and should be verified with the 45-second demo mode in a development or release build.
- Test coverage is intentionally focused on critical logic paths: store mutations, task form validation, sync behavior and notification scheduling.

## Video Demo Checklist

- Show the app Settings/About screen with candidate code `SA-RN-4827`.
- Mention candidate code `SA-RN-4827` verbally or visually in the video.
- Demonstrate demo notification mode from Settings.
- Show online/offline sync status and map marker flow.

## AI Usage Disclosure

AI assistance was used for implementation acceleration, code drafting and iterative cleanup. All architectural choices, integration decisions and final code review were validated manually during implementation.
