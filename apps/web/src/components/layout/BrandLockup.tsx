export function BrandLockup({ kicker = "Verify. Connect. Place." }: { kicker?: string }) {
  return (
    <>
      <span className="brand-mark" aria-hidden="true">
        Af
      </span>
      <span className="brand-lockup">
        <span>Afyalink</span>
        <span className="brand-kicker">{kicker}</span>
      </span>
    </>
  );
}
