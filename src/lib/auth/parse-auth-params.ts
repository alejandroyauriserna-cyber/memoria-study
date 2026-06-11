export type AuthUrlParams = {
  search: URLSearchParams;
  hash: URLSearchParams;
  type: string | null;
  code: string | null;
  tokenHash: string | null;
  token: string | null;
  email: string | null;
  authError: string | null;
};

export function parseAuthUrl(url: string | URL = typeof window !== "undefined" ? window.location.href : "http://localhost"): AuthUrlParams {
  const parsed = typeof url === "string" ? new URL(url) : url;
  const search = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));

  const authError =
    search.get("auth_error") ??
    search.get("error_description") ??
    search.get("error") ??
    hash.get("error_description") ??
    hash.get("error");

  return {
    search,
    hash,
    type: search.get("type") ?? hash.get("type"),
    code: search.get("code"),
    tokenHash: search.get("token_hash") ?? hash.get("token_hash"),
    token: search.get("token"),
    email: search.get("email"),
    authError,
  };
}

export function needsServerAuthConfirm(params: AuthUrlParams): boolean {
  return Boolean(params.code || params.tokenHash || (params.token && params.type));
}

export function buildAuthConfirmUrl(params: AuthUrlParams): string {
  const query = new URLSearchParams();
  if (params.code) query.set("code", params.code);
  if (params.tokenHash) query.set("token_hash", params.tokenHash);
  if (params.token) query.set("token", params.token);
  if (params.type) query.set("type", params.type);
  if (params.email) query.set("email", params.email);
  return `/api/auth/confirm?${query.toString()}`;
}

export function hasRecoverySignal(params: AuthUrlParams): boolean {
  return params.type === "recovery" || params.search.get("mode") === "reset-password";
}

export function hasImplicitSessionHash(params: AuthUrlParams): boolean {
  return Boolean(params.hash.get("access_token") || params.hash.get("refresh_token"));
}
