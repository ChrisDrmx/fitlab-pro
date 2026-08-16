import { useQuery, useMutation } from "@tanstack/react-query";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, Download, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { listReports, deleteReport } from "@/lib/store";
import { exportFittingPdf } from "@/lib/pdf";
import { emptyFitting } from "@/lib/types";
import type { FittingData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export type StoredReport = {
  id: string;
  fittingId: string;
  playerName: string;
  createdAt: string;
  label: string;
  brand: string;
  insightCount: number;
  snapshot: string;
};

export function formatStamp(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("fr-BE", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function ReportHistory({ fittingId }: { fittingId: string }) {
  const { toast } = useToast();
  const key = ["reports", fittingId];

  const { data: reports = [], isLoading } = useQuery<StoredReport[]>({
    queryKey: key,
    queryFn: () => listReports(fittingId),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const download = async (r: StoredReport) => {
    try {
      const snap = { ...emptyFitting(), ...(JSON.parse(r.snapshot) as Partial<FittingData>) } as FittingData;
      await exportFittingPdf(snap, r.createdAt);
    } catch {
      toast({ title: "Rapport illisible", description: "L'archive de ce rapport n'a pas pu être relue.", variant: "destructive" });
    }
  };

  return (
    <SectionCard
      title="Rapports archivés"
      subtitle="Chaque génération est conservée avec sa date. Utile pour comparer deux séances du même joueur."
      icon={<Archive className="h-4 w-4" />}
    >
      {isLoading ? (
        <div className="space-y-2 py-2">
          {[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-md bg-secondary/60" />)}
        </div>
      ) : !reports.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground" data-testid="text-no-reports">
          Aucun rapport généré pour l'instant. Le prochain export sera archivé ici avec sa date.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3" data-testid={`report-${r.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug" data-testid={`text-report-date-${r.id}`}>
                  {formatStamp(r.createdAt)}
                </p>
                <p className="text-xs leading-snug text-muted-foreground">
                  {r.insightCount} constat{r.insightCount > 1 ? "s" : ""} imprimé{r.insightCount > 1 ? "s" : ""}
                  {r.label ? ` · ${r.label}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
              {r.brand ? <Badge variant="secondary" className="text-[11px]">{r.brand}</Badge> : null}
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => void download(r)} data-testid={`button-report-download-${r.id}`}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"
                onClick={() => del.mutate(r.id)} disabled={del.isPending}
                aria-label="Supprimer ce rapport" data-testid={`button-report-delete-${r.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
