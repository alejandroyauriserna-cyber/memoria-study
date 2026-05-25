# MemoriaStudy

MemoriaStudy is a modern full-stack study workspace built with Next.js App Router,
TypeScript, TailwindCSS, Supabase, and the OpenAI API. Users can upload a text-based
PDF and generate summaries, flashcards, fill-in-the-blank exercises, and quizzes.

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

2. Create local environment variables:

```bash
copy .env.example .env.local
```

3. Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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

- Study generation tries OpenAI first, then Gemini, then xAI/Grok, then a free local PDF-based generator.
- Saving decks requires Supabase URL, anon key, service role key, and the SQL schema.
- PDF extraction works best with selectable text PDFs. Scanned PDFs need OCR in a future version.
