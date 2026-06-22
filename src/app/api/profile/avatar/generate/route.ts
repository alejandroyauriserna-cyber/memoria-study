import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";
import { getUserAiCredentials } from "@/lib/ai/user-ai-credentials";
import { recordUserAiGenerationIfNeeded } from "@/lib/beta/record-user-ai-generation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateProfileAvatarImage } from "@/lib/profile/generate-profile-avatar-image";
import {
  removeProfileAvatar,
  uploadProfileAvatarBuffer,
} from "@/lib/profile/profile-avatar-storage";

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(200),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { rateLimit: { limit: 8, windowMs: 60 * 60 * 1000 } });
    if (auth instanceof NextResponse) return auth;

    const { prompt, displayName } = bodySchema.parse(await request.json());
    const envStatus = getImageGenerationEnvStatus();
    const userCredentials = await getUserAiCredentials(auth.user.id);

    const { result, warning } = await generateProfileAvatarImage(prompt, displayName, {
      hfToken: userCredentials.hfToken,
    });

    const { publicUrl } = await uploadProfileAvatarBuffer(
      auth.user.id,
      result.buffer,
      result.mimeType || "image/png",
    );

    const admin = createAdminClient();
    const { error: profileError } = await admin.from("user_profiles").upsert(
      {
        user_id: auth.user.id,
        avatar_url: publicUrl,
      },
      { onConflict: "user_id" },
    );

    if (profileError) throw profileError;

    if (result.source === "flux" && userCredentials.hfToken) {
      await recordUserAiGenerationIfNeeded(auth.user.id, userCredentials, "hf");
    }

    return NextResponse.json({
      ok: true,
      avatarUrl: publicUrl,
      source: result.source,
      warning: warning ?? result.warning ?? null,
      fluxConfigured: envStatus.hfTokenConfigured,
    });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Describe tu avatar en al menos 3 caracteres." },
        { status: 400 },
      );
    }

    console.error("[profile/avatar/generate]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo generar el avatar." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    await removeProfileAvatar(auth.user.id);

    const { error } = await admin
      .from("user_profiles")
      .update({ avatar_url: null })
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true, avatarUrl: null });
  } catch (caught) {
    console.error("[profile/avatar/generate DELETE]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo quitar el avatar." },
      { status: 500 },
    );
  }
}
