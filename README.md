<div align="center">

# FieldFlow

### Offline-first mobile task management for field teams

Create, assign, track, and synchronize field tasks across Android and iOS—even when the network is unavailable.

[![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443E38)](https://zustand.docs.pmnd.rs/)
[![Tests](https://img.shields.io/badge/Tests-18_passing-2E7D32)](#quality)

[Features](#features) · [Architecture](#architecture) · [Getting started](#getting-started) · [Roadmap](#roadmap)

</div>

## About

FieldFlow is a cross-platform operations app for teams working away from a desk. It keeps tasks, assignments, deadlines, locations, attachments, reminders, and audit history available locally, then synchronizes pending changes when connectivity returns.

The project focuses on the parts of mobile development that are easy to overlook in a simple CRUD demo: offline persistence, deterministic sync behavior, local notifications, device-aware API configuration, native maps, validation, and testable business logic.

## Features

- Create and edit tasks with title, description, deadline, address, status, assignee, and image attachments
- Work offline across create, update, delete, view, and history flows
- Persist tasks, settings, history, and the sync queue with AsyncStorage
- Synchronize queued operations automatically after network restoration
- Pull remote changes manually even when the local queue is empty
- Preserve stable local IDs while mapping records to server-generated IDs
- Assign tasks to team members and record the acting user in audit history
- Search and filter task history by task or event type
- Sort tasks by creation date, deadline, status, or synchronization state
- Schedule local deadline reminders with fallback timing
- Preview task locations on native maps
- Search addresses through OpenStreetMap Nominatim with deterministic location presets
- Attach images from the device gallery
- Switch between English and Russian
- Follow the system theme or use the in-app dark mode control

## Offline-first sync

```text
User action
    │
    ▼
Zustand store ──► AsyncStorage
    │                  │
    ├── task data      ├── survives app restarts
    ├── audit event    └── remains available offline
    └── pending change
            │
            ▼ when online
       Sync service ──► REST API / json-server
            │
            ├── POST new tasks
            ├── PUT existing tasks
            ├── DELETE removed tasks
            └── merge remote records without overwriting pending local work
```

The current conflict strategy is last-write-wins. Repeated failures for the same unchanged operation are deduplicated in history to avoid noisy logs.

## Architecture

```text
src/
├── app/                  # Navigation and application bootstrap
├── api/                  # Task API client and platform-aware base URL
├── components/           # Reusable UI building blocks
├── features/
│   ├── location/         # Geocoding and map behavior
│   ├── notifications/    # Reminder scheduling
│   ├── sync/             # Offline queue synchronization
│   └── users/            # Local team member selection
├── screens/              # Tasks, details, forms, map, history, settings
├── storage/              # Zustand store and AsyncStorage persistence
├── theme/                # Theme tokens and color hooks
├── types/                # Domain contracts
└── utils/                # Validation, translations, dates, task helpers
```

Detailed PlantUML diagrams:

- [System architecture](docs/architecture.puml)
- [Task lifecycle](docs/task-lifecycle.puml)
- [Synchronization flow](docs/sync-flow.puml)

## Tech stack

| Area | Technology |
| --- | --- |
| Mobile | Expo 57, React Native 0.86, React 19 |
| Language | TypeScript 6 |
| Navigation | React Navigation |
| State and persistence | Zustand, AsyncStorage |
| Forms and validation | React Hook Form, Zod |
| Native capabilities | Expo Notifications, Expo Image Picker, React Native Maps |
| Connectivity | NetInfo |
| Development API | json-server |
| Testing | Jest, React Native Testing Library |

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- Android Studio and/or Xcode
- CocoaPods for iOS development

### Installation

```bash
git clone https://github.com/Ilja-Prihach/field-tasks-mobile.git
cd field-tasks-mobile
npm install
cp .env.example .env
```

The default simulator configuration is:

```dotenv
EXPO_PUBLIC_API_BASE_URL_ANDROID=http://10.0.2.2:3001
EXPO_PUBLIC_API_BASE_URL_IOS=http://localhost:3001
```

Install iOS pods when running the native iOS project for the first time:

```bash
cd ios
pod install
cd ..
```

The native `ios/` and `android/` projects are tracked. Run Expo prebuild only when you intentionally want to regenerate them and review the resulting native diff.

### Run locally

Use separate terminals:

```bash
# Mock REST API
npm run server

# Metro bundler
npx expo start --dev-client -c

# Choose a platform
npm run android
npm run ios
```

For a physical device, replace the relevant API URL with the development machine's LAN address.

## Useful commands

```bash
npm run start       # Start Expo
npm run android     # Run the Android native project
npm run ios         # Run the iOS native project
npm run server      # Start json-server on port 3001
npm run typecheck   # Run TypeScript checks
npm test            # Run the Jest test suite
```

Build a standalone Android release APK locally:

```bash
cd android
NODE_ENV=production ./gradlew app:assembleRelease
```

Expected output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Quality

The automated suite currently covers the critical business paths:

- store mutations and persisted state behavior
- task form validation
- offline queue synchronization
- task and history utilities
- notification scheduling

Verification commands:

```bash
npm run typecheck
npm test -- --runInBand
cd android && ./gradlew app:compileDebugKotlin
```

## Roadmap

- [ ] Replace the development API with a production backend and authenticated user sessions
- [ ] Add organization workspaces, roles, and server-managed team members
- [ ] Introduce version-based conflict detection instead of last-write-wins
- [ ] Upload attachments to durable object storage
- [ ] Add remote push notifications and background synchronization
- [ ] Support recurring tasks and configurable reminder windows
- [ ] Add manager dashboards and operational analytics
- [ ] Publish signed Android and iOS preview builds
- [ ] Expand integration and end-to-end test coverage

## Known limitations

- `json-server` is a development backend and does not provide authentication or multi-user concurrency guarantees.
- Attachment paths point to files on the local device; removed files cannot be restored automatically.
- Dynamic address lookup requires network access, while preset locations remain available as a fallback.
- Android map tiles and iOS MapKit rendering depend on their respective external map services.
- Exact local notification delivery time remains subject to operating-system scheduling rules.

## Author

Built by [Ilja Prihach](https://github.com/Ilja-Prihach).

[LinkedIn](https://www.linkedin.com/in/ilya-prihach/) · [Telegram](https://t.me/Ilja_prihach)
