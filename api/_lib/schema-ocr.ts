import { z } from "zod";
import { CLUBS } from "./schema-transcript.js";

/** Schema de sortie structuree pour la lecture d'une capture Trackman. */

const txt = () => z.string().nullable();

const Row = z.object({
  club: z.enum(CLUBS).nullable(),
  clubSpeed: txt(),
  ballSpeed: txt(),
  smash: txt(),
  launch: txt(),
  spin: txt(),
  attackAngle: txt(),
  dynamicLoft: txt(),
  spinLoft: txt(),
  faceAngle: txt(),
  clubPath: txt(),
  faceToPath: txt(),
  height: txt(),
  landingAngle: txt(),
  carry: txt(),
  total: txt(),
  sideCarry: txt(),
});

export const OcrSchema = z.object({
  /** Unites lues a l'ecran, avant conversion. */
  detectedUnits: z.object({
    speed: z.enum(["mph", "kmh", "ms"]).nullable(),
    distance: z.enum(["yards", "meters", "feet"]).nullable(),
  }),
  source: z.string(),
  rows: z.array(Row),
  /** Champs illisibles ou douteux a verifier a l'ecran. */
  ambiguities: z.array(z.string()),
});

export type OcrParsed = z.infer<typeof OcrSchema>;
