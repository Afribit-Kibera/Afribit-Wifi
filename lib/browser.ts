// The phone's Wi-Fi sign-in window rather than Chrome or Safari. Android's
// window is a WebView ("; wv)") that only follows http(s), tel: and sms:
// links, so it cannot open Blink or install Mesh. iOS's window has no "Safari/".
export function isSignInWindow(userAgent: string) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent);
  return /CaptiveNetworkSupport|; wv\)/i.test(userAgent) || (ios && !/Safari\//.test(userAgent));
}

// Copies text, falling back for sign-in windows without the clipboard API.
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* Try the older way. */ }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand("copy"); } catch { copied = false; }
  field.remove();
  return copied;
}
