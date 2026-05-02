# PostHog Next.js App Router Example Project

Repository: https://github.com/PostHog/context-mill
Path: basics/next-app-router

---

## README.md

# PostHog Next.js app router example

This is a [Next.js](https://nextjs.org) App Router example demonstrating PostHog integration with product analytics, session replay, feature flags, and error tracking.

## Features

- **Product analytics**: Track user events and behaviors
- **Session replay**: Record and replay user sessions
- **Error tracking**: Capture and track errors
- **User authentication**: Demo login system with PostHog user identification
- **Server-side & Client-side tracking**: Examples of both tracking methods
- **Reverse proxy**: PostHog ingestion through Next.js rewrites

## Getting started

### 1. Install dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your_posthog_project_token
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Get your PostHog project token from your [PostHog project settings](https://app.posthog.com/project/settings).

### 3. Run the development server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Project structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── login/
│   │           └── route.ts   # Login API with server-side tracking
│   ├── burrito/
│   │   └── page.tsx           # Demo feature page with event tracking
│   ├── profile/
│   │   └── page.tsx           # User profile with error tracking demo
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home/Login page
│   └── globals.css            # Global styles
├── components/
│   └── Header.tsx             # Navigation header with auth state
├── contexts/
│   └── AuthContext.tsx        # Authentication context with PostHog integration
└── lib/
    └── posthog-server.ts      # Server-side PostHog client

instrumentation-client.ts      # Client-side PostHog initialization
```

## Key integration points

### Client-side initialization (instrumentation-client.ts)

```typescript
import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});
```

### User identification (AuthContext.tsx)

```typescript
posthog.identify(username, {
  username: username,
});
```

### Event tracking (burrito/page.tsx)

```typescript
posthog.capture('burrito_considered', {
  total_considerations: count,
  username: username,
});
```

### Error tracking (profile/page.tsx)

```typescript
posthog.captureException(error);
```

### Server-side tracking (app/api/auth/login/route.ts)

```typescript
const posthog = getPostHogClient();
posthog.capture({
  distinctId: username,
  event: 'server_login',
  properties: { ... }
});
```

## App router differences from pages router

This example uses Next.js App Router instead of Pages Router. Key differences:

1. **File-based routing**: Pages in `src/app/` instead of `src/pages/`
2. **layout.tsx**: Root layout component wraps all pages
3. **API Routes**: Located in `src/app/api/` with `route.ts` files
4. **'use client'**: Client components need explicit directive
5. **useRouter**: From `next/navigation` instead of `next/router`
6. **Metadata**: Exported from layout/page instead of Head component
7. **Server Components**: Components are server-side by default

## Learn more

- [PostHog Documentation](https://posthog.com/docs)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [PostHog Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## .env.example

```example
# PostHog Configuration
# Get your PostHog project token from: https://app.posthog.com/project/settings
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your_posthog_project_token_here
# NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## instrumentation-client.ts

```ts
import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  // Include the defaults option as required by PostHog
  defaults: '2026-01-30',
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: process.env.NODE_ENV === "development",
});

//IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches, especially components like a PostHogProvider. instrumentation-client.ts is the correct solution for initializating client-side PostHog in Next.js 15.3+ apps.
```

---

## next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

```

---

## src/app/api/auth/login/route.ts

```ts
import { NextResponse } from 'next/server';
import { getPostHogClient } from '@/lib/posthog-server';

const users = new Map<string, { username: string; burritoConsiderations: number }>();

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  let user = users.get(username);
  const isNewUser = !user;
  
  if (!user) {
    user = { username, burritoConsiderations: 0 };
    users.set(username, user);
  }

  // Capture server-side login event
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: username,
    event: 'server_login',
    properties: {
      username: username,
      isNewUser: isNewUser,
      source: 'api'
    }
  });

  // Identify user on server side
  posthog.identify({
    distinctId: username,
    properties: {
      username: username,
      createdAt: isNewUser ? new Date().toISOString() : undefined
    }
  });

  return NextResponse.json({ success: true, user });
}
```

---

## src/app/burrito/page.tsx

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';

export default function BurritoPage() {
  const { user, incrementBurritoConsiderations } = useAuth();
  const router = useRouter();
  const [hasConsidered, setHasConsidered] = useState(false);

  // Redirect to home if not logged in
  if (!user) {
    router.push('/');
    return null;
  }

  const handleConsideration = () => {
    incrementBurritoConsiderations();
    setHasConsidered(true);
    setTimeout(() => setHasConsidered(false), 2000);
    
    // Capture burrito consideration event
    posthog.capture('burrito_considered', {
      total_considerations: user.burritoConsiderations + 1,
      username: user.username,
    });
  };

  return (
    <div className="container">
      <h1>Burrito consideration zone</h1>
      <p>Take a moment to truly consider the potential of burritos.</p>
      
      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={handleConsideration}
          className="btn-burrito"
        >
          I have considered the burrito potential
        </button>
        
        {hasConsidered && (
          <p className="success">
            Thank you for your consideration! Count: {user.burritoConsiderations}
          </p>
        )}
      </div>
      
      <div className="stats">
        <h3>Consideration stats</h3>
        <p>Total considerations: {user.burritoConsiderations}</p>
      </div>
    </div>
  );
}
```

---

## src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Burrito Consideration App",
  description: "Consider the potential of burritos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

```

---

## src/app/page.tsx

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        setUsername('');
        setPassword('');
      } else {
        setError('Please provide both username and password');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('An error occurred during login');
    }
  };

  if (user) {
    return (
      <div className="container">
        <h1>Welcome back, {user.username}!</h1>
        <p>You are now logged in. Feel free to explore:</p>
        <ul>
          <li>Consider the potential of burritos</li>
          <li>View your profile and statistics</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Welcome to Burrito Consideration App</h1>
      <p>Please sign in to begin your burrito journey</p>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter any username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter any password"
          />
        </div>
        
        {error && <p className="error">{error}</p>}
        
        <button type="submit" className="btn-primary">Sign In</button>
      </form>
      
      <p className="note">
        Note: This is a demo app. Use any username and password to sign in.
      </p>
    </div>
  );
}
```

---

## src/app/profile/page.tsx

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to home if not logged in
  if (!user) {
    router.push('/');
    return null;
  }

  const triggerTestError = () => {
    try {
      throw new Error('Test error for PostHog error tracking');
    } catch (err) {
      posthog.captureException(err);
      console.error('Captured error:', err);
      alert('Error captured and sent to PostHog!');
    }
  };

  return (
    <div className="container">
      <h1>User Profile</h1>
      
      <div className="stats">
        <h2>Your Information</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Burrito Considerations:</strong> {user.burritoConsiderations}</p>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <button onClick={triggerTestError} className="btn-primary" style={{ backgroundColor: '#dc3545' }}>
          Trigger Test Error (for PostHog)
        </button>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Your Burrito Journey</h3>
        {user.burritoConsiderations === 0 ? (
          <p>You haven&apos;t considered any burritos yet. Visit the Burrito Consideration page to start!</p>
        ) : user.burritoConsiderations === 1 ? (
          <p>You&apos;ve considered the burrito potential once. Keep going!</p>
        ) : user.burritoConsiderations < 5 ? (
          <p>You&apos;re getting the hang of burrito consideration!</p>
        ) : user.burritoConsiderations < 10 ? (
          <p>You&apos;re becoming a burrito consideration expert!</p>
        ) : (
          <p>You are a true burrito consideration master! 🌯</p>
        )}
      </div>
    </div>
  );
}
```

---

## src/components/Header.tsx

```tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <nav>
          <Link href="/">Home</Link>
          {user && (
            <>
              <Link href="/burrito">Burrito Consideration</Link>
              <Link href="/profile">Profile</Link>
            </>
          )}
        </nav>
        <div className="user-section">
          {user ? (
            <>
              <span>Welcome, {user.username}!</span>
              <button onClick={logout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <span>Not logged in</span>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

## src/contexts/AuthContext.tsx

```tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import posthog from 'posthog-js';

interface User {
  username: string;
  burritoConsiderations: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  incrementBurritoConsiderations: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const users: Map<string, User> = new Map();

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use lazy initializer to read from localStorage only once on mount
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;

    const storedUsername = localStorage.getItem('currentUser');
    if (storedUsername) {
      const existingUser = users.get(storedUsername);
      if (existingUser) {
        return existingUser;
      }
    }
    return null;
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { user: userData } = await response.json();

        let localUser = users.get(username);
        if (!localUser) {
          localUser = userData as User;
          users.set(username, localUser);
        }

        setUser(localUser);
        localStorage.setItem('currentUser', username);
        
        // Identify user in PostHog using username as distinct ID
        posthog.identify(username, {
          username: username,
        });
        
        // Capture login event
        posthog.capture('user_logged_in', {
          username: username,
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Capture logout event before resetting
    posthog.capture('user_logged_out');
    posthog.reset();
    
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const incrementBurritoConsiderations = () => {
    if (user) {
      user.burritoConsiderations++;
      users.set(user.username, user);
      setUser({ ...user });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, incrementBurritoConsiderations }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## src/lib/posthog-server.ts

```ts
import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!,
      { 
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0
      }
    );
    posthogClient.debug(true);
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
```

---

