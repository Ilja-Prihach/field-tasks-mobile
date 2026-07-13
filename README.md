# Field Tasks MVP

Candidate code: `SA-RN-4827`

Expo + React Native + TypeScript MVP for the SalesAutomators RN test task. The app is built for stable Android review and covers task CRUD, validation, offline persistence, local history, local notifications, map markers, theme switching and mock sync with `json-server`.

## Main Features

- Create and edit tasks with required title, description, due date/time, address, status and optional image attachments.
- Validate forms with `react-hook-form` + `zod` and show visible user-facing errors.
- View task list with empty state, sorting by `createdAt`, `dueDate`, `status` and task sync status.
- Open task details with full data, attachment preview, location, history, status updates and delete action.
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
src/
  app/
  screens/
  components/
  features/
    attachments/
    history/
    location/
    notifications/
    sync/
    tasks/
  storage/
  api/
  theme/
  utils/
  types/
```

## Install And Run

```bash
npm install
cp .env.example .env
npm run server
```

In another terminal:

```bash
npm start
```

For Android emulator, the default API URL already points to `http://10.0.2.2:3001`.

For a physical Android device, set `EXPO_PUBLIC_API_BASE_URL` to your machine LAN IP, for example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.20:3001
```

## Mock Server

The project uses `json-server` with [data/db.json](/Users/ilja_prihach/Desktop/RN_test_task/data/db.json).

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

## Architecture Notes

### Storage

- Zustand store persists `tasks`, `history`, `pendingChanges`, sorting and settings to `AsyncStorage`.
- The app remains usable after restart without network.
- Task history is global and filterable by `taskId` on the details screen.

### Sync

- Offline changes are queued as simple `upsert` or `delete` operations.
- When online, the app pushes pending changes to `json-server`.
- Conflict strategy is **last write wins**: the latest local update overwrites older server state.
- Remote tasks are merged back only when there is no local pending change for the same task.

### Notifications

- Reminder target is 30 minutes before task deadline.
- If the deadline is already too close, the app schedules a 60-second fallback reminder instead of silently failing.
- Demo mode in Settings force-schedules the same reminder flow in 45 seconds for video verification, regardless of the actual due time.

### Map / Location

- No geocoding is used.
- The user enters manual address text and manual coordinates.
- Preset locations are available to speed up testing and ensure visible map markers.

### State Management

- UI state and business state are kept in one small Zustand store for simplicity.
- Notification scheduling and mock sync stay in separate service modules.

## Android APK Build

One practical local path for review builds:

```bash
npx expo prebuild -p android
cd android
./gradlew assembleRelease
```

Expected APK output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

If you prefer a cloud build, `eas build -p android` is also possible, but it requires Expo account setup.

## Verification Commands

```bash
npm run typecheck
```

## Known Limitations

- Coordinates are entered manually because external geocoding is intentionally not used.
- Sync is intentionally simple and optimized for assignment scope, not for multi-user collaboration.
- Attachment files rely on local device URIs; if the underlying file is removed by the OS/user, the app handles the missing preview gracefully but cannot restore the asset.
- Local notifications were implemented for Android-focused review; behavior on iOS was not the target.
- No automated tests were added in this MVP to keep focus on required runtime functionality.

## Video Demo Checklist

- Show the app Settings/About screen with candidate code `SA-RN-4827`.
- Mention candidate code `SA-RN-4827` verbally or visually in the video.
- Demonstrate demo notification mode from Settings.
- Show online/offline sync status and map marker flow.

## AI Usage Disclosure

AI assistance was used for implementation acceleration, code drafting and iterative cleanup. All architectural choices, integration decisions and final code review were validated manually during implementation.
