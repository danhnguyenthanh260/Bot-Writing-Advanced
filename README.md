# Dei8 AI - Your Professional Writing & Publishing Studio

## 🚀 Introduction

Dei8 AI is an intelligent studio designed to be a professional partner for literary authors. It transforms the solitary process of writing into an interactive, AI-assisted journey, from initial analysis and drafting to critique and automated publishing.

The latest release introduces a secure backend proxy around the Google Docs API. Instead of asking Gemini to follow a link blindly, the application now authenticates with Google, ingests the real document, converts it into a structured outline, and stores a normalized "Work Profile" for downstream tooling. The React workspace automatically spins up drafting, critique, and polishing pages while the chat assistant leverages the actual manuscript text for contextual responses.

## ✨ Core Features

* **✍️ Professional Editorial Assistant:** Engage with an AI trained to act as a professional editor, providing insightful feedback on drafts.
* **🔗 Google Doc Integration via API:** Paste a Google Docs URL into the new upload form. The backend proxies the request, handles OAuth or Service Accounts, and returns a structured JSON model of your story.
* **📖 Automated Work Profile:** Every ingestion converts headings and paragraphs into a persistent profile summarizing plot beats, style, writing habits, and word counts.
* **⚡️ Efficient Updates:** Re-ingesting the same document refreshes the stored profile and workspace without duplicating pages.
* **🎨 Dynamic Workspace Canvas:** The infinite canvas still provides dedicated Draft, Critique, and Final pages for each story with pan/zoom controls.
* **🤖 Automated Publishing:** Ask the assistant to publish and it prepares the payload for the target platform (simulation ready).
* **💾 Persistent State:** Messages, work profiles, and canvas pages are stored in `localStorage` so your studio survives refreshes. Logged-in users also sync their workspace to the server, which now persists sessions and snapshots in PostgreSQL for seamless restores across restarts or multiple backend instances.

## 🧠 How the Pipeline Works

1. **UploadDocForm (frontend):** The React sidebar renders `UploadDocForm.tsx`, which calls `POST /api/google-docs/ingest` with the user-provided URL. It surfaces loading states and explicit permission errors from Google.
2. **Express Backend Proxy:** `server/index.ts` exposes `/api/google-docs` routes. Requests flow through `services/googleDocsService.ts`, which authenticates with Google using OAuth refresh tokens or Service Accounts.
3. **Google Docs Service:** `googleDocsService` downloads the document, walks through paragraphs/headings, and produces a normalized `StructuredGoogleDoc` JSON payload.
4. **Conversion & Storage:** `convertGoogleDocToWorkProfile` extracts key analytics (outline, writing style heuristics, author habits) and saves them in the in-memory store (`server/storage/workProfilesStore.ts`).
5. **Frontend Hydration:** The response hydrates a `WorkProfile` in React, spawns Draft/Critique/Final canvas pages, and posts an assistant summary message.
6. **Context-Aware Chat:** `services/geminiService.ts` now injects document outlines and truncated manuscript text when sending prompts to Gemini, ensuring critiques reference the real story instead of a bare URL.

## 🗄️ Workspace Storage & Sessions

Google-authenticated users receive a short-lived session token managed by `server/storage/sessionStore.ts`. Sessions and workspace snapshots are stored in PostgreSQL tables (`sessions` and `workspaces`) through a connection pool declared in `server/storage/postgres.ts`. On startup the server auto-creates the required tables if they are missing, ensuring workspaces survive server restarts and can be restored consistently across multiple backend instances.

## 💻 Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind-style utility classes.
* **Backend:** Express 4 (TypeScript), Google APIs Node client, CORS middleware.
* **AI Model:** Google Gemini API (`@google/genai`).
* **Document Ingestion:** Google Docs API via OAuth 2.0 or Service Accounts.
** **State Persistence:** Browser `localStorage` for client-side data; PostgreSQL for authenticated sessions and workspace snapshots on the API proxy.proxy.

## 🧰 Environment Configuration

| Variable | Where | Description |
| --- | --- | --- |
| `API_KEY` | Frontend & backend | Gemini API key consumed by `@google/genai`.
| `GOOGLE_CLIENT_ID` | Backend | OAuth 2.0 client ID (installed application or web application).
| `GOOGLE_CLIENT_SECRET` | Backend | OAuth 2.0 client secret.
| `GOOGLE_REFRESH_TOKEN` | Backend | Long-lived refresh token obtained after user consent. Required for OAuth mode.
| `GOOGLE_REDIRECT_URI` | Backend | Redirect URI used when minting the refresh token. Optional for service accounts.
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Backend | Service account email (alternative auth path).
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Backend | Service account private key. Remember to replace literal `\n` with real newlines.
| `DATABASE_URL` | Backend | PostgreSQL connection string used for sessions and workspace snapshots (e.g., `postgres://user:pass@host:5432/db`). |
| `DATABASE_SSL` | Backend | Optional (`true` to enable `ssl` with `rejectUnauthorized: false`). Use when your provider requires TLS. |
| `PORT` | Backend | Port for the Express server (default `3001`).
| `CORS_ORIGIN` | Backend | Comma-separated list of allowed origins for CORS (e.g., `http://localhost:5173`). Leave blank to allow all (blank entries are ignored).
| `VITE_API_BASE_URL` | Frontend | Base URL for API calls (e.g., `http://localhost:3001`). Leave blank when serving from the same origin.
| `VITE_GOOGLE_CLIENT_ID` | Frontend | OAuth 2.0 client ID used by Google Identity Services on the frontend.
> **Authentication Options:** Provide either the OAuth fields (`GOOGLE_CLIENT_*` + `GOOGLE_REFRESH_TOKEN`) or the service account fields. If both are present, the service account takes precedence.

## 🔑 Setting Up Google Cloud Credentials

1. **Create or select a Google Cloud project.**
2. **Enable the Google Docs API:** In the Google Cloud Console, navigate to *APIs & Services → Library* and enable *Google Docs API*.
3. **Choose your authentication model:**
   * **Service Account (server-to-server):**
     1. Create a new service account under *APIs & Services → Credentials*.
     2. Generate a JSON key and copy `client_email` and `private_key` into the `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` variables (convert `\n` to actual newlines).
     3. Share every document you plan to ingest with the service account email (view access is sufficient).
   * **OAuth Client (user consent):**
     1. Create an OAuth 2.0 Client ID. For local development you can use an "Desktop" or "Web" application type.
     2. Add `http://localhost:3001/oauth2callback` (or your chosen redirect) to the authorized redirect URIs.
     3. Use the client ID/secret to run a one-time OAuth flow (for example with [Google's OAuth playground](https://developers.google.com/oauthplayground)). Request the `https://www.googleapis.com/auth/documents.readonly` scope, authorize, and copy the refresh token into `GOOGLE_REFRESH_TOKEN`.
4. **Store credentials securely:** Use `.env` files or your deployment's secret manager. Never commit raw credentials to version control.

## ▶️ Running the Project Locally

1. **Install dependencies** (requires access to npm registry packages referenced in `package.json`):
   ```bash
   npm install
   ```
   > If your environment blocks certain packages, ensure whitelisting for `googleapis`, `express`, and related `@types` packages.
2. **Create environment files:**
   * Backend (`.env` or shell exports): set Google credentials, `API_KEY`, `PORT`, `CORS_ORIGIN`, and the PostgreSQL settings `DATABASE_URL` (and `DATABASE_SSL=true` if your provider enforces TLS)..
   * Frontend (`.env.local`): set `VITE_API_BASE_URL` to `http://localhost:3001` (or empty if proxied) and `API_KEY`.
3. **Start the backend proxy:**
   ```bash
   npm run server
   ```

    > The server will initialize the PostgreSQL schema on startup if the target database is empty.
4. **Start the Vite dev server:**
   ```bash
   npm run dev
   ```
5. **Use the studio:** Open the frontend (default `http://localhost:5173`), paste a Google Docs URL into the "Phân tích Google Docs" form, and monitor status messages for loading or permission issues.

## 🧭 Usage Tips

* The assistant posts a summary message automatically after ingestion. Re-uploading the same document replaces the existing workspace instead of duplicating it.
* Chat prompts now include the manuscript outline and truncated text, enabling far more specific critiques. Gemini responses will still emit `ACTION_CRITIQUE_DRAFT` blocks when applicable.
* Permission errors from Google (HTTP 401/403) appear directly in the sidebar form so you can fix sharing or refresh tokens quickly.

## 📁 Project Structure

```
.
├── App.tsx
├── components/
│   ├── DocumentCanvas.tsx
│   ├── UploadDocForm.tsx
│   └── ...
├── services/
│   ├── geminiService.ts
│   └── googleDocsService.ts
├── server/
│   ├── index.ts
│   ├── routes/
│   │   └── googleDocs.ts
│   │   ├── auth.ts
│   │   ├── googleDocs.ts
│   │   └── workspace.ts
│   └── storage/
│       ├── postgres.ts
│       ├── sessionStore.ts
│       └── workProfilesStore.ts
├── types.ts
└── ...

## 📞 Support & Contributions

Issues and feature requests are welcome! Please document reproduction steps, include logs from both the frontend console and backend server, and omit any sensitive credentials. Pull requests should include updated documentation when introducing new environment variables or deployment considerations.