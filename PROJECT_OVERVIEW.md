# AgroBot BD — Project Overview & Architecture

> AI-Powered Crop Disease Advisory System for Bangladeshi Farmers

---

## 1. What is AgroBot BD?

AgroBot BD is a full-stack web application that helps Bangladeshi farmers identify crop diseases and get practical treatment advice using Artificial Intelligence. A farmer describes their crop problem in plain text (or uploads a photo), and the AI agent asks follow-up questions, searches a crop disease database, checks local weather conditions, and delivers a structured diagnosis with recommended actions.

The system is designed specifically for Bangladesh — it knows the 8 major districts, supports 13 common Bangladeshi crops, and uses weather data relevant to the local climate.

---

## 2. Key Features

| Feature | Description |
|---|---|
| 🌾 Crop Disease Identification | Diagnoses diseases for 13 major Bangladeshi crops |
| 💬 Conversational AI | Multi-turn chat with follow-up questions before diagnosis |
| 📷 Image Analysis | Upload a crop photo — GPT-4o Vision analyzes it automatically |
| 🌦️ Weather Integration | Real-time weather from OpenWeatherMap for all 8 Bangladesh districts |
| 📋 Structured Advisory Card | Disease name, confidence, cause type, recommended actions |
| ⚠️ Smart Escalation | Automatically recommends consulting an agronomist when needed |
| 💾 Conversation History | All chats saved to MongoDB, accessible from the sidebar |
| 🔐 User Authentication | JWT-based secure login with bcrypt password hashing |
| 🌙 Dark / Light Mode | Full theme support across all pages |

---

## 3. Supported Crops

Rice · Wheat · Maize · Potato · Tomato · Brinjal · Chili · Onion · Cucumber · Jute · Mustard · Banana · Mango

---

## 4. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| React Router | 6.22 | Client-side routing |
| Axios | 1.6 | HTTP client for API calls |
| Tailwind CSS | 3.4 | Utility-first styling |
| Vite | 5.0 | Build tool and dev server |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 4.18 | Web framework |
| MongoDB | 6+ | Database |
| Mongoose | 8.0 | MongoDB object modeling |
| OpenAI SDK | 4.20 | GPT-4o-mini AI model |
| JSON Web Token | 9.0 | Authentication tokens |
| bcrypt | 5.1 | Password hashing |
| express-rate-limit | 7.1 | API rate limiting |

### Testing
| Technology | Purpose |
|---|---|
| Vitest | Unit tests (server + client) |
| Playwright | End-to-end browser tests |

---

## 5. Complete Project Structure

```
agrobot-bd/
│
├── client/                          ← React Frontend (Vite, port 3000)
│   ├── index.html                   ← HTML entry point
│   ├── vite.config.js               ← Vite config + API proxy to port 5000
│   ├── tailwind.config.js           ← Tailwind CSS configuration
│   ├── postcss.config.js            ← PostCSS configuration
│   ├── package.json                 ← Frontend dependencies
│   └── src/
│       ├── main.jsx                 ← React app entry point (mounts ThemeProvider)
│       ├── App.jsx                  ← Route definitions + auth guards
│       ├── index.css                ← Global styles + Tailwind directives
│       ├── pages/
│       │   ├── SignIn.jsx           ← Login page
│       │   ├── SignUp.jsx           ← Registration page
│       │   └── Chat.jsx             ← Main chat interface (largest component)
│       ├── components/
│       │   └── ThemeToggle.jsx      ← Dark/Light mode toggle button
│       ├── context/
│       │   └── ThemeContext.jsx     ← Global theme state (React Context)
│       ├── services/
│       │   └── api.js               ← Axios instance with auth interceptors
│       └── tests/
│           └── unit/                ← Vitest unit tests for all components
│
├── server/                          ← Express Backend (Node.js, port 5000)
│   ├── src/
│   │   ├── server.js                ← App entry point (Express setup, DB connect)
│   │   ├── routes/
│   │   │   ├── authRoutes.js        ← /api/auth/* routes
│   │   │   └── api.js               ← /api/* routes (chat, conversations)
│   │   ├── controllers/
│   │   │   ├── authController.js    ← signup, signin, profile handlers
│   │   │   └── chatController.js    ← chat, getConversations, deleteConversation
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    ← JWT token verification
│   │   ├── services/
│   │   │   └── authService.js       ← register, login, JWT sign/verify
│   │   ├── models/
│   │   │   ├── User.js              ← MongoDB User schema
│   │   │   └── Conversation.js      ← MongoDB Conversation + Message schema
│   │   ├── agents/
│   │   │   └── advisoryAgent.js     ← Main AI agent (agentic loop + tool calling)
│   │   └── tools/
│   │       ├── cropKnowledgeTool.js ← Searches crop_diseases.json database
│   │       ├── weatherTool.js       ← OpenWeatherMap API integration
│   │       ├── escalationTool.js    ← Decides if agronomist referral is needed
│   │       └── imageTool.js         ← GPT-4o Vision for crop photo analysis
│   ├── crop_diseases.json           ← Local crop disease knowledge base
│   ├── .env                         ← Environment variables (secrets)
│   ├── vitest.config.js             ← Vitest test configuration
│   └── package.json                 ← Backend dependencies
│
└── e2e/                             ← Playwright End-to-End Tests
    ├── playwright.config.js         ← Playwright configuration
    ├── package.json                 ← E2E test dependencies + scripts
    ├── fixtures/
    │   └── auth.js                  ← Shared signUp/signIn helpers
    └── tests/
        ├── 01-auth-signup.spec.js   ← Sign Up page tests (6 tests)
        ├── 02-auth-signin.spec.js   ← Sign In page tests (8 tests)
        ├── 03-protected-routes.spec.js ← Route guard tests (5 tests)
        ├── 04-chat-ui.spec.js       ← Chat UI tests (13 tests)
        ├── 05-conversations.spec.js ← Conversation management tests (4 tests)
        └── 06-theme-toggle.spec.js  ← Theme toggle tests (5 tests)
```

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│                    http://localhost:3000                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REACT FRONTEND (Vite)                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  SignIn.jsx  │  │  SignUp.jsx  │  │      Chat.jsx        │   │
│  │  (Public)   │  │  (Public)   │  │     (Protected)      │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App.jsx — React Router + PrivateRoute / PublicRoute     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  api.js — Axios (Bearer token + 401 redirect interceptor)│  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP /api/* (proxied by Vite)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXPRESS BACKEND (Node.js)                      │
│                    http://localhost:5000                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware: CORS · JSON Parser · Rate Limiter           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────┐  ┌───────────────────────────────┐   │
│  │   /api/auth/*       │  │         /api/*                │   │
│  │   authRoutes.js     │  │         api.js                │   │
│  │                     │  │                               │   │
│  │  POST /signup       │  │  POST /chat (auth required)   │   │
│  │  POST /signin       │  │  GET  /conversations          │   │
│  │  GET  /profile      │  │  GET  /conversations/:id      │   │
│  └──────────┬──────────┘  │  DELETE /conversations/:id   │   │
│             │             └──────────────┬────────────────┘   │
│             ▼                            ▼                      │
│  ┌──────────────────┐      ┌─────────────────────────────┐    │
│  │  authController  │      │      chatController          │    │
│  │  authService     │      │                             │    │
│  │  (bcrypt + JWT)  │      │  1. Get/Create Conversation │    │
│  └──────────────────┘      │  2. Analyze image (if any)  │    │
│                            │  3. Run advisoryAgent       │    │
│                            │  4. Save to MongoDB         │    │
│                            └──────────────┬──────────────┘    │
│                                           │                     │
│                                           ▼                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  advisoryAgent.js                      │    │
│  │                                                        │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │  Agentic Loop (max 10 tool calls)                │ │    │
│  │  │                                                  │ │    │
│  │  │  Round 1-2: Ask follow-up questions (no tools)   │ │    │
│  │  │  Round 3+:  Call tools → get final answer        │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  │                                                        │    │
│  │  ┌──────────────┐ ┌─────────────┐ ┌───────────────┐  │    │
│  │  │cropKnowledge │ │ weatherTool │ │escalationTool │  │    │
│  │  │    Tool      │ │             │ │               │  │    │
│  │  │Searches JSON │ │OpenWeatherMap│ │Decides if     │  │    │
│  │  │disease DB    │ │API (8 dist.)│ │agronomist     │  │    │
│  │  └──────────────┘ └─────────────┘ │needed         │  │    │
│  │                                   └───────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌──────────────────┐             ┌──────────────────────┐
│    MongoDB       │             │    OpenAI API        │
│  (Atlas Cloud)   │             │   (GPT-4o-mini)      │
│                  │             │                      │
│  users           │             │  Chat completions    │
│  conversations   │             │  Vision (images)     │
│  messages        │             │  Function calling    │
└──────────────────┘             └──────────────────────┘
```

---

## 7. Authentication Flow

```
User fills Sign Up form
        │
        ▼
SignUp.jsx → POST /api/auth/signup
        │
        ▼
authController.signup()
  → Validates: name, username, email, password required
  → Password must be ≥ 6 characters
        │
        ▼
authService.register()
  → Checks: email not already registered
  → Checks: username not already taken
  → Hashes password with bcrypt (10 salt rounds)
  → Creates User in MongoDB
  → Signs JWT token (expires in 7 days)
        │
        ▼
Returns: { user: {...}, token: "eyJ..." }
        │
        ▼
Frontend stores in localStorage:
  auth_token = "eyJ..."
  auth_user  = { name, email, username, district }
        │
        ▼
React Router redirects to "/" (Chat page)
```

Every subsequent API request:
```
api.js interceptor → reads auth_token from localStorage
                   → adds "Authorization: Bearer eyJ..." header
                   → if 401 received → clears storage → redirects to /signin
```

---

## 8. Chat & AI Agent Flow

```
Farmer types a message → clicks Send (or presses Enter)
        │
        ▼
Chat.jsx → POST /api/chat
  Body: { conversationId, message, image?, imageMimeType? }
        │
        ▼
authMiddleware.authenticate()
  → Verifies JWT token
  → Attaches user to req.user
        │
        ▼
chatController.chat()
  │
  ├── If image uploaded:
  │     imageTool.analyzeCropImage()
  │       → Sends base64 image to GPT-4o Vision
  │       → Returns: crop detected, symptoms, likely condition, severity
  │       → Appends analysis to the message text
  │
  ├── Gets or creates Conversation in MongoDB
  │
  └── Calls advisoryAgent.processMessage(message, conversation)
              │
              ▼
        ┌─────────────────────────────────────────┐
        │         AGENTIC LOOP                    │
        │                                         │
        │  Count follow-up rounds already done    │
        │  (rounds = assistant messages with      │
        │   no advisory card yet)                 │
        │                                         │
        │  If rounds < 2:                         │
        │    → Ask follow-up questions            │
        │    → NO tools called yet                │
        │    → Return question to farmer          │
        │                                         │
        │  If rounds ≥ 2:                         │
        │    → Call search_crop_diseases tool     │
        │    → Call get_weather tool (if location)│
        │    → Call check_escalation tool         │
        │    → Generate final diagnosis           │
        │    → Parse advisory card from response  │
        │    → Return answer + advisory object    │
        └─────────────────────────────────────────┘
              │
              ▼
  Saves both messages (user + assistant) to MongoDB
        │
        ▼
Returns to frontend:
  { conversationId, response: { content, advisory } }
        │
        ▼
Chat.jsx renders:
  - User message (green bubble, right side)
  - Bot response (white bubble, left side)
  - Advisory card (if advisory object present)
  - Escalation warning (if escalateToAgronomist: true)
```

---

## 9. The Three AI Tools

### Tool 1 — cropKnowledgeTool.js
Searches the local `crop_diseases.json` database.

```
Input:  crop name + list of symptoms
Process: Filter diseases by crop → Score each disease by symptom match
Output: Top 5 matching diseases with scores
```

The scoring works by counting how many of the farmer's described symptoms match the known symptoms of each disease. The disease with the highest score is the most likely diagnosis.

### Tool 2 — weatherTool.js
Gets real-time weather for Bangladesh districts.

```
Input:  district name (e.g. "Dhaka", "Sylhet")
Process: Calls OpenWeatherMap API with district coordinates
Output: temperature, humidity, rainfall, condition + impact message
```

Supports all 8 major Bangladesh districts with exact GPS coordinates. Falls back to realistic mock data if the API key is missing or the call fails.

### Tool 3 — escalationTool.js
Decides whether the farmer needs to see a professional agronomist.

```
Input:  disease name, confidence, cause type, severity
Process: Checks escalation rules
Output: true (escalate) or false (no escalation needed)
```

Escalation is triggered when:
- Disease severity is **high**
- Diagnosis confidence is **Low**
- Disease cause is **viral or bacterial** (requires lab confirmation)
- Multiple diseases have similar symptom scores (uncertain diagnosis)

---

## 10. Database Schema

### User Collection
```
{
  _id:       ObjectId,
  name:      String (required),
  username:  String (required, unique, lowercase),
  email:     String (required, unique, lowercase),
  password:  String (required, bcrypt hashed, min 6 chars),
  district:  String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Collection
```
{
  _id:      ObjectId,
  userId:   ObjectId → ref: User (indexed for fast lookup),
  title:    String (first 50 chars of first message),
  messages: [
    {
      role:          "user" | "assistant",
      content:       String,
      advisory:      Object | null,
      imageAnalyzed: Boolean,
      createdAt:     Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 11. API Endpoints Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/signin` | No | Login, returns JWT token |
| GET | `/api/auth/profile` | Yes | Get current user profile |

### Chat & Conversations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/chat` | Yes | Send message, get AI response |
| GET | `/api/conversations` | Yes | List all conversations (max 20) |
| GET | `/api/conversations/:id` | Yes | Get full conversation with messages |
| DELETE | `/api/conversations/:id` | Yes | Delete a conversation |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Server health check |

---

## 12. Frontend Routing

```
/signin  → SignIn.jsx   (PublicRoute — redirects to / if logged in)
/signup  → SignUp.jsx   (PublicRoute — redirects to / if logged in)
/        → Chat.jsx     (PrivateRoute — redirects to /signin if not logged in)
/*       → Redirects to /
```

The `PrivateRoute` and `PublicRoute` components in `App.jsx` check `localStorage` for `auth_token` on every navigation. This is a client-side guard — the server also validates the JWT on every protected API call.

---

## 13. Security Implementation

| Security Measure | Implementation |
|---|---|
| Password hashing | bcrypt with 10 salt rounds |
| Authentication | JWT tokens, 7-day expiry |
| Token storage | localStorage (client-side) |
| API protection | Bearer token on every request |
| Rate limiting | 500 requests per 60 seconds (dev), 100/15min (prod) |
| Input validation | Required field checks in controllers |
| CORS | Enabled for cross-origin requests |
| Request size limit | 10MB max (for image uploads) |
| Token auto-cleanup | 401 response clears token and redirects to signin |

---

## 14. Environment Variables

All secrets are stored in `server/.env`:

```env
# AI
OPENAI_API_KEY=...          ← Required for chat and image analysis
OPENAI_MODEL=gpt-4o-mini    ← AI model to use

# Weather
OPENWEATHER_API_KEY=...     ← Optional (falls back to mock data)

# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=...             ← MongoDB Atlas connection string

# Auth
JWT_SECRET=...              ← Secret key for signing JWT tokens
JWT_EXPIRY=7d               ← Token expiry duration

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=500
```

---

## 15. Testing Strategy

### Unit Tests (Vitest)
Located in `server/src/tests/unit/` and `client/src/tests/unit/`

Tests individual functions in isolation:
- `authController.test.js` — signup/signin validation logic
- `authService.test.js` — register/login/JWT functions
- `authMiddleware.test.js` — token verification
- `chatController.test.js` — chat request handling
- `advisoryAgent.test.js` — AI agent logic
- `cropKnowledgeTool.test.js` — disease search and scoring
- `escalationTool.test.js` — escalation decision rules
- `weatherTool.test.js` — weather data fetching

Run with:
```bash
cd server && npm test
cd client && npm test
```

### End-to-End Tests (Playwright)
Located in `e2e/tests/`

Tests the full application in a real browser — 41 tests across 6 files:

| File | Tests | What it covers |
|---|---|---|
| 01-auth-signup.spec.js | 6 | Registration form, validation, redirect |
| 02-auth-signin.spec.js | 8 | Login form, errors, token storage |
| 03-protected-routes.spec.js | 5 | Route guards, logout |
| 04-chat-ui.spec.js | 13 | Chat interface, sidebar, messaging |
| 05-conversations.spec.js | 4 | Create, view, delete conversations |
| 06-theme-toggle.spec.js | 5 | Dark/light mode switching |

Run with:
```bash
cd e2e
npm test                  # Headless (fastest)
npm run dev:head          # Visible browser
npm run dev:slow          # Visible browser, 800ms delay
npm run dev:very-slow     # Visible browser, 3000ms delay
npm run test:report       # Open HTML report
```

---

## 16. How to Run the Project

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas cloud)
- OpenAI API key

### Step 1 — Start the Backend
```bash
cd agrobot-bd/server
npm install
npm run dev
```
Server starts at `http://localhost:5000`

### Step 2 — Start the Frontend
```bash
cd agrobot-bd/client
npm install
npm run dev
```
App opens at `http://localhost:3000`

### Step 3 — Run E2E Tests (optional)
```bash
cd agrobot-bd/e2e
npm run dev:very-slow
```

---

## 17. Data Flow Summary

```
Farmer opens browser
    → Visits http://localhost:3000
    → React Router checks localStorage for auth_token
    → No token → redirected to /signin

Farmer registers
    → Fills form → POST /api/auth/signup
    → Server creates user in MongoDB, returns JWT
    → Token saved to localStorage
    → Redirected to /  (Chat page)

Farmer sends a message
    → Chat.jsx → POST /api/chat with Bearer token
    → authMiddleware verifies JWT
    → chatController creates/finds Conversation in MongoDB
    → advisoryAgent starts agentic loop:
        Round 1: GPT asks follow-up questions
        Round 2: GPT asks more follow-up questions
        Round 3: GPT calls tools (crop DB + weather + escalation)
        GPT generates final diagnosis
    → Response saved to MongoDB
    → Frontend renders bot message + advisory card

Farmer uploads a photo
    → Image converted to base64 in browser
    → Sent with POST /api/chat
    → imageTool sends to GPT-4o Vision
    → Vision returns: crop, symptoms, condition, severity
    → This analysis is added to the message text
    → Same agentic flow continues from there
```

---

## 18. Summary for Management

AgroBot BD is a production-ready AI web application built with modern technologies. It uses a **React frontend** served by Vite, an **Express.js backend** on Node.js, **MongoDB Atlas** for cloud database storage, and **OpenAI's GPT-4o-mini** model for intelligent crop disease diagnosis.

The AI component is not a simple chatbot — it uses an **agentic architecture** where the AI model decides when to call external tools (crop database search, weather API, escalation checker) and when to ask the farmer follow-up questions before giving a final diagnosis. This ensures the advice is accurate and contextually relevant.

The application is fully tested at two levels: **unit tests** (Vitest) for individual functions, and **end-to-end tests** (Playwright) that simulate real user behavior in a browser. The E2E suite covers 41 test cases across all major user flows.
