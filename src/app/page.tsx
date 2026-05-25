"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/ui/shell";
import { UploadGenerator } from "@/components/study/upload-generator";

const stats = [
  { label: "PDF intake", value: "12 MB", icon: FileText },
  { label: "Study modes", value: "4", icon: Layers3 },
  { label: "Sharing", value: "Public", icon: Users },
  { label: "Auth", value: "Magic link", icon: ShieldCheck },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askPdf() {
    try {
      setLoading(true);

      const pdfText = localStorage.getItem("pdfText");

      if (!pdfText) {
        alert("No PDF text found. Generate a study deck first.");
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          pdfText,
          question,
        }),
      });

      const data = await response.json();

      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      alert("Failed to chat with PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold text-accent">
              AI study workspace
            </p>

            <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              MemoriaStudy
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Convert dense course PDFs into summaries, quizzes,
              flashcards and AI tutoring experiences.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:-translate-y-0.5 hover:bg-foreground/90"
              >
                Open dashboard <ArrowRight size={16} />
              </Link>

              <Link
                href="/auth"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:bg-muted"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
              >
                <stat.icon className="text-accent" size={21} />

                <p className="mt-8 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <UploadGenerator />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Chat with your PDF
          </h2>

          <p className="mt-2 text-muted-foreground">
            Ask difficult university-level questions about your document.
          </p>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Explain promulgation vs publication..."
            className="mt-5 min-h-[140px] w-full rounded-xl border border-border bg-background p-4 outline-none"
          />

          <button
            onClick={askPdf}
            disabled={loading}
            className="mt-4 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask AI"}
          </button>

          {answer && (
            <div className="mt-6 rounded-xl border border-border bg-background p-5">
              <p className="whitespace-pre-wrap leading-7">
                {answer}
              </p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}