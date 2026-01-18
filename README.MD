# Backend API - Phishing Defense Lab

**Master's Thesis Component | Osamah Amer (2026)**

The Backend API serves as the core security engine for the Phishing Defense Lab. Built on Node.js and Express, it implements a **Layered Architecture** to simulate various authentication protocols—ranging from vulnerable legacy systems to robust, hardware-bound defenses (FIDO2).

Unlike standard web applications, this backend is specifically engineered to analyze **Adversary-in-the-Middle (AiTM)** attacks. It features a custom "Active Revocation" system that allows for the immediate neutralization of stolen session identifiers, a critical defense mechanism against modern phishing proxies like Evilginx2.

---

## System Architecture

The application follows a strict **Separation of Concerns (SoC)** design pattern to ensure maintainability and security auditing:

* **Config Layer:** Centralized environment configuration (`config/env.js`) to prevent secret leakage and ensure consistency across the application.
* **Controller Layer:** Handles the business logic for different authentication "Levels" (Legacy, Modern, FIDO).
* **Model Layer:** Encapsulates direct SQL interactions with PostgreSQL, preventing SQL injection via parameterized queries.
* **Security Middleware:** Intercepts requests to enforce rate limiting, proxy detection, and session validity checks.

---

## Core Security Features

### 1. Hybrid Authentication Protocols
The system simultaneously supports multiple authentication standards to simulate real-world heterogeneous environments:
* **Level 1 (Legacy):** Stateful session management using `HttpOnly` cookies.
* **Level 2 (Modern):** Stateless-style authentication using JSON Web Tokens (JWT).
* **Level 5 (FIDO2):** Hardware-bound passwordless authentication using WebAuthn.

### 2. Active Session Revocation (ASR)
Standard JWT implementations are stateless and difficult to revoke without key rotation. This project implements a **Database-Backed Blacklist** (`token_blacklist` table). When a user logs out or a threat is detected:
1.  The specific token signature is hashed and stored in PostgreSQL.
2.  The `checkBlacklist` middleware intercepts all subsequent requests.
3.  Even if an attacker possesses a valid, unexpired token (stolen via AiTM), the server rejects it immediately.

### 3. AiTM & Proxy Defense
* **Host Header Analysis:** The `detectProxy` middleware inspects the `Host` header to identify discrepancies common in reverse proxy attacks.
* **Origin Binding:** FIDO2 credentials are cryptographically bound to the origin domain, rendering relayed challenges useless to an attacker.

---

## Technical Stack

* **Runtime:** Node.js (v20 LTS)
* **Framework:** Express.js
* **Database:** PostgreSQL 15
* **Cryptography:** `bcryptjs` (Hashing), `jsonwebtoken` (Signing), `@simplewebauthn/server` (FIDO2)
* **Testing:** Jest & Supertest

---

## Setup & Installation

### Prerequisites
* Node.js v18+ installed.
* PostgreSQL running locally or via Docker.

### 1. Install Dependencies
Navigate to the backend directory and install the required packages:

```bash
cd backend
npm install

```

### 2. Environment Configuration

Create a `.env` file in the root of the backend directory. You can copy the structure from the provided example:

```env
PORT=5000
NODE_ENV=development

# Database Connection
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_NAME=phishing_lab_db
DB_PORT=5432

# Security Secrets
JWT_SECRET=complex_random_string_for_signing_tokens
RP_ID=localhost
CORS_ORIGIN=http://localhost:5173

```

### 3. Database Initialization

The system includes an auto-initialization script. When you start the server, it will automatically check for the existence of the admin account and necessary tables.

```bash
# Start the server in development mode
npm run dev

```

---

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/auth/level1` | Legacy login. Returns `HttpOnly` cookie. |
| **POST** | `/auth/level2` | Modern login. Returns JWT in JSON body. |
| **GET** | `/auth/me` | Validates session and returns user profile. Protected by Blacklist. |
| **POST** | `/auth/logout` | Terminates session and adds token to the Blacklist. |
| **POST** | `/auth/fido/register/start` | Initiates WebAuthn registration ceremony. |
| **POST** | `/auth/fido/login/start` | Initiates WebAuthn authentication ceremony. |

---

## Testing

The project includes a comprehensive test suite covering API integration and security logic.

```bash
# Run all security tests
npm test

```

Specific security verification scripts are also available in the `utils/` folder to simulate replay attacks:

```bash
# Verify Cookie Replay Defense
node utils/test-security.js

# Verify JWT Replay Defense
node utils/test-security-level2.js

```

---

## Disclaimer

This software is a research prototype developed for educational purposes. It demonstrates both vulnerabilities and defenses. Do not use the attack simulation components on networks or systems you do not own or have explicit permission to test.


