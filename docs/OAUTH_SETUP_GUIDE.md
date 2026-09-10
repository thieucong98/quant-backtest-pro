# Quant Backtest Pro — Authentication & OAuth Setup Guide 🔐

This document provides step-by-step instructions for configuring Single Sign-On (SSO) providers and understanding the dynamic authentication discovery architecture in **Quant Backtest Pro**.

---

## 1. Architecture Overview

Quant Backtest Pro supports a flexible, security-first authentication system with **Zero-Config Default Readiness**:

1. **Standard Email & Password (Ready Out-of-the-Box)**:
   - Full registration, password hashing with bcrypt, and secure 30-day JWT Bearer tokens.
2. **1-Click Institutional Demo Trader (Ready Out-of-the-Box)**:
   - Pre-seeded institutional account (`admin@quantbacktest.pro` / `QuantPro@2026`) enabling immediate local backtesting and testing without setup.
3. **Dynamic Social SSO Discovery (Google, GitHub, Apple)**:
   - The platform dynamically probes backend environment configuration (`GET /api/auth/providers`).
   - **Auto-Hide Guarantee**: If OAuth credentials are not configured in `server/.env`, social login buttons and the "Or continue with" divider are **completely hidden** from the UI.
   - Once credentials are provided and the server is restarted, the configured provider button(s) automatically appear in the `AuthModal`.

---

## 2. Setting Up Google OAuth 2.0

### Step 1: Create a Project in Google Cloud Console
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `Quant Backtest Pro`).
3. Navigate to **APIs & Services** > **OAuth consent screen**.
4. Select **External** (or **Internal** if using Google Workspace) and fill in the required application details.

### Step 2: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Select Application type: **Web application**.
4. Configure URIs:
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (Development)
     - `https://your-domain.com` (Production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
5. Click **Create**. Copy the **Client ID** and **Client Secret**.

### Step 3: Add to Environment Configuration
In `server/.env`:
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 3. Setting Up GitHub OAuth

### Step 1: Create an OAuth App on GitHub
1. Sign in to your GitHub account.
2. Go to **Settings** > **Developer settings** > **OAuth Apps**.
3. Click **New OAuth App**.
4. Fill in the application fields:
   - **Application name**: `Quant Backtest Pro`
   - **Homepage URL**: `http://localhost:5173` (or production domain)
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github` (or `http://localhost:5173/auth/callback/github`)
5. Click **Register application**.

### Step 2: Generate Client Secret
1. On the app configuration page, copy the **Client ID**.
2. Click **Generate a new client secret** and copy the secret value.

### Step 3: Add to Environment Configuration
In `server/.env`:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## 4. Setting Up Apple Sign-In

### Step 1: Register an App ID & Services ID
1. Log in to [Apple Developer Account](https://developer.apple.com/account/).
2. Go to **Certificates, Identifiers & Profiles** > **Identifiers**.
3. Create an **App ID** with **Sign in with Apple** enabled.
4. Create a **Services ID** (e.g. `com.yourdomain.quantbacktest.service`).
5. Configure the Services ID:
   - Enable **Sign in with Apple**.
   - Set **Domains and Subdomains**: `yourdomain.com` (or `localhost` for local testing).
   - Set **Return URLs**: `https://your-domain.com/api/auth/callback/apple`.

### Step 2: Generate Private Key
1. Go to **Keys** > **Create a key**.
2. Select **Sign in with Apple** and link your primary App ID.
3. Download the `.p8` key file, note the **Key ID** and your **Team ID**.

### Step 3: Add to Environment Configuration
In `server/.env`:
```env
APPLE_CLIENT_ID="com.yourdomain.quantbacktest.service"
APPLE_CLIENT_SECRET="your-apple-client-secret-or-jwt"
APPLE_TEAM_ID="your-apple-team-id"
```

---

## 5. Verifying Configuration

1. Edit your `server/.env` file and set the desired provider credentials.
2. Restart the backend server:
   ```bash
   npm run start:all
   ```
3. Test the provider configuration endpoint:
   ```bash
   curl http://localhost:3001/api/auth/providers
   ```
   Example Response:
   ```json
   {
     "providers": {
       "google": true,
       "github": true,
       "apple": false
     }
   }
   ```
4. Open `http://localhost:5173` and click **Sign In / Sign Up**:
   - Only configured providers will be rendered.
   - If all providers are omitted, the SSO section and divider are automatically hidden, keeping the interface minimal and clean.
