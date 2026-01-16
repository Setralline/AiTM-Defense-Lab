# Phishing Defense Lab (AiTM Simulation)

<div align="center">
<img src="./client/src/assets/logo.svg" alt="App Icon" width="120" />
</div>

**Master's Thesis Project by Osamah Amer (2026)**

Welcome to the central repository for the Phishing Defense Lab. This project is a controlled environment designed to simulate and analyze modern **Adversary-in-the-Middle (AiTM)** attacks, specifically focusing on how reverse proxies like Evilginx2 interact with different authentication levels.



---

## Deployment & Installation

This project is modular. For detailed installation, database schema configuration, and environment setup, please refer to the specific documentation located in each module:

* **Backend & Database:** [Read Backend Documentation](./backend/README.MD)
    * *Covers: Node.js API setup, PostgreSQL schema, and environment variables.*
* **Client Interface:** [Read Client Documentation](./client/README.MD)
    * *Covers: React 19 setup, dependencies, and development server.*

---

## Project Structure

This laboratory is architected into two distinct tiers:

* **[Backend API (Node.js/Express)](./backend/README.MD):** Handles the core security logic, including Hybrid Auth strategies, global rate limiting, and the **Active Session Revocation** engine.
* **[Client Interface (React 19)](./client/README.MD):** A modern dashboard that acts as the "victim" application. It implements specific vulnerabilities (XSS surfaces in Level 2) and defenses (HttpOnly Cookies in Level 1) to test AiTM resilience.

---

## Lab Missions

* **Level 1 (Legacy/Cookies):** Simulates enterprise environments using `application/x-www-form-urlencoded` payloads and **HttpOnly cookies**. This level tests defenses against XSS but remains vulnerable to proxy-based session cookie theft.
* **Level 2 (Modern/Tokens):** Simulates modern SPA authentication using `application/json` payloads and **JWTs stored in LocalStorage**. This level allows for testing token theft via XSS and analyzing the efficacy of short-lived tokens.
* **MFA Module:** Integrated TOTP logic to analyze how multi-factor authentication acts as a secondary barrier against real-time session hijacking.

---

## Key Security Features

* **Active Session Revocation (Blacklisting):** Unlike standard stateless JWT implementations, this lab features a server-side revocation list. Upon logout, session identifiers are blacklisted in PostgreSQL, neutralizing stolen tokens immediately.
* **Hybrid Protocol Support:** The architecture dynamically handles diverse data streams—enforcing `x-www-form-urlencoded` for legacy tiers and `application/json` for modern tiers—to accurately simulate heterogeneous corporate environments.
* **Synchronized Termination Logic:** Implements a robust "Kill Switch" protocol that simultaneously purges client-side storage and invokes server-side revocation, ensuring total session death across the network.

---

## Future Roadmap

* **Evilginx & Proxy Fingerprinting:** Detecting reverse proxies via TLS fingerprinting and header analysis.
* **HTTP Header Security:** Identifying unauthorized `X-Forwarded-For` anomalies.
* **Base URI Detection:** Detecting DOM-based phishing injections via JavaScript.

---

## ⚠️ Disclaimer

This software is developed strictly for **educational and research purposes** as part of a Master's Thesis. It contains intentional configurations to simulate vulnerabilities. Please use it responsibly within a controlled, isolated environment.

---

### Tags
`cybersecurity` `phishing-simulation` `aitm-defense` `mfa-bypass` `evilginx-analysis` `react19` `node-js` `master-thesis`