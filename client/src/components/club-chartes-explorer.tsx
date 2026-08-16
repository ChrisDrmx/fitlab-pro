import { useMemo, useState } from "react";
import chartes from "@/data/club-chartes.json";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, Search, SlidersHorizontal } from "lucide-react";

type ClubSpec = {
  brand: string;
  model: string;
  club: string;
  loft?: number | string;
  lie?: number | string;
  lengthIn?: number | string;
  offsetMm?: number | string;
  offsetIn?: number | string;
  swingWeight?: string;
  powerSpec?: number | string;
  retroSpec?: number | string;
  notes?: string;
};

type ShaftSpec = {
  manufacturer: string;
  model: string;
  weight?: string;
  flex?: string;
  launch?: string;
  spin?: string;
  profile?: string;
  notes?: string;
};

const CLUBS = chartes.clubSpecs as ClubSpec[];
const SHAFTS = chartes.shaftSpecs as ShaftSpec[];
const ALL = "Tous";

function value(value: number | string | undefined, suffix = "") {
  return value === undefined || value === "" ? "—" : `${value}${suffix}`;
}

function clubLabel(club: string) {
  if (/^\d+$/.test(club)) return `Fer ${club}`;
  if (club === "PW") return "PW";
  if (club === "AW" || club === "UW" || club === "GW" || club === "SW") return club;
  return club;
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return <div className="max-h-[560px] overflow-auto rounded-xl border border-[#dce5d9] bg-white/70"><table className="w-full min-w-[760px] text-sm"><thead className="sticky top-0 z-10 bg-[#eaf1e7]"><tr>{head.map((item) => <th key={item} className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#52705c]">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#e5ebe1]">{children}</tbody></table></div>;
}

export function ClubChartesExplorer() {
  const [kind, setKind] = useState<"clubs" | "shafts">("clubs");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const search = query.trim().toLowerCase();

  const brands = useMemo(() => [ALL, ...new Set(CLUBS.map((row) => row.brand))], []);
  const models = useMemo(() => [ALL, ...new Set(CLUBS.filter((row) => brand === ALL || row.brand === brand).map((row) => row.model))], [brand]);
  const filteredClubs = useMemo(() => CLUBS.filter((row) => {
    const haystack = `${row.brand} ${row.model} ${row.club} ${row.notes ?? ""}`.toLowerCase();
    return (brand === ALL || row.brand === brand) && (model === ALL || row.model === model) && (!search || haystack.includes(search));
  }), [brand, model, search]);
  const filteredShafts = useMemo(() => SHAFTS.filter((row) => {
    const haystack = `${row.manufacturer} ${row.model} ${row.flex ?? ""} ${row.profile ?? ""}`.toLowerCase();
    return (!search || haystack.includes(search));
  }), [search]);

  const changeKind = (next: "clubs" | "shafts") => {
    setKind(next);
    setQuery("");
    setBrand(ALL);
    setModel(ALL);
  };

  return <div className="space-y-4">
    <Card className="overflow-hidden border-[#d5e1d3] bg-[linear-gradient(135deg,#123323,#285b3d)] text-[#f5f3e9] shadow-lg shadow-[#214832]/10">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6"><div><div className="flex items-center gap-2 text-[#b8d8bd]"><Database className="h-4 w-4" /><span className="text-[11px] font-medium uppercase tracking-[0.2em]">Base constructeur FitLab</span></div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Clubs, lofts, lies et shafts</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#dbe7d8]/75">La base importée du classeur FitLab Pro pour comparer rapidement les spécifications pendant un fitting.</p></div><div className="flex flex-wrap gap-2"><Badge className="border-white/15 bg-white/10 text-[#f5f3e9] hover:bg-white/10">{CLUBS.length} fiches clubs</Badge><Badge className="border-white/15 bg-white/10 text-[#f5f3e9] hover:bg-white/10">{SHAFTS.length} shafts</Badge><Badge className="border-white/15 bg-white/10 text-[#f5f3e9] hover:bg-white/10">2024–2026</Badge></div></div>
    </Card>

    <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => changeKind("clubs")} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${kind === "clubs" ? "border-[#1e6442] bg-[#1e6442] text-white" : "border-[#cbdcca] bg-white/70 text-[#52705c] hover:bg-[#eaf1e7]"}`}>Chartes clubs</button><button type="button" onClick={() => changeKind("shafts")} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${kind === "shafts" ? "border-[#1e6442] bg-[#1e6442] text-white" : "border-[#cbdcca] bg-white/70 text-[#52705c] hover:bg-[#eaf1e7]"}`}>Chartes shafts</button></div>

    <Card className="border-[#dce5d9] bg-white/65 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#52705c]"><SlidersHorizontal className="h-3.5 w-3.5" /> Filtres de recherche</div><div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]"> <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78917d]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={kind === "clubs" ? "Rechercher marque, modèle ou fer…" : "Rechercher fabricant, modèle ou flex…"} className="h-10 border-[#cbdcca] bg-white pl-9" /></div>{kind === "clubs" ? <><Select value={brand} onValueChange={(next) => { setBrand(next); setModel(ALL); }}><SelectTrigger className="h-10 border-[#cbdcca] bg-white"><SelectValue placeholder="Constructeur" /></SelectTrigger><SelectContent>{brands.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={model} onValueChange={setModel}><SelectTrigger className="h-10 border-[#cbdcca] bg-white"><SelectValue placeholder="Modèle" /></SelectTrigger><SelectContent>{models.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></> : <div className="flex h-10 items-center rounded-md border border-[#cbdcca] bg-white px-3 text-sm text-[#607467]">{filteredShafts.length} référence{filteredShafts.length > 1 ? "s" : ""} affichée{filteredShafts.length > 1 ? "s" : ""}</div>}</div></Card>

    {kind === "clubs" ? <Table head={["Constructeur", "Modèle", "Club", "Loft", "Lie", "Longueur", "Offset", "Swing weight"]}>{filteredClubs.map((row, index) => <tr key={`${row.brand}-${row.model}-${row.club}-${index}`} className="hover:bg-[#f2f6ef]"><td className="whitespace-nowrap px-3 py-2.5 font-semibold text-[#1e4c32]">{row.brand}</td><td className="px-3 py-2.5 text-[#31533d]">{row.model}</td><td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#183b28]">{clubLabel(row.club)}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{value(row.loft, "°")}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{value(row.lie, "°")}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{value(row.lengthIn, '"')}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{row.offsetMm !== undefined ? value(row.offsetMm, " mm") : row.offsetIn !== undefined ? value(row.offsetIn, ' in') : "—"}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{row.swingWeight ?? "—"}</td></tr>)}</Table> : <Table head={["Fabricant", "Modèle", "Poids", "Flex", "Launch", "Spin", "Profil"]}>{filteredShafts.map((row, index) => <tr key={`${row.manufacturer}-${row.model}-${index}`} className="hover:bg-[#f2f6ef]"><td className="whitespace-nowrap px-3 py-2.5 font-semibold text-[#1e4c32]">{row.manufacturer}</td><td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#183b28]">{row.model}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{row.weight ?? "—"}</td><td className="px-3 py-2.5 text-xs">{row.flex ?? "—"}</td><td className="whitespace-nowrap px-3 py-2.5 text-xs">{row.launch ?? "—"}</td><td className="whitespace-nowrap px-3 py-2.5 text-xs">{row.spin ?? "—"}</td><td className="min-w-40 px-3 py-2.5 text-xs text-[#607467]">{row.profile ?? "—"}</td></tr>)}</Table>}
    <p className="text-xs leading-5 text-[#738477]">Source : {chartes.sourceFile} · période indiquée dans le document : {chartes.sourcePeriod}. Toujours vérifier l’année exacte du modèle avant une prescription finale.</p>
  </div>;
}
