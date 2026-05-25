import { AppShell } from "@/components/ui/shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-sm font-semibold text-accent">Account</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight">Keep every deck in sync.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Sign in with a magic link to save generated decks, publish them for classmates,
            and return to your review history.
          </p>
        </div>
        <AuthForm />
      </section>
    </AppShell>
  );
}
