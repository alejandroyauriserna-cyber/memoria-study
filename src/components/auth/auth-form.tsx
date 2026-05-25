"use client";

import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      setStatus("sent");
      setMessage("Check your email for a magic link.");
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Add Supabase environment variables to enable sign in.",
      );
    }
  }

  return (
    <form onSubmit={signIn} className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <label className="text-sm font-semibold" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
        required
      />
      <Button className="mt-4 w-full" disabled={status === "loading"}>
        {status === "loading" ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
        Send magic link
      </Button>
      {message ? (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
