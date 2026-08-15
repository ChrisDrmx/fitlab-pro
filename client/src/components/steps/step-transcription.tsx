import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Mic, Sparkles, Wand2, Check, Quote, AlertTriangle, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CLUB_LABEL } from "@/lib/types";
import type { FittingData, ClubKey, CurrentClub, LieTest, TrackmanRow } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Libelles lisibles pour l'ecran de relecture                         */
/* ------------------------------------------------------------------ */

const PLAYER_LABEL: Record<string, string> = {
  firstName: "Prénom", lastName: "Nom", email: "E-mail", phone: "Téléphone",
  gender: "Genre", birthYear: "Année de naissance", handedness: "Latéralité",
  handicap: "Index", yearsPlaying: "Années de pratique", roundsPerMonth: "Parcours / mois",
  tempo: "Tempo", physicalNotes: "Notes physiques", missPattern: "Coup manqué type", club: "Club affilié",
};

const MEASURE_LABEL: Record<string, string> = {
  heightCm: "Taille (cm)", wristToFloorCm: "Poignet-sol (cm)", armSpanCm: "Envergure (cm)",
  handLengthCm: "Longueur de main (cm)", handCircumferenceCm: "Tour de main (cm)",
  middleFingerCm: "Majeur (cm)", gloveSizeCurrent: "Gant actuel", shoeSole: "Semelle",
};

const RECO_LABEL: Record<string, string> = {
  headIrons: "Tête fers", headWoods: "Tête bois", shaftIrons: "Shaft fers", shaftWoods: "Shaft bois",
  flex: "Flex", lengthIrons: "Longueur fers", lengthDriver: "Longueur driver", lie: "Lie",
  gripModel: "Modèle de grip", gripSize: "Taille de grip", glove: "Gant", loftGapping: "Gapping de lofts",
  driverLoft: "Loft driver", ballModel: "Balle", priority: "Priorité", notes: "Notes",
};

const MARK_LABEL: Record<string, string> = {
  toe: "marque en pointe", toe_slight: "légèrement pointe", center: "centrée",
  heel_slight: "légèrement talon", heel: "marque au talon",
};

const TM_LABEL: Record<string, string> = {
  clubSpeed: "Vit. club", ballSpeed: "Vit. balle", smash: "Smash", launch: "Départ",
  spin: "Spin", attackAngle: "Angle d'attaque", dynamicLoft: "Loft dyn.", spinLoft: "Spin loft",
  faceAngle: "Face", clubPath: "Path", faceToPath: "Face-to-path", height: "Hauteur",
  landingAngle: "Angle de chute", carry: "Carry", total: "Total", sideCarry: "Écart latéral",
};

type Result = {
  summary: string;
  player: Record<string, string>;
  measures: Record<string, string>;
  reco: Record<string, string>;
  currentClubs: Record<string, string>[];
  lieTests: Record<string, string>[];
  trackman: Record<string, string>[];
  targetBrand: string;
  fitterNotes: string;
  quotes: Record<string, string>;
  flags?: Record<string, { status: string; confidence: string }>;
  ambiguities?: string[];
};

type Flag = { status: string; confidence: string };

const STATUS_LABEL: Record<string, string> = {
  mesure: "mesuré",
  recommandation: "prescription",
  hypothese: "hypothèse",
  incertain: "incertain",
};

const EXEMPLE = `Séance du 29 juillet, joueur Marc Dupont, droitier, index 15, il joue depuis douze ans, environ quatre parcours par mois.
Mesures : il fait un mètre quatre-vingt-deux, poignet-sol quatre-vingt-huit centimètres, envergure cent quatre-vingt-huit.
Main : dix-neuf virgule cinq du pli du poignet au bout du majeur, tour de main vingt-deux, majeur huit et demi. Il joue en gant L, chaussures à crampons.
Matériel actuel : série Ping G425 de 2021, shaft AWT 2.0 en regular, grips Tour Velvet standard avec une couche.
Lie board au fer 7 : la marque part légèrement vers la pointe. Au fer 3 pareil, légèrement pointe.
Trackman fer 7 : vitesse de club quatre-vingt-sept virgule quatre, balle cent dix-huit deux, départ dix-sept deux, spin cinq mille cent, angle d'attaque moins deux virgule un, carry cent soixante-trois mètres.
Driver : vitesse quatre-vingt-dix-huit virgule quatre, carry deux cent trente mètres, il slice pas mal.
Mon avis : on part sur du stiff, un degré upright et un grip midsize. Cible PING.`;

/* ------------------------------------------------------------------ */

export function StepTranscription({
  d, set, goNext,
}: {
  d: FittingData;
  set: (fn: (draft: FittingData) => void) => void;
  goNext: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = useState(d.transcript ?? "");
  const [res, setRes] = useState<Result | null>(null);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState(false);

  const playerName = `${d.player.firstName} ${d.player.lastName}`.trim();

  const on = (k: string) => !off.has(k);
  const toggle = (k: string) =>
    setOff((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  /* --- Analyse ---------------------------------------------------- */
  const analyse = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/transcript-parse", { transcript: text });
      return (await r.json()) as Result;
    },
    onSuccess: (r) => {
      setRes(r);
      // Les hypotheses et les valeurs de faible confiance ne sont pas cochees
      // par defaut : le fitter doit les valider explicitement.
      const doute = new Set<string>();
      for (const [k, f] of Object.entries(r.flags ?? {})) {
        if (f.status === "hypothese" || f.confidence === "faible") doute.add(k);
      }
      setOff(doute);
      setApplied(false);
      set((x) => { x.transcript = text; });
      const n = countValues(r);
      toast({
        title: n ? `${n} donnée${n > 1 ? "s" : ""} détectée${n > 1 ? "s" : ""}` : "Aucune donnée exploitable",
        description: n ? "Relis la proposition puis applique-la à la fiche." : "La transcription ne contient pas de mesure identifiable.",
        variant: n ? undefined : "destructive",
      });
    },
    onError: async (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Analyse impossible.";
      toast({ title: "Analyse impossible", description: msg, variant: "destructive" });
    },
  });

  /* --- Application a la fiche du joueur ---------------------------- */
  const applyToSheet = () => {
    if (!res) return;
    set((x) => {
      merge(x, res, off);
      x.transcript = text;
    });
    setApplied(true);
    toast({
      title: "Fiche remplie",
      description: `Les données sont reportées dans la fiche de ${playerName || "ce joueur"}. Vérifie-les étape par étape.`,
    });
  };

  const nSel = useMemo(() => (res ? countValues(res) - off.size : 0), [res, off]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm" data-testid="text-transcript-player">
        <User className="h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0">
          Transcription rattachée à{" "}
          <span className="font-semibold">{playerName || "cette fiche (joueur sans nom)"}</span>
          {d.player.handicap ? <span className="text-muted-foreground"> · index {d.player.handicap}</span> : null}
        </p>
      </div>

        <SectionCard
          title="Texte de la séance"
          subtitle="Dicte pendant le fitting, colle ici après coup. Aucune valeur n'est inventée : ce qui n'est pas dit reste vide."
          icon={<Mic className="h-4 w-4" />}
          action={
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setText(EXEMPLE)} data-testid="button-transcript-example">
                Exemple
              </Button>
              <Button
                size="sm" variant="ghost" className="h-7 px-2 text-xs"
                onClick={() => { setText(""); setRes(null); setOff(new Set()); }}
                data-testid="button-transcript-clear"
              >
                Vider
              </Button>
            </div>
          }
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Colle ici la transcription de ton enregistrement…"
            className="min-h-[220px] font-mono text-[13px] leading-relaxed"
            data-testid="input-transcript"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground" data-testid="text-transcript-count">
              {words} mot{words > 1 ? "s" : ""} · {text.length} caractères
            </p>
            <Button
              onClick={() => analyse.mutate()}
              disabled={analyse.isPending || text.trim().length < 20}
              className="gap-2"
              data-testid="button-transcript-analyse"
            >
              <Sparkles className="h-4 w-4" />
              {analyse.isPending ? "Analyse en cours…" : "Analyser la transcription"}
            </Button>
          </div>
        </SectionCard>

        {analyse.isPending ? (
          <SectionCard title="Analyse en cours" subtitle="Lecture raisonnée de la transcription et extraction des mesures. Compte jusqu'à une minute sur une longue séance." icon={<Sparkles className="h-4 w-4" />}>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-secondary/60" />)}
            </div>
          </SectionCard>
        ) : null}

        {res && !analyse.isPending ? (
          <>
            <SectionCard
              title="Données détectées"
              subtitle={res.summary || "Décoche ce que tu ne veux pas reporter dans la fiche."}
              icon={<Wand2 className="h-4 w-4" />}
              action={
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOff(new Set())} data-testid="button-transcript-all">
                    Tout cocher
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOff(new Set(allKeys(res)))} data-testid="button-transcript-none">
                    Tout décocher
                  </Button>
                </div>
              }
            >
              {countValues(res) === 0 ? (
                <div className="flex items-start gap-2.5 py-6 text-sm text-muted-foreground" data-testid="text-transcript-empty">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p>
                    Aucune mesure exploitable trouvée. Vérifie que la transcription contient bien les valeurs dictées
                    (taille, poignet-sol, envergure, marques de lie board, chiffres Trackman).
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <ScalarGroup title="Joueur" data={res.player} labels={PLAYER_LABEL} prefix="player" quotes={res.quotes} flags={res.flags} on={on} toggle={toggle} />
                  <ScalarGroup title="Mesures statiques" data={res.measures} labels={MEASURE_LABEL} prefix="measures" quotes={res.quotes} flags={res.flags} on={on} toggle={toggle} />

                  {res.currentClubs.length ? (
                    <Group title="Matériel actuel">
                      {res.currentClubs.map((c, i) => (
                        <Row key={i} k={`currentClubs.${i}`} on={on} toggle={toggle} quote={res.quotes[`currentClubs.${i}`]} flag={res.flags?.[`currentClubs.${i}`]} testId={`row-tr-club-${i}`}>
                          <span className="font-medium">{CLUB_LABEL[c.club as ClubKey] ?? c.club}</span>
                          <span className="text-muted-foreground">
                            {[c.brand, c.model, c.shaft, c.flex && `flex ${c.flex}`, c.lengthIn && `${c.lengthIn}"`, c.gripModel, c.gripSize, c.wraps && `${c.wraps} couche(s)`]
                              .filter(Boolean).join(" · ")}
                          </span>
                        </Row>
                      ))}
                    </Group>
                  ) : null}

                  {res.lieTests.length ? (
                    <Group title="Test de lie">
                      {res.lieTests.map((l, i) => (
                        <Row key={i} k={`lieTests.${i}`} on={on} toggle={toggle} quote={res.quotes[`lieTests.${i}`]} flag={res.flags?.[`lieTests.${i}`]} testId={`row-tr-lie-${i}`}>
                          <span className="font-medium">{CLUB_LABEL[l.club as ClubKey] ?? l.club}</span>
                          <span className="text-muted-foreground">
                            {[MARK_LABEL[l.mark] ?? l.mark, l.correctionDeg && `${l.correctionDeg}°`].filter(Boolean).join(" · ")}
                          </span>
                        </Row>
                      ))}
                    </Group>
                  ) : null}

                  {res.trackman.length ? (
                    <Group title="Données Trackman">
                      {res.trackman.map((r, i) => (
                        <Row key={i} k={`trackman.${i}`} on={on} toggle={toggle} quote={res.quotes[`trackman.${i}`]} flag={res.flags?.[`trackman.${i}`]} testId={`row-tr-tm-${i}`}>
                          <span className="font-medium">{CLUB_LABEL[r.club as ClubKey] ?? r.club}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {Object.keys(TM_LABEL).filter((f) => r[f]).map((f) => `${TM_LABEL[f]} ${r[f]}`).join(" · ")}
                          </span>
                        </Row>
                      ))}
                    </Group>
                  ) : null}

                  <ScalarGroup title="Prescription dictée" data={res.reco} labels={RECO_LABEL} prefix="reco" quotes={res.quotes} flags={res.flags} on={on} toggle={toggle} />

                  {res.targetBrand || res.fitterNotes ? (
                    <Group title="Divers">
                      {res.targetBrand ? (
                        <Row k="targetBrand" on={on} toggle={toggle} quote={res.quotes.targetBrand} flag={res.flags?.targetBrand} testId="row-tr-brand">
                          <span className="font-medium">Marque cible</span>
                          <span className="text-muted-foreground">{res.targetBrand}</span>
                        </Row>
                      ) : null}
                      {res.fitterNotes ? (
                        <Row k="fitterNotes" on={on} toggle={toggle} quote={res.quotes.fitterNotes} flag={res.flags?.fitterNotes} testId="row-tr-notes">
                          <span className="font-medium">Notes du fitter</span>
                          <span className="text-muted-foreground">{res.fitterNotes}</span>
                        </Row>
                      ) : null}
                    </Group>
                  ) : null}
                </div>
              )}
            </SectionCard>

            {res.ambiguities?.length ? (
              <SectionCard
                title="À vérifier de vive voix"
                subtitle="Points que la transcription ne permet pas de trancher avec certitude."
                icon={<AlertTriangle className="h-4 w-4" />}
              >
                <ul className="space-y-1.5" data-testid="list-transcript-ambiguities">
                  {res.ambiguities.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-snug" data-testid={`text-ambiguity-${i}`}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {countValues(res) ? (
              <SectionCard
                title="Reporter dans la fiche"
                subtitle="Seules les lignes cochées sont écrites. Une valeur déjà saisie n'est jamais effacée par une valeur vide."
                icon={<Check className="h-4 w-4" />}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {applied
                      ? "Données reportées. Continue vers les mesures pour vérifier."
                      : `${nSel} donnée${nSel > 1 ? "s" : ""} sélectionnée${nSel > 1 ? "s" : ""} pour ${playerName || "cette fiche"}.`}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={applyToSheet} disabled={nSel <= 0} className="gap-2" data-testid="button-transcript-apply">
                      <Check className="h-4 w-4" />
                      Reporter {nSel} donnée{nSel > 1 ? "s" : ""}
                    </Button>
                    {applied ? (
                      <Button variant="outline" onClick={goNext} className="gap-2" data-testid="button-transcript-continue">
                        Vérifier les mesures
                      </Button>
                    ) : null}
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </>
        ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants de relecture                                        */
/* ------------------------------------------------------------------ */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <Separator className="flex-1" />
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  k, on, toggle, quote, flag, children, testId,
}: {
  k: string; on: (k: string) => boolean; toggle: (k: string) => void;
  quote?: string; flag?: Flag; children: React.ReactNode; testId: string;
}) {
  const active = on(k);
  return (
    <div
      className={`rounded-md border p-2.5 transition-opacity ${active ? "border-card-border bg-secondary/30" : "border-dashed border-card-border opacity-55"}`}
      data-testid={testId}
    >
      <div className="flex items-start gap-2.5">
        <Checkbox checked={active} onCheckedChange={() => toggle(k)} className="mt-0.5" aria-label={`Reporter ${k}`} data-testid={`checkbox-tr-${k}`} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm sm:flex-row sm:items-baseline sm:gap-2">
          {children}
          {flag && (flag.status !== "mesure" || flag.confidence !== "haute") ? (
            <span className="flex shrink-0 flex-wrap gap-1 sm:ml-auto">
              {flag.status !== "mesure" ? (
                <span className="rounded border border-card-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {STATUS_LABEL[flag.status] ?? flag.status}
                </span>
              ) : null}
              {flag.confidence !== "haute" ? (
                <span className="rounded border border-card-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  confiance {flag.confidence}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
      {quote ? (
        <p className="mt-1.5 flex items-start gap-1.5 pl-7 text-xs italic leading-snug text-muted-foreground">
          <Quote className="mt-0.5 h-3 w-3 shrink-0" />
          {quote}
        </p>
      ) : null}
    </div>
  );
}

function ScalarGroup({
  title, data, labels, prefix, quotes, flags, on, toggle,
}: {
  title: string; data: Record<string, string>; labels: Record<string, string>;
  prefix: string; quotes: Record<string, string>; flags?: Record<string, Flag>;
  on: (k: string) => boolean; toggle: (k: string) => void;
}) {
  const entries = Object.entries(data).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <Group title={title}>
      {entries.map(([f, v]) => (
        <Row key={f} k={`${prefix}.${f}`} on={on} toggle={toggle} quote={quotes[`${prefix}.${f}`]} flag={flags?.[`${prefix}.${f}`]} testId={`row-tr-${prefix}-${f}`}>
          <span className="font-medium">{labels[f] ?? f}</span>
          <span className="font-mono text-muted-foreground">{v}</span>
        </Row>
      ))}
    </Group>
  );
}

/* ------------------------------------------------------------------ */
/* Comptage et fusion                                                  */
/* ------------------------------------------------------------------ */

function allKeys(r: Result): string[] {
  const k: string[] = [];
  for (const f of Object.keys(r.player)) if (r.player[f]) k.push(`player.${f}`);
  for (const f of Object.keys(r.measures)) if (r.measures[f]) k.push(`measures.${f}`);
  for (const f of Object.keys(r.reco)) if (r.reco[f]) k.push(`reco.${f}`);
  r.currentClubs.forEach((_, i) => k.push(`currentClubs.${i}`));
  r.lieTests.forEach((_, i) => k.push(`lieTests.${i}`));
  r.trackman.forEach((_, i) => k.push(`trackman.${i}`));
  if (r.targetBrand) k.push("targetBrand");
  if (r.fitterNotes) k.push("fitterNotes");
  return k;
}

function countValues(r: Result) {
  return allKeys(r).length;
}

/** Reporte dans la fiche uniquement les valeurs cochees. */
function merge(base: FittingData, r: Result, off: Set<string>) {
  const keep = (k: string) => !off.has(k);

  for (const [f, v] of Object.entries(r.player)) {
    if (v && keep(`player.${f}`)) (base.player as unknown as Record<string, string>)[f] = v;
  }
  for (const [f, v] of Object.entries(r.measures)) {
    if (v && keep(`measures.${f}`)) (base.measures as unknown as Record<string, string>)[f] = v;
  }
  for (const [f, v] of Object.entries(r.reco)) {
    if (v && keep(`reco.${f}`)) (base.reco as unknown as Record<string, string>)[f] = v;
  }

  r.currentClubs.forEach((c, i) => {
    if (!keep(`currentClubs.${i}`)) return;
    const row: CurrentClub = {
      club: c.club as ClubKey, brand: c.brand ?? "", model: c.model ?? "", year: c.year ?? "",
      shaft: c.shaft ?? "", flex: c.flex ?? "", shaftWeight: c.shaftWeight ?? "",
      lengthIn: c.lengthIn ?? "", lieNote: c.lieNote ?? "", gripModel: c.gripModel ?? "",
      gripSize: c.gripSize ?? "", wraps: c.wraps ?? "",
    };
    const at = base.currentClubs.findIndex((x) => x.club === row.club);
    if (at >= 0) base.currentClubs[at] = { ...base.currentClubs[at], ...stripEmpty(row as unknown as Record<string, unknown>) } as CurrentClub;
    else base.currentClubs.push(row);
  });

  r.lieTests.forEach((l, i) => {
    if (!keep(`lieTests.${i}`)) return;
    const row: LieTest = {
      club: l.club as ClubKey, mark: (l.mark ?? "") as LieTest["mark"],
      shotsHitLeft: l.shotsHitLeft ?? "", correctionDeg: l.correctionDeg ?? "", note: l.note ?? "",
    };
    const at = base.lieTests.findIndex((x) => x.club === row.club);
    if (at >= 0) base.lieTests[at] = { ...base.lieTests[at], ...stripEmpty(row as unknown as Record<string, unknown>) } as LieTest;
    else base.lieTests.push(row);
  });

  r.trackman.forEach((t, i) => {
    if (!keep(`trackman.${i}`)) return;
    const row = { ...emptyTm(t.club as ClubKey), ...stripEmpty(t as unknown as Record<string, unknown>) } as TrackmanRow;
    const at = base.trackman.findIndex((x) => x.club === row.club);
    if (at >= 0) base.trackman[at] = { ...base.trackman[at], ...stripEmpty(row as unknown as Record<string, unknown>) } as TrackmanRow;
    else base.trackman.push(row);
  });

  if (r.targetBrand && keep("targetBrand")) base.targetBrand = r.targetBrand;
  if (r.fitterNotes && keep("fitterNotes")) {
    base.fitterNotes = base.fitterNotes ? `${base.fitterNotes}\n${r.fitterNotes}` : r.fitterNotes;
  }
}

function stripEmpty<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== "" && v !== undefined && v !== null) out[k] = v;
  return out as Partial<T>;
}

function emptyTm(club: ClubKey): TrackmanRow {
  return {
    club, clubSpeed: "", ballSpeed: "", smash: "", launch: "", spin: "", attackAngle: "",
    dynamicLoft: "", spinLoft: "", faceAngle: "", clubPath: "", faceToPath: "", height: "",
    landingAngle: "", carry: "", total: "", sideCarry: "", impactHoriz: "", impactVert: "",
  };
}

