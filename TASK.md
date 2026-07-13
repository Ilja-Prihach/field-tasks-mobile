1st Mobile Task - React Native Intern
•

Last updated 6 days ago at 4:50 pm
Deadline: 48 hours from the moment you receive this assignment. Late submissions, even by 1 minute, are automatically rejected.

Imagine that our company is building an internal productivity tool for field employees who work outside the office. The application should help technicians create, plan, track, and review daily work tasks, including locations, attachments, status changes, and action history.

The goal of this assignment is to evaluate your ability to build a simple but functional React Native mobile application with clean structure, local persistence, basic offline behavior, and a user-friendly interface.

Required Technology
React Native. Expo or React Native CLI are both acceptable, but the final APK must be installable and testable.
TypeScript is required.
Local data storage is required. You may use AsyncStorage, SQLite, MMKV, WatermelonDB, or a similar local storage solution.
A mock REST server is required for synchronization. json-server is acceptable.
You may choose your own state management and UI libraries. Explain your choices in the README and email body.
Functional Requirements
Task Creation and Editing
Users must be able to create and edit tasks with the following fields:

Task title - required.
Task description - required.
Execution date and time / due date - required.
Location - required. Manual address input is required; optional coordinate selection is a plus.
Attachments - at least image attachment support is required; support for PDFs or other files is a plus.
Status - one of: New, In Progress, Completed, Cancelled.
Basic input validation and user-friendly error messages are required. The app must prevent saving incomplete or invalid tasks.

Task List, Sorting, and Details
Display a list of all created tasks with key details: title, due date/time, status, and location summary.
Allow sorting by date added, due date, and current status.
Allow opening a detailed view with the full task information, attachments, location, and history.
Allow deleting tasks that are no longer needed.
Show a clear empty state when no tasks exist.
Task Status Management
Allow users to update task status to In Progress, Completed, or Cancelled.
Every status change must be recorded in the task history log with a timestamp.
Completed and Cancelled tasks should remain visible unless deleted by the user.
Attachments
Allow the user to attach at least one image to a task.
Display attached files or images on the task detail screen.
Handle missing, deleted, or inaccessible attachments gracefully.
Store enough attachment metadata locally so that attachments remain visible after app restart when possible.
Push Notifications
Schedule a local push notification 30 minutes before the task due date/time.
If the due date/time is less than 30 minutes away, show a clear validation message or schedule the notification using a sensible fallback and explain the behavior in the README.
For the video demo, include a debug/demo mode that can trigger the same notification flow after 30-60 seconds, so we can verify the implementation without waiting 30 minutes.
Handle notification permissions and errors in a user-friendly way.
Location and Map
Users must be able to attach a location to a task. Manual address input is required.
Display tasks with locations as pins or markers on a map using react-native-maps or a similar solution.
The map screen should allow the reviewer to select or open a task from a marker.
Real geocoding is optional. If geocoding is not implemented, allow the user to manually enter coordinates or use a predefined dropdown of locations.
History Log
Maintain a log of task creation, edits, status updates, attachment changes, deletion, and sync events.
Each log item must include a timestamp, action type, and short description.
Display the log in a dedicated History tab or screen.
The log must persist locally after the app is closed and reopened.
Offline Support and Mock Synchronization
The app must work offline for creating, editing, viewing, and deleting tasks.
Tasks and logs must be stored locally and remain available after app restart.
When network connection is restored, the app should synchronize local changes with a mock REST server.
Use a clear sync status: for example Pending Sync, Synced, Sync Failed.
A simple json-server setup is enough. Include setup instructions and sample data in the repository.
Conflict resolution can be simple. If you choose a last-write-wins strategy, document it clearly.
UI/UX Requirements
The interface should be clean, modern, and easy to use for field employees.
Provide light and dark theme support with a visible toggle.
Use loading, empty, error, and success states where appropriate.
The app should be usable on a standard Android phone screen without clipped text or broken layouts.
Accessibility basics are expected: readable text size, clear button labels, and sufficient tap targets.
Candidate Code Requirement
Generate a unique code, for example: SA-RN-1234.

You must include this code in all three places:

In the app footer, About screen, or Settings screen.
In the README.md file.
In the video demonstration.
Submissions without the candidate code are considered incomplete. This helps us confirm that the submitted work was prepared specifically for this assignment.

Code Quality Requirements
Use meaningful variable, function, and file names.
Organize the project into clear folders, for example screens, components, services, storage, api, hooks, types, and utils.
Separate UI code from data access, storage, synchronization, and notification logic where reasonable.
Include basic error handling and edge-case handling.
Add comments only where they clarify non-obvious logic. Do not comment every line.
Keep secrets and API keys out of the repository. If a map key is required, document how to provide it through an environment file.
A meaningful commit history is expected. A repository with one final commit is acceptable only if the code quality is strong, but a clear commit history is preferred.
README Requirements
Project overview and main features.
Installation and run instructions.
APK build instructions or APK download link.
Mock server setup instructions, including how to run json-server or equivalent.
Short architecture explanation: storage, sync, notifications, map/location, and state management.
Known limitations and trade-offs.
AI/tooling disclosure: briefly mention whether you used AI assistants or code generators and what you used them for. AI usage is not automatically disqualifying; lack of understanding during review is.
Submission Requirements
Send the completed assignment to:

pavel@salesautomators.com
charles.n@salesautomators.com
Email subject: Mobile RN intern test task done - [Full Name]

Your email must include:

Full name.
CV as a PDF attachment.
A link to your resume/profile from the recruiting platform where you applied, for example LinkedIn, HH, SEEK, or another job portal.
A link to the GitHub repository or another source code repository. If private, invite the reviewers or provide access instructions.
A working APK file or a direct unrestricted Google Drive link to the APK.
A direct unrestricted Google Drive link to the video demonstration.
A short explanation of technologies and libraries used.
The reasoning behind your main technical choices.
Any important code, design, or feature details that deserve attention.
Video Demonstration Requirements
Record a 2-5 minute video. The video must be viewable without requesting access. The video should show:

The app installed and running from the APK or a release build.
Creating a task with title, description, due date/time, location, and an attachment.
Validation behavior when required fields are missing or invalid.
Task list, sorting, detail screen, status update, and delete flow.
Map screen with task markers.
Local notification flow. Use the 30-60 second demo mode if needed.
History tab with timestamps and task actions.
Offline behavior and sync status with the mock server.
Light/dark theme toggle.
A brief code walkthrough of one important module, for example sync service, local storage layer, notification scheduler, or map integration.
Scope Clarifications
Authentication is not required.
A production backend is not required.
Real-time collaboration is not required.
Real geocoding is optional.
Perfect UI design is not required, but the app must be clean, readable, and usable.
Unit tests are optional, but at least one small test for validation, storage, or sync logic is a plus.
Evaluation Criteria


Criterion

Weight

What we look for

Core functionality

25%

CRUD, statuses, sorting, details, deletion, validation.

Advanced functionality

25%

Attachments, notifications, map/location, history log, offline sync.

Code quality and architecture

20%

Clear structure, TypeScript types, separation of concerns, error handling.

UI/UX quality

15%

Clean layout, theme toggle, useful states, field-worker usability.

Submission quality

10%

README, video, APK, repository access, clear setup instructions.

Code understanding

5%

Ability to explain decisions and important implementation details in the video or follow-up interview.



Automatic Rejection Conditions
Submission is late.
APK is missing, cannot be installed, or crashes immediately on launch.
Video link is missing, private, or cannot be viewed.
Repository link is missing or inaccessible.
Candidate code is missing from the app, README, or video.
The project is clearly unrelated to the assignment or appears to be a generic template without meaningful adaptation.
The candidate cannot explain the main parts of the submitted code during a follow-up review.
Bonus Points
Search and filtering by title, status, or date range.
Basic unit tests for validation, storage, sync, or reducers.
Better sync conflict handling than last-write-wins.
Reusable UI components and polished animations used appropriately.
Support for multiple attachment types.
Better accessibility support and responsive layout handling.


We do not expect a perfect production-ready application in 48 hours. We do expect a working, understandable, and well-structured solution that demonstrates how you think, how you organize code, and how you handle practical mobile development trade-offs.

