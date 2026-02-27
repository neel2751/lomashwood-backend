# @lomash-wood/auth-client

Type-safe HTTP client for the Lomash Wood Auth Service. Handles token management, automatic token refresh, and all auth API interactions.

## Installation

```json
{
  "dependencies": {
    "@lomash-wood/auth-client": "workspace:*"
  }
}
```

## Usage

```typescript
import { AuthClient } from "@lomash-wood/auth-client";

const authClient = new AuthClient({
  baseUrl: process.env.AUTH_SERVICE_URL,
  timeout: 10000,
  withCredentials: true,
  getAccessToken: () => localStorage.getItem("accessToken"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),
  setTokens: (tokens) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
  onTokenRefresh: (tokens) => console.log("Tokens refreshed"),
  onUnauthorized: () => (window.location.href = "/login"),
});

const { user, tokens } = await authClient.login({
  email: "user@example.com",
  password: "Password@123",
});
```

## API

| Method | Description |
|---|---|
| `register(payload)` | Register a new user |
| `login(payload)` | Login and receive tokens |
| `logout()` | Logout and clear tokens |
| `me()` | Get current authenticated user |
| `refreshToken(payload)` | Refresh access token |
| `forgotPassword(payload)` | Request password reset email |
| `resetPassword(payload)` | Reset password with token |
| `changePassword(payload)` | Change password (authenticated) |
| `verifyEmail(payload)` | Verify email with token |
| `resendVerificationEmail()` | Resend verification email |
| `updateProfile(payload)` | Update user profile |
| `validateSession(token)` | Validate a session token |
| `getUserById(userId)` | Get user by ID (admin) |
| `getAllRoles()` | List all roles (admin) |
| `assignRole(payload)` | Assign role to user (admin) |
| `revokeRole(payload)` | Revoke role from user (admin) |
| `listSessions()` | List active sessions |
| `revokeSession(sessionId)` | Revoke a specific session |
| `revokeAllSessions()` | Revoke all sessions |

## Error Handling

```typescript
import {
  AuthClient,
  InvalidCredentialsError,
  TokenExpiredError,
  RefreshTokenExpiredError,
  isAuthClientError,
} from "@lomash-wood/auth-client";

try {
  await authClient.login({ email, password });
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    // show invalid credentials message
  } else if (error instanceof RefreshTokenExpiredError) {
    // redirect to login
  } else if (isAuthClientError(error)) {
    console.error(error.statusCode, error.code, error.message);
  }
}
```

## Build

```bash
pnpm build
```