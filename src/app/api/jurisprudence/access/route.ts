import { NextResponse } from "next/server";
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

  return NextResponse.json({
    authenticated: true,
    email,
    emailConfirmed,
    canContribute: isUnt && emailConfirmed,
    isModerator,
    moderatorsConfigured: moderators.length,
    moderatorHint: isModerator ? null : await getModeratorAccessHint(email),
    untDomains: getUntEmailDomains(),
    denialMessage: !isUnt
      ? getUntAccessDenialMessage()
      : !emailConfirmed
        ? getEmailConfirmationMessage()
        : null,
  });
}
