"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction } from "@/app/admin/login/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <form action={action} className="mt-8 space-y-5">
      <div><label className="field-label" htmlFor="email">Email</label><Input id="email" name="email" type="email" autoComplete="username" required /></div>
      <div><label className="field-label" htmlFor="password">Password</label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {state.error && <p className="rounded-md bg-[var(--red-soft)] p-3 text-sm text-[var(--red)]">{state.error}</p>}
      <Button className="w-full" disabled={pending}>{pending ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />} Sign in</Button>
    </form>
  );
}
