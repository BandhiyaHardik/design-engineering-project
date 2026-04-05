# BVM Campus Management — Event Platform

**The open-source operating system for college communities.**

BVM Campus Management helps colleges discover, register, and manage campus events — from hackathons and workshops to cultural fests and tech talks.

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** for animations

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install and start backend
cd server
npm install
cp .env.example .env
npm run start

# In a new terminal: install and start frontend
cd ../client
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the app.

Important notes:

- Backend must be running on port `5000` in development.
- If using MongoDB Atlas, whitelist your current IP in Atlas Network Access.
- For hosted frontend, set `VITE_API_BASE_URL` to your deployed backend API URL.

## Features

- 🔍 **Discovery** — Browse and search campus events by category
- 📝 **Registration** — Register with QR ticket, waitlist support, conflict detection
- 🏛️ **Multi-Org** — Support for multiple colleges, each managing their own data
- 🎪 **Fest Management** — Parent events with sub-events (e.g., TechFest with 10+ sub-events)
- 🛡️ **Role Access** — Super Admin → Org Admin → Club Admin → Organizer → Student
- 📊 **Dashboard** — Organizer dashboard with analytics, attendance tracking
- 📷 **QR Attendance** — Scan-based check-in for events

## Deployment

Build for production:

```sh
npm run build
```

The `dist/` folder contains the production-ready static files.

## Contributing

This is an open-source project. PRs and issues are welcome!

---

Built with ❤️ by **Team Duo Ignited** · BVM Engineering College · 2026
