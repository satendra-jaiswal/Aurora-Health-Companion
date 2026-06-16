# 🌌 Aurora – Mobile Health Companion MVP

**Aurora** is a modern, premium, and calm AI-powered mobile health companion designed to help users understand their health metrics rather than just collecting data. Built for the Humanity Founders Hackathon, this mobile MVP is structured as a monorepo containing a **React Native + Expo** front-end client and a **Node.js Express + SQLite** backend integration.

---

## 🚀 Key Features

*   **🎙️ Agentic Health Companion (Core Feature):**
    *   Natural language text and audio conversation interface.
    *   Features a glowing, pulsing "Aurora Orb" UI animation reacting to listening, thinking, and speaking states.
    *   Uses **Google Gemini Function Calling (Tool Use)** to execute database logs (e.g. logging water, sleep, habits) directly from user conversations.
    *   Speaks conversational health insights back to the user using device-level Text-to-Speech (TTS).
*   **📱 Frictionless Authentication & Onboarding:**
    *   A premium landing slide deck introducing the companion's metrics.
    *   A beautiful dark themed authentication overlay (Sign In, Sign Up, Google/Apple SSO mockups).
    *   Interactive multi-step questionnaire collecting personal metrics (Height, Weight, Schedules, and target Health Goals).
*   **📊 Home Dashboard:**
    *   Unified summary card grid for Hydration, Sleep, Habits, and Nutrition.
    *   Dynamic AI daily advice insight card.
    *   Streaks and achievements counters to incentivize consistency.
    *   Companion long-term memory panel displaying observations recorded about user behavior.
*   **💧 Hydration Module:**
    *   A visually responsive virtual water bottle that fills up dynamically using gradient transitions based on daily water progress.
    *   Quick logging presets (+250ml cup, +500ml glass, +750ml bottle) and custom amount entry.
*   **🌙 Sleep Center:**
    *   Custom weekly sleep duration bar chart with sleep quality indicator ratings.
    *   Simple stepper inputs to log durations and sleep quality (1-5 stars).
*   **✅ Habits Checklist:**
    *   Optimistic check/uncheck updates for daily routines.
    *   Custom habit creation panel with specialized category icons.
*   **🍳 Nutrition Awareness:**
    *   Describe your meal in plain text (e.g. *"three scrambled eggs and buttered toast"*) $\rightarrow$ Gemini parses the description to estimate macro values (Calories, Protein, Carbs, Fat) and logs it.
    *   Manual macro logging overrides.

---

## 🛠️ Codebase Structure

```bash
├── app/                  # React Native Expo Frontend
│   ├── src/
│   │   ├── app/          # Expo Router page screens (Dashboard, Hydration, Sleep, Companion, Onboarding, etc.)
│   │   ├── components/   # UI widgets and custom tab bar bindings
│   │   ├── constants/    # API endpoints and color themes
│   └── package.json
├── server/               # Express Node.js Backend API
│   ├── server.js         # Entry point server wrapper
│   ├── routes.js         # REST endpoints for water, sleep, habits, nutrition, and chat
│   ├── db.js             # SQLite initialization and SQL helper utilities
│   ├── agent.js          # Gemini function calling and tool implementation dispatching
│   ├── test_all.js       # End-to-end programmatic integration test suite
│   └── package.json
└── .gitignore            # Workspace ignore configuration
```

---

## ⚙️ Running Locally

### Prerequisites
*   **Node.js** (v18.0+)
*   **npm** or **yarn**

### 1. Set Up and Run the Backend API
1. Navigate to the `/server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/server` directory and add your Gemini API Key (optional; backend has a robust keyword parsing fallback if empty):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```
4. Start the server in watch/dev mode:
   ```bash
   npm run dev
   ```
5. Confirm the server is running by opening `http://localhost:3000/status` in your browser.

### 2. Set Up and Run the Mobile App
1. Navigate to the `/app` directory:
   ```bash
   cd ../app
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Expo developer server:
   ```bash
   npx expo start
   ```
4. **Run on Device (Recommended):** Download the **Expo Go** application on your physical device and scan the QR code displayed in the terminal.
5. **Run on Emulator:** Press `a` for Android Emulator or `i` for iOS Simulator (requires macOS).

---

## 🧪 Testing the Integration

We have built a programmatic integration test suite that tests all endpoints, database connections, and AI tool dispatches with a single command. 

1. Ensure the server is running (`npm run dev`).
2. Open a terminal in `/server` and run:
   ```bash
   node test_all.js
   ```
3. This will test and print confirmation for:
   *   Server status ping
   *   User profile onboarding database inserts
   *   Profile retrival updates
   *   Water & sleep logging
   *   Custom habit creation & toggling completeness
   *   AI Nutrition Macro Estimation
   *   AI Agentic chat tool dispatching (processes natural text *"I drank 250ml water"*, invokes database log, and generates speech responses).
   *   Dashboard metrics aggregation sync
