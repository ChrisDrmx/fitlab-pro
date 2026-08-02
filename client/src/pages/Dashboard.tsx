import { Plus, Search, Trash2, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getJson } from "../lib/api";

type Row = { id: string; player?: { firstName?: string; lastName?: string }; date?: string; status?: string; targetBrand?: string; reportCount?: number };

export default function Dashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = () => getJson<Row[]>("/api/fittings").then(setRows).catch((err) => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => rows.filter((row) => `${row.player?.firstName || ""} ${row.player?.lastName || ""} ${row.targetBrand || ""}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const remove = async (id: string) => { if (!window.confirm("Supprimer cette fiche ?")) return; await api(`/api/fittings/${id}`, { method: "DELETE" }); setRows((items) => items.filter((item) => item.id !== id)); };
  return <div className="page">
    <div className="page-header"><div><div className="eyebrow">FitLab Pro</div><h1>Tableau de bord</h1><p className="subtle">Les fiches de fitting de Chris Deramaix</p></div><button className="button" onClick={() => navigate("/fitting")}><Plus size={17} /> Nouveau fitting</button></div>
    <div className="cards"><div className="stat-card"><div className="label">Fiches joueurs</div><div className="number">{rows.length}</div></div><div className="stat-card"><div className="label">Rapports archivés</div><div className="number">{rows.reduce((sum, row) => sum + (row.reportCount || 0), 0)}</div></div><div className="stat-card"><div className="label">IA Grok</div><div className="number" style={{ color: "var(--green)" }}>Prête</div></div></div>
    <div className="panel"><div className="toolbar"><div><h2>Fiches récentes</h2><p className="subtle">Sauvegarde automatique activée</p></div><div className="field" style={{ minWidth: 220 }}><label htmlFor="search"><Search size={13} /> Rechercher</label><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, marque…" /></div></div>
      {error && <div className="error">{error}</div>}{loading ? <div className="empty">Chargement…</div> : filtered.length === 0 ? <div className="empty"><ClipboardList size={30} /><p>Aucune fiche pour le moment.</p><button className="button" onClick={() => navigate("/fitting")}>Créer le premier fitting</button></div> : <div className="table-wrap"><table><thead><tr><th>Joueur</th><th>Date</th><th>Statut</th><th>Marque</th><th>Rapports</th><th /></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><button className="button ghost" onClick={() => navigate(`/fitting/${row.id}`)}>{row.player?.firstName || "Sans prénom"} {row.player?.lastName || ""}</button></td><td>{row.date ? new Date(row.date).toLocaleDateString("fr-BE") : "—"}</td><td><span className="status">{row.status || "Brouillon"}</span></td><td>{row.targetBrand || "—"}</td><td>{row.reportCount || 0}</td><td><button className="icon-button" onClick={() => remove(row.id)} aria-label="Supprimer"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}
