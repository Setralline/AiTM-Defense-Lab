# Phishing Lab - User Interface

**Developed by Osamah Amer (2026)**

This is the frontend application for the Phishing Lab. It provides a modern, terminal-style interface designed to simulate security scenarios and authentication flows. The project is built with React and Vite to ensure a fast and smooth experience.

## Key Features

* **Security-Focused Design**: A clean, dark theme with high-contrast red accents that mimic a professional security tool.
* **Authentication Levels**:
* **Level 1**: A simulation of legacy login systems using cookie-based sessions.
* **Level 2**: A simulation of modern security using JWT tokens.


* **Interactive MFA**: A working Multi-Factor Authentication system that generates QR codes and verifies security tokens in real-time.
* **Clean UI Components**: All buttons, inputs, and layout elements are built as reusable components to keep the code organized.

## Getting Started

1. **Install Dependencies**:
Open your terminal in the `client` folder and run:
```bash
npm install

```


2. **Backend Connection**:
Check the `src/api/axios.js` file to make sure the `baseURL` matches your running backend server (usually http://localhost:5000).
3. **Launch the App**:
Start the development server with:
```bash
npm run dev

```



## Future Roadmap

This project is built to grow. In future updates, we plan to add more advanced labs such as:

* **Evilginx & Reverse Proxy Fingerprinting**: Learning how to detect tools like Evilginx2 by analyzing unique header patterns and TLS signatures.
* **HTTP Header Detection**: Identifying unauthorized proxies or suspicious traffic by analyzing header inconsistencies.
* **Base URI & DOM Integrity**: Labs focused on detecting URI injections and unauthorized changes to the page structure.

## Customization and Requests

This project is designed to be flexible.

* **Add Your Own Labs**: The folder structure makes it easy for you to add new levels or security scenarios for your own use.
* **Create a Request**: If there is a specific security bypass or phishing technique you want to see added, you can submit a request.
* **Contributions**: You are welcome to modify the styles or logic to better fit your research or training needs.

