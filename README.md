# 🛡️ Secure Node.js Authentication & Vulnerability Lab Framework

**Intern Name:** Rahat Jabeen  
**Role:** Cybersecurity Engineering Intern  
**Project Status:** Completed & Fully Remediated (Weeks 1 - 3)

---

## 📝 Project Overview
This repository contains a production-grade secured version of a Node.js/Express user management application and vulnerability playground. Over a 3-week lifecycle, the application was audited for critical security flaws (OWASP Top 10), patched at the source level, and integrated with persistent runtime auditing mechanisms.

---

## 🛠️ Implemented Security Fixes & Core Modules

### 1. Week 1: Security Assessment & Vulnerability Discovery
- Conducted manual perimeter penetration testing and automated scanning to isolate critical vectors.
- Identified high-risk flaws including Stored Cross-Site Scripting (XSS), cryptographically weak MD5 credential hashing, and missing server security response headers.

### 2. Week 2: Source Code Remediation & Cryptographic Upgrade
- **Input Sanitization (XSS Defense):** Integrated backend validation middleware using the `validator` library to reject script injections at registration.
- **Advanced Cryptographic Storage:** Upgraded legacy `md5(password)` hashing to standard **Bcrypt** configurations utilizing `10` cryptographically secure salt rounds.
- **Database Column Migration:** Altered the MySQL schema constraints from a limited character length to `VARCHAR(255)` to cleanly process 60-character Bcrypt hashes without data truncation.
- **Frontend Parser Alignment:** Corrected asynchronous handling inside `register.ejs` to parse raw JWT authentication tokens securely without breaking frontend layout controls.
- **HTTP Security Headers:** Deployed `Helmet.js` globally across backend application routers to hide framework metadata signatures (`X-Powered-By`) and enforce strict Content Security Policies (CSP).

### 3. Week 3: Runtime Auditing & Event Streams
- **Structured Activity Logging:** Integrated the production-ready **`winston`** logging layer directly inside application routers (`auth_controller.js`).
- **Audit Logging Controls:** Enabled structural file transports to stream live authentication states, validation errors, and malicious vectors to a persistent `security.log` document file.

---

## 🚀 How to Install and Run Locally

### Prerequisites
- Node.js (v16+ recommended)
- MySQL Server instance

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <your-repository-url>
   cd <project-folder-name>