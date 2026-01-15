# Phishing Defense Lab (AiTM Simulation)

<div align="center">
<img src="./client/src/assets/logo.svg" alt="App Icon" width="120" />
</div>

**Master's Thesis Project by Osamah Amer (2026)**

Welcome to the central repository for the Phishing Defense Lab. This project is a controlled environment designed to simulate and analyze modern Adversary-in-the-Middle (AiTM) attacks, specifically focusing on how reverse proxies like Evilginx2 interact with different authentication levels.

---

## Quick Start Guide

To get the lab up and running, you need to set up the database first, then launch the backend and frontend.

### 1. Database Setup (PostgreSQL)

Before running the code, create the environment for your data:

1. **Create Database:** Use your PostgreSQL terminal to create a database named `phishing_lab_db`.
2. **Run Schema:** Create the necessary tables including `users` and `token_blacklist`.
3. **Add Admin:** Insert a default user for immediate access:
`INSERT INTO users (email, password, name) VALUES ('admin@lab.com', 'password123', 'White Hat Hacker');`

### 2. Backend Setup

1. Navigate to the `/backend` folder: `cd backend`.
2. Install dependencies: `npm install`.
3. Configure your environment: Create a `.env` file with your database credentials.
4. Launch: `npm run dev`.

### 3. Client Setup

1. Open a new terminal and navigate to the `/client` folder: `cd client`.
2. Install dependencies: `npm install`.
3. Launch the interface: `npm run dev`.
4. Access the lab at: `http://localhost:5173`.

---

## Project Structure

This laboratory is split into two main sections:

* **[Backend API](./backend/README.MD):** Built with Node.js/Express. Manages secure sessions, JWT generation, and the server-side revocation logic.
* **[Client Interface](./client/README.MD):** A modern React 19 dashboard that acts as the "victim" application, featuring real-time security state management.

---

## Lab Missions

* **Level 1 (Legacy/Cookies):** Simulates legacy authentication using `application/x-www-form-urlencoded` payloads and HttpOnly cookies.
* **Level 2 (Modern/Tokens):** Simulates modern SPA authentication using `application/json` payloads and JWT tokens stored in LocalStorage.
* **MFA Module:** Analyzes how TOTP adds a critical layer of defense against real-time session hijacking.

---

## Key Security Features

* **Active Session Revocation (Blacklisting):** Implements a centralized server-side blacklist for both JWTs and Cookies. This ensures that session termination is absolute, neutralizing stolen tokens even before their expiration.
* **Hybrid Protocol Support:** Successfully handles diverse data streams (URL-encoded vs JSON) to simulate heterogeneous corporate environments and test middleware resilience.
* **HttpOnly Session Protection:** Level 1 utilizes strict cookie attributes to mitigate XSS-based session theft, isolating the research focus to AiTM/Proxy-based attacks.
* **Synchronized Termination Logic:** A robust "Terminate Session" protocol that purges client-side storage while simultaneously revoking the session identifier on the server.

---

## Future Roadmap

* **Evilginx & Proxy Fingerprinting:** Detecting reverse proxies via header analysis.
* **HTTP Header Security:** Identifying unauthorized `X-Forwarded-For` patterns.
* **Base URI Detection:** Catching DOM-based phishing injections.

---

## Disclaimer

This software is strictly for **educational and research purposes**. It was developed as part of a Master's Thesis to study defense mechanisms. Please use it responsibly in a controlled environment.

---

### Tags

`cybersecurity` `phishing-simulation` `aitm-defense` `mfa-bypass` `evilginx-analysis` `react19` `node-js` `master-thesis`
