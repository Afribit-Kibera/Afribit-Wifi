"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, Share, SquarePlus } from "lucide-react";
import { copyText, isSignInWindow } from "@/lib/browser";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const appUrl = "https://wifi.afribit.africa/app";
const noop = () => () => {};

function platform(userAgent: string) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent));
  // Sign-in windows cannot install apps, and cannot open Chrome or Safari for us.
  return { ios, captive: isSignInWindow(userAgent) };
}

// Install Mesh on the home screen. Phones only allow this from Chrome or
// Safari, so the Wi-Fi sign-in window shows the address to open there.
export function InstallMesh() {
  const userAgent = useSyncExternalStore(noop, () => navigator.userAgent, () => "");
  const standalone = useSyncExternalStore(noop, () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true, () => false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [copied, setCopied] = useState(false);
  const device = platform(userAgent);

  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", done); };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    if ((await prompt.userChoice).outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }
  async function copy() { setCopied(await copyText(appUrl)); }

  if (standalone || installed) return <div className="install-step"><Check size={18} aria-hidden="true" /><p><strong>Mesh is on your home screen.</strong> Open it any time you are near Mesh Wi-Fi.</p></div>;
  if (prompt) return <button type="button" className="flow-action" onClick={install}><Download size={17} aria-hidden="true" /> Install Mesh</button>;
  if (device.captive) return <div className="install-steps">
    <p className="flow-copy">Open {device.ios ? "Safari" : "Chrome"} and go to this address. Tap it to copy.</p>
    <button type="button" className="flow-action secondary" onClick={copy}>{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? "Copied" : "wifi.afribit.africa/app"}</button>
  </div>;
  if (device.ios) return <ol className="install-steps">
    <li><Share size={17} aria-hidden="true" /> Tap the Share button in Safari.</li>
    <li><SquarePlus size={17} aria-hidden="true" /> Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
  </ol>;
  return <ol className="install-steps">
    <li>Open the browser menu <strong>⋮</strong>.</li>
    <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
  </ol>;
}

// Registers the offline page for the home-screen app. No private data is cached.
export function MeshServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || location.pathname.startsWith("/admin")) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
