import { callLlmStructured } from "./llm.js";
import type { LlmDiag } from "./llm.js";
import { CoachingSchema } from "./schema-coaching.js";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const INSTRUCTIONS = `Tu es un assistant de préparation de cours pour un pro de golf.

La source est une transcription collée par le pro après un cours. Elle contient ses commentaires sur son élève, ses observations de swing et ses consignes éventuelles. Analyse ses mots et ses pratiques : n'applique pas le prompt de fitting et ne transforme pas une remarque pédagogique en mesure Trackman.

Règles impératives :
- N'invente aucune donnée, cause, mesure ou préférence qui ne figure pas dans la transcription.
- Conserve l'intention et le vocabulaire du pro, même si la reconnaissance vocale contient quelques erreurs évidentes.
- Si une information est ambiguë, laisse le champ concerné vide et ajoute un point à vérifier dans ambiguities.
- Les recommandations doivent suivre exactement ces quatre champs : problème observé, cause probable, correction proposée, priorité (haute, moyenne ou basse). La priorité est une estimation pédagogique, pas un diagnostic médical.
- Propose des exercices directement utilisables en cours ou à la maison. Chaque exercice doit comporter durée, répétitions, fréquence par semaine, consignes, critère de réussite et vidéo ou lien externe. Mets une chaîne vide pour le lien si aucun lien n'est donné ou connu. N'invente pas d'URL.
- Le rapport élève doit être une version courte, claire, encourageante et non technique des éléments réellement présents. Il ne doit pas contenir de promesse de résultat ni de conseil médical.
- Si la transcription ne permet pas de créer une recommandation ou un exercice fiable, renvoie un tableau vide plutôt que d'inventer.
- Renvoie toujours tous les champs du format demandé, même lorsqu'ils sont vides.`;

export async function parseCoachingTranscript(
  transcript: string,
  context: { objective?: string; duration?: string; studentName?: string } = {},
  tune: { model?: string; effort?: string } = {},
) {
  const source = transcript.trim();
  if (source.length < 20) throw new Error("Transcription trop courte pour être analysée.");
  if (source.length > 60000) throw new Error("Transcription trop longue (60 000 caractères maximum).");

  const diag: Partial<LlmDiag> = {};
  const parsed = await callLlmStructured({
    instructions: INSTRUCTIONS,
    input: [
      "--- CONTEXTE DU COURS ---",
      `Élève : ${text(context.studentName) || "non renseigné"}`,
      `Objectif : ${text(context.objective) || "non renseigné"}`,
      `Durée : ${text(context.duration) || "non renseignée"}`,
      "--- COMMENTAIRES DU PRO ---",
      source,
    ].join("\n"),
    schema: CoachingSchema,
    schemaName: "coaching_session",
    maxTokens: 6000,
    model: tune.model,
    effort: tune.effort,
    diag,
  });

  return {
    summary: parsed.summary.trim(),
    recommendations: parsed.recommendations.map((r) => ({
      problemObserved: r.problemObserved.trim(),
      probableCause: r.probableCause.trim(),
      proposedCorrection: r.proposedCorrection.trim(),
      priority: r.priority,
    })),
    exercises: parsed.exercises.map((e) => ({
      title: e.title.trim(),
      duration: e.duration.trim(),
      repetitions: e.repetitions.trim(),
      frequency: e.frequency.trim(),
      instructions: e.instructions.trim(),
      successCriteria: e.successCriteria.trim(),
      videoUrl: e.videoUrl.trim(),
    })),
    studentReport: parsed.studentReport.trim(),
    ambiguities: parsed.ambiguities.map((a) => a.trim()).filter(Boolean).slice(0, 12),
    diag: diag as LlmDiag,
  };
}

export type CoachingResult = Awaited<ReturnType<typeof parseCoachingTranscript>>;
