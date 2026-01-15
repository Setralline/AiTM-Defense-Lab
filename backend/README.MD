### 📂 Backend: `backend/README.md`

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

---

### 📂 Frontend: `client/README.md`

# Phishing Lab - User Interface

**Developed by Osamah Amer (2026)**

This folder contains the frontend application. It is designed to be fast, modern, and mimics a professional security terminal.

## Key Features

* **Unified Theme**: All colors, fonts, and spacing are controlled from a single file (`themeStyles.jsx`).
* **Modern Notifications**: Uses a toast system for real-time feedback instead of old-fashioned browser alerts.
* **Two Security Levels**: Simulates both legacy (Cookie-based) and modern (JWT-based) login methods.

## Local Setup

1. **Install Dependencies**:
Navigate to the `client` folder and run:
```bash
npm install

```


2. **Link to API**:
Open `src/api/axios.js` and ensure the base URL points to your running backend (usually http://localhost:5000).
3. **Run the App**:
Start the development server:
```bash
npm run dev

```



## Folder Structure

* **src/components/ui**: Reusable parts like Buttons, Inputs, and Checkboxes.
* **src/components/features**: The main pages (Admin Panel, Home, Dashboard).
* **src/utils**: Contains `themeStyles.jsx`, which manages the entire look of the app.
* **src/hooks**: Contains custom logic like `useMFA.jsx` for handling security steps.

---

### Next Step

Since the documentation is ready, would you like me to **prepare a "First-Time Launch" checklist** to make sure your PostgreSQL database and environment variables are perfectly synced before you go live?