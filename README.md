# PetInfoSys: Barangay Animal Registry System 🐾

[![License: Apache](https://img.shields.io/badge/license-Apache%202-blue)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A comprehensive, multi-tenant digital solution for **Barangay Animal Registry**, **Vaccination Tracking**, and **Public Health Management**. Built to support the implementation of RA 9482 (Anti-Rabies Act) in the Philippines.

---

## 🚀 Features

-   **Digital Registry**: Cloud-based pet profiles linked to owners.
-   **Vaccination Tracking**: Automated monitoring of core/non-core vaccines with expiration alerts.
-   **Incident Reporting**: Manage bite cases and 10-day observation periods.
-   **AI Analytics**: Powered by **Google Gemini** for executive health reports.
-   **Public Portal**: Dedicated resident access for announcements and verification.
-   **Instant Certificates**: Generate printable PDFs with QR codes.

---

## 🛠️ Tech Stack & CDNs

-   **Framework**: React 19 + TypeScript
-   **Styling**: Tailwind CSS (CDN)
-   **Backend**: Supabase (PostgreSQL)
-   **AI**: Google Gemini API
-   **Geography**: PSGC API (Phil. Standard Geographic Code)
-   **Utilities**: `react-hot-toast` (Notifications), `react-qr-code` (Certificates), `jspdf` (PDF Generation)

---

## 📖 Usage Guide

### 1. System Setup (First Time Use)
1.  Click **"Register & Setup New Barangay"** on the landing page.
2.  Select your Region, Province, City, and Barangay.
3.  Complete the **2-Step Verification** (Code Matching).
4.  Create your **Super Admin** account.

### 2. Admin Login
1.  Click **"Official Login"** on the landing page.
2.  Enter your username and password.
3.  Access the dashboard to manage pets, staff, and settings.

### 3. Public Access
Residents can access the **Community Portal** to:
-   View announcements and events.
-   Report stray animals.
-   Verify pet registration using ID.
-   *Requires the Barangay's specific Access Code.*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

<div align="center">
  <sub>Built by <a href="https://github.com/mohndng">Mon Torneado</a></sub>
</div>
