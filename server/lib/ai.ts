/**
 * FitLab Pro — IA via API Grok (xAI)
 * Clé : process.env.XAI_API_KEY (jamais en dur)
 *
 * RÈGLE ABSOLUE : une valeur illisible ou non dite reste null / "".
 * Interdit d'inventer, estimer ou compléter.
 */

const XAI_BASE = "https://api.x.ai/v1";

function getApiKey(): string {
  const key = process.env.XAI_API_KEY || "";
  if (!key) throw new Error("Clé API Grok non configurée (XAI_API_KEY)");
  return key;
}

async function xaiChat(params: {
  model: string;
  system: string;
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>;
  max_tokens?: number;
}): Promise<string> {
  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.max_tokens ?? 4096,
      temperature: 0,
      messages: [
        { role: "system", content: params.system },
        ...params.messages,
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`xAI API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJson(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Réponse IA non parsable (pas de JSON)");
  return JSON.parse(jsonMatch[0]);
}

const TRANSCRIPT_SYSTEM = `Tu es un expert en fitting de clubs de golf. Tu extrais UNIQUEMENT les informations explicitement présentes dans la transcription audio d'une séance de fitting.

RÈGLE ABSOLUE — RIEN N'EST INVENTÉ :
- Un champ non mentionné reste null ou chaîne vide.
- Ne jamais deviner, estimer, interpréter au-delà du texte, ni compléter.
- Si une information est ambiguë ou partiellement audible, laisse le champ vide.
- Préférer un champ vide plutôt qu'une valeur incertaine.

Convertis uniquement si explicitement dit :
- Nombres en toutes lettres → chiffres (\"un mètre quatre-vingt-deux\" → 182)
- Longueurs corporelles en cm
- Vitesses en mph (si km/h ×0.621371, si m/s ×2.23694)
- Distances en mètres (si yards ×0.9144)
- Genre et latéralité uniquement si clairement déductibles du langage
- Marques de lie board : talon/heel, légèrement pointe/toe léger, centre, etc.
- Matériel en série sans club précis (\"il joue du Ping i230\") → rattacher au fer 7 avec mention \"série complète\"

Réponds UNIQUEMENT en JSON valide (pas de markdown) :
{
  \"summary\": \"résumé court de la séance\",
  \"player\": {
    \"firstName\": \"\", \"lastName\": \"\", \"email\": \"\", \"phone\": \"\",
    \"gender\": \"H\"|\"F\"|\"\", \"birthYear\": null, \"handedness\": \"droitier\"|\"gaucher\"|\"\",
    \"handicap\": null, \"yearsPlaying\": null, \"roundsPerMonth\": null,
    \"tempo\": \"lent\"|\"moyen\"|\"rapide\"|\"\", \"physicalNotes\": \"\",
    \"goals\": [], \"missPattern\": \"\", \"golfClub\": \"\"
  },
  \"measures\": {
    \"heightCm\": null, \"wristToFloorCm\": null, \"wingspanCm\": null,
    \"handLengthCm\": null, \"handCircumferenceCm\": null, \"middleFingerCm\": null,
    \"currentGloveSize\": \"\", \"shoeSole\": \"plate\"|\"crampons\"|\"\"
  },
  \"currentClubs\": [],
  \"lieTests\": [],
  \"trackman\": [],
  \"reco\": {
    \"lie\": \"\", \"lengthInches\": null, \"lengthCm\": null, \"flex\": \"\",
    \"gripModel\": \"\", \"gripSize\": \"\", \"glove\": \"\", \"pingColorCode\": \"\",
    \"loftGapping\": \"\", \"driverLoft\": \"\", \"ballModel\": \"\"
  },
  \"targetBrand\": \"\",
  \"fitterNotes\": \"\",
  \"quotes\": {}
}

Pour \"quotes\" : pour CHAQUE valeur non vide/null, fournis l'extrait EXACT de la transcription qui la justifie. Clé = chemin du champ (ex: \"player.firstName\", \"measures.heightCm\").`;

const OCR_SYSTEM = `Tu es un expert en extraction de données TrackMan pour le fitting de clubs de golf.
Analyse l'image d'un écran ou rapport TrackMan et extrais UNIQUEMENT les mesures clairement lisibles.

RÈGLE ABSOLUE — JAMAIS DE VALEUR INVENTÉE :
- Une valeur floue, coupée, partiellement visible ou absente reste null.
- Ne jamais estimer, interpoler ou deviner un chiffre.
- Si tu n'es pas certain à 100 % d'un chiffre, mets null.
- Préférer rows: [] plutôt que des données douteuses.

Conversions obligatoires (uniquement sur valeurs lues) :
- Vitesses (club speed, ball speed) → MPH (si km/h ×0.621371, si m/s ×2.23694)
- Distances (carry, total, height, side) → mètres (si yards ×0.9144)
- Spin → rpm
- Angles → degrés
- Side : gauche/L → nombre négatif, droite/R → positif

Champs calculés UNIQUEMENT si les deux opérandes sont lisibles :
- smashFactor = ballSpeed / clubSpeed
- faceToPath = faceAngle − clubPath
- spinLoft = dynamicLoft − attackAngle

Clubs : DR, 3W, 5W, 7W, H3, H4, H5, 3i–9i, PW, GW, SW, LW (normaliser les noms).

Réponds UNIQUEMENT en JSON valide (pas de markdown) :
{
  \"detectedUnits\": \"unités détectées dans l'image\",
  \"source\": \"description courte de l'écran (joueur, club, date si visibles)\",
  \"rows\": [
    {
      \"club\": \"DR\",
      \"clubSpeed\": null,
      \"ballSpeed\": null,
      \"smashFactor\": null,
      \"launchAngle\": null,
      \"backspin\": null,
      \"attackAngle\": null,
      \"dynamicLoft\": null,
      \"spinLoft\": null,
      \"faceAngle\": null,
      \"clubPath\": null,
      \"faceToPath\": null,
      \"height\": null,
      \"landAngle\": null,
      \"carry\": null,
      \"total\": null,
      \"sideCarry\": null
    }
  ]
}

Si aucune donnée TrackMan n'est clairement lisible :
{\"detectedUnits\":\"\",\"source\":\"Aucune donnée lisible\",\"rows\":[]}`;

export async function parseTranscript(transcript: string) {
  const text = await xaiChat({
    model: "grok-4",
    system: TRANSCRIPT_SYSTEM,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Transcription de la séance de fitting :\n\n${transcript}`,
      },
    ],
  });
  return extractJson(text);
}

export async function ocrTrackman(imageBase64: string) {
  let mediaType = "image/jpeg";
  if (imageBase64.startsWith("data:image/png")) mediaType = "image/png";
  else if (imageBase64.startsWith("data:image/webp")) mediaType = "image/webp";
  else if (imageBase64.startsWith("data:image/gif")) mediaType = "image/gif";

  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:${mediaType};base64,${imageBase64}`;

  try {
    const text = await xaiChat({
      model: "grok-2-vision-latest",
      system: OCR_SYSTEM,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: "Extrais toutes les données TrackMan clairement lisibles dans cette image. Si un chiffre est flou, mets null. Ne rien inventer.",
            },
          ],
        },
      ],
    });
    return extractJson(text) as {
      detectedUnits: string;
      source: string;
      rows: unknown[];
    };
  } catch (err) {
    console.error("OCR TrackMan error:", err);
    return {
      detectedUnits: "",
      source: "Erreur ou données non lisibles",
      rows: [],
    };
  }
}

export function hasAiKey(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}
