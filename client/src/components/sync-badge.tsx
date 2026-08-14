import { useEffect, useState } from "react";
import { onSyncState, syncNow, type SyncState } from "@/lib/sync";
import { useAuth } from "@/lib/auth";
import { Cloud, CloudOff, RefreshCw, AlertTriangle, HardDrive, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/** Etat de sauvegarde, visible en permanence pour rassurer pendant une seance. */
export function SyncBadge({ compact = false }: { compact?: boolean }) {
  const [s, setS] = useState<SyncState>({ status: "local", pending: 0, lastSync: null, message: "" });
  const { session, email, signOut } = useAuth();

  useEffect(() => {
    const off = onSyncState(setS);
    return () => { off(); };
  }, []);

  const meta = {
    "a-jour": { icon: Cloud, label: "Sauvegardé en ligne", tone: "text-primary" },
    synchro: { icon: RefreshCw, label: "Synchronisation…", tone: "text-muted-foreground animate-spin" },
    "hors-ligne": { icon: CloudOff, label: "Hors ligne", tone: "text-amber-500" },
    local: { icon: HardDrive, label: "Sur cet appareil", tone: "text-muted-foreground" },
    erreur: { icon: AlertTriangle, label: "Synchro en attente", tone: "text-amber-500" },
  }[s.status];
  const Icon = meta.icon;

  const detail =
    s.pending && s.status !== "local"
      ? `${s.pending} modification${s.pending > 1 ? "s" : ""} à envoyer`
      : s.message
        ? s.message
        : s.lastSync
          ? `Dernière synchro ${new Date(s.lastSync).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}`
          : "";

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void syncNow()}
        title={`${meta.label} — ${detail}`}
        aria-label={meta.label}
        data-testid="button-sync-compact"
        className="relative grid h-9 w-9 place-items-center rounded-md text-sidebar-foreground/80"
      >
        <Icon className={cn("h-4 w-4", meta.tone)} />
        {s.pending ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" data-testid="dot-sync-pending" />
        ) : null}
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => void syncNow()}
        data-testid="button-sync"
        className="flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left text-sidebar-foreground/70 hover:text-sidebar-foreground"
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.tone)} />
        <span className="min-w-0 leading-tight">
          <span className="block text-[11px] font-medium" data-testid="text-sync-status">{meta.label}</span>
          <span className="block truncate text-[10px] text-sidebar-foreground/50" data-testid="text-sync-detail">{detail}</span>
        </span>
      </button>
      {session ? (
        <button
          type="button"
          onClick={() => void signOut()}
          data-testid="button-signout"
          className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-3 w-3 shrink-0" />
          <span className="truncate">{email}</span>
        </button>
      ) : null}
    </div>
  );
}
