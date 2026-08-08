import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";

export function AppShell({
  children,
  active,
  className,
  hideNav = false,
}: {
  children: ReactNode;
  active: "home" | "history" | "settings";
  className?: string;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className={cn("app-max flex min-h-dvh flex-col", className)}>
        <main
          className={cn(
            "flex-1 px-4 pt-[calc(var(--grok-banner-h,0px)+1.5rem)]",
            hideNav ? "pb-10" : "pb-32",
          )}
        >
          {children}
        </main>
        {!hideNav && <BottomNav active={active} />}
      </div>
    </div>
  );
}
