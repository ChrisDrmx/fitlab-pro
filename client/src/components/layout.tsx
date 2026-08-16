import { Link, useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClipboardList, BookOpen, Moon, Sun, Ruler, GraduationCap } from "lucide-react";
import { SyncBadge } from "@/components/sync-badge";

const NAV = [
  { href: "/", label: "Fittings", icon: ClipboardList },
  { href: "/coaching", label: "Coaching", icon: GraduationCap },
  { href: "/reference", label: "Chartes", icon: BookOpen },
  { href: "/outils", label: "Outils", icon: Ruler },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  const { theme, toggle } = useTheme();
  const active = (href: string) => (href === "/" ? loc === "/" || loc.startsWith("/fitting") : loc.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <span className="text-sidebar-primary"><Logo className="h-7 w-7" /></span>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">FitLab Pro</div>
            <div className="text-[11px] text-sidebar-foreground/60">Fers &amp; bois</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              <a
                data-testid={`link-${n.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active(n.href)
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </a>
            </Link>
          ))}
        </nav>
        <div className="space-y-3 px-4 py-4 text-[11px] text-sidebar-foreground/50">
          <button
            onClick={toggle}
            data-testid="button-theme"
            className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </button>
          <SyncBadge />
          <p className="leading-relaxed">Chris Deramaix — Pro de golf, Trackman &amp; vidéo</p>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sidebar-primary"><Logo className="h-6 w-6" /></span>
          <span className="text-sm font-bold tracking-tight">FitLab Pro</span>
        </div>
        <div className="flex items-center gap-0.5">
          <SyncBadge compact />
          <Button variant="ghost" size="icon" onClick={toggle} data-testid="button-theme-mobile" className="text-sidebar-foreground hover:bg-sidebar-accent">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>

      {/* Nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}>
            <a
              data-testid={`tab-${n.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-2.5 text-center text-[10px] leading-tight",
                active(n.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title, subtitle, action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-background/80 px-4 py-4 md:px-6 md:py-5">
      <div className="min-w-0">
        <h1 className="text-xl font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
