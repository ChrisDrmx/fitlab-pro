import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { getCoaching, newId, updateCoaching, type Coaching } from "@/lib/store";
import { emptyCoaching, type CoachingData, type CoachingExercise, type CoachingRecommendation } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { exportCoachingPdf } from "@/lib/coaching-pdf";
import { Layout } from "@/components/layout";
import { Field, SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, Download, ImagePlus, Loader2, Plus, Trash2, WandSparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { key: "eleve", label: "Élève", short: "Élève" },
  { key: "commentaires", label: "Commentaires", short: "Transcription" },
  { key: "recommandations", label: "Recommandations", short: "Recommandations" },
  { key: "exercices", label: "Exercices", short: "Exercices" },
  { key: "rapport", label: "Rapport élève", short: "Rapport" },
];

type AiResult = {
  summary: string;
  recommendations: Omit<CoachingRecommendation, "id">[];
  exercises: Omit<CoachingExercise, "id">[];
  studentReport: string;
  ambiguities: string[];
};

function hydrate(raw: string): CoachingData {
  const base = emptyCoaching();
  try {
    const value = JSON.parse(raw) as Partial<CoachingData>;
    return {
      ...base, ...value,
      student: { ...base.student, ...(value.student ?? {}) },
      recommendations: value.recommendations ?? [],
      exercises: value.exercises ?? [],
      trackmanPhotos: value.trackmanPhotos ?? [],
    };
  } catch { return base; }
}

function extension(value: string) {
  return value || "photo";
}

async function compressPhoto(file: File) {
  const source = await createImageBitmap(file);
  const max = 1400;
  const ratio = Math.min(1, max / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * ratio));
  canvas.height = Math.max(1, Math.round(source.height * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer la photo.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return { id: newId(), name: extension(file.name), dataUrl: canvas.toDataURL("image/jpeg", 0.74) };
}

export default function CoachingSessionPage() {
  const [, params] = useRoute("/coaching/:id");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = params?.id ?? "";
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CoachingData | null>(null);
  const [saved, setSaved] = useState(true);
  const [exporting, setExporting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const { data: coaching, isLoading } = useQuery<Coaching | undefined>({ queryKey: ["coachings", id], queryFn: () => getCoaching(id), enabled: Boolean(id) });
  useEffect(() => { if (coaching && data === null) setData(hydrate(coaching.data)); }, [coaching, data]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const save = useMutation({
    mutationFn: (payload: { data: CoachingData; status?: string }) => updateCoaching(id, {
      studentName: `${payload.data.student.firstName} ${payload.data.student.lastName}`.trim() || "Sans nom",
      studentEmail: payload.data.student.email,
      date: payload.data.date,
      ...(payload.status ? { status: payload.status } : {}),
      data: JSON.stringify(payload.data),
    }),
    onSuccess: () => { setSaved(true); queryClient.invalidateQueries({ queryKey: ["coachings"] }); },
    onError: () => toast({ title: "Enregistrement impossible", description: "Vérifie la connexion et réessaie.", variant: "destructive" }),
  });

  const set = (fn: (draft: CoachingData) => void) => {
    setData((previous) => {
      if (!previous) return previous;
      const next = JSON.parse(JSON.stringify(previous)) as CoachingData;
      fn(next);
      setSaved(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save.mutate({ data: next }), 700);
      return next;
    });
  };

  const analyse = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Fiche indisponible.");
      const response = await apiRequest("POST", "/api/coaching-parse", {
        transcript: data.transcript,
        student: data.student,
        objective: data.objective,
        duration: data.duration,
      });
      return response.json() as Promise<AiResult>;
    },
    onSuccess: (result) => {
      set((draft) => {
        draft.recommendations = result.recommendations.map((r) => ({ ...r, id: newId() }));
        draft.exercises = result.exercises.map((e) => ({ ...e, id: newId() }));
        draft.studentReport = result.studentReport;
      });
      toast({ title: "Commentaires analysés", description: `${result.recommendations.length} recommandation(s) et ${result.exercises.length} exercice(s) proposés. Tu peux tout modifier.` });
      setStep(2);
    },
    onError: (error) => toast({ title: "Analyse impossible", description: error instanceof Error ? error.message : "Réessaie après avoir vérifié ta session.", variant: "destructive" }),
  });

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const available = Math.max(0, 6 - (data?.trackmanPhotos.length ?? 0));
    if (!available) { toast({ title: "Limite atteinte", description: "Six photos maximum par cours pour garder la fiche légère." }); return; }
    try {
      const photos = await Promise.all([...files].slice(0, available).map(compressPhoto));
      set((draft) => { draft.trackmanPhotos.push(...photos); });
    } catch { toast({ title: "Photo non ajoutée", description: "Le fichier n'a pas pu être préparé.", variant: "destructive" }); }
  };

  const finish = () => { if (data) { save.mutate({ data, status: "termine" }); toast({ title: "Cours marqué comme terminé" }); } };
  const onExport = async () => {
    if (!data) return;
    setExporting(true);
    try { await exportCoachingPdf(data); toast({ title: "Rapport PDF généré", description: "Le fichier est prêt à être envoyé à l'élève." }); }
    catch { toast({ title: "Export impossible", description: "Réessaie dans un instant.", variant: "destructive" }); }
    finally { setExporting(false); }
  };

  if (isLoading || !data) return <Layout><div className="space-y-4 p-4 md:p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div></Layout>;
  const name = `${data.student.firstName} ${data.student.lastName}`.trim() || "Nouvelle fiche";

  return (
    <Layout>
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate("/coaching")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-base font-semibold md:text-lg">{name}</h1>{coaching?.status === "termine" ? <Badge className="shrink-0 gap-1"><CheckCircle2 className="h-3 w-3" /> Terminé</Badge> : null}</div><p className="truncate text-xs text-muted-foreground">{STEPS[step].label} · étape {step + 1} sur {STEPS.length}</p></div>
          <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">{saved ? <><Check className="h-3.5 w-3.5 text-primary" /> Enregistré</> : <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</>}</span>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:px-6">{STEPS.map((s, i) => <button key={s.key} type="button" onClick={() => setStep(i)} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${i === step ? "border-primary bg-primary text-primary-foreground" : i < step ? "border-primary/30 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}><span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold ${i === step ? "bg-primary-foreground/20" : i < step ? "bg-primary/20" : "bg-secondary"}`}>{i < step ? <Check className="h-2.5 w-2.5" /> : i + 1}</span><span className="md:hidden">{s.short}</span><span className="hidden md:inline">{s.label}</span></button>)}</div>
      </div>

      <div className="p-4 md:p-6">
        {step === 0 ? <StudentStep data={data} set={set} /> : null}
        {step === 1 ? <CommentsStep data={data} set={set} analyse={analyse} addPhotos={addPhotos} fileInput={fileInput} /> : null}
        {step === 2 ? <RecommendationsStep data={data} set={set} /> : null}
        {step === 3 ? <ExercisesStep data={data} set={set} /> : null}
        {step === 4 ? <ReportStep data={data} set={set} exporting={exporting} onExport={onExport} /> : null}
        <div className="mt-6 flex items-center justify-between gap-3"><Button variant="outline" className="gap-2" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft className="h-4 w-4" /> Précédent</Button>{step < STEPS.length - 1 ? <Button className="gap-2" onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}>{STEPS[step + 1].short} <ArrowRight className="h-4 w-4" /></Button> : <Button className="gap-2" onClick={finish}><CheckCircle2 className="h-4 w-4" /> Clôturer le cours</Button>}</div>
      </div>
    </Layout>
  );
}

function StudentStep({ data, set }: { data: CoachingData; set: (fn: (draft: CoachingData) => void) => void }) {
  return <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2"><SectionCard title="Élève" subtitle="Le nom, le prénom et l'adresse e-mail sont requis à la création."><div className="grid gap-4 sm:grid-cols-2"><Field label="Prénom *"><Input value={data.student.firstName} onChange={(e) => set((d) => { d.student.firstName = e.target.value; })} /></Field><Field label="Nom *"><Input value={data.student.lastName} onChange={(e) => set((d) => { d.student.lastName = e.target.value; })} /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Adresse e-mail *"><Input type="email" value={data.student.email} onChange={(e) => set((d) => { d.student.email = e.target.value; })} /></Field><Field label="Téléphone"><Input value={data.student.phone} onChange={(e) => set((d) => { d.student.phone = e.target.value; })} /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Niveau"><Input value={data.student.level} placeholder="Débutant, confirmé…" onChange={(e) => set((d) => { d.student.level = e.target.value; })} /></Field><Field label="Handicap"><Input value={data.student.handicap} onChange={(e) => set((d) => { d.student.handicap = e.target.value; })} /></Field></div></SectionCard><SectionCard title="Cadre du cours" subtitle="Ces informations orientent l'analyse des commentaires."><div className="grid gap-4 sm:grid-cols-2"><Field label="Date du cours"><Input type="date" value={data.date} onChange={(e) => set((d) => { d.date = e.target.value; })} /></Field><Field label="Durée"><Input value={data.duration} placeholder="60 minutes" onChange={(e) => set((d) => { d.duration = e.target.value; })} /></Field></div><div className="mt-4"><Field label="Objectif de la séance"><Textarea value={data.objective} placeholder="Ex. régulariser le contact et le départ de balle" onChange={(e) => set((d) => { d.objective = e.target.value; })} /></Field></div><div className="mt-4"><Field label="Notes générales du pro"><Textarea value={data.proNotes} placeholder="Notes libres à conserver avec le cours" onChange={(e) => set((d) => { d.proNotes = e.target.value; })} /></Field></div></SectionCard></div>;
}

function CommentsStep({ data, set, analyse, addPhotos, fileInput }: { data: CoachingData; set: (fn: (draft: CoachingData) => void) => void; analyse: ReturnType<typeof useMutation<AiResult, Error, void>>; addPhotos: (files: FileList | null) => Promise<void>; fileInput: React.MutableRefObject<HTMLInputElement | null> }) {
  return <div className="mx-auto max-w-4xl space-y-4"><SectionCard title="Commentaires du pro" subtitle="Colle ici la transcription du cours. L'IA utilisera un prompt pédagogique dédié au coaching, différent du fitting." action={<Button className="gap-2" onClick={() => analyse.mutate()} disabled={analyse.isPending || data.transcript.trim().length < 20}><WandSparkles className="h-4 w-4" />{analyse.isPending ? "Analyse…" : "Analyser les commentaires"}</Button>}><Field label="Transcription collée" hint={`${data.transcript.length} caractères · minimum 20 caractères`}><Textarea value={data.transcript} onChange={(e) => set((d) => { d.transcript = e.target.value; })} placeholder="Colle la transcription ou les commentaires dictés par le pro…" className="min-h-72" /></Field>{analyse.isPending ? <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> L'IA prépare les recommandations et les exercices…</p> : null}</SectionCard><SectionCard title="Captures Trackman" subtitle="Après la transcription, ajoute une ou plusieurs captures depuis ton ordinateur ou ton téléphone."><div className="flex flex-wrap items-center gap-3"><Button variant="outline" className="gap-2" onClick={() => fileInput.current?.click()}><ImagePlus className="h-4 w-4" /> Ajouter des photos</Button><input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addPhotos(e.target.files); e.currentTarget.value = ""; }} /><span className="text-xs text-muted-foreground">{data.trackmanPhotos.length}/6 photo(s) · compressées et conservées avec la fiche</span></div>{data.trackmanPhotos.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{data.trackmanPhotos.map((photo) => <div key={photo.id} className="relative overflow-hidden rounded-md border border-card-border"><img src={photo.dataUrl} alt={photo.name} className="aspect-video w-full object-cover" /><Button variant="destructive" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => set((d) => { d.trackmanPhotos = d.trackmanPhotos.filter((p) => p.id !== photo.id); })}><Trash2 className="h-3.5 w-3.5" /></Button><div className="truncate px-2 py-1 text-[11px] text-muted-foreground">{photo.name}</div></div>)}</div> : <div className="mt-4 rounded-md border border-dashed border-card-border p-8 text-center text-sm text-muted-foreground"><Camera className="mx-auto mb-2 h-6 w-6" />Aucune capture ajoutée pour le moment.</div>}<p className="mt-3 text-xs text-muted-foreground">L'analyse dédiée des données Trackman pourra être ajoutée ensuite. Pour l'instant, les captures restent jointes au cours.</p></SectionCard></div>;
}

function RecommendationsStep({ data, set }: { data: CoachingData; set: (fn: (draft: CoachingData) => void) => void }) {
  const add = () => set((d) => { d.recommendations.push({ id: newId(), problemObserved: "", probableCause: "", proposedCorrection: "", priority: "moyenne" }); });
  return <div className="mx-auto max-w-4xl space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Recommandations</h2><p className="text-sm text-muted-foreground">Tout est modifiable par le pro avant ou après l'analyse IA.</p></div><Button variant="outline" className="gap-2" onClick={add}><Plus className="h-4 w-4" /> Ajouter</Button></div>{!data.recommendations.length ? <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">Aucune recommandation. Analyse la transcription ou ajoute un constat manuellement.</Card> : data.recommendations.map((r, index) => <SectionCard key={r.id} title={`Recommandation ${index + 1}`} action={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => set((d) => { d.recommendations = d.recommendations.filter((item) => item.id !== r.id); })}><Trash2 className="h-4 w-4" /></Button>}><div className="grid gap-4 md:grid-cols-2"><Field label="Problème observé"><Textarea value={r.problemObserved} onChange={(e) => set((d) => { d.recommendations[index].problemObserved = e.target.value; })} /></Field><Field label="Cause probable"><Textarea value={r.probableCause} onChange={(e) => set((d) => { d.recommendations[index].probableCause = e.target.value; })} /></Field><Field label="Correction proposée"><Textarea value={r.proposedCorrection} onChange={(e) => set((d) => { d.recommendations[index].proposedCorrection = e.target.value; })} /></Field><Field label="Priorité"><Select value={r.priority || "moyenne"} onValueChange={(value) => set((d) => { d.recommendations[index].priority = value as CoachingRecommendation["priority"]; })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="haute">Haute</SelectItem><SelectItem value="moyenne">Moyenne</SelectItem><SelectItem value="basse">Basse</SelectItem></SelectContent></Select></Field></div></SectionCard>)}</div>;
}

function ExercisesStep({ data, set }: { data: CoachingData; set: (fn: (draft: CoachingData) => void) => void }) {
  const add = () => set((d) => { d.exercises.push({ id: newId(), title: "", duration: "", repetitions: "", frequency: "", instructions: "", successCriteria: "", videoUrl: "" }); });
  const field = (index: number, key: keyof CoachingExercise, value: string) => set((d) => { d.exercises[index][key] = value as never; });
  return <div className="mx-auto max-w-4xl space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Exercices</h2><p className="text-sm text-muted-foreground">L'IA les propose directement. Tu peux les ajuster ou en ajouter.</p></div><Button variant="outline" className="gap-2" onClick={add}><Plus className="h-4 w-4" /> Ajouter</Button></div>{!data.exercises.length ? <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">Aucun exercice. Analyse la transcription ou ajoute un exercice manuellement.</Card> : data.exercises.map((e, index) => <SectionCard key={e.id} title={`Exercice ${index + 1}`} action={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => set((d) => { d.exercises = d.exercises.filter((item) => item.id !== e.id); })}><Trash2 className="h-4 w-4" /></Button>}><Field label="Nom de l'exercice"><Input value={e.title} onChange={(event) => field(index, "title", event.target.value)} /></Field><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Durée"><Input value={e.duration} onChange={(event) => field(index, "duration", event.target.value)} placeholder="10 min" /></Field><Field label="Répétitions"><Input value={e.repetitions} onChange={(event) => field(index, "repetitions", event.target.value)} placeholder="3 x 10" /></Field><Field label="Fréquence / semaine"><Input value={e.frequency} onChange={(event) => field(index, "frequency", event.target.value)} placeholder="3 fois" /></Field></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Consignes"><Textarea value={e.instructions} onChange={(event) => field(index, "instructions", event.target.value)} /></Field><Field label="Critère de réussite"><Textarea value={e.successCriteria} onChange={(event) => field(index, "successCriteria", event.target.value)} /></Field></div><div className="mt-4"><Field label="Vidéo ou lien externe"><Input type="url" value={e.videoUrl} onChange={(event) => field(index, "videoUrl", event.target.value)} placeholder="https://…" /></Field></div></SectionCard>)}</div>;
}

function ReportStep({ data, set, exporting, onExport }: { data: CoachingData; set: (fn: (draft: CoachingData) => void) => void; exporting: boolean; onExport: () => Promise<void> }) {
  return <div className="mx-auto max-w-4xl space-y-4"><SectionCard title="Rapport simplifié pour l'élève" subtitle="Le texte reste modifiable. Il sera inclus dans le PDF avec les recommandations et les exercices." action={<Button className="gap-2" onClick={() => void onExport()} disabled={exporting}><Download className="h-4 w-4" />{exporting ? "Export…" : "Exporter le PDF"}</Button>}><Field label="Message à l'élève"><Textarea value={data.studentReport} onChange={(e) => set((d) => { d.studentReport = e.target.value; })} placeholder="Le rapport sera généré après l'analyse de la transcription…" className="min-h-64" /></Field></SectionCard><div className="grid gap-4 md:grid-cols-2"><Card className="p-4"><div className="text-sm font-semibold">{data.recommendations.length} recommandation(s)</div><p className="mt-1 text-xs text-muted-foreground">Vérifie-les dans l'étape précédente avant l'envoi.</p></Card><Card className="p-4"><div className="text-sm font-semibold">{data.exercises.length} exercice(s)</div><p className="mt-1 text-xs text-muted-foreground">Les consignes sont visibles dans le PDF élève.</p></Card></div></div>;
}
