import { SectionCard, Field, NumField } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Target } from "lucide-react";
import type { FittingData } from "@/lib/types";

const GOALS = [
  "Gagner de la distance", "Plus de régularité", "Corriger un slice", "Corriger un hook",
  "Meilleur contrôle des trajectoires", "Combler un trou de distance",
  "Confort / réduire la douleur", "Passer du fer long à l'hybride",
];

const MISS = ["Slice", "Hook", "Push (droite)", "Pull (gauche)", "Top / balle basse", "Gratte / fat", "Balle trop haute", "Dispersion aléatoire"];

export function StepPlayer({ d, set }: { d: FittingData; set: (fn: (p: FittingData) => void) => void }) {
  const p = d.player;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard title="Identité du joueur" icon={<User className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom">
            <Input value={p.firstName} onChange={(e) => set((x) => { x.player.firstName = e.target.value; })} className="h-11 md:h-9" data-testid="input-firstname" />
          </Field>
          <Field label="Nom">
            <Input value={p.lastName} onChange={(e) => set((x) => { x.player.lastName = e.target.value; })} className="h-11 md:h-9" data-testid="input-lastname" />
          </Field>
          <Field label="E-mail">
            <Input type="email" inputMode="email" value={p.email} onChange={(e) => set((x) => { x.player.email = e.target.value; })} className="h-11 md:h-9" data-testid="input-email" />
          </Field>
          <Field label="Téléphone">
            <Input type="tel" inputMode="tel" value={p.phone} onChange={(e) => set((x) => { x.player.phone = e.target.value; })} className="h-11 md:h-9" data-testid="input-phone" />
          </Field>
          <Field label="Sexe" hint="Détermine la table de tailles de gants et le lie standard de référence.">
            <Select value={p.gender} onValueChange={(v) => set((x) => { x.player.gender = v as "H" | "F"; })}>
              <SelectTrigger className="h-11 md:h-9" data-testid="select-gender"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="H">Homme</SelectItem>
                <SelectItem value="F">Femme</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumField label="Année de naissance" value={p.birthYear} onChange={(v) => set((x) => { x.player.birthYear = v; })} step="1" inputMode="numeric" testId="input-birthyear" />
          <Field label="Main">
            <Select value={p.handedness} onValueChange={(v) => set((x) => { x.player.handedness = v as "droitier" | "gaucher"; })}>
              <SelectTrigger className="h-11 md:h-9" data-testid="select-handedness"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="droitier">Droitier</SelectItem>
                <SelectItem value="gaucher">Gaucher</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Club / affiliation">
            <Input value={p.club} onChange={(e) => set((x) => { x.player.club = e.target.value; })} className="h-11 md:h-9" data-testid="input-club" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Profil de jeu" subtitle="Le contexte de jeu oriente les compromis du fitting." icon={<Target className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="Index / handicap" value={p.handicap} onChange={(v) => set((x) => { x.player.handicap = v; })} testId="input-handicap" />
          <NumField label="Années de pratique" value={p.yearsPlaying} onChange={(v) => set((x) => { x.player.yearsPlaying = v; })} step="1" inputMode="numeric" testId="input-years" />
          <NumField label="Parcours par mois" value={p.roundsPerMonth} onChange={(v) => set((x) => { x.player.roundsPerMonth = v; })} step="1" inputMode="numeric" testId="input-rounds" />
          <Field label="Tempo de swing" hint="Un tempo rapide demande un shaft plus rigide à vitesse égale.">
            <Select value={p.tempo} onValueChange={(v) => set((x) => { x.player.tempo = v as "lent" | "moyen" | "rapide"; })}>
              <SelectTrigger className="h-11 md:h-9" data-testid="select-tempo"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lent">Lent / fluide</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="rapide">Rapide / agressif</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Objectifs du fitting</div>
          <div className="flex flex-wrap gap-1.5">
            {GOALS.map((g) => {
              const on = p.goals.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  data-testid={`chip-goal-${g.slice(0, 8)}`}
                  onClick={() => set((x) => {
                    x.player.goals = on ? x.player.goals.filter((y) => y !== g) : [...x.player.goals, g];
                  })}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                >
                  <Badge variant={on ? "default" : "outline"} className="cursor-pointer text-xs font-normal">{g}</Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Miss dominant">
            <Select value={p.missPattern} onValueChange={(v) => set((x) => { x.player.missPattern = v; })}>
              <SelectTrigger className="h-11 md:h-9" data-testid="select-miss"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {MISS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Contraintes physiques" hint="Blessures, dos, poignets, souplesse limitée…">
            <Textarea
              value={p.physicalNotes}
              onChange={(e) => set((x) => { x.player.physicalNotes = e.target.value; })}
              rows={3}
              data-testid="input-physical"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
