import { Suspense } from "react";
import { AppShell } from "@/components/ui/shell";
import { AuthCallbackClient } from "@/components/auth/auth-callback-client";

function AuthCallbackFallback() {
  return <p className="text-sm text-muted-foreground">Completando acceso…</p>;
}

/** Intercambio de tokens/código en el cliente — conserva el hash del correo de confirmación. */
export default function AuthCallbackPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-16">
        <Suspense fallback={<AuthCallbackFallback />}>
          <AuthCallbackClient />
        </Suspense>
      </div>
    </AppShell>
  );
}
