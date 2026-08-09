import { cn } from "@/lib/utils";

const sportTone: Record<string, string> = {
  running: "border-running text-running",
  strength: "border-strength text-strength",
  mobility: "border-mobility text-mobility",
};

export function Badge({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function SportBadge({
  sport,
  label,
  className,
}: {
  sport: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge className={cn(sportTone[sport] ?? "border-primary text-primary", className)}>
      {label}
    </Badge>
  );
}
