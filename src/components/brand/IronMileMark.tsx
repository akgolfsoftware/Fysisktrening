import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type Props = {
  className?: string;
  withWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
};

const px = { sm: 28, md: 34, lg: 44, xl: 72 } as const;
const word = {
  sm: "text-lg",
  md: "text-[22px]",
  lg: "text-3xl",
  xl: "text-[32px]",
} as const;

/** Design-spec mark: iron plate + copper plates + bar */
export function IronMileMark({
  className,
  withWordmark = false,
  size = "md",
  showTagline = true,
}: Props) {
  const s = px[size];
  return (
    <div className={cn("flex flex-row items-center gap-[11px]", className)}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 64 64"
        fill="none"
        className="block shrink-0"
        role="img"
        aria-label={BRAND.name}
      >
        <rect width="64" height="64" rx="16" fill="#2a3136" />
        <rect x="12" y="26" width="5" height="12" rx="1.8" fill="#8f4f38" />
        <rect x="47" y="26" width="5" height="12" rx="1.8" fill="#8f4f38" />
        <rect x="20" y="28.5" width="4" height="7" rx="1.4" fill="#f4f2ed" />
        <rect x="40" y="28.5" width="4" height="7" rx="1.4" fill="#f4f2ed" />
        <rect x="24" y="30.8" width="16" height="2.4" rx="1.2" fill="#f4f2ed" />
      </svg>
      {withWordmark && (
        <div className="flex flex-col justify-center">
          <span className={cn("font-display leading-none text-foreground", word[size])}>
            {BRAND.name}
          </span>
          {showTagline && size !== "sm" && (
            <span className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
