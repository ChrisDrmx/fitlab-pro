import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { listFittings, createFitting, deleteFitting, type Fitting } from "@/lib/store";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/kit";
import {
  Activity, Archive, CalendarDays, ChevronRight, Dumbbell, GraduationCap,
  Plus, Sparkles, Target, Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { emptyFitting } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const BRANDS = ["PING", "Callaway", "Cobra", "TaylorMade", "Titleist", "Mizuno", "Srixon", "PXG", "Multi-marques"];

const MODULES = [
  { label: "Coaching", detail: "Vos objectifs", icon: GraduationCap, href: "/coaching", color: "bg-[#b8d8bd] text-[#123223]", size: "h-32 w-32" },
  { label: "Exercices", detail: "Votre routine", icon: Dumbbell, href: "/coaching", color: "bg-[#dcead7] text-[#245338]", size: "h-28 w-28" },
  { label: "Data", detail: "Vos mesures", icon: Activity, href: "/outils", color: "bg-[#6d9f78] text-[#f5f3e9]", size: "h-28 w-28" },
  { label: "Cours", detail: "Votre historique", icon: Sparkles, href: "/coaching", color: "bg-[#e9ecdf] text-[#31533d]", size: "h-24 w-24" },
  { label: "Agenda", detail: "Bientôt disponible", icon: CalendarDays, href: "", color: "bg-[#8bb997] text-[#102d21]", size: "h-24 w-24" },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { email } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("PING");

  const { data: fittings, isLoading } = useQuery<(Fitting & { reportCount?: number })[]>({ queryKey: ["fittings"], queryFn: listFittings });
  const recentCount = fittings?.length ?? 0;
  const initials = useMemo(() => (email?.split("@")[0] ?? "J").slice(0, 2).toUpperCase(), [email]);

  const create = useMutation({
    mutationFn: async () => {
      const data = emptyFitting();
      const parts = name.trim().split(" ");
      data.player.firstName = parts[0] ?? "";
      data.player.lastName = parts.slice(1).join(" ");
      data.targetBrand = brand;
      return createFitting({ playerName: name.trim(), date: new Date().toISOString().slice(0, 10), status: "en_cours", brand, data: JSON.stringify(data) });
    },
    onSuccess: (fitting) => {
      queryClient.invalidateQueries({ queryKey: ["fittings"] });
      setOpen(false); setName("");
      navigate(`/fitting/${fitting.id}`);
    },
    onError: () => toast({ title: "Création impossible", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFitting(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fittings"] }),
  });

  return (
    <Layout>
      <main className="min-h-screen bg-[#f4f3eb]">
        <section className="relative overflow-hidden bg-[#092016] px-4 py-5 text-[#f5f3e9] sm:px-8 sm:py-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_25%,rgba(127,185,139,0.32),transparent_27%),linear-gradient(125deg,#07150f,#0d2a1d_60%,#1a4630)]" />
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border border-[#a8d3af]/10" />
          <div className="relative mx-auto max-w-7xl">
            <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10"><img src="/fitlab-brand.jpg" alt="FitLab" className="h-8 w-8 rounded-xl object-cover object-top" /></span><div><div className="text-sm font-semibold tracking-wide">FitLab</div><div className="text-[10px] uppercase tracking-[0.25em] text-[#9fc5a9]">Data &amp; coaching golf</div></div></div><div className="grid h-10 w-10 place-items-center rounded-full border border-[#b8d8bd]/40 bg-[#b8d8bd]/15 text-xs font-semibold text-[#dcead7]" title={email ?? "Joueur"}>{initials}</div></div>
            <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16"><div className="max-w-xl"><p className="text-xs uppercase tracking-[0.3em] text-[#a8d3af]">Votre espace golf</p><h1 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl">Analysez.<br /><span className="text-[#a8d3af]">Progressez.</span><br />Performez.</h1><p className="mt-5 max-w-md text-sm leading-6 text-[#dbe7d8]/70 sm:text-base">Retrouvez vos séances, vos exercices et les données qui donnent du sens à votre progression.</p><div className="mt-7 flex flex-wrap gap-3"><Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[#eff4e8] hover:bg-white/10">{recentCount} séance{recentCount > 1 ? "s" : ""} enregistrée{recentCount > 1 ? "s" : ""}</Badge><Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[#eff4e8] hover:bg-white/10">Espace premium</Badge></div></div><div className="relative hidden min-h-[250px] lg:block"><div className="absolute right-8 top-0 h-60 w-60 rounded-[2rem] border border-white/10 bg-black/10 p-3 shadow-2xl"><img src="/fitlab-brand.jpg" alt="Identité FitLab" className="h-full w-full rounded-[1.3rem] object-cover object-center opacity-90" /><div className="absolute inset-x-8 bottom-7 rounded-full border border-white/15 bg-[#092016]/70 px-4 py-2 text-center text-[10px] uppercase tracking-[0.22em] text-[#dcead7] backdrop-blur">Analyse · progression · performance</div></div><div className="absolute -bottom-2 left-8 grid h-24 w-24 place-items-center rounded-full border border-[#b8d8bd]/45 bg-[#8bb997]/20 backdrop-blur"><div className="text-center"><div className="text-2xl font-semibold">{recentCount}</div><div className="text-[9px] uppercase tracking-wider text-[#cde5ce]">cours</div></div></div></div></div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[#63806c]">Navigation</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#153526]">Votre parcours</h2></div><p className="hidden text-xs text-[#738477] sm:block">Touchez un cercle pour ouvrir un espace</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:items-center lg:gap-5">{MODULES.map((module) => <ModuleCircle key={module.label} {...module} onUnavailable={() => toast({ title: `${module.label} bientôt disponible`, description: "Cet espace sera activé dans une prochaine version." })} />)}</div></section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-8 lg:px-12"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.22em] text-[#63806c]">Espace pro</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#153526]">Fiches de fitting</h2><p className="mt-1 text-sm text-[#738477]">Retrouve tes diagnostics fers &amp; bois.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gap-2 rounded-xl bg-[#1e6442] hover:bg-[#174d32]"><Plus className="h-4 w-4" /> Nouveau fitting</Button></DialogTrigger><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Nouvelle fiche de fitting</DialogTitle></DialogHeader><div className="space-y-4"><Field label="Nom du joueur"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Prénom Nom" data-testid="input-player-name" className="h-11" /></Field><Field label="Marque de référence"><Select value={brand} onValueChange={setBrand}><SelectTrigger data-testid="select-brand" className="h-11"><SelectValue /></SelectTrigger><SelectContent>{BRANDS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></div><DialogFooter><Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending} data-testid="button-create-fitting">{create.isPending ? "Création…" : "Démarrer le fitting"}</Button></DialogFooter></DialogContent></Dialog></div>{isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div> : !fittings?.length ? <Card className="flex flex-col items-center gap-3 border-dashed border-[#d4dfd1] bg-white/65 px-6 py-12 text-center"><Target className="h-8 w-8 text-[#7c9a82]/60" /><div><p className="font-medium text-[#183b28]">Aucune fiche pour le moment</p><p className="mt-1 text-sm text-[#738477]">Crée une fiche pour lancer un diagnostic complet.</p></div><Button onClick={() => setOpen(true)} variant="outline" className="mt-2 gap-2 rounded-xl border-[#cbdcca] bg-white/70"><Plus className="h-4 w-4" /> Nouveau fitting</Button></Card> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{fittings.map((fitting) => <FittingCard key={fitting.id} fitting={fitting} onOpen={() => navigate(`/fitting/${fitting.id}`)} onDelete={() => remove.mutate(fitting.id)} />)}</div>}</section>
      </main>
    </Layout>
  );
}

function ModuleCircle({ label, detail, icon: Icon, href, color, size, onUnavailable }: { label: string; detail: string; icon: typeof Activity; href: string; color: string; size: string; onUnavailable: () => void }) {
  const content = <div className={`group flex flex-col items-center justify-center rounded-full border border-white/70 px-3 text-center shadow-lg shadow-[#31533d]/10 transition duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl ${size} ${color}`}><Icon className="h-5 w-5 opacity-80" /><div className="mt-2 text-sm font-semibold">{label}</div><div className="mt-0.5 text-[10px] opacity-70">{detail}</div></div>;
  return href ? <Link href={href}><a aria-label={`Ouvrir ${label}`}>{content}</a></Link> : <button type="button" onClick={onUnavailable} aria-label={`${label}, bientôt disponible`}>{content}</button>;
}

function FittingCard({ fitting, onOpen, onDelete }: { fitting: Fitting & { reportCount?: number }; onOpen: () => void; onDelete: () => void }) {
  let handicap = "";
  try { handicap = JSON.parse(fitting.data)?.player?.handicap ?? ""; } catch { /* ancienne fiche */ }
  return <Card className="group cursor-pointer border-[#d8e1d4] bg-white/75 p-4 hover-elevate" onClick={onOpen} data-testid={`card-fitting-${fitting.id}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-semibold text-[#183b28]" data-testid={`text-name-${fitting.id}`}>{fitting.playerName}</div><div className="mt-0.5 font-mono text-xs text-[#738477]">{new Date(fitting.date).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" })}{handicap ? ` · index ${handicap}` : ""}</div></div><Badge variant="secondary" className="shrink-0">{fitting.brand || "—"}</Badge></div><div className="mt-4 flex items-center justify-between"><div className="flex flex-wrap items-center gap-2"><Badge variant={fitting.status === "termine" ? "default" : "outline"}>{fitting.status === "termine" ? "Terminé" : "En cours"}</Badge>{fitting.reportCount ? <Badge variant="secondary" className="gap-1"><Archive className="h-3 w-3" />{fitting.reportCount} rapport{fitting.reportCount > 1 ? "s" : ""}</Badge> : null}</div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-[#738477] hover:text-destructive" onClick={(event) => { event.stopPropagation(); onDelete(); }}><Trash2 className="h-4 w-4" /></Button><ChevronRight className="h-4 w-4 text-[#738477]" /></div></div></Card>;
}
