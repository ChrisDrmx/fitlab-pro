import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/kit";
import { ARM_LABEL, ARM_MATCHUPS, BIOSWING_CHECKLIST, PLANE_LABEL, PLANE_MATCHUPS, POSTURE_BY_PLANE } from "@/lib/bioswing";
import type { BioSwingArmType, BioSwingPlane } from "@/lib/types";

const planes: { key: BioSwingPlane; condition: string; position: string }[] = [
  { key: "Shoulder", condition: "Envergure > taille de 4\"", position: "Au-dessus de la ligne des épaules" },
  { key: "Torso", condition: "Écart compris entre −4\" et +4\"", position: "Aligné avec la ligne des épaules" },
  { key: "Hip", condition: "Envergure < taille de 4\"", position: "En dessous de la ligne des épaules" },
];

const arms: { key: Exclude<BioSwingArmType, "">; observation: string; top: string }[] = [
  { key: "OnTop", observation: "Coude monte + paume vers le sol", top: "Across the line" },
  { key: "SideOn", observation: "Coude aligné avec la couture de chemise", top: "Down the line" },
  { key: "Under", observation: "Coude rentre + paume vers le ciel", top: "Laid off" },
];

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground">{head.map((h) => <th key={h} className="whitespace-nowrap pb-2 pr-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-border/50 last:border-0">{row.map((value, j) => <td key={j} className={`py-2 pr-4 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}>{value}</td>)}</tr>)}</tbody></table></div>;
}

export function BioSwingReference() {
  return <div className="space-y-4">
    <div className="rounded-xl border border-[#bed8c1] bg-[linear-gradient(120deg,#edf7ed,#f8f5e9)] p-4 md:p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4e805b]">BioSwing Dynamics</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#173c28]">Référentiel physiologique du joueur</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#5d7463]">Cette référence reprend la logique du module fourni. La saisie et la validation se font dans l’étape <span className="font-medium text-[#315d3e]">BioSwing Dynamics</span> de chaque fiche de fitting.</p></div>
    <SectionCard title="Principe central" subtitle="La position idéale dépend de la morphologie et de la biomécanique naturelle du joueur."><p className="text-sm leading-relaxed text-muted-foreground">Il n’existe pas une seule bonne position en haut du backswing. Le module propose un plan de mouvement puis un matchup technique, tout en conservant les observations et les overrides du moniteur.</p></SectionCard>
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard title="Plan de backswing" subtitle="Calcul automatique à partir de l’envergure et de la taille."><DataTable head={["Plan", "Condition", "Position du bras gauche"]} rows={planes.map((p) => [PLANE_LABEL[p.key], p.condition, p.position])} /></SectionCard>
      <SectionCard title="Type de bras droit" subtitle="Classification manuelle ou assistée par observation vidéo."><DataTable head={["Type", "Observation", "Tendance en haut"]} rows={arms.map((a) => [ARM_LABEL[a.key], a.observation, a.top])} /></SectionCard>
    </div>
    <SectionCard title="Matchups techniques" subtitle="Le type de bras droit pilote le hinge, la position du club et le release."><DataTable head={["Type", "Hinge", "Club en haut", "Release", "Grip"]} rows={arms.map((a) => { const m = ARM_MATCHUPS[a.key]; return [ARM_LABEL[a.key], m.hinge, m.clubPosition, m.release, m.gripTendency]; })} /><div className="mt-4 grid gap-2 sm:grid-cols-3">{planes.map((p) => <div key={p.key} className="rounded-md border border-card-border bg-secondary/30 p-3"><div className="text-sm font-semibold">{PLANE_LABEL[p.key]}</div><p className="mt-1 text-xs text-muted-foreground">{POSTURE_BY_PLANE[p.key].posture}</p><p className="mt-1 text-xs text-muted-foreground">Attention : {POSTURE_BY_PLANE[p.key].attention}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2">{planes.flatMap((p) => arms.map((a) => <Badge key={`${p.key}-${a.key}`} variant="outline" className="text-[11px]">{p.key} × {a.key} : {PLANE_MATCHUPS[p.key][a.key]}</Badge>))}</div></SectionCard>
    <SectionCard title="Checklist terrain" subtitle="À valider dans le parcours joueur avant de finaliser la recommandation."><div className="grid gap-2 sm:grid-cols-2">{BIOSWING_CHECKLIST.map((item, i) => <div key={item.id} className="flex gap-3 rounded-md border border-card-border bg-card p-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span><div><div className="text-sm font-medium">{item.label}</div><div className="mt-0.5 text-xs text-muted-foreground">{item.action}</div></div></div>)}</div></SectionCard>
  </div>;
}
