import { Moon, Sun, Target, LayoutDashboard, ClipboardList, BookOpen, Calculator } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem("fitlab-theme") !== "light");
  useEffect(() => { document.documentElement.classList.toggle("light", !dark); localStorage.setItem("fitlab-theme", dark ? "dark" : "light"); }, [dark]);
  const links = [
    ["/", "Tableau de bord", LayoutDashboard], ["/fitting", "Nouveau fitting", ClipboardList], ["/chartes", "Chartes", BookOpen], ["/outils", "Outils", Calculator],
  ] as const;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Target size={22} /></span><span>FitLab <b>Pro</b></span></div>
      <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer"><div className="fitter">Chris Deramaix<br /><small>Pro de golf · TrackMan & vidéo</small></div><button className="icon-button" onClick={() => setDark((value) => !value)} aria-label="Changer le thème">{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div>
    </aside>
    <main className="main-content">{children}</main>
  </div>;
}
