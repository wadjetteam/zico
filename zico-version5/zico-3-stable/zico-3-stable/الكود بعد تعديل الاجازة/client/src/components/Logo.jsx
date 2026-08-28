/**
 * WADJET brand emblem — production artwork from /logo.png (512x512 PNG).
 * Rendered as a rounded badge with a subtle gold ring + soft glow.
 * Pass `withWordmark` to show the WADJET wordmark + tagline next to it.
 * API: `size`, `withWordmark`, `className`, `radius`.
 */
export default function Logo({ size = 40, withWordmark = false, className = "", radius = "rounded-xl" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center ${radius} ring-1 ring-gold/30`}
        style={{
          width: size,
          height: size,
          boxShadow: "0 0 22px rgba(212,175,55,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <img
          src="/logo.png"
          alt="WADJET"
          width={size}
          height={size}
          className="block h-full w-full rounded-[inherit] object-cover"
        />
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="heading gold-text text-lg font-semibold tracking-[0.35em]">WADJET</span>
          <span className="mt-1 text-[10px] tracking-[0.14em] text-neutral-500">
            Eyes on Risk. Control in Action.
          </span>
        </span>
      )}
    </span>
  );
}
