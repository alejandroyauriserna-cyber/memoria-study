import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import {
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

  const email = user.email ?? "";
  const isUnt = isUntInstitutionalEmail(email);
  const emailConfirmed = isEmailConfirmed(user);

  return NextResponse.json({
    authenticated: true,
    email,
    emailConfirmed,
    canContribute: isUnt && emailConfirmed,
    isModerator: isJurisprudenceModerator(email),
    untDomains: getUntEmailDomains(),
    denialMessage: !isUnt
      ? getUntAccessDenialMessage()
      : !emailConfirmed
        ? getEmailConfirmationMessage()
        : null,
  });
}
