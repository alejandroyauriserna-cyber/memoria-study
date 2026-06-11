-- Cost tracking for Visual IA image generation (estimated USD per provider)

create table if not exists public.image_generation_cost_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  organizer_id uuid references public.organizers(id) on delete set null,
  format_id text,
  provider text not null,
  estimated_cost_usd numeric(10, 6) not null default 0,
  used_fallback boolean not null default false,
  provider_chain jsonb not null default '[]'::jsonb,
  failed_attempts int not null default 0,
  duration_ms int
);

create index if not exists image_generation_cost_events_created_at_idx
  on public.image_generation_cost_events(created_at desc);

create index if not exists image_generation_cost_events_provider_idx
  on public.image_generation_cost_events(provider, created_at desc);

alter table public.image_generation_cost_events enable row level security;

-- Solo service role inserta/lee agregados; sin políticas para clientes.
