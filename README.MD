# Phishing Defense Lab (AiTM Simulation)

<div align="center">
<img src="./client/src/assets/logo.svg" alt="App Icon" width="120" />
</div>

**Master's Thesis Project by Osamah Amer (2026)**

Welcome to the central repository for the Phishing Defense Lab. This project is a controlled environment designed to simulate and analyze modern **Adversary-in-the-Middle (AiTM)** attacks, specifically focusing on how reverse proxies like Evilginx2 interact with different authentication levels.

---

## Deployment via Docker

This project is fully containerized to ensure consistency across development and production environments. Using **Docker Compose**, you can spin up the Frontend (React/Nginx), Backend (Node.js), and Database (PostgreSQL) with a single command.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed (for local run).
* **AWS EC2** instance (for production).

### 1. Run Locally (Development & Testing)
This will build the images and start the services on a unified network. Nginx will serve the application on port `80`.

```bash
# Start all services in detached mode
docker-compose up --build -d

# View logs (optional)
docker-compose logs -f

```

> **Access the Lab:** Open your browser and navigate to `http://localhost`

### 2. Run in Production (AWS/VPS) - Automated

For production deployment with SSL (HTTPS) and auto-configuration, we provide an automated script.

**⚠️ Prerequisite:**
Before running the script, ensure you have:

1. Associated an **Elastic IP** with your AWS EC2 instance.
2. Linked your **Domain Name** (A Record) to that Elastic IP in your DNS provider (e.g., Namecheap).

**Deployment Steps:**
Simply run the included setup script. It will handle System Updates, Docker Installation, SSL Certificates (Let's Encrypt), and Nginx Configuration automatically.

```bash
# 1. Give execution permission (first time only)
chmod +x setup.sh

# 2. Run the script
./setup.sh

```

> The script will ask for your domain name and configure the entire lab automatically.

### 3. Stop the Environment

To stop all containers and remove the network:

```bash
docker-compose down

```

---

## Automated Testing & QA

This project maintains rigorous quality standards using a CI/CD pipeline (GitHub Actions). You can also run these tests locally to verify system integrity.

### Backend Security Tests (Jest & Supertest)

Validates the API endpoints, authentication logic (Level 1 vs Level 2), and database interactions.

```bash
cd backend
npm test

```

### Client E2E Tests (Playwright)

Simulates a real user navigating through the application. It verifies that critical attack surfaces (Login Forms, Dashboard) are rendered correctly.

```bash
cd client
# Install browsers (first time only)
npx playwright install

# Run the navigation tests
npx playwright test

```

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

