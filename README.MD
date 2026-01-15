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
2. **Run Schema:** Execute the SQL commands found in the **Database Setup** section of the [Backend README](./backend/README.MD) to create the `users` table.
3. **Add Admin:** Insert a default user so you can log in immediately:
`INSERT INTO users (email, password, name) VALUES ('admin@lab.com', 'password123', 'White Hat Hacker');`

### 2. Backend Setup

1. Navigate to the `/backend` folder: `cd backend`.
2. Install dependencies: `npm install`.
3. Configure your environment: Create a `.env` file with your database credentials (check [Backend README](./backend/README.MD) for the template).
4. Launch: `npm run dev`.

### 3. Client Setup

1. Open a new terminal and navigate to the `/client` folder: `cd client`.
2. Install dependencies: `npm install`.
3. Launch the interface: `npm run dev`.
4. Access the lab at: `http://localhost:5173`.

---

## Project Structure

This laboratory is split into two main sections for better organization:

* **[Backend API](./backend/README.MD):** Built with Node.js and Express. It manages secure sessions, JWT tokens, and the MFA (TOTP) logic.
* **[Client Interface](./client/README.MD):** A modern React 19 dashboard that acts as the "victim" application, featuring real-time security updates and mission-based levels.

---

## Lab Missions

Once the project is running, you can test the following:

* **Level 1 (Cookies):** Simulates legacy authentication using HttpOnly cookies.
* **Level 2 (Tokens):** Simulates modern SPA authentication using JWT.
* **MFA Module:** Enable Multi-Factor Authentication in the dashboard to test how TOTP adds a layer of defense against session hijacking.

---

## Future Roadmap

This lab is designed to be extensible. We plan to add more modules in the future covering:

* **Evilginx & Proxy Fingerprinting:** Detecting reverse proxies via header analysis.
* **HTTP Header Security:** Identifying unauthorized `X-Forwarded-For` patterns.
* **Base URI Detection:** Catching DOM-based phishing injections.

---

## Disclaimer

This software is strictly for **educational and research purposes**. It was developed as part of a Master's Thesis to study defense mechanisms. Please use it responsibly in a controlled environment.

---

### Tags

`cybersecurity` `phishing-simulation` `aitm-defense` `mfa-bypass` `evilginx-analysis` `react19` `node-js` `master-thesis`
