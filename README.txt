================================================================================
  BHOS LOST & FOUND — PROJECT DOCUMENTATION
  Baku Higher Oil School | Campus Lost & Found Platform
================================================================================

  Live Application (Vercel): https://campus-lost-and-found-narmins-projects-7a0748c4.vercel.app

================================================================================
  TABLE OF CONTENTS
================================================================================

  1. Project Overview
  2. Features
  3. Technology Stack
  4. Project Architecture & File Structure
  5. Database Design
  6. API Endpoints
  7. Prerequisites
  8. How to Run the App Locally (Step-by-Step)
  9. How to Reset the Database
  10. Environment Variables (Optional — for Image Uploads)
  11. Deployment (Vercel)
  12. Language Support

================================================================================
  1. PROJECT OVERVIEW
================================================================================

BHOS Lost & Found is a full-stack web application designed specifically for
students and staff at Baku Higher Oil School (BHOS). The platform provides a
centralized, trustworthy space where community members can report lost items,
post found items, submit claims, and coordinate safe handovers — all without
needing any third-party messaging apps.

The application was built as a mobile-first, single-page web app that behaves
like a native mobile application. It uses a bottom navigation bar, smooth screen
transitions, toast notifications, and a clean card-based layout. The entire
frontend runs in a single HTML file that dynamically loads screen content using
plain JavaScript — no frontend framework such as React or Vue was used.

The backend is a REST API server built with Node.js and Express.js. It uses
SQLite as the local development database, which means no external database
setup is required to run the project. Everything runs on your own machine with
a single command.

================================================================================
  2. FEATURES
================================================================================

  Authentication
  - User registration with full name, campus email, phone number, role
    (student or staff), department, and year of study
  - Secure login using email or phone number with bcrypt password hashing
  - Session-based authentication using cryptographically random bearer tokens
  - Account suspension support handled by admin users

  Lost & Found Item Posting
  - Users can post two types of items: "Lost" (something they lost) or
    "Found" (something they discovered on campus)
  - Each post includes a title, category, description, location, date, time,
    and optionally a photo
  - Eight item categories are supported: Documents / ID Cards, Electronics,
    Keys, Wallet / Money, Earphones / Accessories, Bags, Clothing, and Other
  - Nine campus locations are available: Main Building, Library, Cafeteria,
    Lab, Classroom Building, Dormitory, Parking Area, Security Desk, Other
  - Finders can attach verification questions to their "Found" posts so that
    only the true owner can prove their identity

  Claim System
  - Any logged-in user who is not the original poster can submit a claim on a
    found item by answering the poster's verification questions
  - The item poster reviews the answers and can either approve or reject the
    claim, with the option to add a review note for rejected claims
  - A claim approval automatically opens a private chat channel between the
    two parties

  In-App Chat & Handover Coordination
  - Once a claim is approved, both the poster and the claimant can exchange
    messages in a private chat thread linked to that specific claim
  - Either party can schedule a handover meeting by specifying a meeting point
    and time
  - The poster marks the handover as complete, which changes the item status
    to "Resolved / Returned" and records the resolution date

  Notifications
  - Users receive in-app notifications for key events such as claim
    submissions, approvals, rejections, and new messages
  - An unread badge counter appears on the Messages tab in the navigation bar
  - Users can mark all notifications as read in bulk

  Search & Filtering
  - A dedicated search screen allows users to filter items by keyword, type
    (lost or found), category, location, and status
  - Search queries match against item titles, descriptions, categories, and
    locations simultaneously

  User Profiles
  - Each user has a profile page showing their avatar initials, role, join date,
    department, post count, and resolved count
  - Users can view their own posted items and submitted claims from the profile
    screen

  Admin Panel
  - Users with the "admin" role have access to a special admin screen
  - Admins can view platform-wide statistics: total users, total items, and
    pending reports
  - Admins can review reports submitted by users and take actions such as
    issuing warnings, removing posts, suspending users, or dismissing reports
  - All admin actions are recorded in an audit log

  Reporting
  - Any user can report a post or another user by selecting a reason and
    severity level (low, medium, or high)

  Bilingual Support
  - The entire interface supports both English and Azerbaijani languages
  - Users can switch languages from their profile screen
  - The language preference is persisted in localStorage across sessions

================================================================================
  3. TECHNOLOGY STACK
================================================================================

  Frontend
  --------
  - HTML5, CSS3, and plain JavaScript (ES2020+) — no frontend framework
  - Google Fonts (Inter typeface) for clean typography
  - Custom CSS variables for theming (colors, shadows, border radii)
  - Mobile-first responsive design with a bottom navigation bar
  - Screen routing handled entirely in JavaScript via a custom router (router.js)

  Backend
  -------
  - Node.js (runtime)
  - Express.js v4 (HTTP server and routing)
  - better-sqlite3 (synchronous SQLite driver for Node.js)
  - bcryptjs (password hashing with salt rounds)
  - Zod v4 (runtime request body validation and schema parsing)
  - cors (Cross-Origin Resource Sharing middleware)
  - crypto (Node.js built-in, used for generating session tokens)

  Developer Tools
  ---------------
  - concurrently (runs the API server and the static file server in parallel)
  - http-server (serves the static frontend files during local development)

  Deployment
  ----------
  - Vercel (frontend static hosting + serverless API function via api/index.js)
  - vercel.json rewrites all /api/* requests to the serverless function

  Optional (Image Uploads)
  ------------------------
  - Supabase Storage (object storage for item photos when environment variables
    are provided)

================================================================================
  4. PROJECT ARCHITECTURE & FILE STRUCTURE
================================================================================

  campus-lost-and-found/
  |
  |-- index.html              The single HTML entry point. Defines the screen
  |                           container, bottom navigation bar, toast, and modal
  |                           elements. Loads all JS files in order.
  |
  |-- styles.css              All application styles. Uses CSS custom properties
  |                           for consistent theming across every screen.
  |
  |-- i18n.js                 Internationalization module. Contains all English
  |                           and Azerbaijani string translations. Exposes the
  |                           global `Lang` object used by screen files.
  |
  |-- api.js                  Frontend API client. Wraps all fetch() calls to the
  |                           backend with auth header injection, error handling,
  |                           and token management via localStorage.
  |
  |-- data.js                 In-memory data store (`DB` object). Holds the
  |                           current user session, fetched items, claims,
  |                           messages, and notifications in the browser.
  |
  |-- router.js               Custom single-page app router. Manages screen
  |                           history, navigation transitions, the App.init()
  |                           bootstrap function, remote data refresh, and nav
  |                           badge updates.
  |
  |-- screens-auth.js         Screen definitions for the splash/onboarding screen,
  |                           login screen, and registration screen.
  |
  |-- screens-main.js         Screen definitions for the home feed, search,
  |                           post item form, item detail view, notifications,
  |                           messages inbox, user profile, and admin panel.
  |
  |-- screens-claims.js       Screen definitions for claim submission, claim
  |                           review (for the poster), and in-app chat with
  |                           handover scheduling.
  |
  |-- backend/
  |   |-- server.js           Express.js REST API server. Defines all API routes,
  |                           authentication middleware, and database operations.
  |   |-- db.js               SQLite database connection module. Opens the
  |                           better-sqlite3 connection and runs any pending
  |                           migrations at startup.
  |   |-- schema.sql          SQL schema defining all database tables. Applied
  |                           once by the reset script.
  |   |-- dev.sqlite3         The local SQLite database file (created on first run
  |                           or after db:reset).
  |   `-- scripts/
  |       `-- reset-db.js     Utility script to wipe and recreate the database.
  |
  |-- api/
  |   `-- index.js            Vercel serverless function entry point. Dispatches
  |                           all /api/* requests for production deployment.
  |
  |-- assets/
  |   `-- bhos-logo.png       BHOS logo image used in the splash/auth screens.
  |
  |-- vercel.json             Vercel deployment configuration. Rewrites all
  |                           /api/:path* requests to the serverless function.
  |
  `-- package.json            NPM project manifest with scripts and dependencies.

================================================================================
  5. DATABASE DESIGN
================================================================================

The local development database is SQLite, stored in backend/dev.sqlite3. The
schema consists of eight tables with full referential integrity enforced via
foreign key constraints.

  users
  -----
  Stores all registered users. Each user has a unique text ID (prefixed with
  "u"), a name, email, phone, bcrypt password hash, role (student/staff/admin),
  an auto-generated avatar string of initials, verification and suspension flags,
  join date, department, year, and running counts of posts and resolved items.

  sessions
  --------
  Stores active authentication sessions. Each session has a random 48-character
  hex token as its primary key, linked to a user ID. Tokens are checked on every
  authenticated API request via the Authorization: Bearer <token> header.

  items
  -----
  Stores all posted lost and found items. Includes type (lost/found), title,
  category, description, optional photo URL, location, date, time, status,
  poster ID and display name, claim count, resolved date, and timestamps.

  item_verification_questions
  ---------------------------
  Stores the optional verification questions that finders attach to their "Found"
  posts. Each question belongs to one item and has a display position.

  claims
  ------
  Stores all claim submissions and finder responses. Tracks whether the claim is
  a finder response, its approval status (Pending/Approved/Rejected/Resolved),
  whether chat is enabled, a review note from the poster, and meeting details for
  handover scheduling.

  claim_answers
  -------------
  Stores the individual question-and-answer pairs submitted with each claim.
  References both the claim and the original question ID.

  messages
  --------
  Stores all in-app chat messages grouped by claim. Each message has a sender ID,
  message text, formatted time, date, and a precise ISO timestamp for ordering.

  notifications
  -------------
  Stores per-user notifications. Each notification has a type, title,
  description, human-readable time label, a read flag, and optional deep-link
  references to a claim or item screen.

  reports
  -------
  Stores user-submitted reports about posts or other users. Includes type
  (post/user), target ID and title, reporter ID, reason, optional detail, severity
  level (low/medium/high), and status (pending/reviewed).

  admin_log
  ---------
  Immutable audit log of all admin actions. Each entry records the action label,
  the target item or user, a descriptive note, the admin's user ID, and timestamp.

================================================================================
  6. API ENDPOINTS
================================================================================

  All endpoints are prefixed with /api.

  Health
    GET  /api/health               Returns { ok: true } — used to verify the
                                   server is running.

  Config
    GET  /api/config               Returns app configuration: categories,
                                   locations, predefined verification questions,
                                   and optional Supabase storage config.

  Authentication
    POST /api/auth/login           Log in with email/phone and password. Returns
                                   a bearer token and user object.
    POST /api/auth/register        Register a new account. Returns a bearer token
                                   and user object.
    GET  /api/me                   Returns the currently authenticated user.
                                   Requires bearer token.

  Items
    GET  /api/items                List all items. Supports query parameters:
                                   type, category, location, status, q (search).
    GET  /api/items/:id            Get a single item by ID, including its
                                   verification questions.
    POST /api/items                Create a new lost or found item. Requires auth.
    PATCH /api/items/:id           Update an item's status. Requires auth.
    DELETE /api/items/:id          Delete an item. Requires auth (owner or admin).

  Claims
    GET  /api/items/:id/claims     List all claims for an item. Requires auth
                                   (poster or admin only).
    POST /api/items/:id/claims     Submit a new claim. Requires auth.
    GET  /api/claims               List all claims involving the current user
                                   (as claimant or poster). Requires auth.
    POST /api/claims/:id/approve   Approve a claim and open chat. Requires auth.
    POST /api/claims/:id/reject    Reject a claim with a note. Requires auth.
    POST /api/claims/:id/handover  Schedule or complete a handover. Requires auth.

  Messages
    GET  /api/claims/:id/messages  List messages for a claim chat. Requires auth.
    POST /api/claims/:id/messages  Send a message. Requires auth; chat must be
                                   enabled (claim must be approved).

  Notifications
    GET  /api/notifications        List notifications for current user.
    POST /api/notifications        Mark all notifications as read.

  Reports
    GET  /api/reports              List all reports. Requires admin role.
    POST /api/reports              Submit a report about a post or user.
                                   Requires auth.

  Admin
    GET  /api/admin/stats          Returns platform-wide counts. Admin only.
    GET  /api/admin/log            Returns the admin action log. Admin only.
    POST /api/admin/actions        Take action on a report (warn/remove/suspend/
                                   dismiss). Admin only.

  Users
    GET  /api/users/:id            Get a user's public profile (id, name, avatar).

  Upload
    POST /api/upload               Upload an item photo to Supabase Storage.
                                   Requires auth and Supabase env variables.

================================================================================
  7. PREREQUISITES
================================================================================

Make sure the following are installed before you begin:

  - Node.js v18 or later   https://nodejs.org
  - Git                    https://git-scm.com

No external database is needed. SQLite is embedded and handled automatically
by the npm packages.

================================================================================
  8. HOW TO RUN THE APP LOCALLY
================================================================================

Open a terminal and run these commands in order:

  # 1. Clone the repository
  git clone https://github.com/muradakhundov1/campus-lost-and-found.git

  # 2. Move into the project folder
  cd campus-lost-and-found

  # 3. Install all dependencies
  npm install

  # 4. Create and seed the database (first time only)
  npm run db:reset

  # 5. Start the app (API + frontend together)
  npm run dev

  # 6. Open in your browser
  http://localhost:5173

The API runs on http://localhost:8787 and the frontend on http://localhost:5173.
Keep the terminal open while using the app. To stop, press Ctrl + C.

After the first setup, on any future run you only need:

  cd campus-lost-and-found
  npm run dev

================================================================================
  9. HOW TO RESET THE DATABASE
================================================================================

To wipe all data and restore the original demo seed, stop the server (Ctrl + C)
and run:

  npm run db:reset
  npm run dev

================================================================================
  10. ENVIRONMENT VARIABLES (OPTIONAL — FOR IMAGE UPLOADS)
================================================================================

By default, item photo uploads are disabled when running locally. The app
works fully without photos — they are an optional enhancement.

If you want to enable photo uploads, you need a free Supabase account and a
storage bucket. Create a file called .env in the root of the project with the
following contents (replace the values with your own):

  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  SUPABASE_STORAGE_BUCKET=item-photos

The backend/server.js file reads these values when the /api/upload endpoint
is called. The POST /api/upload route streams the image directly from the
Express server to Supabase Storage using the service role key for authorization.

The frontend reads the public Supabase URL and anon key from the /api/config
endpoint and uses them to display uploaded images.

The .env file is listed in .gitignore and will NOT be committed to the
repository. Never share your service role key publicly.

================================================================================
  11. DEPLOYMENT (VERCEL)
================================================================================

The application is deployed to Vercel for public access. Vercel handles both
the static frontend files and the serverless API function.

The vercel.json configuration file at the project root tells Vercel to route
all requests matching /api/:path* to the serverless function defined in
api/index.js. That function imports and runs the same Express application that
is used during local development, ensuring behavior is identical in both
environments.

To deploy your own copy:

  1. Install the Vercel CLI:
       npm install -g vercel

  2. From the project root, run:
       vercel

  3. Follow the prompts to link to your Vercel account and project.

  4. Add your environment variables in the Vercel project dashboard under
     Settings > Environment Variables (required for image upload support).

================================================================================
  12. LANGUAGE SUPPORT
================================================================================

The application supports two languages out of the box: English and Azerbaijani.
All UI strings are stored in i18n.js within two translation maps keyed by "en"
and "az". The global Lang object exposes a t() function that returns the correct
string for the currently active language.

Users can switch languages from their Profile screen by tapping the Language
option. The selected language is saved to localStorage under the key "bhos.lang"
so it persists between sessions without requiring a server round-trip.

Date and time values are formatted using the JavaScript Intl.DateTimeFormat API
with the appropriate locale — "en-US" for English and "az-AZ" for Azerbaijani —
ensuring that months, weekdays, and relative time strings appear in the correct
language.

================================================================================
  END OF DOCUMENTATION
================================================================================
