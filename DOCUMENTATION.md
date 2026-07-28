# LearnMS — Full Application Documentation

LearnMS is a learning management system for teachers, assistants, students, and parents. It covers online course delivery with DRM video, offline center attendance, credit-based payments, assessments, and an Apple Rewards loyalty system.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Features by Role](#4-features-by-role)
5. [Feature Reference (All Modules)](#5-feature-reference-all-modules)
6. [Frontend Routes](#6-frontend-routes)
7. [API Reference](#7-api-reference)
8. [Domain Model](#8-domain-model)
9. [Business Rules](#9-business-rules)
10. [Integrations](#10-integrations)
11. [Setup & Deployment](#11-setup--deployment)
12. [Project Structure](#12-project-structure)

---



## 1. Overview


| Area         | Description                                 |
| ------------ | ------------------------------------------- |
| **Product**  | LearnMS — LMS + rewards platform            |
| **Users**    | Teacher, Assistant, Student, Parent         |
| **Frontend** | React (Vite) + Tailwind + shadcn/ui         |
| **Backend**  | ASP.NET Core 8 + EF Core + PostgreSQL 16    |
| **Hosting**  | API serves SPA; Docker Compose for API + DB |


**Core capabilities**

- Course / lecture / lesson catalog with publish controls
- Credit (LE) economy: generate, sell, redeem, purchase content
- DRM video lessons via VdoCipher
- Online quizzes & exams + offline homework/quiz grades
- Barcode attendance at physical centers
- Apple Rewards for students and assistants
- Parent progress portal
- Bilingual UI (Arabic / English, RTL)

---



## 2. Technology Stack



### Backend (`src/LearnMS.API`)


| Component  | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Runtime    | .NET 8                                                 |
| Database   | PostgreSQL 16 + EF Core                                |
| Auth       | Custom JWT Bearer + DeviceKey (students)               |
| Video DRM  | VdoCipher (upload policy, OTP playback, tus resumable) |
| Images     | ImgBB                                                  |
| Email      | SMTP (password reset)                                  |
| Logging    | Serilog                                                |
| Docs       | Swagger (Development)                                  |
| Containers | Docker + docker-compose                                |




### Frontend (`src/LearnMS.React`)


| Component | Technology                                  |
| --------- | ------------------------------------------- |
| Framework | React + Vite                                |
| Routing   | React Router                                |
| Data      | TanStack Query + Orval-generated API client |
| UI        | Tailwind CSS, Radix / shadcn                |
| State     | Zustand (modals, question drafts, assets)   |
| i18n      | i18next (`en` / `ar`, fallback `ar`)        |
| Barcode   | Quagga2                                     |
| Charts    | Recharts                                    |


---



## 3. User Roles & Permissions



### Roles


| Role          | Access                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Teacher**   | Full dashboard; bypasses assistant permission checks; can manage assistant rewards/payouts |
| **Assistant** | Dashboard filtered by assigned permissions                                                 |
| **Student**   | Public catalog + protected learning, payments, apple store; device-bound JWT               |
| **Parent**    | Separate login (student code + phones); progress dashboard only                            |




### Assistant permissions


| Permission                | What it unlocks                                                      |
| ------------------------- | -------------------------------------------------------------------- |
| `ViewStatistics`          | Statistics dashboard (UI); not enforced on most API stats routes     |
| `ManageLecture`           | Mark lectures as important                                           |
| `ManageCourses`           | Courses, lectures, lessons, quizzes, exams, centers, attendance scan |
| `ManageCreditCodes`       | Full credit-code management                                          |
| `GenerateCreditCodes`     | Generate / sell / export (own codes if no Manage)                    |
| `ManageFiles`             | Shared PDF library + question bank (UI)                              |
| `ManageAssistants`        | Assistants CRUD, permissions, incomes, claim                         |
| `ManageStudents`          | Students CRUD, credit, device unlink                                 |
| `ManageGrantedAccess`     | Grant free lecture access                                            |
| `ManageExpirationTime`    | Override lecture enrollment expiry                                   |
| `ManageStudentApples`     | Student apple scanner / adjustments                                  |
| `ManageAppleRewardsStore` | Apple store admin                                                    |


**Teacher-only UI:** Assistant rewards scanner, pay-all assistant rewards.  
**Assistant-only UI:** My Profile, My Rewards.

### Auth model

- **Staff & students:** `POST /api/auth/login` → JWT in `localStorage.token`; students must send matching `DeviceKey` header.
- **Parents:** `POST /api/parent/login` → `parentToken` (separate from main JWT).
- Unauthenticated students can browse published courses/lectures; exams, lessons, quizzes, payments, and apple store require login.

---



## 4. Features by Role



### Student


| Feature            | Capabilities                                                    |
| ------------------ | --------------------------------------------------------------- |
| **Landing / Home** | Marketing sections; when logged in: important & latest lectures |
| **Course catalog** | Browse by level; course detail with lectures & exams            |
| **Enroll / renew** | Buy course or individual lectures with credit balance           |
| **Lessons**        | Start / renew timed access; watch VdoCipher DRM video           |
| **Quizzes**        | Start timed attempt, submit, view results (per quiz settings)   |
| **Exams**          | Purchase / retake with credit; submit; review                   |
| **PDF assets**     | Open lecture attachments (Drive / uploaded files)               |
| **Homework video** | YouTube homework embed on lectures                              |
| **Payments**       | Redeem credit codes; request top-up via external Google Form    |
| **Apple Rewards**  | Browse store when open; order items; cancel for apple refund    |
| **Profile**        | Update info; view events, sessions, exams                       |
| **i18n**           | Switch Arabic / English                                         |




### Teacher


| Feature                     | Capabilities                                             |
| --------------------------- | -------------------------------------------------------- |
| **Statistics**              | Income-style analytics, lecture metrics, apple stats     |
| **Full content CMS**        | Courses → lectures → lessons / quizzes / exams           |
| **Video upload**            | VdoCipher policy / multipart / tus upload                |
| **Attendance**              | Barcode scan at selected center; roster; CSV export      |
| **Grades**                  | Offline homework/quiz scores; bulk import; essay grading |
| **Credit codes**            | Generate, sell, export                                   |
| **Students**                | Search, create, edit, add credit/apples, unlink device   |
| **Assistants**              | Create, set permissions, pay rewards, session scanner    |
| **Apple store admin**       | Schedule, catalog, orders, export                        |
| **Granted access / expiry** | Free enrollments and custom expiration                   |




### Assistant

Same dashboard shell as teacher, limited to assigned permissions. Own **My Profile** and **My Rewards** (session apples, milestones, payout history). Cannot use teacher reward scanner unless role is Teacher.

### Parent


| Feature      | Capabilities                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| **Login**    | Student code + student phone + parent phone                                  |
| **Progress** | Attendance %, quiz/exam averages, apples                                     |
| **Tabs**     | Attendance, quiz grades (offline/homework/online), exams, apple transactions |


---



## 5. Feature Reference (All Modules)



### 5.1 Authentication & Account

- Student registration (level, online/offline mode, student code when offline)
- Login / logout
- Forgot password + email reset link (1-hour token)
- Reset password page (`/auth/reset-password?token=`)
- Platform instructions gate on sign-in/up
- Student device binding (`DeviceKey`); admin can unlink
- Profile view / update



### 5.2 Courses

- Create / edit / delete courses
- Pricing: purchase price, renewal price, expiration days
- Level targeting (`Level0`–`Level3`)
- Publish / unpublish
- Ordered lecture list + course-level exams
- Student buy / renew with credit (level must match)



### 5.3 Lectures

- Create / edit / delete within a course
- Lecture pricing & renewal
- Publish / unpublish
- Mark as **important** (shown on student home)
- Attach PDF assets / Google Drive links
- Homework YouTube URL
- Offline homework & quiz full marks
- Student roster with attendance
- Barcode attendance scan (requires center)
- Grant access without payment
- CSV grade import/export



### 5.4 Lessons (Video)

- Create / edit / delete under a lecture
- Expiration hours + renewal price
- Upload video to VdoCipher (policy, multipart ≤5GB, tus)
- Manual video ID binding
- Processing status validation
- Student **start** (accept rules / start timer) and **renew**
- Prior quizzes in order must be passed before start
- DRM playback via VdoCipher OTP iframe when ready



### 5.5 Quizzes (Lecture-level)

- Builder with inline + bank questions
- Pass count, expiry minutes, result visibility
- Student start → timed attempt → submit
- Retake support
- Assistant essay grading



### 5.6 Exams (Course-level)

- Builder with questions, price, retake price, pass count, expiry
- Student purchase / retake with credit
- Submit and review
- Staff roster of submissions
- Grant exam enrollment
- Essay grading



### 5.7 Question Bank

- Multiple choice, numeric (tolerance), essay
- Reuse across quizzes and exams
- Images on questions/choices supported via uploads



### 5.8 Credit Codes & Payments

- Generate batches of prepaid codes
- Sell codes (Fresh → Sold)
- Student redeem (Sold/eligible → Redeemed → balance += value)
- Export by status
- Manual credit add on student profile
- Assistant income from sold/redeemed codes + manual credits; claim flow
- Student payments page: redeem + external top-up form link



### 5.9 Students Administration

- Search / list / export
- Create / update / delete
- Add credit, add/adjust apples
- Unlink device
- Activity events log
- Lecture enrollments & exam history on detail page



### 5.10 Assistants Administration

- Create assistants (default permission often `ManageCourses`)
- Permission matrix editor
- Numeric assistant code for scanning
- Income history and claim
- Delete assistant
- Teachers can create other teachers



### 5.11 Centers & Attendance

- Create / list active centers
- Lecture attendance by student code + `centerId`
- Toggle attendance present/absent
- Statistics treat offline “income” as attendance counts



### 5.12 Files / Assets

- Shared PDF/file library
- Attach assets to lectures
- External Drive/URL PDFs
- ImgBB image hosting for covers / questions / store



### 5.13 Statistics & Home Content

- Dashboard incomes / course / lecture analytics
- Student apple leaderboard & transactions
- Public important lectures & latest lectures for landing page



### 5.14 Apple Rewards — Students

- Apple balance on student account
- Staff grant apples (scanner by barcode/code or student detail)
- Transaction ledger
- **Store:** open window settings, catalog items, student orders, cancel/refund while open
- Parent can view apple history



### 5.15 Apple Rewards — Assistants

- Teacher scans assistant code → session attendance
- Apples = base session value + milestone bonuses (config)
- Manual apple adjust (teacher)
- Pay rewards (payout zeros balances, logs events)
- Assistant My Profile / My Rewards timeline



### 5.16 Parent Portal

- Triple-match login
- Progress dashboard with attendance and grade summaries
- Separate token storage (`parentToken`, `parentStudent`)



### 5.17 Localization & UX

- Arabic / English with RTL
- Dark/light theme support (student shell)
- Loading and permission-denied pages (denied often redirects assistants to first allowed home)

---



## 6. Frontend Routes



### Public


| Path                                     | Purpose                |
| ---------------------------------------- | ---------------------- |
| `/`                                      | Landing / student home |
| `/courses`                               | Course catalog         |
| `/courses/levels/:levelNum`              | Catalog by grade       |
| `/courses/:courseId`                     | Course detail          |
| `/courses/:courseId/lectures/:lectureId` | Lecture hub            |
| `/sign-in-sign-up`                       | Login / register       |
| `/auth/reset-password`                   | Password reset         |
| `/parent`                                | Parent login           |
| `/parent/dashboard`                      | Parent progress        |




### Student (authenticated, role `Student`)


| Path                             | Purpose               |
| -------------------------------- | --------------------- |
| `/courses/.../lessons/:lessonId` | Lesson + DRM video    |
| `/courses/.../quizzes/:quizId`   | Take quiz             |
| `/courses/.../exams/:examId`     | Take / buy exam       |
| `/payments`                      | Redeem codes / top-up |
| `/apple-rewards`                 | Student apple store   |




### Dashboard (Teacher / Assistant)


| Path                                              | Permission / note         |
| ------------------------------------------------- | ------------------------- |
| `/dashboard`                                      | `ViewStatistics`          |
| `/dashboard/important-lectures`                   | `ManageLecture`           |
| `/dashboard/courses`                              | `ManageCourses`           |
| `/dashboard/courses/add`                          | `ManageCourses`           |
| `/dashboard/courses/:courseId`                    | `ManageCourses`           |
| `/dashboard/courses/.../lectures/:lectureId`      | `ManageCourses`           |
| `/dashboard/courses/.../lectures/:lectureId/scan` | Attendance scanner        |
| `/dashboard/courses/.../lessons/:lessonId`        | Lesson + video upload     |
| `/dashboard/courses/.../quizzes/add               | :quizId`                  |
| `/dashboard/courses/.../exams/add                 | :examId`                  |
| `/dashboard/courses/.../exams/:examId/students`   | Exam roster               |
| `/dashboard/credit-codes`                         | Credit code perms         |
| `/dashboard/files`                                | `ManageFiles`             |
| `/dashboard/questions`                            | `ManageFiles`             |
| `/dashboard/assistants`                           | `ManageAssistants`        |
| `/dashboard/assistants/:assistantId`              | `ManageAssistants`        |
| `/dashboard/assistant-rewards-scanner`            | **Teacher only**          |
| `/dashboard/student-apples-scanner`               | `ManageStudentApples`     |
| `/dashboard/apple-rewards-store`                  | `ManageAppleRewardsStore` |
| `/dashboard/my-profile`                           | **Assistant only**        |
| `/dashboard/my-rewards`                           | **Assistant only**        |
| `/dashboard/students`                             | `ManageStudents`          |
| `/dashboard/students/:studentId`                  | `ManageStudents`          |
| `/dashboard/granted-access`                       | `ManageGrantedAccess`     |
| `/dashboard/expiration-time`                      | `ManageExpirationTime`    |


Routing source: `src/LearnMS.React/src/App.tsx`.

---



## 7. API Reference

Base API is under `/api/...`. Students need `Authorization: Bearer <token>` and `DeviceKey` header when authenticated.

### Auth — `/api/auth`


| Method | Route                         | Auth | Purpose                      |
| ------ | ----------------------------- | ---- | ---------------------------- |
| POST   | `/students/register`          | Anon | Register student             |
| POST   | `/login`                      | Anon | Login (+ optional DeviceKey) |
| POST   | `/forgot-password`            | Anon | Email reset link             |
| POST   | `/reset-password`             | Anon | Reset with token             |
| POST   | `/students/register-external` | —    | Not implemented              |
| POST   | `/login-external`             | —    | Not implemented              |




### Profile — `/api/profile`


| Method | Route | Auth     | Purpose         |
| ------ | ----- | -------- | --------------- |
| GET    | `/`   | Optional | Current profile |
| PATCH  | `/`   | Student  | Update profile  |




### Parent — `/api/parent`


| Method | Route       | Auth          | Purpose       |
| ------ | ----------- | ------------- | ------------- |
| POST   | `/login`    | Anon          | Parent JWT    |
| GET    | `/progress` | Parent Bearer | Progress data |




### Courses — `/api/courses`

CRUD, publish/unpublish, student `buy`. Catalog also via `/api/students/courses`.

### Lectures — `/api/courses/{courseId}/lectures`

CRUD, publish, toggle-important, buy, homework/quiz scores, students roster/export, assets, PDF links, attend by code, toggle attendance, grant enroll, bulk grades.

### Lessons — `.../lectures/{lectureId}/lessons`

CRUD, start, renew, video upload / policy / validate (+ tus at `.../video`).

### Quizzes — `.../quizzes`

Upsert, get, delete, start, submit, retake, grade-essay.

### Exams — `/api/courses/{courseId}/exams`

Upsert, get, delete, buy, submit, enroll student, roster, grade-essay.

### Questions — `/api/questions`

List, create, delete (note: no `[ApiAuthorize]` on controller).

### Students — `/api/students`

List/search, CRUD, credit, apples, unlink-device, lectures, exams, events, enrollment patch, export.

### Credit codes — `/api/credit-codes`

List, generate, redeem, sell, export.

### Rewards — `/api/rewards`

Assistant me/dashboard, attend session, lookup, attend-by-code, adjust apples, pay-rewards; student lookup and apples-by-code.

### Apple store — `/api/rewards/store`

Admin: settings, items, overview, orders, export.  
Student: status, catalog, orders, cancel.

### Administration — `/api/administration`

Teachers create; assistants CRUD; permissions list; incomes; claim.

### Statistics — `/api/statistics`

Incomes, courses, lecture, student-apples, latest-lectures, important-lectures.

### Centers — `/api/centers`

List active, create.

### Assets / Uploads

`/api/assets` list/delete/download; `/api/uploads/imgbb` image upload.

---



## 8. Domain Model


| Entity                                  | Meaning                                             |
| --------------------------------------- | --------------------------------------------------- |
| Account / User                          | Identity; Student, Assistant, or Teacher            |
| Student                                 | Level, credit (LE), apples, device key, enrollments |
| Assistant                               | Permissions, scan code, session apples, income      |
| Teacher                                 | Top-level staff                                     |
| Course                                  | Catalog, pricing, level, lectures, exams            |
| Lecture                                 | Module, assets, lessons, quizzes, attendance        |
| Lesson                                  | VdoCipher video, timed access                       |
| Exam / Quiz                             | Assessments with questions                          |
| Question                                | MCQ / numeric / essay bank item                     |
| Enrollments                             | Course / lecture / exam access windows              |
| LectureAttendance                       | Center attendance record                            |
| LessonAttendance                        | Lesson start + video expiry                         |
| CreditCode                              | Fresh → Sold → Redeemed                             |
| StudentAppleTransaction                 | Student apple ledger                                |
| AssistantRewardEvent                    | Session / adjust / payout                           |
| AppleRewardItem / Order / StoreSettings | Student prize store                                 |
| Asset                                   | PDF/file or external URL                            |
| Center                                  | Physical location                                   |
| StudentEvent                            | Activity log                                        |


---



## 9. Business Rules


| Domain                | Rules                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **Course buy**        | Must be published; student level matches; charge Price or RenewalPrice; extend ExpirationDays |
| **Lecture buy**       | Blocked while full course enrollment active; rebuy clears lesson attendances                  |
| **Exam buy**          | First purchase vs retake; active unsubmitted enrollment blocked                               |
| **Lesson start**      | Enrolled; prior quizzes passed; one acceptance per lesson                                     |
| **Credit redeem**     | One-time; adds to student balance + event                                                     |
| **Code sell**         | Only Fresh codes; sets seller                                                                 |
| **Device**            | First login binds DeviceKey; mismatch fails auth until unlink                                 |
| **Apple store**       | Only while open; deduct apples on order; cancel refunds while open                            |
| **Assistant session** | Increments sessions; awards base + milestone apples                                           |
| **Attendance**        | Valid student code + active center required                                                   |


---



## 10. Integrations


| Service          | Usage                                                           |
| ---------------- | --------------------------------------------------------------- |
| **VdoCipher**    | DRM lesson video upload & OTP playback                          |
| **YouTube**      | Landing promo + lecture homework embeds                         |
| **ImgBB**        | Image hosting                                                   |
| **Quagga2**      | Camera barcode scanning (attendance, apples, assistant rewards) |
| **Google Form**  | External student credit top-up requests                         |
| **Google Drive** | Lecture PDF links                                               |
| **SMTP email**   | Password reset                                                  |
| **PostgreSQL**   | Primary datastore                                               |


---



## 11. Setup & Deployment



### Docker Compose

```bash
# From repo root — requires .env with DB and app secrets
docker compose up --build
```

- API: `http://localhost:3000` (container `8080`)
- Postgres: `localhost:5432`



### Local development (typical)

1. Start PostgreSQL (compose DB service or local).
2. Configure `src/LearnMS.API/appsettings.json` / `.env` (JwtBearer, connection string, VdoCipher, ImgBB, Email, Administration seed).
3. Run API (`dotnet run` in `LearnMS.API`).
4. Run React (`npm install && npm run dev` in `LearnMS.React`) — API proxies to `localhost:3000` in development.



### Seed

On startup, `InitializeAsync` can create teachers/assistants from `Administration` configuration.

---



## 12. Project Structure

```
new-rafik-web-2027/
├── DOCUMENTATION.md          ← this file
├── README.md
├── Dockerfile
├── docker-compose.yaml
├── LearnMS.sln
└── src/
    ├── LearnMS.API/          # ASP.NET Core backend
    │   ├── Features/         # Controllers + services by domain
    │   ├── Entities/         # Domain model
    │   ├── Data/             # EF Core
    │   ├── Security/         # JWT, DeviceKey, password hashing
    │   ├── ThirdParties/     # VdoCipher
    │   └── Migrations/
    └── LearnMS.React/        # Vite React SPA
        └── src/
            ├── pages/        # auth, student, dashboard, parent
            ├── components/   # UI, assessment, rewards, landing
            ├── api/          # Auth helpers + axios
            ├── generated/    # Orval OpenAPI client
            ├── locales/      # en / ar
            └── store/        # Zustand stores
```

---



## Quick Feature Checklist

- [x] Auth (register, login, password reset, device binding)
- [x] Student course catalog & enrollment
- [x] Lectures, lessons, PDF assets, homework YouTube
- [x] VdoCipher DRM video
- [x] Online quizzes & exams + essay grading
- [x] Offline homework/quiz grades & CSV
- [x] Credit codes (generate, sell, redeem)
- [x] Manual credit & payments page
- [x] Centers + barcode attendance
- [x] Students & assistants administration
- [x] Granular assistant permissions
- [x] Statistics dashboard
- [x] Important / latest lectures on home
- [x] Student Apple Rewards store
- [x] Student apple scanner
- [x] Assistant rewards scanner & payouts
- [x] Parent progress portal
- [x] Arabic / English + RTL
- [x] File library & ImgBB uploads
- [x] Granted access & expiration overrides

---

*Generated from the LearnMS codebase (*`LearnMS.API` *+* `LearnMS.React`*). For a shorter overview, see* `README.md`*.*