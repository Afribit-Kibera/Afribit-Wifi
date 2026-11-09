// Pass codes kept on this phone, so the Mesh app and browser can show them
// even after the sign-in cookie is gone. The phone's own storage only; the
// iPhone sign-in window wipes its storage when it closes, Safari and the app don't.
export type SavedPass = { code: string; kind: string; expiresAt: string; savedAt: string };
const key = "mesh:passes";

export function readSavedPasses(): SavedPass[] {
  try {
    const list = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(list) ? list.filter((item): item is SavedPass => typeof item?.code === "string" && Date.parse(item.expiresAt) > Date.now()) : [];
  } catch { return []; }
}

export function savePass(pass: { code: string; kind: string; expiresAt: string }) {
  try {
    const others = readSavedPasses().filter(item => item.code !== pass.code);
    const list = [{ ...pass, savedAt: new Date().toISOString() }, ...others].slice(0, 5);
    localStorage.setItem(key, JSON.stringify(list));
  } catch { /* Private mode or storage blocked: nothing to keep. */ }
}

export function timeLeft(expiresAt: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((Date.parse(expiresAt) - now) / 60_000));
  if (minutes >= 2880) return `${Math.floor(minutes / 1440)} days left`;
  if (minutes >= 120) return `${Math.floor(minutes / 60)} hours left`;
  if (minutes >= 60) return `1 hour ${minutes - 60} min left`;
  return `${minutes} min left`;
}

export const endsAt = (expiresAt: string) =>
  new Date(expiresAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", weekday: "short", hour: "numeric", minute: "2-digit" });
