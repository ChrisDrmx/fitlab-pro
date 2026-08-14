/**
 * Couche d'appel au modele d'analyse (OCR Trackman + transcription).
 *
 * L'application fonctionne entierement sans cle : seules les deux fonctions
 * d'analyse a la demande en ont besoin. Si aucune cle n'est configuree, on
 * renvoie une erreur explicite en francais, sans jamais planter l'application.
 *
 * Variables d'environnement reconnues (une seule suffit) :
 *   ANTHROPIC_API_KEY  + ANTHROPIC_MODEL (optionnel)
 *   OPENAI_API_KEY     + OPENAI_MODEL    (optionnel)
 */

export class LlmNotConfiguredError extends Error {
  status = 503;
  constructor() {
    super(
      "Aucune clé d'analyse configurée. Ajoutez ANTHROPIC_API_KEY ou OPENAI_API_KEY dans les variables d'environnement du projet Vercel, puis réessayez. Le reste de l'application fonctionne sans clé.",
    );
    this.name = "LlmNotConfiguredError";
  }
}

type Provider = "anthropic" | "openai";

export function llmProvider(): { provider: Provider; key: string; model: string } | null {
  const anthropic = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (anthropic) {
    return {
      provider: "anthropic",
      key: anthropic,
      model: (process.env.ANTHROPIC_MODEL ?? "").trim() || "claude-sonnet-4-5-20250929",
    };
  }
  const openai = (process.env.OPENAI_API_KEY ?? "").trim();
  if (openai) {
    return {
      provider: "openai",
      key: openai,
      model: (process.env.OPENAI_MODEL ?? "").trim() || "gpt-4o",
    };
  }
  return null;
}

export function llmConfigured() {
  return llmProvider() !== null;
}

export type LlmImage = { mediaType: string; base64: string };

/** Envoie un prompt (avec image optionnelle) et renvoie le texte brut du modele. */
export async function callLlm(opts: {
  prompt: string;
  image?: LlmImage;
  maxTokens?: number;
}): Promise<string> {
  const cfg = llmProvider();
  if (!cfg) throw new LlmNotConfiguredError();
  const maxTokens = opts.maxTokens ?? 4000;

  if (cfg.provider === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: cfg.key });
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
  const client = new OpenAI({ apiKey: cfg.key });
  const content: Array<Record<string, unknown>> = [{ type: "text", text: opts.prompt }];
  if (opts.image) {
    content.unshift({
      type: "image_url",
      image_url: { url: `data:${opts.image.mediaType};base64,${opts.image.base64}` },
    });
  }
  const resp = await client.chat.completions.create({
    model: cfg.model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: content as never }],
  });
  return resp.choices?.[0]?.message?.content ?? "";
}
