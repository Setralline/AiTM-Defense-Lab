# Phishing Defense Lab (AiTM Research Platform)

**Master's Thesis Project | Osamah Amer (2026)**
*Adversary-in-the-Middle (AiTM) Attack Analysis & Defense*

The **Phishing Defense Lab** is a full-stack simulation environment designed to analyze the mechanics of modern phishing attacks—specifically Reverse Proxy (AiTM) attacks like *Evilginx2*—and evaluate the efficacy of various defense mechanisms.

Unlike standard vulnerable web applications (e.g., DVWA), this platform focuses exclusively on **Authentication Security**, providing a comparative analysis of legacy protocols vs. hardware-bound credentials (FIDO2/WebAuthn).

---

##  System Architecture

The project follows a decoupled microservices-ready architecture, containerized for consistent deployment:

* **Client (Victim UI)**: A React/Vite Single Page Application (SPA) simulating an enterprise portal. It implements active client-side defenses (DOM analysis) and hardware interactions.
* **Backend (Security Engine)**: A Node.js/Express API that handles session management, cryptographic challenges (WebAuthn), and active threat detection (Header Analysis).
* **Database**: PostgreSQL for persistent user storage and an active "Token Blacklist" for immediate session revocation.
* **Infrastructure**: Nginx (Reverse Proxy) and Docker Compose for orchestration.

---

##  Research Scenarios (Levels)

The laboratory is structured into five distinct levels, each representing a specific paradigm of web security:

### Vulnerable Implementations
These levels simulate common configurations susceptible to credential harvesting and session hijacking.

* **Level 1: Legacy Authentication (Cookies)**
    * **Protocol**: State-based sessions using `HttpOnly` cookies.
    * **Vulnerability**: Cookies are automatically forwarded by reverse proxies, allowing attackers to hijack sessions without knowing the password.
* **Level 2: Modern SPA (JWT)**
    * **Protocol**: Stateless JSON Web Tokens.
    * **Vulnerability**: Vulnerable to token theft via XSS or AiTM interception during the initial handshake.

### Defended Implementations
These levels implement specific countermeasures to detect or block proxy traffic.

* **Level 3: Server-Side Heuristics**
    * **Defense**: Inspects HTTP headers (`Host`, `X-Forwarded-For`) to detect discrepancies between the client's intended destination and the actual request origin.
* **Level 4: Client-Side Integrity (Domain Guard)**
    * **Defense**: JavaScript execution in the browser verifies `window.location.hostname` against a whitelist, neutralizing the attack if the domain does not match the legitimate service.

### Immune Implementation
* **Level 5: Hardware-Bound Authentication (FIDO2)**
    * **Defense**: Uses WebAuthn/FIDO2 to cryptographically bind the authentication ceremony to the origin. This renders the attack mathematically impossible for an AiTM proxy, as it cannot forge the origin signature.

---

## Installation & Deployment

### Option 1: Production Simulation (Docker) - Recommended
This method spins up the Database, Backend, and Nginx Client in a unified network, simulating a real-world production environment.

1.  **Prerequisites**: Ensure Docker and Docker Compose are installed.
2.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
3.  **Access**:
    * Application: `http://localhost` (Served via Nginx on Port 80)
    * API Direct: `http://localhost:5000`

### Option 2: Local Development
For active code modification and debugging.

1.  **Database**: Ensure PostgreSQL is running locally on port `5432`.
2.  **Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
3.  **Client**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
4.  **Access**:
    * Application: `http://localhost:5173`
    * API: `http://localhost:5000`

---

## 🔧 Technical Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite | High-performance UI with "Security-Ops" theme. |
| **Backend** | Node.js, Express | REST API with layered security middleware. |
| **Database** | PostgreSQL | Relational data and session blacklisting. |
| **Auth** | SimpleWebAuthn | FIDO2/WebAuthn server-side implementation. |
| **Security** | BCrypt, JWT | Standard cryptographic primitives. |
| **DevOps** | Docker, Nginx | Containerization and reverse proxying. |

---

## Project Structure

```text
/
├── backend/            # Server-side logic, API, and Database Models
│   ├── controllers/    # Auth logic for Levels 1-5
│   ├── middleware/     # Security checks (Blacklist, ProxyDetect)
│   └── models/         # SQL interactions
├── client/             # Frontend React Application
│   ├── src/pages/      # Views for each Level
│   ├── src/services/   # Auth Service & Axios Config
│   └── src/components/ # Reusable UI elements
├── docker-compose.yml  # Container orchestration
└── README.md           # Documentation

```

---

## Disclaimer

This software is a research prototype developed for educational and academic purposes. It contains code designed to demonstrate vulnerabilities. Do not deploy the vulnerable configurations (Levels 1 & 2) in a production environment exposed to the public internet without proper firewalling.

