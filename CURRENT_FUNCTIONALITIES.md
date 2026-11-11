# GovGuide - Current Functionalities

This document outlines the features and systems that are currently fully implemented and working in the GovGuide project.

## 🎨 1. Frontend & UI System (React + Vite + Tailwind)
- **Design System:** A cohesive, premium design system featuring a customized tricolor palette (Navy, Saffron, Green) inspired by the Indian flag.
- **Theme Support:** Fully functional Light and Dark mode toggle that persists user preference.
- **Typography:** Standardized across the application using the "Open Sans" font family for clean, modern readability.
- **Custom Branding:** Bespoke SVG logos (including dark mode, monochrome, and favicon variants) designed explicitly for GovGuide, integrated directly into the UI.
- **Routing:** Client-side routing set up via `react-router-dom` with placeholder pages ready for all major sections (Home, About, Schemes, Categories, Profile).
- **Landing Page:** A highly polished `HomePage` featuring a Hero section, "How it Works" cards, Featured Categories, and Trust/Official Source sections.

## 🔐 2. Authentication Flow (End-to-End)
- **Registration (`RegisterPage`):** 
  - Form validation for name, email, password strength, and password confirmation.
  - Submits data to the backend via a proxied API call (`POST /api/auth/register`).
  - Seamless redirection to the login page upon successful account creation with a success banner.
- **Login (`LoginPage`):**
  - Form validation and loading states to prevent duplicate submissions.
  - Authenticates user credentials against the backend database (`POST /api/auth/login`).
  - **Token Management:** Successfully receives and stores the JSON Web Token (JWT) in the browser's `localStorage` to maintain the user's session.
  - Automatically redirects authenticated users into the application (e.g., Profile page).
- **API Proxy:** Vite development server is configured to seamlessly proxy frontend `/api` requests to the local backend on port 5000, preventing CORS issues.

## ⚙️ 3. Backend Architecture (Node.js + Express + MongoDB)
- **Server Setup:** Express server running on port 5000 with CORS and JSON parsing enabled.
- **Database Connection:** Active connection to MongoDB for persistent data storage.
- **Database Models:** Mongoose schemas created for:
  - `User`: Stores authentication credentials and demographic profile data.
  - `Scheme`: Stores government scheme details (title, description, category, state vs. central).
  - `EligibilityRule`: Stores the complex demographic requirements needed to qualify for a scheme.
  - `Application`: Tracks user saved/applied schemes.
- **API Routes & Controllers:**
  - `/api/auth`: fully functional endpoints for user registration and login.
  - `/api/profile`: Endpoints built to handle user profile creation/updates.
  - `/api/schemes`: Endpoints built to fetch and filter scheme data.
  - `/api/eligibility`: Controller logic ready to calculate matching schemes based on a user's demographics.

---

## 🎯 4. Integrated Features (Fully Completed)
1. **Dynamic Schemes (`/schemes` & `/schemes/:id`):** Live fetching from `/api/schemes` and `/api/schemes/:id`, with multi-parameter filtering (Category, Level, Indian State) and instant client-side keyword search.
2. **Profile Questionnaire UI (`/profile`):** Interactive questionnaire for age, gender, state, district, annual income, occupation, education, and category, communicating directly with `/api/profile`.
3. **Eligibility Engine (`/eligible`):** Deterministic rules-based calculation via `/api/eligibility` showing qualification status, passing checks, and granular ineligibility reasons.
4. **Saved Schemes & Bookmarking (`/saved`):** Full end-to-end bookmarking with optimistic updates, navbar count badges, and persistence via `/api/saved`.
5. **Auxiliary Pages (`/about`, `/categories`, `/how-it-works`):** Professional mission overview, 9 sector categories with live scheme count sync & deep-links, and transparent 6-step citizen journey roadmap.
6. **Application Lifecycle Tracking (`/applications`):** Stage tracking (`saved`, `in-progress`, `submitted`, `approved`, `rejected`), inline stage switching, personal reminders/notes editor, date recording, and strict user ownership isolation.
7. **Backend Security & Data Quality (Phase 4):**
   - Protected Scheme mutation endpoints (`POST`, `PUT`, `DELETE /api/schemes`) with `authMiddleware` and `adminMiddleware`.
   - Comprehensive input validation & sanitization for auth, profile, schemes, and applications.
   - Brute-force rate limiting on auth endpoints and HTTP security headers.
   - Case-insensitive, robust demographic eligibility calculation engine with clear reasons.
   - Comprehensive seed dataset covering all 9 supported sectors across Central and State government levels with 100% paired EligibilityRules.

---

## 🌟 5. Bihar Welfare Revamp & Flagship Specialization (Fully Completed)
- **Bihar Flagship Catalog:** Comprehensive dataset of 32+ verified schemes covering:
  - **Saat Nischay / 7-Nischay:** Bihar Student Credit Card Scheme (BSCCS), Swayam Sahayata Bhatta (SHA), Kushal Yuva Program (KYP), Har Ghar Nal Ka Jal, etc.
  - **Women & Child:** Mukhyamantri Kanya Utthan (Graduation & 10+2), 10th Protsahan, Balika Cycle, Laxmibai Samajik Suraksha Pension, Kanya Vivah.
  - **Entrepreneurship & Youth:** Mukhyamantri SC/ST, EBC, Mahila, and Yuva Udyami Yojanas (₹10 Lakh assistance: 50% grant + 50% interest-free loan), Civil Seva Protsahan (BPSC ₹50,000, UPSC ₹1,00,000).
  - **Social Security & Senior Citizens:** Mukhyamantri Vridhjan Pension Yojana (MVPY), Bihar Rajya Divyang Pension, Pravasi Mazdoor Durghatna Anudan.
  - **Agriculture & Rural:** Krishi Input Anudan, Diesel Anudan, Krishi Yantrikaran (Farm Mechanization), Jeevika (BRLPS), Gram Parivahan.
  - **Central Schemes in Bihar:** PM-KISAN, PMAY-G, Ayushman Bharat PM-JAY, PM SVANidhi, PM Mudra, Sukanya Samriddhi.
- **Dedicated Bihar Branding:** GovGuide Bihar (बिहार जन-कल्याण पोर्टल), default district selectors (all 38 districts of Bihar), official lifeline links (ServicePlus RTPS, Medhasoft e-Kalyan, 7-Nischay MNSSBY, DBT Agriculture, Udyami Bihar).

## 🤖 6. AI Conversational Assistant - GovGuide Bihar Saathi (बिहार सारथी)
- **FastAPI + Qdrant Microservice:** High-performance vector RAG pipeline indexing 180 semantic chunks with `gemini-embedding-001` (768 dimensions).
- **Gemini 3.5 Flash Engine:** Multi-turn conversational memory, intelligent fallback mechanism, and strict domain guardrails preventing hallucinations or out-of-scope misuse.
- **Bihar Administrative Context:** Provides localized guidance for DRCC document verification, RTPS ServicePlus online certificates, Medhasoft scholarships, and direct clickable scheme citations.

---

## 🚧 Upcoming Roadmap
1. **Multilingual Regional Expansion:** Additional regional Indian dialects and speech-to-text / text-to-speech support.
2. **Production Containerization:** Multi-container Docker compose deployment for Backend, Frontend, and AI microservices.

*(For the complete comprehensive project breakdown, architecture diagram, and API matrix, refer to [PROJECT_STATUS.md](file:///c:/Users/kisho/Desktop/govguide/PROJECT_STATUS.md).)*
