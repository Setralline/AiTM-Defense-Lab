# Phishing Defense Lab - Backend API

**Master's Thesis Project by Osamah Amer (2026)**

This directory contains the server-side logic for the Phishing Defense Lab. It acts as the secure gateway handling authentication, database persistence, and the "Active Session Revocation" logic with forensic auditing capabilities.

---

## Technology Stack

* **Runtime:** Node.js & Express
* **Database:** PostgreSQL (with `pg` pool)
* **Security:** `bcryptjs` (Hashing), `jsonwebtoken` (JWT), `speakeasy` (MFA/TOTP)
* **Logging:** Native File System (`fs`) for forensic audit trails
* **Architecture:** MVC (Model-View-Controller)

---

## Prerequisites

Before running this project locally, ensure you have the following installed:

* **Node.js** (v18 or higher)
* **PostgreSQL** (v14 or higher) - **Critical:** Must be installed and running locally.

---

## Quick Setup

### 1. Database Preparation
Ensure your local PostgreSQL service is running. You do **not** need to create tables manually, but you must create the database itself:
```bash
# In your terminal or pgAdmin
CREATE DATABASE phishing_lab_db;

```

### 2. Install Dependencies

Navigate to the backend folder and install the required packages:

```bash
cd backend
npm install

```

### 3. Configure Environment

Create a `.env` file in the root of the `backend` folder using the following template.
**Note:** Update `DB_PASSWORD` with your actual local PostgreSQL password.

```ini
PORT=5000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_NAME=phishing_lab_db
DB_PORT=5432

# Security Configuration
JWT_SECRET=super_secret_unified_key_2026
CORS_ORIGIN=http://localhost:5173

```

### 4. Start the Server

Launch the development server:

```bash
npm run dev

```

---

## Automated Initialization (Zero-Config)

When `server.js` starts, it triggers `config/initDb.js` which automatically:

1. **Checks Database:** Verifies connection to your local PostgreSQL instance.
2. **Creates Schema:** Automatically creates the `users` table and `token_blacklist` table if they don't exist.
3. **Seeds Admin:** Injects the default admin account.

**Default Credentials:**

* **Email:** `admin@lab.com`
* **Password:** `lab123`

---

## Architecture Structure

Based on the project file system:

* **`config/`**:
* `db.js`: PostgreSQL connection pool configuration.
* `initDb.js`: Automation script for schema creation and admin seeding.


* **`controllers/`**:
* `authController.js`: General auth logic (Admin login, User management).
* `level1Controller.js`: Logic for Legacy Auth (Cookie-based).
* `level2Controller.js`: Logic for Modern Auth (Token-based).
* `mfaController.js`: Handling TOTP generation and verification.


* **`middleware/`**:
* `checkBlacklist.js`: Interceptor that blocks revoked tokens (Active Defense) and logs incidents.


* **`logs/` (Auto-Generated)**:
* Stores forensic evidence of security events (see details below).


* **`routes/`**:
* `auth.js`: API endpoints definitions.


* **`utils/`**:
* `helpers.js`: Shared utility functions including token generation and revocation logic.



---

## Key Security Features Implemented

1. **Active Revocation:** The `checkBlacklist` middleware queries the database on every request to ensure the token hasn't been revoked.
2. **Forensic Auditing:** Detailed logging of both terminated sessions and blocked access attempts for security analysis.
3. **Hybrid Auth Handling:** Controllers are separated (`level1` vs `level2`) to simulate different vulnerability surfaces.
4. **Secure Seeding:** Passwords are never stored in plain text; `initDb.js` uses `bcrypt` before seeding the database.

---

## Forensic Logging & Auditing

The system automatically generates audit trails in the `logs/` directory to demonstrate Proof of Concept (POC) and monitor threats:

* **`logs/terminated.txt`**:
* Records every successful session revocation (Logout/Terminate).
* Saves the **Full Token String** to allow researchers to copy it and test replay attacks (validating that they fail).


* **`logs/blocked_attempts.txt`**:
* Records detailed metrics when a revoked token attempts to access the API.
* Captures: **IP Address**, **Country** (via Headers), **User-Agent**, and **Request Path**.


