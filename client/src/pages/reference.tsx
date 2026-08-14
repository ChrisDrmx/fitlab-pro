import { Layout, PageHeader } from "@/components/layout";
import { SectionCard, SourceLink } from "@/components/kit";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLUB_LABEL } from "@/lib/types";
import {
  PING_COLORS_CURRENT, PING_COLORS_CURRENT_SRC, PING_COLORS_LEGACY, PING_COLORS_LEGACY_SRC,
  PING_LENGTH_BY_HEIGHT, PING_GRIP_COLORS, PING_GRIP_SRC, PING_SRC,
  STANDARD_LIE, STATIC_LIE_SRC, MODEL_SPECS, MODEL_SPECS_NOTE,
  PGA_TOUR, TOUR_SRC, LPGA_TOUR, LPGA_SRC, CLUB_WINDOWS, WINDOW_SRC,
  IRON7_WINDOW_BY_SPEED, SHAFT_WEIGHT_RANGES, FLEX_IRON_SRC,
  GRIP_SIZE_TABLE, GRIP_SIZE_SRC, GRIP_BUILDUP_NOTE, GRIP_BUILDUP_SRC,
  GLOVE_TABLE, GLOVE_SRC, GLOVE_NOTE, LIE_DEVIATION_BY_CLUB, LIE_DEVIATION_SRC,
  LIE_LOGIC_NOTE, ARM_SPAN_NOTE, GAPPING_NOTE, GEAR_EFFECT_NOTE, GEAR_EFFECT_SRC,
  LIE_MARKS, IN,
} from "@/data/reference";

function T({ head, rows, mono = true }: { head: string[]; rows: (string | JSX.Element)[][]; mono?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {head.map((h) => <th key={h} className="whitespace-nowrap pb-2 pr-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className={mono ? "tabular-nums" : ""}>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`whitespace-nowrap py-1.5 pr-3 ${j === 0 ? "font-medium" : mono ? "font-mono text-xs" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Swatch = ({ hex, label }: { hex: string; label: string }) => (
  <span className="flex items-center gap-2">
    <span className="h-3 w-3 shrink-0 rounded-full border border-border" style={{ backgroundColor: hex }} />
    {label}
  </span>
);

export default function Reference() {
  return (
    <Layout>
      <PageHeader
        title="Chartes de fitting"
        subtitle="Base de référence constructeurs, shafts, grips et fenêtres Trackman — chaque table renvoie à sa source"
      />
      <div className="p-4 md:p-6">
        <Tabs defaultValue="lie">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="lie" data-testid="tab-lie">Lie &amp; longueur</TabsTrigger>
            <TabsTrigger value="marques" data-testid="tab-marques">Marques</TabsTrigger>
            <TabsTrigger value="trackman" data-testid="tab-trackman">Trackman</TabsTrigger>
            <TabsTrigger value="shafts" data-testid="tab-shafts">Shafts</TabsTrigger>
            <TabsTrigger value="grips" data-testid="tab-grips">Grips &amp; gants</TabsTrigger>
            <TabsTrigger value="methode" data-testid="tab-methode">Méthode</TabsTrigger>
          </TabsList>

          {/* ---------------- LIE ---------------- */}
          <TabsContent value="lie" className="mt-0 space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="PING — code couleur actuel" subtitle="Système 1° par couleur, ©PING 2020. Black = standard.">
                <T
                  head={["Couleur", "Correction de lie"]}
                  rows={PING_COLORS_CURRENT.map((c) => [
                    <Swatch key={c.color} hex={c.hex} label={`${c.fr} (${c.color})`} />,
                    c.deg === 0 ? "Standard" : `${Math.abs(c.deg)}° ${c.deg > 0 ? "upright" : "flat"}`,
                  ])}
                  mono={false}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  La charte officielle PING est publiée uniquement sous forme d'image, sans PDF téléchargeable ni calculateur interactif.
                  Les fiches techniques des fers précisent que le lie publié correspond au code Black à longueur standard.
                </p>
                <SourceLink src={PING_COLORS_CURRENT_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="PING — système historique" subtitle="Séries anciennes : 0,75° par couleur, avec bandes de wrist-to-floor.">
                <T
                  head={["Couleur", "Lie", "Wrist-to-floor"]}
                  rows={PING_COLORS_LEGACY.map((c) => [
                    <Swatch key={c.color} hex={c.hex} label={c.fr} />,
                    c.deg === 0 ? "Standard" : `${c.deg > 0 ? "+" : ""}${c.deg}°`,
                    c.wtfMin === null ? "—" : `${c.wtfMin}" – ${c.wtfMax === null ? "+" : `${c.wtfMax}"`}`,
                  ])}
                  mono={false}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Ce système comprend Yellow et Purple, qui ne figurent plus sur la charte actuelle. Utile pour identifier un club d'occasion.
                </p>
                <SourceLink src={PING_COLORS_LEGACY_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="PING — ajustement de longueur par taille" subtitle="Bandes relevées sur la charte officielle.">
                <T
                  head={["Taille", "Ajustement"]}
                  rows={PING_LENGTH_BY_HEIGHT.map((r, i, a) => [
                    `${r.label} · ${i === 0 ? `${r.minCm.toFixed(0)} cm et plus` : i === a.length - 1 ? `moins de ${r.maxCm.toFixed(0)} cm` : `${r.minCm.toFixed(0)}–${r.maxCm.toFixed(0)} cm`}`,
                    r.adjIn === 0 ? "Longueur standard" : `${r.adjIn > 0 ? "+" : "−"}${Math.abs(r.adjIn)}"`,
                  ])}
                />
                <SourceLink src={PING_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="Lie standard par club — hommes" subtitle="Référence de série adulte homme, avant correction.">
                <T
                  head={["Club", "Lie standard"]}
                  rows={Object.entries(STANDARD_LIE).map(([k, v]) => [CLUB_LABEL[k as keyof typeof CLUB_LABEL] ?? k, `${v}°`])}
                />
                <SourceLink src={STATIC_LIE_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="Effet d'une erreur de lie" subtitle="Plus le loft est fort, plus l'erreur de lie coûte cher." className="xl:col-span-2">
                <T
                  head={["Club", "Loft", "Distance de référence", "Erreur de lie", "Déviation latérale"]}
                  rows={LIE_DEVIATION_BY_CLUB.map((r) => [
                    r.club, `${r.loft}°`, `${r.distanceM} m`, `${r.errorDeg}°`, `${r.deviationM} m`,
                  ])}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Règle de terrain : environ 4 yards (3,7 m) de déviation par degré de lie incorrect sur un fer médian.
                </p>
                <SourceLink src={LIE_DEVIATION_SRC} className="mt-3" />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ---------------- MARQUES ---------------- */}
          <TabsContent value="marques" className="mt-0 space-y-4">
            <SectionCard title="Lofts et lie par modèle" subtitle="Marques travaillées par Drohme en premier : PING, Callaway, Cobra.">
              <T
                head={["Marque", "Modèle", "Catégorie", "Fer 7 loft", "Fer 7 lie", "Fer 7 long."]}
                rows={MODEL_SPECS.map((m) => [
                  m.brand, m.model, m.category,
                  m.iron7.loft !== null ? `${m.iron7.loft}°` : "—",
                  m.iron7.lie !== null ? `${m.iron7.lie}°` : "—",
                  m.iron7.lengthIn !== null ? `${m.iron7.lengthIn}"` : "—",
                ])}
                mono={false}
              />
              <div className="mt-4 rounded-md border border-chart-2/40 bg-chart-2/10 p-3 text-xs leading-relaxed">
                {MODEL_SPECS_NOTE}
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {MODEL_SPECS.map((m) => (
                <SectionCard key={`${m.brand}-${m.model}`} title={`${m.brand} ${m.model}`} subtitle={m.category}>
                  <div className="flex flex-wrap gap-1.5">
                    {m.iron7.loft !== null ? <Badge variant="secondary" className="font-mono text-[11px]">Fer 7 : {m.iron7.loft}°</Badge> : null}
                    {m.iron7.lie !== null ? <Badge variant="secondary" className="font-mono text-[11px]">Lie {m.iron7.lie}°</Badge> : null}
                    {m.pw?.loft ? <Badge variant="secondary" className="font-mono text-[11px]">PW : {m.pw.loft}°</Badge> : null}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.notes}</p>
                  <SourceLink src={m.src} className="mt-3" />
                </SectionCard>
              ))}
            </div>
          </TabsContent>

          {/* ---------------- TRACKMAN ---------------- */}
          <TabsContent value="trackman" className="mt-0 space-y-4">
            <SectionCard title="Moyennes PGA Tour" subtitle="Référence haute — à ne pas utiliser comme objectif pour un amateur.">
              <T
                head={["Club", "Vit. club", "Attaque", "Vit. balle", "Smash", "Départ", "Backspin", "Hauteur", "Chute", "Carry"]}
                rows={PGA_TOUR.map((r) => [
                  CLUB_LABEL[r.club], `${r.clubSpeed}`, `${r.attack}°`, `${r.ballSpeed}`,
                  `${r.smash}`, `${r.launch}°`, `${r.spin}`, `${r.height}`, `${r.landing}°`, `${r.carry}`,
                ])}
              />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Vitesses en mph, backspin en tr/min, hauteur et carry en yards.
              </p>
              <SourceLink src={TOUR_SRC} className="mt-3" />
            </SectionCard>

            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Fenêtres cibles par club" subtitle="Plages utilisées par le diagnostic automatique de l'application.">
                <T
                  head={["Club", "Départ", "Backspin", "Smash", "Attaque"]}
                  rows={Object.entries(CLUB_WINDOWS).map(([k, w]) => [
                    CLUB_LABEL[k as keyof typeof CLUB_LABEL] ?? k,
                    w?.launch ? `${w.launch[0]}–${w.launch[1]}°` : "—",
                    w?.spin ? `${w.spin[0]}–${w.spin[1]}` : "—",
                    w?.smash ? `${w.smash[0]}–${w.smash[1]}` : "—",
                    w?.attack ? `${w.attack[0]}–${w.attack[1]}°` : "—",
                  ])}
                />
                <SourceLink src={WINDOW_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="Fer 7 — fenêtre par vitesse de tête" subtitle="Protocole de fitting fers Callaway.">
                <T
                  head={["Vitesse (mph)", "Départ", "Backspin"]}
                  rows={IRON7_WINDOW_BY_SPEED.map((r) => [
                    `${r.speed}`,
                    r.launch ? `${r.launch[0]}–${r.launch[1]}°` : "—",
                    `${r.spin[0]}–${r.spin[1]} tr/min`,
                  ])}
                />
                <SourceLink src={FLEX_IRON_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="Moyennes LPGA" subtitle="Référence utile pour les joueuses et les vitesses modérées.">
                <T
                  head={["Club", "Vit. club", "Attaque", "Départ", "Backspin", "Carry"]}
                  rows={LPGA_TOUR.map((r) => [
                    CLUB_LABEL[r.club], r.clubSpeed !== null ? `${r.clubSpeed}` : "—", r.attack !== null ? `${r.attack}°` : "—", `${r.launch}°`, r.spin !== null ? `${r.spin}` : "—", r.carry !== null ? `${r.carry}` : "—",
                  ])}
                />
                <SourceLink src={LPGA_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="Effet gear et point d'impact">
                <p className="text-xs leading-relaxed text-muted-foreground">{GEAR_EFFECT_NOTE}</p>
                <SourceLink src={GEAR_EFFECT_SRC} className="mt-3" />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ---------------- SHAFTS ---------------- */}
          <TabsContent value="shafts" className="mt-0 space-y-4">
            <SectionCard title="Plages de poids de shaft" subtitle="Fourchettes constructeur, en grammes.">
              <T
                head={["Type", "Plage de poids"]}
                rows={[
                  ["Graphite — fers", `${SHAFT_WEIGHT_RANGES.graphite_iron[0]} – ${SHAFT_WEIGHT_RANGES.graphite_iron[1]} g`],
                  ["Graphite — driver et bois", `${SHAFT_WEIGHT_RANGES.graphite_driver[0]} – ${SHAFT_WEIGHT_RANGES.graphite_driver[1]} g`],
                  ["Acier — fers", `${SHAFT_WEIGHT_RANGES.steel_iron[0]} – ${SHAFT_WEIGHT_RANGES.steel_iron[1]} g`],
                ]}
                mono={false}
              />
              <SourceLink src={FLEX_IRON_SRC} className="mt-3" />
            </SectionCard>
            <SectionCard title="Méthode de sélection">
              <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li>· Fixer d'abord le poids, puis le flex, puis le profil de flexion. Le poids influence davantage la dispersion que le flex.</li>
                <li>· Un shaft plus léger fait gagner de la vitesse mais dégrade souvent la régularité : arbitrer sur la dispersion, pas sur le carry maximal.</li>
                <li>· Un profil souple en pointe élève le départ et augmente le backspin ; un profil rigide en pointe fait l'inverse.</li>
                <li>· Un tempo rapide justifie un cran de rigidité supplémentaire à vitesse égale.</li>
                <li>· Traiter fers et bois séparément : les deux tables de flex ne convergent pas toujours pour un même joueur.</li>
              </ul>
              <SourceLink src={FLEX_IRON_SRC} className="mt-3" />
            </SectionCard>
          </TabsContent>

          {/* ---------------- GRIPS ---------------- */}
          <TabsContent value="grips" className="mt-0 space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Golf Pride — taille de grip" subtitle="Mesure du pli du poignet au bout du majeur.">
                <T
                  head={["Longueur de main", "Taille"]}
                  rows={GRIP_SIZE_TABLE.map((g) => [
                    g.minIn === 0
                      ? `< ${g.maxIn}" · < ${(g.maxIn * IN).toFixed(1)} cm`
                      : `${g.minIn.toFixed(1)}–${g.maxIn >= 99 ? "+" : `${g.maxIn.toFixed(1)}"`} · ${(g.minIn * IN).toFixed(1)}–${g.maxIn >= 99 ? "+" : `${(g.maxIn * IN).toFixed(1)} cm`}`,
                    g.size,
                  ])}
                />
                <SourceLink src={GRIP_SIZE_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="PING — charte de grip" subtitle="Code couleur croisant longueur de main et longueur du majeur.">
                <T
                  head={["Couleur", "Ajustement de diamètre"]}
                  rows={PING_GRIP_COLORS.map((c) => [<Swatch key={c.color} hex={c.hex} label={`${c.fr} (${c.color})`} />, c.adj])}
                  mono={false}
                />
                <SourceLink src={PING_GRIP_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="Build-up et couches de scotch">
                <p className="text-xs leading-relaxed text-muted-foreground">{GRIP_BUILDUP_NOTE}</p>
                <SourceLink src={GRIP_BUILDUP_SRC} className="mt-3" />
              </SectionCard>

              <SectionCard title="FootJoy — tailles de gant" subtitle="Longueur et tour de main, en centimètres.">
                <T
                  head={["Taille", "Sexe", "Longueur", "Tour de main"]}
                  rows={GLOVE_TABLE.map((g) => [
                    g.size, g.gender === "H" ? "Homme" : "Femme",
                    `${g.lenMin} – ${g.lenMax} cm`,
                    g.circMin !== null ? `${g.circMin} – ${g.circMax} cm` : "—",
                  ])}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{GLOVE_NOTE}</p>
                <SourceLink src={GLOVE_SRC} className="mt-3" />
              </SectionCard>
            </div>
          </TabsContent>

          {/* ---------------- METHODE ---------------- */}
          <TabsContent value="methode" className="mt-0 space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Lecture de la lie board">
                <p className="text-xs leading-relaxed text-muted-foreground">{LIE_LOGIC_NOTE}</p>
                <T
                  head={["Trace sur la semelle", "Diagnostic", "Correction"]}
                  rows={LIE_MARKS.map((m) => [
                    m.label,
                    m.deg > 0 ? "Club trop flat" : m.deg < 0 ? "Club trop upright" : "Lie correct",
                    m.deg === 0 ? "Aucune" : `${Math.abs(m.deg)}° ${m.deg > 0 ? "upright" : "flat"}`,
                  ])}
                  mono={false}
                />
              </SectionCard>

              <SectionCard title="Envergure et ape index">
                <p className="text-xs leading-relaxed text-muted-foreground">{ARM_SPAN_NOTE}</p>
              </SectionCard>

              <SectionCard title="Gapping des distances">
                <p className="text-xs leading-relaxed text-muted-foreground">{GAPPING_NOTE}</p>
              </SectionCard>

              <SectionCard title="Ordre de priorité en séance">
                <ol className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <li>1. Mesures statiques : taille, wrist-to-floor, envergure, mains. Elles donnent le point de départ, jamais la conclusion.</li>
                  <li>2. État du matériel actuel : longueur, lie, grip, usure. Beaucoup de problèmes viennent de là.</li>
                  <li>3. Qualité de centrage à l'impact, avant toute conclusion sur la tête ou le shaft.</li>
                  <li>4. Lie dynamique sur lie board, validé sur un fer médian puis contrôlé sur fer long et wedge.</li>
                  <li>5. Longueur et poids de shaft, arbitrés sur la dispersion.</li>
                  <li>6. Flex et profil de flexion, puis loft et gapping de la série.</li>
                  <li>7. Grip et gant en dernier, mais jamais négligés : ils conditionnent la libération de la face.</li>
                </ol>
              </SectionCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
