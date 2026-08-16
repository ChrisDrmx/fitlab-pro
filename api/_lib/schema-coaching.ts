import { z } from "zod";

const Recommendation = z.object({
  problemObserved: z.string(),
  probableCause: z.string(),
  proposedCorrection: z.string(),
  priority: z.enum(["haute", "moyenne", "basse"]),
});

const Exercise = z.object({
  title: z.string(),
  duration: z.string(),
  repetitions: z.string(),
  frequency: z.string(),
  instructions: z.string(),
  successCriteria: z.string(),
  videoUrl: z.string(),
});

export const CoachingSchema = z.object({
  summary: z.string(),
  recommendations: z.array(Recommendation),
  exercises: z.array(Exercise),
  studentReport: z.string(),
  ambiguities: z.array(z.string()),
});

export type CoachingParsed = z.infer<typeof CoachingSchema>;
