"use client";

import { useEffect, useState } from "react";
import { SavedCodes } from "@/components/pass-panel";
import { readSavedPasses, type SavedPass } from "@/lib/saved-passes";

// The Mesh app's copy of this phone's pass codes. Shows nothing until one is saved.
export function SavedPassesCard() {
  const [saved, setSaved] = useState<SavedPass[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSaved(readSavedPasses()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return saved.length ? <SavedCodes saved={saved} /> : null;
}
