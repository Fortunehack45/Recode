---
name: supabase
description: Master Supabase architecture and operations. Covers PostgreSQL schema design, Row-Level Security (RLS) policies, triggers, Edge Functions (Deno), pgvector AI semantic search, Realtime channels, and database migrations.
---

# Supabase & PostgreSQL Architecture Engineering

This skill provides exhaustive instructions for architecting, securing, and scaling applications powered by Supabase, PostgreSQL, pgvector, and Deno Edge Functions.

---

## 1. Declarative Row-Level Security (RLS) Engineering

RLS is the primary security boundary in Supabase. Every public table **must** have RLS enabled. If RLS is enabled without policies, all public queries return 0 rows.

### Standard RLS Policy Pattern
```sql
-- Always enable RLS on table creation
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 1. Helper Function: Check membership with SECURITY DEFINER
-- Runs with function owner rights to prevent infinite RLS recursion loops
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = target_org_id
      AND user_id = (SELECT auth.uid())
  );
$$;

-- 2. Granular RLS Policies for Documents Table
CREATE POLICY "Members can view documents of their organizations"
  ON public.documents
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org Admins can insert documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = documents.organization_id
        AND user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Authors or Admins can update documents"
  ON public.documents
  FOR UPDATE
  USING (
    author_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = documents.organization_id
        AND user_id = (SELECT auth.uid())
        AND role = 'owner'
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = documents.organization_id
        AND user_id = (SELECT auth.uid())
        AND role = 'owner'
    )
  );
```

---

## 2. AI Semantic Search with `pgvector`

### Vector Indexing & Hybrid Search Architecture
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Index for ultra-fast approximate nearest neighbor lookups
CREATE INDEX ON public.document_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Match Function with Cosine Distance & Threshold
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    document_embeddings.id,
    document_embeddings.document_id,
    document_embeddings.content,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM public.document_embeddings
  WHERE 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 3. High-Performance Edge Functions (Deno Runtime)

Handle secure operations, Stripe webhooks, or AI orchestration in Edge Functions:

```typescript
// supabase/functions/process-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Use Service Role client inside server environment for privileged mutations
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_tier: 'pro' })
      .eq('stripe_customer_id', session.customer);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
```

---

## 4. Supabase Engineering Checklist

- [ ] **RLS Enabled**: Check `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` to ensure no table has RLS disabled.
- [ ] **Index Foreign Keys**: Ensure all foreign key columns (e.g., `user_id`, `org_id`) have explicit B-tree indexes to prevent table scans on cascading updates/deletes.
- [ ] **Service Role Key Security**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side bundles or public repositories.
- [ ] **Connection Pooling**: Configure PgBouncer / Supavisor connection pooling for serverless environments (Port `6543` with Transaction Mode).
