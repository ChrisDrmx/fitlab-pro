/**
 * Couche d'appel au modele d'analyse (OCR Trackman + transcription).
 *
 * L'application fonctionne entierement sans cle : seules les deux fonctions
 * d'analyse a la demande en ont besoin. Si aucune cle n'est configuree, on
 * renvoie une erreur explicite en francais, sans jamais planter l'application.
 *
 * Variables d'environnement reconnues (une seule suffit) :
 *   OPENAI_API_KEY     + OPENAI_MODEL (defaut gpt-5.6-luna)
 *                      + OPENAI_REASONING_EFFORT (defaut high)
 *   ANTHROPIC_API_KEY  + ANTHROPIC_MODEL (optionnel)
 *
 * OpenAI passe par la Responses API : raisonnement explicite (effort high) et
 * sorties structurees garanties par schema. Anthropic sert de secours et obtient
 * la meme garantie de forme via un outil dont le schema d'entree est le meme.
 */

import type { z } from "zod";

export class LlmNotConfiguredError extends Error {
  status = 503;
  constructor() {
    super(
      "Aucune clé d'analyse configurée. Ajoutez OPENAI_API_KEY ou ANTHROPIC_API_KEY dans les variables d'environnement du projet Vercel, puis réessayez. Le reste de l'application fonctionne sans clé.",
    );
    this.name = "LlmNotConfiguredError";
  }
}

type Provider = "anthropic" | "openai";

export type LlmConfig = {
  provider: Provider;
  key: string;
  model: string;
  /** Niveau de raisonnement demande (OpenAI uniquement). */
  effort: "none" | "low" | "medium" | "high" | "xhigh" | "max";
};

const EFFORTS = ["none", "low", "medium", "high", "xhigh", "max"] as const;

export function llmProvider(): LlmConfig | null {
  const openai = (process.env.OPENAI_API_KEY ?? "").trim();
  if (openai) {
    const raw = (process.env.OPENAI_REASONING_EFFORT ?? "").trim().toLowerCase();
    const effort = (EFFORTS as readonly string[]).includes(raw)
      ? (raw as LlmConfig["effort"])
      : "high";
    return {
      provider: "openai",
      key: openai,
      model: (process.env.OPENAI_MODEL ?? "").trim() || "gpt-5.6-luna",
      effort,
    };
  }
  const anthropic = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (anthropic) {
    return {
      provider: "anthropic",
      key: anthropic,
      model: (process.env.ANTHROPIC_MODEL ?? "").trim() || "claude-sonnet-4-5-20250929",
      effort: "high",
    };
  }
  return null;
}

export function llmConfigured() {
  return llmProvider() !== null;
}

export type LlmImage = { mediaType: string; base64: string };

/** Traduit les erreurs du fournisseur en messages clairs pour le fitter. */
function traduireErreur(e: unknown): Error {
  if (e instanceof LlmNotConfiguredError) return e;
  const brut = e instanceof Error ? e.message : String(e);
  const m = brut.toLowerCase();
  if (m.includes("no credits") || m.includes("insufficient_quota") || m.includes("quota")) {
    return new Error(
      "Le compte du fournisseur d'analyse n'a plus de cr\u00e9dits. Recharge le compte (OpenAI ou Anthropic) ou remplace la cl\u00e9 dans les variables d'environnement Vercel. La saisie manuelle reste disponible.",
    );
  }
  if (m.includes("401") || m.includes("invalid api key") || m.includes("authentication")) {
    return new Error(
      "Cl\u00e9 d'analyse refus\u00e9e par le fournisseur. V\u00e9rifie la valeur de OPENAI_API_KEY ou ANTHROPIC_API_KEY dans les variables d'environnement Vercel.",
    );
  }
  if (m.includes("429") || m.includes("rate limit")) {
    return new Error("Trop de demandes envoy\u00e9es au fournisseur d'analyse. R\u00e9essaie dans une minute.");
  }
  if (m.includes("model") && (m.includes("not found") || m.includes("does not exist") || m.includes("unsupported"))) {
    return new Error(
      "Mod\u00e8le d'analyse indisponible pour cette cl\u00e9. Renseigne un mod\u00e8le valide via OPENAI_MODEL ou ANTHROPIC_MODEL.",
    );
  }
  if (m.includes("timeout") || m.includes("etimedout") || m.includes("fetch failed")) {
    return new Error("Fournisseur d'analyse injoignable. R\u00e9essaie dans un instant.");
  }
  return new Error(`Analyse impossible : ${brut}`);
}

/* ------------------------------------------------------------------ */
/* Sortie structuree : garantie par schema Zod                         */
/* ------------------------------------------------------------------ */

/** Mesures de performance d'un appel, pour diagnostiquer la lenteur. */
export type LlmDiag = {
  provider: string;
  model: string;
  effort: string;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
};

export type StructuredOpts<T extends z.ZodType> = {
  /** Consignes de role (message "developer"). */
  instructions: string;
  /** Contenu a analyser (message "user"). */
  input: string;
  image?: LlmImage;
  schema: T;
  /** Nom du schema, requis par l'API (a-z, chiffres, tirets bas). */
  schemaName: string;
  maxTokens?: number;
  /** Surcharges ponctuelles, pour comparer vitesse et qualite. */
  model?: string;
  effort?: string;
  /** Objet rempli avec les mesures de l'appel. */
  diag?: Partial<LlmDiag>;
};

export async function callLlmStructured<T extends z.ZodType>(
  opts: StructuredOpts<T>,
): Promise<z.infer<T>> {
  const t0 = Date.now();
  try {
    const base = llmProvider();
    if (!base) throw new LlmNotConfiguredError();
    const cfg: LlmConfig = {
      ...base,
      model: (opts.model ?? "").trim() || base.model,
      effort: (EFFORTS as readonly string[]).includes((opts.effort ?? "").trim().toLowerCase())
        ? ((opts.effort as string).trim().toLowerCase() as LlmConfig["effort"])
        : base.effort,
    };
    if (opts.diag) {
      opts.diag.provider = cfg.provider;
      opts.diag.model = cfg.model;
      opts.diag.effort = cfg.provider === "openai" ? cfg.effort : "n/a";
    }
    return cfg.provider === "openai"
      ? await structureOpenai(cfg, opts)
      : await structureAnthropic(cfg, opts);
  } catch (e) {
    throw traduireErreur(e);
  } finally {
    if (opts.diag) opts.diag.ms = Date.now() - t0;
  }
}

async function structureOpenai<T extends z.ZodType>(
  cfg: LlmConfig,
  opts: StructuredOpts<T>,
): Promise<z.infer<T>> {
  const { default: OpenAI } = await import("openai");
  const { zodTextFormat } = await import("openai/helpers/zod");
  const client = new OpenAI({ apiKey: cfg.key, timeout: 240_000, maxRetries: 1 });

  const userContent: Array<Record<string, unknown>> = [];
  if (opts.image) {
    userContent.push({
      type: "input_image",
      image_url: `data:${opts.image.mediaType};base64,${opts.image.base64}`,
      detail: "high",
    });
  }
  userContent.push({ type: "input_text", text: opts.input });

  const resp = await client.responses.parse({
    model: cfg.model,
    ...(cfg.effort === "none" ? {} : { reasoning: { effort: cfg.effort } }),
    max_output_tokens: (opts.maxTokens ?? 8000) + 24_000,
    input: [
      { role: "developer", content: opts.instructions },
      { role: "user", content: userContent as never },
    ],
    text: { format: zodTextFormat(opts.schema as never, opts.schemaName) },
  } as never);

  if (opts.diag) {
    const u = (resp as { usage?: Record<string, unknown> }).usage ?? {};
    opts.diag.inputTokens = Number(u.input_tokens ?? 0);
    opts.diag.outputTokens = Number(u.output_tokens ?? 0);
    opts.diag.reasoningTokens = Number(
      (u.output_tokens_details as { reasoning_tokens?: number } | undefined)?.reasoning_tokens ?? 0,
    );
  }

  const parsed = (resp as { output_parsed?: unknown }).output_parsed;
  if (parsed === null || parsed === undefined) {
    const refus = (resp as { output_text?: string }).output_text ?? "";
    throw new Error(
      refus
        ? `réponse inexploitable du module d'analyse (${refus.slice(0, 200)})`
        : "réponse vide du module d'analyse",
    );
  }
  return parsed as z.infer<T>;
}

async function structureAnthropic<T extends z.ZodType>(
  cfg: LlmConfig,
  opts: StructuredOpts<T>,
): Promise<z.infer<T>> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { z: zod } = await import("zod");
  const client = new Anthropic({ apiKey: cfg.key, timeout: 240_000, maxRetries: 1 });

  const jsonSchema = (zod as unknown as { toJSONSchema: (s: unknown, o?: unknown) => unknown })
    .toJSONSchema(opts.schema, { target: "draft-7", io: "output" });

  const content: unknown[] = [];
  if (opts.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.base64 },
    });
  }
  content.push({ type: "text", text: opts.input });

  const resp = await client.messages.create({
    model: cfg.model,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.instructions,
    tools: [
      {
        name: opts.schemaName,
        description: "Renvoie le resultat structure de l'analyse.",
        input_schema: jsonSchema as never,
      },
    ],
    tool_choice: { type: "tool", name: opts.schemaName },
    messages: [{ role: "user", content: content as never }],
  });

  const block = (resp.content as Array<{ type: string; input?: unknown }>).find(
    (c) => c.type === "tool_use",
  );
  if (!block?.input) throw new Error("réponse vide du module d'analyse");
  return opts.schema.parse(block.input) as z.infer<T>;
}

/* ------------------------------------------------------------------ */
/* Sortie texte libre (compatibilite)                                  */
/* ------------------------------------------------------------------ */

/** Envoie un prompt (avec image optionnelle) et renvoie le texte brut du modele. */
export async function callLlm(opts: {
  prompt: string;
  image?: LlmImage;
  maxTokens?: number;
}): Promise<string> {
  try {
    return await appelBrut(opts);
  } catch (e) {
    throw traduireErreur(e);
  }
}

async function appelBrut(opts: {
  prompt: string;
  image?: LlmImage;
  maxTokens?: number;
}): Promise<string> {
  const cfg = llmProvider();
  if (!cfg) throw new LlmNotConfiguredError();
  const maxTokens = opts.maxTokens ?? 4000;

  if (cfg.provider === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: cfg.key, timeout: 240_000, maxRetries: 1 });
    const content: unknown[] = [];
    if (opts.image) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.base64 },
      });
    }
    content.push({ type: "text", text: opts.prompt });
    const resp = await client.messages.create({
      model: cfg.model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: content as never }],
    });
    return (resp.content as Array<{ type: string; text?: string }>)
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text as string)
      .join("\n");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: cfg.key, timeout: 240_000, maxRetries: 1 });
  const userContent: Array<Record<string, unknown>> = [];
  if (opts.image) {
    userContent.push({
      type: "input_image",
      image_url: `data:${opts.image.mediaType};base64,${opts.image.base64}`,
      detail: "high",
    });
  }
  userContent.push({ type: "input_text", text: opts.prompt });

  const resp = await client.responses.create({
    model: cfg.model,
    ...(cfg.effort === "none" ? {} : { reasoning: { effort: cfg.effort } }),
    max_output_tokens: maxTokens + 24_000,
    input: [{ role: "user", content: userContent as never }],
  } as never);

  return (resp as { output_text?: string }).output_text ?? "";
}
