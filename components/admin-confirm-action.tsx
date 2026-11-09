import type { ReactNode } from "react";

// A server-action button that asks once more before acting. Works without JavaScript.
export function AdminConfirmAction({ action, name, value, label, confirm, children }: {
  action: (formData: FormData) => Promise<void>; name: string; value: string; label: string; confirm: string; children?: ReactNode;
}) {
  return <details className="inline-block text-left">
    <summary className="cursor-pointer list-none rounded-md border border-[var(--line)] px-2.5 py-1 text-xs font-semibold hover:border-[var(--red)]">{label}</summary>
    <form action={action} className="mt-2 w-56 whitespace-normal rounded-md border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs shadow-lg">
      <input type="hidden" name={name} value={value} />
      <p className="mb-2 text-[var(--muted)]">{confirm}</p>{children}
      <button type="submit" className="rounded-md bg-[var(--red)] px-3 py-1.5 font-semibold text-white">{label}</button>
    </form>
  </details>;
}
