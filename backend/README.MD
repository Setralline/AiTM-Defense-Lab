# Phishing Lab - Backend API

**Developed by Osamah Amer (2026)**

This folder contains the server-side logic for the Phishing Lab. It handles database connections, password encryption, and Multi-Factor Authentication (MFA) logic.

## How it works

The server is built using a modern stack to ensure reliability:

* **Node.js**: The core runtime environment.
* **Express**: The framework used to manage API routes.
* **PostgreSQL**: The relational database used to store operative accounts and security secrets.
* **Speakeasy**: A library used to generate TOTP (MFA) secrets and verify security codes.

## Local Setup

1. **Install Dependencies**:
Open your terminal in the `backend` folder and run:
```bash
npm install

```


2. **Environment Configuration**:
Create a file named `.env` in the root of the backend folder and add your credentials:
```text
PORT=5000
DATABASE_URL=postgres://your_user:your_password@localhost:5432/your_db_name
JWT_SECRET=your_custom_secret_key

```


3. **Run the Server**:
Start the server in development mode:
```bash
npm run dev

```


*Note: On the first run, the system will automatically create the database tables and a default admin account (admin@lab.com / lab123).*

## Folder Structure

* **config**: Database connection and system initialization settings.
* **controllers**: The logic for each action (Login, Delete User, MFA verification).
* **routes**: The endpoints the frontend communicates with.
* **services**: Technical logic, such as generating QR codes.

