import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveUserEmail } from "@/lib/auth/user-email";
import { hasSupabaseEnv } from "@/lib/env";
import {
  getAllModeratorEmails,
  getModeratorAccessHint,
  getUntAccessDenialMessage,
  getUntEmailDomains,
  isJurisprudenceModerator,
  isUntInstitutionalEmail,
} from "@/lib/jurisprudence/unt-access";
import {
  getEmailConfirmationMessage,
  isEmailConfirmed,
} from "@/lib/jurisprudence/require-confirmed-email";

export const runtime = "nodejs";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      authenticated: false,
      canContribute: false,
      isModerator: false,
      untDomains: getUntEmailDomains(),
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      canContribute: false,
      isModerator: false,
      untDomains: getUntEmailDomains(),
    });
  }

  const email = resolveUserEmail(user) ?? "";
  const isUnt = isUntInstitutionalEmail(email);
  const emailConfirmed = isEmailConfirmed(user);
  const isModerator = await isJurisprudenceModerator(email);
  const moderators = await getAllModeratorEmails();

  let pendingCount = 0;
  if (isModerator) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("jurisprudence_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return NextResponse.json({
    authenticated: true,
    email,
    emailConfirmed,
    canContribute: isUnt && emailConfirmed,
    isModerator,
    pendingCount,
    moderatorsConfigured: moderators.length,
    moderatorHint: isModerator
      ? null
      : await getModeratorAccessHint(email, { isUntInstitutional: isUnt }),
    untDomains: getUntEmailDomains(),
    denialMessage: !isUnt
      ? getUntAccessDenialMessage()
      : !emailConfirmed
        ? getEmailConfirmationMessage()
        : null,
  });
}
