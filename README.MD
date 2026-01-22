<div align="center">
  <img src="./client/src/assets/logo.svg" alt="Cyber Lab Logo" width="120" />
</div>

# Phishing Defense Lab (AiTM Research Platform)

**Master's Thesis Project | Osamah Amer (2026)** *Adversary-in-the-Middle (AiTM) Attack Analysis & Defense*

The **Phishing Defense Lab** is a professional full-stack simulation environment designed to analyze the mechanics of modern phishing attacks—specifically Reverse Proxy (AiTM) attacks like *Evilginx2*—and evaluate the efficacy of various defense mechanisms.

Unlike standard vulnerable web applications, this platform focuses exclusively on **Authentication Security**, providing a comparative analysis of legacy protocols versus hardware-bound credentials (FIDO2/WebAuthn).

---

## System Architecture

The project follows a decoupled, containerized architecture designed for consistent deployment across local and cloud environments:

* **Frontend (Victim UI)**: A React/Vite SPA with a "Security-Ops" aesthetic. It implements active client-side defenses (DOM/Hostname analysis).
* **Backend (Security Engine)**: A Node.js/Express API handling session management, cryptographic WebAuthn challenges, and active threat detection.
* **Database**: PostgreSQL for persistent storage and an active **Token Blacklist** for immediate session revocation.
* **Infrastructure**: Nginx acting as a Reverse Proxy with Docker Compose for full-stack orchestration.

---

## Research Scenarios (The 5 Levels)

The laboratory is structured into five levels, representing the evolution of web security:

### 1. Vulnerable Implementations
* **Level 1: Legacy Auth (Cookies)**: State-based sessions using `HttpOnly` cookies. High susceptibility to session hijacking via proxy forwarding.
* **Level 2: Modern SPA (JWT)**: Stateless JSON Web Tokens. INTERCEPT-ready during the initial handshake in non-hardened environments.

### 2. Defended Implementations
* **Level 3: Server-Side Traffic Analysis**: 
    * **Fingerprinting**: Inspects HTTP headers (`X-Evilginx`) to detect default tool signatures.
    * **Host Validation**: Enforces strict "Source of Truth" checks against `Host` and `X-Forwarded-Host` headers to detect proxy forwarding discrepancies.

* **Level 4: Client-Side Integrity (Domain Guard)**: 
    * **Zero Trust Validation**: JavaScript execution verifies the `window.location.hostname` against a strict whitelist.
    * **Anti-Mirroring (Obfuscation)**: Uses **Base64-encoded** configuration payloads to defeat Evilginx's "Content Replacement" filters (Reality Mirroring), triggering a kill-switch if the decoded origin does not match the browser's URL bar.

### 3. Immune Implementation
* **Level 5: Hardware-Bound Auth (FIDO2)**: Uses **WebAuthn/FIDO2** to cryptographically bind authentication to the origin. This renders AiTM attacks mathematically impossible as proxies cannot forge the origin signature.

---

## Future Roadmap & Research Directions

The following defense mechanisms are proposed for future iterations to counter evolving AiTM tactics:

* **Advanced Turing Tests (Captcha Defense)**:
  * *Objective*: To block automated "pre-flight" probes used by Evilginx bots.
  * *Mechanism*: Implementing **Cloudflare Turnstile** or hCaptcha to force human interaction before the login form renders.

* **Dynamic Input Randomization**:
  * *Objective*: To break the static Regex capturers defined in Evilginx Phishlets.
  * *Mechanism*: Dynamically randomizing HTML input `name` and `id` attributes (e.g., generating `password_x92` instead of `password`) on every page load to render static phishlets ineffective.

---

## Defense Mechanisms Explained

This lab demonstrates how specific defenses break the *Evilginx* kill chain:

| Defense | How it Defeats Evilginx |
| :--- | :--- |
| **Header Analysis (Lab 3)** | Detects inconsistencies in `Host` headers and identifies signatures left by default proxy configurations. |
| **Base64 Obfuscation (Lab 4)** | Evilginx attempts to "Mirror Reality" by replacing real domains in the response with fake ones. By encoding the domain in Base64 (`dGhlc...`), the proxy cannot find/replace the string, revealing the deception to the client-side code. |
| **Origin Binding (Lab 5)** | Cryptographically binds the session to the domain name. Even if a proxy intercepts the traffic, it cannot generate a valid signature for the fake domain. |

---

## Automated Deployment

The project includes a **Unified Setup Script** (`setup.sh`) that automates environment configuration, dependency checks, and security provisioning.

### Quick Start
1.  **Ensure Docker Desktop is running**.
2.  **Run the initializer**:
    ```bash
    chmod +x setup.sh
    ./setup.sh
    ```
3.  **Select your mode**:
    * **Option 1 (Local)**: Deploys to `http://localhost`.
    * **Option 2 (Production)**: Automates **SSL (Certbot/HTTPS)** generation and deploys to your custom domain on AWS/VPS.

---

## Forensic Auditing & Logging

To support academic research and threat analysis, the backend generates real-time forensic audit trails in the `backend/logs/` directory:

* **`terminated.txt`**: Records successful session revocations, including the full revoked token for replay-attack testing.
* **`blocked_attempts.txt`**: Logs detailed metrics of blocked attackers, including **IP Address**, **User-Agent**, and **Geographic Metadata**.

---

## Technical Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance UI with custom security themes. |
| **Backend** | Node.js, Express | Security-hardened REST API (Non-root Docker user). |
| **Database** | PostgreSQL 14 | Relational storage with active session blacklisting. |
| **Auth** | SimpleWebAuthn | FIDO2/WebAuthn server-side implementation. |
| **Infrastructure** | Docker, Nginx | Container orchestration and SSL termination. |

---

## Project Structure

```text
/
├── backend/            # API Logic, Database Models & Forensic Logs
│   ├── logs/           # Audit trails (terminated.txt, blocked_attempts.txt)
│   ├── middleware/     # Active defense (Blacklist, ProxyDetect)
├── client/             # Frontend React Application & Nginx Config
│   ├── nginx.conf      # Routing & Production SSL configurations
│   └── src/utils/      # Developer Branding & Console Signatures
├── setup.sh            # Multi-OS Automation Script (Local/Prod)
├── docker-compose.yml  # Production-ready orchestration (Ports 80/443)
└── .env.example        # Environment variable template

```

---

## ⚠️ Disclaimer

This software is a research prototype developed for educational and academic purposes. It contains code designed to demonstrate vulnerabilities. Do not deploy the vulnerable configurations (Levels 1 & 2) in a production environment exposed to the public internet without proper firewalling.
