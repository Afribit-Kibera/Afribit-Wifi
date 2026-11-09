import { BrandMark } from "@/components/brand-mark";

export default function Loading() {
  return (
    <main className="mesh-flow" aria-busy="true">
      <section className="mesh-flow-card mesh-portal-card" role="status" aria-live="polite">
        <header className="flow-top"><BrandMark /></header>
        <h1 className="flow-heading">Opening Mesh…</h1>
        <div className="flow-placeholders" aria-hidden="true"><span /><span /><span /><span /></div>
      </section>
    </main>
  );
}
