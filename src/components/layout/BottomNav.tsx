import { Link } from "@tanstack/react-router";
import { Clock3, House, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Økter", icon: House, key: "home" as const },
  { to: "/history", label: "Historikk", icon: Clock3, key: "history" as const },
  { to: "/settings", label: "Innstillinger", icon: Settings, key: "settings" as const },
];

export function BottomNav({ active }: { active: "home" | "history" | "settings" }) {
  return (
    <nav className="nav-blur fixed inset-x-0 bottom-0 z-40 border-t border-border safe-pb">
      <div className="app-max flex justify-around px-2 pb-1.5 pt-2.5">
        {items.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                isActive ? "font-semibold text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-[22px]" strokeWidth={isActive ? 2.2 : 1.9} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
