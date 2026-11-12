/** Verilo logo: lime rounded-square mark with dark tick + dark wordmark. */
export function Logo({ size = 24, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Verilo">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#B8F36A" />
        <path d="M9 16.5l4.5 4.5L23 11" fill="none" stroke="#0B0F14" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {wordmark && (
        <span className="font-display text-[18px] font-semibold tracking-tight text-text leading-none">Verilo</span>
      )}
    </span>
  );
}
