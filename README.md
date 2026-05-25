# MemoriaStudy

MemoriaStudy is a modern full-stack study workspace for **Derecho (UNT)** built with
Next.js App Router, TypeScript, TailwindCSS, Supabase, and AI providers. Users organize
material by **año → ciclo → curso → semana**, upload PDFs (including scanned documents
via Gemini OCR), and generate Spanish legal study content: flashcards, definition matching,
memory pairs, fill-in-the-blank exercises, and quizzes.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- TailwindCSS 4
- Supabase Auth and Postgres
- OpenAI Responses API with structured output
- PDF.js text extraction
- ESLint

## Setup

1. Install dependencies:

```bash
npm install
```

2. Crea tu archivo local de secretos (solo este lo usa Next.js):

```bash
copy .env.example .env.local
```

3. Edita **solo** `.env.local` y reemplaza los placeholders con tus claves reales:

> **Nota:** `.env.example` es la plantilla (texto ficticio). `.env.local` es tu copia privada con las APIs reales. No hace falta otro archivo `.env`.

```bash

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.2
GEMINI_API_KEY=optional_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
XAI_API_KEY=optional_xai_api_key
XAI_MODEL=grok-4-fast-reasoning
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Project Structure

```text
src/app                 App Router pages and API routes
src/components          Reusable UI, auth, and study components
src/lib/ai              OpenAI schema and generation service
src/lib/decks           Deck persistence mappers
src/lib/pdf             PDF text extraction
src/lib/supabase        Browser, server, and admin Supabase clients
src/types               Shared domain types
supabase/schema.sql     Database schema and RLS policies
```

## Notes

- Study generation tries OpenRouter, OpenAI, Gemini, xAI, then a free local generator. All prompts target UNT Derecho in Spanish.
- Saving decks requires Supabase URL, anon key, service role key, and the SQL schema (run migrations in `supabase/schema.sql`).
- PDF extraction: pdf2json → pdf-parse → **Gemini OCR** for scanned documents (`GEMINI_API_KEY` required for OCR).
- Study modes: flashcards, término↔definición, juego de pares, completar espacios, quiz.
