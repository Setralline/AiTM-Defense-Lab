# Phishing Defense Lab - Backend API

**Master's Thesis Project by Osamah Amer (2026)**

This directory contains the server-side logic for the Phishing Defense Lab. It acts as the secure gateway handling authentication, database persistence, and the "Active Session Revocation" logic.

---

## Technology Stack

* **Runtime:** Node.js & Express
* **Database:** PostgreSQL (with `pg` pool)
* **Security:** `bcryptjs` (Hashing), `jsonwebtoken` (JWT), `speakeasy` (MFA/TOTP)
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

Create a `.env` file in the root of the `backend` folder with your local credentials:

```ini
PORT=5000
# REPLACE 'your_user' and 'your_password' with your local Postgres credentials
DATABASE_URL=postgres://your_user:your_password@localhost:5432/phishing_lab_db
JWT_SECRET=your_super_secret_key_for_thesis
NODE_ENV=development

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

##  Architecture Structure

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
* `checkBlacklist.js`: Interceptor that blocks revoked tokens (Active Defense).


* **`routes/`**:
* `auth.js`: API endpoints definitions.


* **`utils/`**:
* `helpers.js`: Shared utility functions.
* `test-security.js`: Scripts to verify the blacklist mechanism.



---

## Key Security Features Implemented

1. **Active Revocation:** The `checkBlacklist` middleware queries the database on every request to ensure the token hasn't been revoked.
2. **Hybrid Auth Handling:** Controllers are separated (`level1` vs `level2`) to simulate different vulnerability surfaces.
3. **Secure Seeding:** Passwords are never stored in plain text; `initDb.js` uses `bcrypt` before seeding the database.

