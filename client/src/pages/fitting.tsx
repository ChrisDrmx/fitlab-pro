import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getFitting, updateFitting, createReport, type Fitting } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Loader2, CheckCircle2 } from "lucide-react";
import type { FittingData } from "@/lib/types";
import { emptyFitting } from "@/lib/types";
import { StepPlayer } from "@/components/steps/step-player";
import { StepTranscription } from "@/components/steps/step-transcription";
import { StepMeasures } from "@/components/steps/step-measures";
import { StepGear } from "@/components/steps/step-gear";
import { StepLie } from "@/components/steps/step-lie";
import { StepTrackman } from "@/components/steps/step-trackman";
import { StepDiagnosis } from "@/components/steps/step-diagnosis";
import { exportFittingPdf } from "@/lib/pdf";
import { ReportHistory } from "@/components/report-history";
import { buildDiagnosis } from "@/lib/engine";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { key: "joueur", label: "Joueur", short: "Joueur" },
  { key: "transcription", label: "Transcription", short: "Transcript." },
  { key: "mesures", label: "Mesures statiques", short: "Mesures" },
  { key: "materiel", label: "Matériel actuel", short: "Matériel" },
  { key: "lie", label: "Lie dynamique", short: "Lie" },
  { key: "trackman", label: "Données Trackman", short: "Trackman" },
  { key: "diagnostic", label: "Diagnostic & rapport", short: "Diagnostic" },
];

/** Fusionne les données stockées avec la structure vide pour tolérer les anciennes fiches. */
function hydrate(raw: string): FittingData {
  const base = emptyFitting();
  try {
    const p = JSON.parse(raw) as Partial<FittingData>;
    return {
      ...base, ...p,
      player: { ...base.player, ...(p.player ?? {}) },
      measures: { ...base.measures, ...(p.measures ?? {}) },
      currentClubs: p.currentClubs ?? [],
      lieTests: p.lieTests ?? [],
      trackman: p.trackman ?? [],
      transcript: p.transcript ?? "",
    };
  } catch {
    return base;
  }
}

export default function FittingPage() {
  const [, params] = useRoute("/fitting/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = params?.id ?? "";
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FittingData | null>(null);
  const [saved, setSaved] = useState(true);
  const [exporting, setExporting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: fitting, isLoading } = useQuery<Fitting | undefined>({
    queryKey: ["fittings", id],
    queryFn: () => getFitting(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (fitting && data === null) setData(hydrate(fitting.data));
  }, [fitting, data]);

  const save = useMutation({
    mutationFn: async (payload: { data: FittingData; status?: string }) => {
      const name = `${payload.data.player.firstName} ${payload.data.player.lastName}`.trim();
      await updateFitting(id, {
        playerName: name || "Sans nom",
        brand: payload.data.targetBrand,
        ...(payload.status ? { status: payload.status } : {}),
        data: JSON.stringify(payload.data),
      });
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["fittings"] });
    },
    onError: () => toast({ title: "Enregistrement impossible", description: "Vérifie la connexion et réessaie.", variant: "destructive" }),
  });

  /** Mutation immuable + auto-enregistrement différé. */
  const set = (fn: (draft: FittingData) => void) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as FittingData;
      fn(next);
      setSaved(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save.mutate({ data: next }), 700);
      return next;
    });
  };

  const finish = () => {
    if (!data) return;
    save.mutate({ data, status: "termine" });
    toast({ title: "Fiche marquée comme terminée" });
  };

  const onExport = async () => {
    if (!data) return;
    setExporting(true);
    const createdAt = new Date().toISOString();
    try {
      await exportFittingPdf(data, createdAt);
      const dx = buildDiagnosis(data);
      const kept = dx.insights.filter((it) => !(data.excludedInsights ?? []).includes(it.id)).length;
      try {
        // Archivage du rapport sur la fiche du joueur, retrouvable par date.
        await createReport({
          fittingId: id,
          playerName: `${data.player.firstName} ${data.player.lastName}`.trim() || "Sans nom",
          createdAt,
          label: dx.summary.lie ? `Lie ${dx.summary.lie} · ${dx.summary.length}` : "",
          brand: data.targetBrand || "",
          insightCount: kept,
          snapshot: JSON.stringify(data),
        });
        queryClient.invalidateQueries({ queryKey: ["reports", id] });
      } catch {
        toast({ title: "PDF généré, archivage impossible", description: "Le rapport n'a pas pu être ajouté à l'historique.", variant: "destructive" });
        return;
      }
      toast({ title: "Rapport PDF généré", description: "Il est archivé sur la fiche avec sa date." });
    } catch {
      toast({ title: "Échec de la génération du PDF", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <Layout>
        <div className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const playerName = `${data.player.firstName} ${data.player.lastName}`.trim() || "Nouvelle fiche";

  return (
    <Layout>
      {/* En-tête collant */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold md:text-lg" data-testid="text-fitting-title">{playerName}</h1>
              {fitting?.status === "termine" ? (
                <Badge variant="default" className="shrink-0 gap-1"><CheckCircle2 className="h-3 w-3" /> Terminé</Badge>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {STEPS[step].label} · étape {step + 1} sur {STEPS.length}
              {data.targetBrand ? ` · ${data.targetBrand}` : ""}
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex" data-testid="text-save-state">
            {saved
              ? <><Check className="h-3.5 w-3.5 text-primary" /> Enregistré</>
              : <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</>}
          </span>
        </div>

        {/* Barre d'étapes */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:px-6">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(i)}
              data-testid={`button-step-${s.key}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                i === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < step
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold ${
                i === step ? "bg-primary-foreground/20" : i < step ? "bg-primary/20" : "bg-secondary"
              }`}>
                {i < step ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              <span className="md:hidden">{s.short}</span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {step === 0 ? <StepPlayer d={data} set={set} /> : null}
        {step === 1 ? <StepTranscription d={data} set={set} goNext={() => setStep(2)} /> : null}
        {step === 2 ? <StepMeasures d={data} set={set} /> : null}
        {step === 3 ? <StepGear d={data} set={set} /> : null}
        {step === 4 ? <StepLie d={data} set={set} /> : null}
        {step === 5 ? <StepTrackman d={data} set={set} /> : null}
        {step === 6 ? (
          <div className="space-y-4">
            <StepDiagnosis d={data} set={set} onExport={onExport} exporting={exporting} />
            <ReportHistory fittingId={id} />
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline" className="gap-2"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            data-testid="button-prev"
          >
            <ArrowLeft className="h-4 w-4" /> Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="gap-2" onClick={() => setStep((s) => s + 1)} data-testid="button-next">
              {STEPS[step + 1].short} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="gap-2" onClick={finish} data-testid="button-finish">
              <CheckCircle2 className="h-4 w-4" /> Clôturer la fiche
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
