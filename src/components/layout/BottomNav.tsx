import { Link } from "@tanstack/react-router";
import { Clock3, Dumbbell, House, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Økter", icon: House },
  { to: "/history", label: "Historikk", icon: Clock3 },
  { to: "/settings", label: "Innstillinger", icon: Settings },
] as const;

export function BottomNav({ active }: { active: "home" | "history" | "settings" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md safe-pb">
      <div className="app-max flex">
        {items.map((item) => {
          const key =
            item.to === "/" ? "home" : item.to === "/history" ? "history" : "settings";
          const isActive = key === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SportIcon({ sport, className }: { sport: string; className?: string }) {
  if (sport === "strength") return <Dumbbell className={className} />;
  if (sport === "mobility") return <Clock3 className={className} />;
  return <House className={className} />;
}
