type Env = Record<string, string | boolean | undefined>;

export function readAppIdentity(env: Env) {
  return {
    name: String(env.VITE_APP_NAME ?? "").trim() || "Chirp",
    locale: String(env.VITE_APP_LOCALE ?? "").trim() || "uk-UA",
  };
}

export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}
