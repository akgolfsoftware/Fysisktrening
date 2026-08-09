import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "iron-mile-pwa-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Soft install prompt: Android/Chrome via beforeinstallprompt,
 * iOS via Share → Add to Home Screen instructions.
 */
export function InstallPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS: show after short delay if not standalone
    if (isIos()) {
      const t = window.setTimeout(() => {
        setShowIos(true);
        setVisible(true);
      }, 1800);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBip);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    setVisible(false);
    setDeferred(null);
    setShowIos(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "rounded-[18px] border border-strength/30 bg-card p-4 shadow-[var(--shadow-soft)]",
        className,
      )}
      role="region"
      aria-label="Installer app"
    >
      <div className="flex items-start gap-3">
        <img
          src="/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{BRAND.name} på hjemskjermen</p>
          {showIos && !deferred ? (
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              Trykk <Share className="mx-0.5 inline size-3.5 align-text-bottom" /> Del, deretter
              «Legg til på Hjem-skjerm».
            </p>
          ) : (
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              Installer for rask tilgang, fullskjerm og offline-bruk.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {deferred && (
              <Button type="button" size="sm" variant="strength" onClick={() => void install()}>
                <Download className="size-3.5" /> Installer
              </Button>
            )}
            {showIos && !deferred && (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href="/?install=1&platform=ios">Vis steg</a>
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              Ikke nå
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground"
          aria-label="Lukk"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
