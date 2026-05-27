import Image from "next/image";

export function BrandLockup({
  kicker = "Verify. Connect. Place.",
  variant = "compact",
}: {
  kicker?: string;
  variant?: "compact" | "full";
}) {
  if (variant === "full") {
    return (
      <>
        <span className="brand-logo-crop" aria-hidden="true">
          <Image
            src="/brand/afyalink-logo.png"
            alt=""
            width={190}
            height={48}
            priority
            className="brand-logo-image"
            sizes="190px"
          />
        </span>
        <span className="sr-only">Afyalink</span>
      </>
    );
  }

  return (
    <>
      <span className="brand-mark" aria-hidden="true">
        <Image src="/brand/afyalink-mark.svg" alt="" width={38} height={38} unoptimized />
      </span>
      <span className="brand-lockup">
        <span>Afyalink</span>
        <span className="brand-kicker">{kicker}</span>
      </span>
    </>
  );
}
