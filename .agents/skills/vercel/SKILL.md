---
name: vercel
description: Production Vercel and Next.js 15 deployment engineering. Covers App Router architecture, Server Actions, Edge Middleware routing, Incremental Static Regeneration (ISR), Edge Config, Vercel Blob/KV storage, and cache headers.
---

# Vercel Deployment & Next.js 15 Architecture

This skill provides exhaustive guidance on deploying and optimizing modern full-stack web applications on Vercel with Next.js 15, Server Actions, and Edge infrastructure.

---

## 1. Next.js 15 App Router & Server Action Mechanics

### Async Request APIs & Server Actions
In Next.js 15, asynchronous request APIs (`cookies()`, `headers()`, `params`, `searchParams`) must be awaited. Server Actions must enforce strict input validation and optimistic updates:

```typescript
// app/actions/update-profile.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(280).optional(),
});

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  const validated = UpdateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
  });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: validated.data,
  });

  revalidateTag('user-profile');
  revalidatePath('/settings/profile');
  return { success: true };
}
```

---

## 2. High-Performance Edge Middleware

Edge Middleware runs before the cache, executing in low-latency Vercel Edge compute regions:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get('session-token')?.value;

  // Protected route checking
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Security Headers Injection
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
```

---

## 3. Caching Architecture & Revalidation Tags

Next.js 15 eliminates aggressive default caching in `fetch` in favor of explicit declarative caching:

```typescript
// Explicit revalidation tag for on-demand invalidation
export async function getProductCatalog() {
  const res = await fetch('https://api.example.com/products', {
    next: {
      tags: ['products'],
      revalidate: 3600, // ISR: 1 hour background revalidation
    },
  });

  if (!res.ok) throw new Error('Failed to fetch catalog');
  return res.json();
}
```

---

## 4. Vercel Configuration (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 5. Vercel Engineering Checklist

- [ ] **Next.js 15 Compatibility**: Ensure `cookies()`, `headers()`, and dynamic params are awaited.
- [ ] **Static vs Dynamic Route Verification**: Review build output to ensure pages expected to be static (`○`) are not accidentally marked dynamic (`ƒ`).
- [ ] **Image Optimization**: Use `next/image` with configured `remotePatterns` in `next.config.js`.
- [ ] **Edge Function Limits**: Verify Edge functions stay within the $25\,\text{MB}$ memory and $25\text{ms}$ CPU limit.
