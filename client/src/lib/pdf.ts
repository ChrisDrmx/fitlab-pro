import { jsPDF } from "jspdf";
import type { FittingData } from "@/lib/types";
import { CLUB_LABEL } from "@/lib/types";
import { buildDiagnosis, computeStatic, computeDynamicLie, dynamicLieConsensus, computeGapping, fmt } from "@/lib/engine";

const GREEN: [number, number, number] = [27, 58, 44];
const ACCENT: [number, number, number] = [32, 100, 72];
const GREY: [number, number, number] = [110, 112, 108];
const LINE: [number, number, number] = [214, 214, 208];

const M = 16;

/* Les polices standard de jsPDF sont limitées au jeu WinAnsi : on remplace les
   glyphes non couverts, sinon le texte s'affiche étiré et illisible. */
const SUBST: [RegExp, string][] = [
  [/\u2248/g, "~"], [/\u2192/g, "->"], [/\u2190/g, "<-"], [/\u2264/g, "<="],
  [/\u2265/g, ">="], [/\u00d7/g, "x"], [/\u2026/g, "..."], [/\u2032/g, "'"],
  [/\u2033/g, '"'], [/\u2018|\u2019/g, "'"], [/\u201c|\u201d/g, '"'],
  [/\u00a0|\u202f|\u2009/g, " "], [/\u2022/g, "-"],
];

function san<T>(v: T): T {
  if (typeof v === "string") {
    let out: string = v;
    for (const [re, rep] of SUBST) out = out.replace(re, rep);
    return out as unknown as T;
  }
  if (Array.isArray(v)) return v.map((x) => san(x)) as unknown as T;
  return v;
}

export function exportFittingPdf(d: FittingData, stampIso?: string) {
  const stamp = stampIso && !Number.isNaN(new Date(stampIso).getTime()) ? new Date(stampIso) : new Date();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  // Toute écriture de texte passe par le nettoyage des glyphes.
  const rawText = doc.text.bind(doc);
  (doc as unknown as { text: (...a: unknown[]) => unknown }).text = (
    t: unknown, ...rest: unknown[]
  ) => (rawText as unknown as (...a: unknown[]) => unknown)(san(t), ...rest);
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const s = computeStatic(d);
  const dx = buildDiagnosis(d);
  const dyn = computeDynamicLie(d);
  const consensus = dynamicLieConsensus(dyn);
  const gaps = computeGapping(d.trackman);

  const playerName = `${d.player.firstName} ${d.player.lastName}`.trim() || "Joueur";
  const today = stamp.toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" });
  let y = 0;

  const ensure = (need: number) => {
    if (y + need > H - 18) {
      footer();
      doc.addPage();
      y = M;
    }
  };

  const footer = () => {
    const n = doc.getNumberOfPages();
    doc.setFontSize(7.5).setTextColor(...GREY).setFont("helvetica", "normal");
    doc.text(`FitLab Pro — rapport de fitting · ${playerName} · ${today}`, M, H - 9);
    doc.text(String(n), W - M, H - 9, { align: "right" });
  };

  /* ---------- En-tête ---------- */
  doc.setFillColor(...GREEN).rect(0, 0, W, 34, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(17);
  doc.text("Rapport de fitting", M, 15);
  doc.setFont("helvetica", "normal").setFontSize(9.5);
  doc.text("Fers & bois — diagnostic Trackman et mesures morphologiques", M, 22);
  doc.setFontSize(8).setTextColor(190, 210, 198);
  doc.text("Chris Deramaix — Pro de golf, expert Trackman data & vidéo", M, 28.5);
  doc.setFontSize(9).setTextColor(255, 255, 255);
  doc.text(today, W - M, 15, { align: "right" });
  doc.setFontSize(8).setTextColor(190, 210, 198);
  doc.text(d.targetBrand || "", W - M, 22, { align: "right" });
  y = 44;

  const h2 = (t: string) => {
    ensure(14);
    doc.setDrawColor(...LINE).setLineWidth(0.3).line(M, y - 4.5, W - M, y - 4.5);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...GREEN);
    doc.text(t, M, y);
    y += 6.5;
  };

  const kv = (rows: [string, string][], cols = 2) => {
    const colW = (W - 2 * M) / cols;
    rows.forEach((r, i) => {
      if (i % cols === 0) ensure(7);
      const x = M + (i % cols) * colW;
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
      doc.text(r[0], x, y);
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(30, 30, 30);
      doc.text(r[1] || "—", x, y + 4.2, { maxWidth: colW - 4 });
      if (i % cols === cols - 1 || i === rows.length - 1) y += 11;
    });
    y += 1;
  };

  const table = (head: string[], rows: string[][], widths: number[]) => {
    const total = widths.reduce((a, b) => a + b, 0);
    const scale = (W - 2 * M) / total;
    const w = widths.map((x) => x * scale);
    ensure(12);
    doc.setFillColor(240, 240, 236).rect(M, y - 4, W - 2 * M, 6.5, "F");
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...GREEN);
    head.forEach((hh, i) => doc.text(hh, M + 1.5 + w.slice(0, i).reduce((a, b) => a + b, 0), y));
    y += 5.5;
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(35, 35, 35);
    rows.forEach((r) => {
      ensure(7);
      r.forEach((c, i) => doc.text(c, M + 1.5 + w.slice(0, i).reduce((a, b) => a + b, 0), y + 1.5, { maxWidth: w[i] - 3 }));
      y += 5.6;
      doc.setDrawColor(238, 238, 234).setLineWidth(0.2).line(M, y - 1.6, W - M, y - 1.6);
    });
    y += 4;
  };

  /* ---------- Joueur ---------- */
  h2("Joueur");
  kv([
    ["Nom", playerName],
    ["Index / handicap", d.player.handicap || "—"],
    ["E-mail", d.player.email || "—"],
    ["Téléphone", d.player.phone || "—"],
    ["Main", d.player.handedness || "—"],
    ["Tempo de swing", d.player.tempo || "—"],
    ["Club / affiliation", d.player.club || "—"],
    ["Miss dominant", d.player.missPattern || "—"],
  ], 4);
  if (d.player.goals.length) {
    ensure(10);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
    doc.text("Objectifs", M, y);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(d.player.goals.join(" · "), W - 2 * M);
    doc.text(lines, M, y + 4.2);
    y += 4.2 + lines.length * 4.2 + 4;
  }

  /* ---------- Synthèse ---------- */
  h2("Synthèse de la prescription");
  const boxW = (W - 2 * M - 9) / 4;
  ensure(24);
  ([
    ["Lie", dx.summary.lie, dx.summary.lieSource],
    ["Longueur", dx.summary.length, dx.summary.lengthSource],
    ["Shaft", dx.summary.shaft, dx.summary.shaftSource],
    ["Grip / gant", dx.summary.grip, dx.summary.gripSource],
  ] as [string, string, string][]).forEach((b, i) => {
    const x = M + i * (boxW + 3);
    doc.setFillColor(246, 247, 244).setDrawColor(...LINE).setLineWidth(0.3);
    doc.roundedRect(x, y - 2, boxW, 20, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GREY);
    doc.text(b[0].toUpperCase(), x + 3, y + 3);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...ACCENT);
    doc.text(b[1], x + 3, y + 9.5, { maxWidth: boxW - 6 });
    doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...GREY);
    doc.text(doc.splitTextToSize(b[2], boxW - 6).slice(0, 2), x + 3, y + 14);
  });
  y += 25;

  ensure(20);
  table(
    ["Spécification", "Valeur"],
    dx.spec.map((sp) => [sp.label, sp.value]),
    [60, 40],
  );

  /* ---------- Mesures ---------- */
  h2("Mesures morphologiques");
  kv([
    ["Taille", d.measures.heightCm ? `${d.measures.heightCm} cm` : "—"],
    ["Wrist-to-floor", d.measures.wristToFloorCm ? `${d.measures.wristToFloorCm} cm (${fmt(s.wtfIn, 2)}")` : "—"],
    ["Envergure", d.measures.armSpanCm ? `${d.measures.armSpanCm} cm` : "—"],
    ["Ape index", s.apeRatio ? `${fmt(s.apeRatio, 3)} — ${s.apeReading?.label ?? ""}` : "—"],
    ["Longueur de main", d.measures.handLengthCm ? `${d.measures.handLengthCm} cm` : "—"],
    ["Tour de main", d.measures.handCircumferenceCm ? `${d.measures.handCircumferenceCm} cm` : "—"],
    ["Code couleur PING", s.pingColorCurrent ? `${s.pingColorCurrent.fr} (${s.pingColorCurrent.color})` : "—"],
    ["Gant recommandé", s.gloveSize ? `${s.gloveSize}${s.gloveCadet ? " Cadet" : ""}` : "—"],
  ], 4);

  /* ---------- Lie ---------- */
  if (d.lieTests.length) {
    h2("Test de lie dynamique (lie board)");
    table(
      ["Club", "Trace sur semelle", "Lie standard", "Correction", "Lie cible"],
      dyn.map((r) => [
        CLUB_LABEL[r.club],
        r.markLabel,
        r.standardLie !== null ? `${fmt(r.standardLie)}°` : "—",
        r.correctionLabel,
        r.targetLie !== null ? `${fmt(r.targetLie)}°` : "—",
      ]),
      [22, 44, 24, 30, 22],
    );
    ensure(8);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...ACCENT);
    doc.text(`Lie retenu pour la série : ${dx.summary.lie}`, M, y);
    y += 8;
  }

  /* ---------- Matériel actuel ---------- */
  if (d.currentClubs.length) {
    h2("Matériel actuel");
    table(
      ["Club", "Marque / modèle", "Shaft", "Flex", "Long.", "Lie", "Grip"],
      d.currentClubs.map((c) => [
        CLUB_LABEL[c.club],
        `${c.brand} ${c.model}`.trim() || "—",
        c.shaft || "—",
        c.flex || "—",
        c.lengthIn ? `${c.lengthIn}"` : "—",
        c.lieNote || "—",
        `${c.gripModel} ${c.gripSize}`.trim() || "—",
      ]),
      [16, 34, 26, 10, 12, 18, 26],
    );
  }

  /* ---------- Trackman ---------- */
  if (d.trackman.length) {
    h2("Données Trackman");
    table(
      ["Club", "Vit. club", "Vit. balle", "Smash", "Départ", "Backspin", "Attaque", "Loft dyn.", "Haut.", "Chute", "Carry", "Total"],
      d.trackman.map((r) => [
        CLUB_LABEL[r.club],
        r.clubSpeed || "—", r.ballSpeed || "—", r.smash || "—", r.launch ? `${r.launch}°` : "—",
        r.spin || "—", r.attackAngle ? `${r.attackAngle}°` : "—", r.dynamicLoft ? `${r.dynamicLoft}°` : "—",
        r.height || "—", r.landingAngle ? `${r.landingAngle}°` : "—", r.carry || "—", r.total || "—",
      ]),
      [15, 13, 13, 11, 12, 14, 13, 13, 11, 11, 11, 11],
    );
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GREY);
    doc.text("Vitesses en mph, backspin en tr/min, hauteur et distances en mètres.", M, y - 1);
    y += 5;
  }

  if (gaps.length) {
    h2("Gapping des distances");
    table(
      ["Transition", "Carry", "Écart", "Lecture"],
      gaps.map((g) => [
        `${g.from} -> ${g.to}`,
        `${g.carryFrom.toFixed(0)} -> ${g.carryTo.toFixed(0)} m`,
        `${g.gap.toFixed(0)} m`,
        g.verdict === "ok" ? "Correct" : g.verdict === "trou" ? "Trou de distance" : "Écart trop serré",
      ]),
      [28, 30, 18, 40],
    );
  }

  /* ---------- Constats ---------- */
  const shown = dx.insights.filter((it) => !(d.excludedInsights ?? []).includes(it.id));
  if (shown.length) h2("Constats et actions");
  shown.forEach((it) => {
    const detail = doc.splitTextToSize(it.detail, W - 2 * M - 4);
    const action = it.action ? doc.splitTextToSize(`Action : ${it.action}`, W - 2 * M - 4) : [];
    ensure(10 + detail.length * 3.8 + action.length * 3.8);
    doc.setFillColor(it.priority === "haute" ? 32 : it.priority === "moyenne" ? 150 : 200, it.priority === "haute" ? 100 : 150, it.priority === "haute" ? 72 : 150);
    doc.circle(M + 1, y - 1.2, 1.1, "F");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(25, 25, 25);
    doc.text(`${it.title}`, M + 4.5, y);
    doc.setFont("helvetica", "normal").setFontSize(6.8).setTextColor(...GREY);
    doc.text(`${it.area} · ${it.priority === "haute" ? "priorité haute" : it.priority === "moyenne" ? "priorité moyenne" : "confort"}`, W - M, y, { align: "right" });
    y += 4;
    doc.setFontSize(7.8).setTextColor(70, 70, 70);
    doc.text(detail, M + 4.5, y);
    y += detail.length * 3.6;
    if (action.length) {
      doc.setTextColor(...ACCENT);
      doc.text(action, M + 4.5, y);
      y += action.length * 3.6;
    }
    y += 3.5;
  });

  /* ---------- Notes ---------- */
  if (d.fitterNotes.trim()) {
    h2("Notes du fitter");
    const lines = doc.splitTextToSize(d.fitterNotes, W - 2 * M);
    ensure(lines.length * 4 + 4);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(50, 50, 50);
    doc.text(lines, M, y);
    y += lines.length * 4 + 4;
  }

  /* ---------- Sources ---------- */
  h2("Sources des chartes de fitting");
  const srcs = [
    "PING — Color Code Chart : https://ping.com/en-us/fitting/color-code-chart",
    "PING — Guide du système de points couleur (Golfbidder) : https://www.golfbidder.co.uk/guides-and-advice/buyers-guides/a-guide-to-the-ping-colour-dot-system",
    "Lie statique wrist-to-floor × taille : https://jimchapplegolf.com/custom-club-fitting/determining-and-selecting-your-lie-angle/",
    "Callaway — Iron Fitting Protocols (flex par vitesse) : https://callawaymedia.com/wp-content/uploads/2025/02/CG24_SLS017_IronFittingProtocols_FlipBook_4x6_Ref-Only.pdf",
    "Golf Pride — Guide des tailles de grip : https://www.golfpride.com/us/en-us/grip-academy/swing-grip-size-guide.html",
    "FootJoy — Glove Fitting Guide : https://www.footjoy.com/golf-glove-fitting-guide.html",
    "Moyennes PGA Tour (Trackman) : https://teeituprva.com/wp-content/uploads/2019/03/PGA-AVERAGES-INTERACTIVE.pdf",
    "Fenêtres optimales par club : https://www.upyourclub.com/optimal-launch-monitor-numbers-for-every-club-driver-through-wedges/",
  ];
  doc.setFont("helvetica", "normal").setFontSize(6.8).setTextColor(...GREY);
  srcs.forEach((sc) => {
    const lines = doc.splitTextToSize(sc, W - 2 * M);
    ensure(lines.length * 3.2 + 1);
    doc.text(lines, M, y);
    y += lines.length * 3.2 + 1;
  });

  footer();
  doc.save(`fitting-${playerName.replace(/\s+/g, "-").toLowerCase()}-${stamp.toISOString().slice(0, 10)}-${String(stamp.getHours()).padStart(2, "0")}h${String(stamp.getMinutes()).padStart(2, "0")}.pdf`);
}
