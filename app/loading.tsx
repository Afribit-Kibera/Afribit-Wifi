export default function Loading() {
  return (
    <main className="mesh-portal mesh-catalogue mesh-catalogue-loading" aria-busy="true">
      <div className="mesh-header">
        <span className="mesh-brand">
          <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M4 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10M10 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>
          <span>Mesh</span>
        </span>
      </div>
      <section className="mesh-main mesh-catalogue-loading-copy" role="status" aria-live="polite">
        <span className="mesh-eyebrow">Afribit · Powered by Bitcoin</span>
        <h1>Opening Mesh…</h1>
        <p>Your internet passes are on their way.</p>
        <div className="mesh-catalogue-placeholders" aria-hidden="true"><span /><span /><span /><span /></div>
      </section>
    </main>
  );
}
