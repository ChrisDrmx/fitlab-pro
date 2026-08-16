import { SectionCard, Field } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wrench } from "lucide-react";
import { CLUB_LABEL, IRON_CLUBS, WOOD_CLUBS } from "@/lib/types";
import type { ClubKey, FittingData } from "@/lib/types";
import chartes from "@/data/club-chartes.json";

const ALL: ClubKey[] = [...WOOD_CLUBS, ...IRON_CLUBS];
const FLEXES = ["L", "A", "R", "R+", "S", "S+", "X", "TX"];
const GRIP_SIZES = ["Undersize", "Standard", "Midsize", "Jumbo"];
const CLUB_CHARTES = chartes.clubSpecs as Array<{
  brand: string; model: string; club: string; lie?: number | string; lengthIn?: number | string;
}>;
const BRANDS = [...new Set(CLUB_CHARTES.map((row) => row.brand))];

function chartClub(club: ClubKey) {
  return /^\d+i$/.test(club) ? club.slice(0, -1) : club;
}

function specFor(brand: string, model: string, club: ClubKey) {
  const targetClub = chartClub(club);
  return CLUB_CHARTES.find((row) => row.brand.toLowerCase() === brand.trim().toLowerCase()
    && row.model.toLowerCase() === model.trim().toLowerCase()
    && row.club === targetClub);
}

export function StepGear({ d, set }: { d: FittingData; set: (fn: (p: FittingData) => void) => void }) {
  const add = () => set((x) => {
    const used = new Set(x.currentClubs.map((c) => c.club));
    const next = ALL.find((c) => !used.has(c)) ?? "7i";
    x.currentClubs.push({
      club: next, brand: "", model: "", year: "", shaft: "", flex: "",
      shaftWeight: "", lengthIn: "", lieNote: "", gripModel: "", gripSize: "", wraps: "",
    });
  });

  return (
    <SectionCard
      title="Matériel actuel du joueur"
      subtitle="Le point de départ du diagnostic : ce que le joueur utilise aujourd'hui."
      icon={<Wrench className="h-4 w-4" />}
      action={<Button size="sm" variant="outline" className="gap-1.5" onClick={add} data-testid="button-add-club"><Plus className="h-3.5 w-3.5" /> Club</Button>}
    >
      {!d.currentClubs.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun club renseigné. Ajoute au minimum le driver et un fer médian.
        </p>
      ) : (
        <div className="space-y-4">
          {d.currentClubs.map((c, i) => (
            <div key={i} className="rounded-md border border-card-border bg-secondary/30 p-3" data-testid={`row-gear-${i}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <Select value={c.club} onValueChange={(v) => set((x) => { x.currentClubs[i].club = v as ClubKey; })}>
                  <SelectTrigger className="h-9 w-[160px] font-medium" data-testid={`select-gear-club-${i}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL.map((k) => <SelectItem key={k} value={k}>{CLUB_LABEL[k]}</SelectItem>)}</SelectContent>
                </Select>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => set((x) => { x.currentClubs.splice(i, 1); })}
                  data-testid={`button-remove-gear-${i}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Marque constructeur">
                  <Input list={`club-brands-${i}`} value={c.brand} onChange={(e) => set((x) => { x.currentClubs[i].brand = e.target.value; })} className="h-10 md:h-9" />
                  <datalist id={`club-brands-${i}`}>{BRANDS.map((brand) => <option key={brand} value={brand} />)}</datalist>
                </Field>
                <Field label="Modèle constructeur" hint="La longueur et le lie se complètent automatiquement si le modèle est reconnu.">
                  <Input list={`club-models-${i}`} value={c.model} onChange={(e) => set((x) => {
                    const model = e.target.value;
                    x.currentClubs[i].model = model;
                    const spec = specFor(x.currentClubs[i].brand, model, x.currentClubs[i].club);
                    if (spec?.lengthIn !== undefined) x.currentClubs[i].lengthIn = String(spec.lengthIn);
                    if (spec?.lie !== undefined) x.currentClubs[i].lieNote = `${spec.lie}° standard`;
                  })} className="h-10 md:h-9" />
                  <datalist id={`club-models-${i}`}>{CLUB_CHARTES.filter((row) => row.brand.toLowerCase() === c.brand.trim().toLowerCase() && row.club === chartClub(c.club)).map((row) => <option key={row.model} value={row.model} />)}</datalist>
                </Field>
                <Field label="Année">
                  <Input type="number" inputMode="numeric" value={c.year} onChange={(e) => set((x) => { x.currentClubs[i].year = e.target.value; })} className="h-10 font-mono md:h-9" />
                </Field>
                <Field label="Shaft">
                  <Input value={c.shaft} onChange={(e) => set((x) => { x.currentClubs[i].shaft = e.target.value; })} className="h-10 md:h-9" placeholder="KBS Tour, Ventus Blue…" />
                </Field>
                <Field label="Flex">
                  <Select value={c.flex} onValueChange={(v) => set((x) => { x.currentClubs[i].flex = v; })}>
                    <SelectTrigger className="h-10 md:h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{FLEXES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Poids du shaft" hint="grammes">
                  <Input type="number" inputMode="decimal" value={c.shaftWeight} onChange={(e) => set((x) => { x.currentClubs[i].shaftWeight = e.target.value; })} className="h-10 font-mono md:h-9" />
                </Field>
                <Field label="Longueur" hint="pouces">
                  <Input type="number" step="0.125" inputMode="decimal" value={c.lengthIn} onChange={(e) => set((x) => { x.currentClubs[i].lengthIn = e.target.value; })} className="h-10 font-mono md:h-9" />
                </Field>
                <Field label="Lie actuel" hint="ex. 1° upright, standard">
                  <Input value={c.lieNote} onChange={(e) => set((x) => { x.currentClubs[i].lieNote = e.target.value; })} className="h-10 md:h-9" />
                </Field>
                <Field label="Grip">
                  <Input value={c.gripModel} onChange={(e) => set((x) => { x.currentClubs[i].gripModel = e.target.value; })} className="h-10 md:h-9" />
                </Field>
                <Field label="Taille de grip">
                  <Select value={c.gripSize} onValueChange={(v) => set((x) => { x.currentClubs[i].gripSize = v; })}>
                    <SelectTrigger className="h-10 md:h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{GRIP_SIZES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Couches de scotch" hint="build-up sous le grip">
                  <Input type="number" inputMode="numeric" value={c.wraps} onChange={(e) => set((x) => { x.currentClubs[i].wraps = e.target.value; })} className="h-10 font-mono md:h-9" />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
