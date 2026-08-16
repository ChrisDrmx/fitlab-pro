import type { CoachingData } from "@/lib/types";

const GREEN: [number, number, number] = [27, 58, 44];
const GREY: [number, number, number] = [105, 112, 108];
const M = 16;
const clean = (value: string) => value
  .replace(/[→←]/g, "->")
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[•·]/g, "-")
  .replace(/[\u202f\u00a0]/g, " ");

export async function exportCoachingPdf(data: CoachingData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const studentName = `${data.student.firstName} ${data.student.lastName}`.trim() || "Élève";
  const date = data.date ? new Date(`${data.date}T12:00:00`).toLocaleDateString("fr-BE") : "";
  let y = 0;

  const footer = () => {
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GREY);
    doc.text(`FitLab Pro — rapport de coaching · ${clean(studentName)}`, M, H - 9);
    doc.text(String(doc.getNumberOfPages()), W - M, H - 9, { align: "right" });
  };
  const ensure = (height: number) => {
    if (y + height > H - 18) { footer(); doc.addPage(); y = M; }
  };
  const heading = (title: string) => {
    ensure(14);
    doc.setDrawColor(214, 214, 208).setLineWidth(0.3).line(M, y - 4, W - M, y - 4);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...GREEN).text(clean(title), M, y);
    y += 7;
  };
  const paragraph = (value: string) => {
    if (!value.trim()) return;
    const lines = doc.splitTextToSize(clean(value), W - 2 * M);
    ensure(lines.length * 4.2 + 3);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(35, 35, 35).text(lines, M, y);
    y += lines.length * 4.2 + 4;
  };
  const labelValue = (label: string, value: string) => {
    ensure(9);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY).text(clean(label), M, y);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(35, 35, 35).text(clean(value || "—"), M + 34, y);
    y += 6;
  };

  doc.setFillColor(...GREEN).rect(0, 0, W, 34, "F");
  doc.setFont("helvetica", "bold").setFontSize(17).setTextColor(255, 255, 255).text("Rapport de coaching", M, 15);
  doc.setFont("helvetica", "normal").setFontSize(9.5).text("Plan de séance et suivi de progression", M, 22);
  doc.setFontSize(8).setTextColor(190, 210, 198).text("Chris Deramaix — Pro de golf", M, 28.5);
  doc.setFontSize(9).setTextColor(255, 255, 255).text(date, W - M, 15, { align: "right" });
  y = 44;

  heading("Séance");
  labelValue("Élève", studentName);
  labelValue("Date du cours", date);
  labelValue("Objectif", data.objective);
  labelValue("Durée", data.duration);
  if (data.proNotes) { labelValue("Notes du pro", ""); paragraph(data.proNotes); }

  if (data.studentReport) {
    heading("À retenir pour l'élève");
    paragraph(data.studentReport);
  }

  if (data.recommendations.length) {
    heading("Recommandations");
    for (const r of data.recommendations) {
      ensure(27);
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...GREEN)
        .text(clean(`${r.priority ? `${r.priority} — ` : ""}${r.problemObserved || "Constat"}`), M, y);
      y += 5;
      paragraph(`Cause probable : ${r.probableCause || "—"}`);
      paragraph(`Correction proposée : ${r.proposedCorrection || "—"}`);
    }
  }

  if (data.exercises.length) {
    heading("Exercices");
    for (const e of data.exercises) {
      ensure(30);
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...GREEN).text(clean(e.title || "Exercice"), M, y);
      y += 5;
      labelValue("Durée", e.duration);
      labelValue("Répétitions", e.repetitions);
      labelValue("Fréquence", e.frequency);
      paragraph(`Consignes : ${e.instructions || "—"}`);
      paragraph(`Critère de réussite : ${e.successCriteria || "—"}`);
      if (e.videoUrl) paragraph(`Lien : ${e.videoUrl}`);
    }
  }

  if (data.trackmanPhotos.length) {
    heading("Captures Trackman jointes");
    paragraph(`${data.trackmanPhotos.length} photo${data.trackmanPhotos.length > 1 ? "s" : ""} conservée${data.trackmanPhotos.length > 1 ? "s" : ""} avec la fiche. L'analyse Trackman dédiée pourra être ajoutée ultérieurement.`);
  }

  footer();
  const slug = studentName.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "eleve";
  doc.save(`coaching-${slug}-${data.date || new Date().toISOString().slice(0, 10)}.pdf`);
}
