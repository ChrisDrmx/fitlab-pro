import type { ClubKey } from "@/lib/types";

export const IN = 2.54; // cm par pouce

export interface Src { label: string; url: string }

/* ------------------------------------------------------------------ *
 * 1. PING — Color Code (lie) et ajustement de longueur
 * ------------------------------------------------------------------ */

export const PING_SRC: Src = {
  label: "PING — Color Code Chart",
  url: "https://ping.com/en-us/fitting/color-code-chart",
};

/** Système actuel PING : 1 couleur = 1° de lie. */
export const PING_COLORS_CURRENT = [
  { color: "Gold", fr: "Or", deg: -4, dir: "flat", hex: "#C9A227" },
  { color: "Brown", fr: "Brun", deg: -3, dir: "flat", hex: "#6B4423" },
  { color: "Orange", fr: "Orange", deg: -2, dir: "flat", hex: "#E8751A" },
  { color: "Red", fr: "Rouge", deg: -1, dir: "flat", hex: "#C62828" },
  { color: "Black", fr: "Noir", deg: 0, dir: "standard", hex: "#1C1C1C" },
  { color: "Blue", fr: "Bleu", deg: 1, dir: "upright", hex: "#1565C0" },
  { color: "Green", fr: "Vert", deg: 2, dir: "upright", hex: "#2E7D32" },
  { color: "White", fr: "Blanc", deg: 3, dir: "upright", hex: "#F5F5F5" },
  { color: "Silver", fr: "Argent", deg: 4, dir: "upright", hex: "#A8A8A8" },
  { color: "Maroon", fr: "Bordeaux", deg: 5, dir: "upright", hex: "#7B1B2E" },
] as const;

export const PING_COLORS_CURRENT_SRC: Src[] = [
  { label: "TGW — How to read the PING color code chart", url: "https://www.tgw.com/golf-guide/how-to-read-the-ping-color-code-chart/" },
  { label: "House of Golf — PING colour code chart", url: "https://houseofgolf.com.au/blogs/custom-tools/ping-colour-code-chart" },
];

/** Système historique PING (pré-2017) : 1 couleur = 0,75° — bandes wrist-to-floor documentées. */
export const PING_COLORS_LEGACY = [
  { color: "Gold", fr: "Or", deg: -3.75, hex: "#c9a227", wtfIn: [28.5, 30.0], wtfMin: 28.5, wtfMax: 30.0 },
  { color: "Brown", fr: "Brun", deg: -3.0, hex: "#7a4a21", wtfIn: [29.25, 30.75], wtfMin: 29.25, wtfMax: 30.75 },
  { color: "Orange", fr: "Orange", deg: -2.25, hex: "#e0762a", wtfIn: [30.5, 31.75], wtfMin: 30.5, wtfMax: 31.75 },
  { color: "Purple", fr: "Violet", deg: -1.5, hex: "#6b3fa0", wtfIn: [31.25, 32.5], wtfMin: 31.25, wtfMax: 32.5 },
  { color: "Red", fr: "Rouge", deg: -0.75, hex: "#c0342b", wtfIn: [32.25, 33.5], wtfMin: 32.25, wtfMax: 33.5 },
  { color: "Black", fr: "Noir", deg: 0.0, hex: "#1c1c1c", wtfIn: [33.0, 34.25], wtfMin: 33.0, wtfMax: 34.25 },
  { color: "Blue", fr: "Bleu", deg: 0.75, hex: "#1e5fa8", wtfIn: [33.75, 35.25], wtfMin: 33.75, wtfMax: 35.25 },
  { color: "Yellow", fr: "Jaune", deg: 1.5, hex: "#e8c72c", wtfIn: [34.75, 36.0], wtfMin: 34.75, wtfMax: 36.0 },
  { color: "Green", fr: "Vert", deg: 2.25, hex: "#2e8b57", wtfIn: [35.5, 36.75], wtfMin: 35.5, wtfMax: 36.75 },
  { color: "White", fr: "Blanc", deg: 3.0, hex: "#f2f2f0", wtfIn: [36.5, 37.75], wtfMin: 36.5, wtfMax: 37.75 },
  { color: "Silver", fr: "Argent", deg: 3.75, hex: "#b8bcc0", wtfIn: [37.25, 38.75], wtfMin: 37.25, wtfMax: 38.75 },
  { color: "Maroon", fr: "Bordeaux", deg: 4.5, hex: "#7b2233", wtfIn: [38.25, 99], wtfMin: 38.25, wtfMax: null },
] as const;

export const PING_COLORS_LEGACY_SRC: Src = {
  label: "Golfbidder — Guide du système de points couleur PING",
  url: "https://www.golfbidder.co.uk/guides-and-advice/buyers-guides/a-guide-to-the-ping-colour-dot-system",
};

/**
 * PING — ajustement de longueur selon la taille du joueur.
 * Bandes relevées sur la charte officielle PING Color Code Chart (©PING 2020),
 * publiée uniquement sous forme d'image sur ping.com (aucun PDF officiel).
 */
export const PING_LENGTH_BY_HEIGHT = [
  { minCm: 198.1, maxCm: 215, label: "6'6\"–6'7\"", adjIn: 1.5 },
  { minCm: 185.4, maxCm: 198.1, label: "6'1\"–6'5\"", adjIn: 1.0 },
  { minCm: 179.7, maxCm: 185.4, label: "5'11\"–6'0\"", adjIn: 0.5 },
  { minCm: 169.5, maxCm: 179.7, label: "5'7\"–5'10\"", adjIn: 0.0 },
  { minCm: 161.9, maxCm: 169.5, label: "5'4\"–5'6\"", adjIn: -0.5 },
  { minCm: 156.8, maxCm: 161.9, label: "5'2\"–5'3\"", adjIn: -1.0 },
  { minCm: 120.0, maxCm: 156.8, label: "5'0\"–5'1\"", adjIn: -1.5 },
];

/**
 * PING Grip Chart — code couleur de grip (longueur de main x longueur du majeur).
 * Charte compagnon publiée sur la même page que le color code chart.
 */
export const PING_GRIP_COLORS = [
  { color: "Blue", fr: "Bleu", hex: "#1e5fa8", adj: "-1/16\"" },
  { color: "Red", fr: "Rouge", hex: "#c0342b", adj: "-1/32\"" },
  { color: "Aqua", fr: "Turquoise", hex: "#2fa8a0", adj: "-1/64\"" },
  { color: "White", fr: "Blanc", hex: "#f2f2f0", adj: "standard" },
  { color: "Gold", fr: "Or", hex: "#c9a227", adj: "+1/32\"" },
  { color: "Orange", fr: "Orange", hex: "#e0762a", adj: "+1/16\"" },
];

export const PING_GRIP_SRC: Src = {
  label: "PING — Grip Chart (page Color Code Chart)",
  url: "https://ping.com/en-us/fitting/color-code-chart",
};

/* ------------------------------------------------------------------ *
 * 2. Lie statique — table croisée wrist-to-floor x taille
 * ------------------------------------------------------------------ */

export const STATIC_LIE_SRC: Src = {
  label: "Jim Chapple Golf — Determining and selecting your lie angle",
  url: "https://jimchapplegolf.com/custom-club-fitting/determining-and-selecting-your-lie-angle/",
};

/** wtfIn -> correction de lie (°, + = upright) par bande de taille. */
export const STATIC_LIE_TABLE: { wtfIn: number; small: number | null; mid: number | null; tall: number | null }[] = [
  { wtfIn: 40, small: null, mid: 3, tall: 3 },
  { wtfIn: 39, small: 3, mid: 3, tall: 2 },
  { wtfIn: 38, small: 2, mid: 2, tall: 2 },
  { wtfIn: 37, small: 2, mid: 2, tall: 1 },
  { wtfIn: 36, small: 1, mid: 1, tall: 0 },
  { wtfIn: 35, small: 0, mid: 0, tall: 0 },
  { wtfIn: 34, small: 0, mid: 0, tall: 0 },
  { wtfIn: 33, small: 0, mid: 0, tall: 0 },
  { wtfIn: 32, small: 0, mid: -1, tall: -1 },
  { wtfIn: 31, small: -1, mid: -2, tall: -2 },
  { wtfIn: 30, small: -2, mid: -2, tall: -3 },
  { wtfIn: 29, small: -3, mid: -3, tall: null },
];

/** Bandes de taille de la table ci-dessus. */
export const HEIGHT_BANDS = {
  small: { label: "4'10\"–5'6\" (147–168 cm)", minCm: 120, maxCm: 168 },
  mid: { label: "5'6\"–6'2\" (168–188 cm)", minCm: 168, maxCm: 188 },
  tall: { label: "6'2\"–6'7\" (188–201 cm)", minCm: 188, maxCm: 230 },
};

/** Lie standard hommes par club (référence de contrôle). */
export const STANDARD_LIE: Partial<Record<ClubKey, number>> = {
  DR: 56, "3W": 56, "5W": 57, "7W": 57.5, H3: 58, H4: 58.5, H5: 59,
  "3i": 58, "4i": 59, "5i": 60, "6i": 61, "7i": 62, "8i": 63, "9i": 64,
  PW: 64, GW: 64, SW: 64, LW: 64,
};

/* ------------------------------------------------------------------ *
 * 3. Grips et gants
 * ------------------------------------------------------------------ */

export const GRIP_SIZE_SRC: Src = {
  label: "Golf Pride — Swing Grip Size Guide",
  url: "https://www.golfpride.com/us/en-us/grip-academy/swing-grip-size-guide.html",
};

/** Mesure : pli du poignet -> bout du majeur (main du gant). */
export const GRIP_SIZE_TABLE = [
  { size: "Junior", minIn: 0, maxIn: 5.0, glove: "Femme XS / Junior" },
  { size: "Undersize", minIn: 5.0, maxIn: 6.5, glove: "Homme S, Cadet S, Femme S/M" },
  { size: "Standard", minIn: 6.6, maxIn: 7.5, glove: "Homme M/ML, Cadet M/ML, Femme ML/L" },
  { size: "Midsize", minIn: 7.6, maxIn: 9.0, glove: "Homme L/XL, Cadet L/XL" },
  { size: "Jumbo", minIn: 9.0, maxIn: 99, glove: "Homme XL/XXL/XXXL, Cadet XXL" },
];

export const GRIP_BUILDUP_SRC: Src = {
  label: "Golf Pride — Grip specifications & build-up",
  url: "https://www.golfpride.com/us/en-us/customer-service-hub/grip-advice/grip-specifications.html",
};

export const GRIP_BUILDUP_NOTE =
  "Chaque couche supplémentaire de scotch double-face augmente le diamètre du grip d'environ 1/64\" (0,4 mm). 4 couches ~ +1/64\" de plus par rapport à Midsize sur un même modèle. Un grip Midsize pèse en général 4 à 6 g de plus qu'un Standard, ce qui abaisse légèrement le swingweight (~ 1 point de swingweight pour 2 g au grip).";

export const GLOVE_SRC: Src = {
  label: "FootJoy — Golf glove fitting guide",
  url: "https://www.footjoy.com/golf-glove-fitting-guide.html",
};

/** FootJoy — longueur de main (cm) & tour de main (cm). */
export const GLOVE_TABLE = [
  { size: "S", gender: "H", lenCm: [17.5, 18.1], circCm: [19.7, 20.3], lenMin: 17.5, lenMax: 18.1, circMin: 19.7, circMax: 20.3 },
  { size: "M", gender: "H", lenCm: [18.1, 18.7], circCm: [20.3, 21.0], lenMin: 18.1, lenMax: 18.7, circMin: 20.3, circMax: 21.0 },
  { size: "ML", gender: "H", lenCm: [18.7, 19.2], circCm: [21.0, 21.3], lenMin: 18.7, lenMax: 19.2, circMin: 21.0, circMax: 21.3 },
  { size: "L", gender: "H", lenCm: [19.2, 19.7], circCm: [21.3, 22.2], lenMin: 19.2, lenMax: 19.7, circMin: 21.3, circMax: 22.2 },
  { size: "XL", gender: "H", lenCm: [19.7, 20.3], circCm: [22.2, 23.5], lenMin: 19.7, lenMax: 20.3, circMin: 22.2, circMax: 23.5 },
  { size: "XXL", gender: "H", lenCm: [20.3, 21.0], circCm: [23.5, 24.8], lenMin: 20.3, lenMax: 21.0, circMin: 23.5, circMax: 24.8 },
  { size: "S", gender: "F", lenCm: [15.2, 16.2], circCm: [17.2, 17.8], lenMin: 15.2, lenMax: 16.2, circMin: 17.2, circMax: 17.8 },
  { size: "M", gender: "F", lenCm: [16.2, 16.8], circCm: [17.8, 18.8], lenMin: 16.2, lenMax: 16.8, circMin: 17.8, circMax: 18.8 },
  { size: "ML", gender: "F", lenCm: [16.8, 17.1], circCm: [19.4, 19.7], lenMin: 16.8, lenMax: 17.1, circMin: 19.4, circMax: 19.7 },
  { size: "L", gender: "F", lenCm: [17.1, 18.1], circCm: [19.7, 20.3], lenMin: 17.1, lenMax: 18.1, circMin: 19.7, circMax: 20.3 },
  { size: "XL", gender: "F", lenCm: [18.1, 18.7], circCm: [20.3, 21.0], lenMin: 18.1, lenMax: 18.7, circMin: 20.3, circMax: 21.0 },
];

export const GLOVE_NOTE =
  "Un modèle « Cadet » est recommandé lorsque le tour de main correspond à une taille alors que la longueur des doigts correspond à la taille en dessous (paume large, doigts courts).";

/* ------------------------------------------------------------------ *
 * 4. Flex
 * ------------------------------------------------------------------ */

export const FLEX_IRON_SRC: Src = {
  label: "Callaway — Iron Fitting Protocols (PDF officiel)",
  url: "https://callawaymedia.com/wp-content/uploads/2025/02/CG24_SLS017_IronFittingProtocols_FlipBook_4x6_Ref-Only.pdf",
};

/** Vitesse de tête fer 7 (mph) -> flex, selon le protocole Callaway. */
export const FLEX_BY_IRON7_SPEED = [
  { flex: "Ladies (L)", min: 0, max: 60 },
  { flex: "Light (A)", min: 60, max: 70 },
  { flex: "Regular (R)", min: 70, max: 80 },
  { flex: "Stiff (S)", min: 80, max: 90 },
  { flex: "X-Stiff (X)", min: 90, max: 200 },
];

/** Fenêtres launch / backspin fer 7 selon la vitesse de tête (Callaway). */
export const IRON7_WINDOW_BY_SPEED = [
  { speed: 60, launch: [20, 23], spin: [4400, 5500] },
  { speed: 65, launch: [19, 22], spin: [4700, 5700] },
  { speed: 70, launch: [17, 20], spin: [4900, 5900] },
  { speed: 75, launch: [17, 19], spin: [5200, 6100] },
  { speed: 80, launch: [18, 20], spin: [5400, 6400] },
  { speed: 85, launch: null, spin: [5600, 6600] },
  { speed: 90, launch: null, spin: [5900, 6800] },
  { speed: 95, launch: null, spin: [6100, 7000] },
];

export const SHAFT_WEIGHT_SRC: Src = FLEX_IRON_SRC;

export const SHAFT_WEIGHT_RANGES = {
  graphite_iron: [40, 100],
  graphite_driver: [40, 115],
  steel_iron: [80, 130],
  src: FLEX_IRON_SRC,
};

/* ------------------------------------------------------------------ *
 * 5. Fenêtres Trackman
 * ------------------------------------------------------------------ */

export const TOUR_SRC: Src = {
  label: "PGA Tour averages (Trackman) — tableau de référence",
  url: "https://teeituprva.com/wp-content/uploads/2019/03/PGA-AVERAGES-INTERACTIVE.pdf",
};

export interface TourRow {
  club: ClubKey; clubSpeed: number; attack: number; ballSpeed: number;
  smash: number; launch: number; spin: number; height: number;
  landing: number; carry: number;
}

export const PGA_TOUR: TourRow[] = [
  { club: "DR", clubSpeed: 113, attack: -1.3, ballSpeed: 167, smash: 1.48, launch: 10.9, spin: 2686, height: 32, landing: 38, carry: 275 },
  { club: "3W", clubSpeed: 107, attack: -2.9, ballSpeed: 158, smash: 1.48, launch: 9.2, spin: 3655, height: 30, landing: 43, carry: 243 },
  { club: "5W", clubSpeed: 103, attack: -3.3, ballSpeed: 152, smash: 1.47, launch: 9.4, spin: 4350, height: 31, landing: 47, carry: 230 },
  { club: "H3", clubSpeed: 100, attack: -3.5, ballSpeed: 146, smash: 1.46, launch: 10.2, spin: 4437, height: 29, landing: 47, carry: 225 },
  { club: "3i", clubSpeed: 98, attack: -3.1, ballSpeed: 142, smash: 1.45, launch: 10.4, spin: 4630, height: 27, landing: 46, carry: 212 },
  { club: "4i", clubSpeed: 96, attack: -3.4, ballSpeed: 137, smash: 1.43, launch: 11.0, spin: 4836, height: 28, landing: 48, carry: 203 },
  { club: "5i", clubSpeed: 94, attack: -3.7, ballSpeed: 132, smash: 1.41, launch: 12.1, spin: 5361, height: 31, landing: 49, carry: 194 },
  { club: "6i", clubSpeed: 92, attack: -4.1, ballSpeed: 127, smash: 1.38, launch: 14.1, spin: 6231, height: 30, landing: 50, carry: 183 },
  { club: "7i", clubSpeed: 90, attack: -4.3, ballSpeed: 120, smash: 1.33, launch: 16.3, spin: 7097, height: 32, landing: 50, carry: 172 },
  { club: "8i", clubSpeed: 87, attack: -4.5, ballSpeed: 115, smash: 1.32, launch: 18.1, spin: 7998, height: 28, landing: 50, carry: 160 },
  { club: "9i", clubSpeed: 85, attack: -4.7, ballSpeed: 109, smash: 1.28, launch: 20.4, spin: 8647, height: 27, landing: 51, carry: 148 },
  { club: "PW", clubSpeed: 83, attack: -5.0, ballSpeed: 102, smash: 1.23, launch: 24.2, spin: 9304, height: 27, landing: 52, carry: 136 },
];

export const LPGA_SRC: Src = {
  label: "GolfMagic — Moyennes LPGA Tour par club",
  url: "https://www.golfmagic.com/news/page-4-iron-averages-tour",
};

export const LPGA_TOUR = [
  { club: "DR" as ClubKey, clubSpeed: 94, attack: 3.0, launch: 13.2, ballSpeed: 145, spin: null, carry: null },
  { club: "4i" as ClubKey, clubSpeed: null, attack: null, launch: 14.3, ballSpeed: 116, spin: 4801, carry: null },
  { club: "5i" as ClubKey, clubSpeed: null, attack: null, launch: 14.8, ballSpeed: null, spin: 5081, carry: null },
  { club: "6i" as ClubKey, clubSpeed: null, attack: null, launch: 17.1, ballSpeed: 109, spin: 5943, carry: null },
  { club: "7i" as ClubKey, clubSpeed: null, attack: null, launch: 19.0, ballSpeed: null, spin: 6699, carry: null },
  { club: "8i" as ClubKey, clubSpeed: null, attack: null, launch: 20.8, ballSpeed: 100, spin: 7494, carry: null },
  { club: "9i" as ClubKey, clubSpeed: null, attack: null, launch: 23.9, ballSpeed: 93, spin: 7589, carry: null },
];

export const WINDOW_SRC: Src = {
  label: "Up Your Club — Optimal launch monitor numbers for every club",
  url: "https://www.upyourclub.com/optimal-launch-monitor-numbers-for-every-club-driver-through-wedges/",
};

export interface Window { launch: [number, number] | null; spin: [number, number] | null; smash: [number, number] | null; attack: [number, number] | null; landing: [number, number] | null; height: [number, number] | null }

/** Fenêtres génériques par club (joueur amateur bon niveau). */
export const CLUB_WINDOWS: Partial<Record<ClubKey, Window>> = {
  DR: { launch: [10, 14], spin: [2000, 2600], smash: [1.44, 1.50], attack: [2, 5], landing: [35, 42], height: [25, 35] },
  "3W": { launch: [12, 15], spin: [2800, 3500], smash: [1.44, 1.49], attack: [-3, 0], landing: [40, 48], height: [28, 38] },
  "5W": { launch: [14, 16], spin: [3000, 3800], smash: [1.42, 1.48], attack: [-4, -1], landing: [42, 50], height: [30, 40] },
  "7W": { launch: [15, 18], spin: [3200, 4000], smash: [1.40, 1.46], attack: [-4, -1], landing: [43, 51], height: [30, 40] },
  H3: { launch: [16, 19], spin: [3000, 4000], smash: [1.40, 1.45], attack: [-4, -1], landing: [45, 52], height: [30, 42] },
  H4: { launch: [16, 20], spin: [3200, 4300], smash: [1.39, 1.45], attack: [-4, -2], landing: [45, 52], height: [30, 42] },
  H5: { launch: [17, 21], spin: [3500, 4600], smash: [1.38, 1.44], attack: [-4, -2], landing: [45, 52], height: [30, 42] },
  "3i": { launch: [11, 15], spin: [4000, 5200], smash: [1.38, 1.45], attack: [-5, -2], landing: [42, 50], height: [24, 34] },
  "4i": { launch: [12, 16], spin: [4300, 5600], smash: [1.38, 1.43], attack: [-5, -2], landing: [42, 50], height: [24, 34] },
  "5i": { launch: [13, 17], spin: [4700, 6000], smash: [1.38, 1.42], attack: [-5, -2], landing: [44, 50], height: [24, 34] },
  "6i": { launch: [14, 19], spin: [5200, 6800], smash: [1.36, 1.41], attack: [-5, -3], landing: [45, 51], height: [25, 35] },
  "7i": { launch: [16, 21], spin: [6000, 7500], smash: [1.35, 1.40], attack: [-5, -3], landing: [45, 52], height: [25, 35] },
  "8i": { launch: [18, 23], spin: [6800, 8300], smash: [1.33, 1.39], attack: [-6, -3], landing: [46, 52], height: [25, 35] },
  "9i": { launch: [19, 24], spin: [7500, 9000], smash: [1.32, 1.38], attack: [-6, -3], landing: [47, 53], height: [25, 35] },
  PW: { launch: [25, 30], spin: [7000, 9000], smash: [1.28, 1.36], attack: [-6, -3], landing: [50, 55], height: [28, 35] },
  GW: { launch: [28, 35], spin: [8500, 10500], smash: [1.24, 1.32], attack: [-6, -3], landing: [50, 58], height: [30, 38] },
  SW: { launch: [28, 35], spin: [8500, 11000], smash: [1.22, 1.30], attack: [-6, -3], landing: [50, 58], height: [30, 38] },
  LW: { launch: [30, 38], spin: [9000, 11500], smash: [1.18, 1.28], attack: [-6, -3], landing: [52, 60], height: [30, 38] },
};

/* ------------------------------------------------------------------ *
 * 6. Lie dynamique — lie board
 * ------------------------------------------------------------------ */

export const LIE_MARKS = [
  { key: "toe", label: "Marque nette côté toe", correction: 2, deg: 2, hint: "Semelle relevée au talon : le club est trop flat pour le joueur." },
  { key: "toe_slight", label: "Marque légère côté toe", correction: 1, deg: 1, hint: "Tendance flat modérée." },
  { key: "center", label: "Marque centrée", correction: 0, deg: 0, hint: "Lie dynamique correct : semelle à plat à l'impact." },
  { key: "heel_slight", label: "Marque légère côté talon", correction: -1, deg: -1, hint: "Tendance upright modérée." },
  { key: "heel", label: "Marque nette côté talon", correction: -2, deg: -2, hint: "Semelle relevée au toe : le club est trop upright pour le joueur." },
] as const;

export const LIE_LOGIC_NOTE =
  "Le lie dynamique se lit sur une lie board : la trace laissée sur la semelle indique le point de contact réel. Une trace décalée vers le toe signifie que le talon est relevé à l'impact — il faut rendre le club plus UPRIGHT. Une trace décalée vers le talon signifie l'inverse — il faut rendre le club plus FLAT. Un club trop upright envoie la face vers la gauche (droitier), un club trop flat vers la droite.";

/* ------------------------------------------------------------------ *
 * 7. Envergure (arm span)
 * ------------------------------------------------------------------ */

export const ARM_SPAN_NOTE =
  "L'envergure se mesure bras écartés à l'horizontale, du bout d'un majeur au bout de l'autre, dos contre un mur. Le rapport envergure / taille (ape index) complète le wrist-to-floor : un rapport supérieur à 1,03 indique des bras longs par rapport au tronc (clubs plutôt plus courts et/ou plus flat), un rapport inférieur à 0,98 indique des bras courts (clubs plutôt plus longs et/ou plus upright). Cet indice sert de contrôle de cohérence — le wrist-to-floor reste la mesure primaire pour la longueur et le lie.";

export function apeIndexReading(ratio: number) {
  if (ratio >= 1.03) return { label: "Bras longs", hint: "Contrôler la cohérence : longueur plutôt courte, lie plutôt flat.", tone: "warn" as const };
  if (ratio <= 0.98) return { label: "Bras courts", hint: "Contrôler la cohérence : longueur plutôt longue, lie plutôt upright.", tone: "warn" as const };
  return { label: "Proportions neutres", hint: "Le wrist-to-floor est directement exploitable.", tone: "ok" as const };
}

/* ------------------------------------------------------------------ *
 * 8. Gapping
 * ------------------------------------------------------------------ */

export const GAPPING_NOTE =
  "Objectif de gapping : un écart de carry régulier de 10 à 15 m entre fers consécutifs, et un écart de loft de 4° maximum entre wedges. Un écart de carry inférieur à 8 m entre deux clubs signale une redondance (souvent entre le fer long et l'hybride) ; supérieur à 18 m, un trou de distance à combler.";

export const GAP_TARGET_M: [number, number] = [10, 15];

/* ------------------------------------------------------------------ *
 * 12. Lie — quantification de l'erreur et lecture de la lie board
 * ------------------------------------------------------------------ */

/** Déviation latérale approximative par degré de lie incorrect. */
export const LIE_YARDS_PER_DEGREE = 4;
export const LIE_M_PER_DEGREE = 3.66;

export const LIE_DEVIATION_SRC: Src[] = [
  { label: "TGW — Lecture de la charte PING (règle des 4 yards/degré)", url: "https://www.tgw.com/golf-guide/how-to-read-the-ping-color-code-chart/" },
  { label: "Golf Digest — Lie angles, irons and range mats", url: "https://www.golfdigest.com/story/lie-angles-irons-range-mats" },
];

/** Déviation latérale par club : plus de loft = plus d'effet du lie. */
export const LIE_DEVIATION_BY_CLUB = [
  { club: "PW", loft: 46, distanceM: 110, errorDeg: 4, deviationM: 7.9, src: "https://www.golfclubbrokers.com/blog/golf-club-lie-angle-affect-direction/" },
  { club: "Fer 7", loft: 33, distanceM: 137, errorDeg: 2, deviationM: 6.1, src: "https://www.golfdigest.com/story/lie-angles-irons-range-mats" },
  { club: "Fer 3", loft: 20, distanceM: 174, errorDeg: 4, deviationM: 4.6, src: "https://www.golfclubbrokers.com/blog/golf-club-lie-angle-affect-direction/" },
];

/** Conversion trace sur semelle -> erreur de lie. */
export const LIE_BOARD_SCALE = {
  mmPerDegreeMin: 4.8,
  mmPerDegreeMax: 6.35,
  mizunoRule: "Sur une lie board Mizuno, les lignes sont espacées de 1/4 de pouce (6,35 mm) : un décalage d'une ligne = 1° de lie.",
  outdoorBias: "Une lecture de lie board en extérieur affiche typiquement 1° de plus upright que le lie réel : en tenir compte avant de régler.",
  lengthTradeoff: "Règle d'atelier : 1/2 pouce de longueur ~ 1° de lie. Allonger un club le rend fonctionnellement plus upright.",
  swingweight: "Chaque 3° de correction upright coûte environ 1 point de swingweight.",
};

export const LIE_BOARD_SRC: Src[] = [
  { label: "Tutelman — Lie angle, part 2 (rocker de semelle)", url: "https://www.tutelman.com/golf/design/lie2.php" },
  { label: "Dan Bubany Golf — Club fitting variable 2 : lie angle", url: "https://danbubanygolf.com/club-fitting-variable-2-lie-angle/" },
];

/* ------------------------------------------------------------------ *
 * 13. Flex driver par vitesse (table True Spec Golf)
 * ------------------------------------------------------------------ */

export const FLEX_BY_DRIVER_SPEED = [
  { flex: "L (Ladies)", mph: "< 72", kmh: "< 116", carryM: "< 137" },
  { flex: "A (Senior)", mph: "72 – 83", kmh: "116 – 134", carryM: "137 – 165" },
  { flex: "R (Regular)", mph: "84 – 96", kmh: "135 – 154", carryM: "165 – 201" },
  { flex: "S (Stiff)", mph: "97 – 104", kmh: "156 – 167", carryM: "201 – 233" },
  { flex: "X (X-Stiff)", mph: "105 +", kmh: "169 +", carryM: "233 +" },
];

export const FLEX_DRIVER_SRC: Src = {
  label: "True Spec Golf — Driver shaft flex guide",
  url: "https://launchpointgolf.com/articles/driver-shaft-flex-guide/",
};

export const AMATEUR_BENCHMARK = {
  driverSpeedMph: 93.4,
  driverSpeedKmh: 150,
  note: "Vitesse de tête moyenne au driver chez l'amateur masculin ; plus de 40 % des golfeurs se situent entre 91 et 100 mph.",
  src: { label: "TrackMan / Golf.com", url: "https://golf.com/instruction/average-golfer-swing-speed/" } as Src,
};

/** Effet gear — lecture des impacts décentrés. */
export const GEAR_EFFECT_NOTE =
  "Effet gear : un impact bas sur la face augmente le backspin et coûte de la distance, un impact haut le réduit. Un impact au talon incline l'axe de spin à droite, un impact vers le toe à gauche. Un impact centré à 90 mph porte plus loin qu'un impact décentré à 100 mph : traiter le centrage avant le matériel.";

export const GEAR_EFFECT_SRC: Src[] = [
  { label: "Golf.com — How impact location affects spin rate", url: "https://golf.com/instruction/how-impact-location-affects-spin-rate/" },
  { label: "Andrew Rice Golf — Optimal driver numbers on TrackMan", url: "https://www.andrewricegolf.com/andrew-rice-golf/2012/05/optimal-driver-numbers-on-trackman" },
];

/* ------------------------------------------------------------------ *
 * 14. Spécifications constructeurs — modèles de fers de référence
 * ------------------------------------------------------------------ */

export interface ModelSpec {
  brand: string;
  model: string;
  category: string;
  src: Src;
  /** loft / lie / longueur du fer 7 */
  iron7: { loft: number | null; lie: number | null; lengthIn: number | null };
  pw?: { loft: number | null; lie: number | null; lengthIn: number | null };
  notes: string;
}

export const MODEL_SPECS: ModelSpec[] = [
  {
    brand: "PING", model: "i230", category: "Fers joueur, cavité compacte",
    src: { label: "PING — i230 Irons", url: "https://eu.ping.com/en-gb/golf-clubs/irons/i230-iron" },
    iron7: { loft: 33, lie: 61.75, lengthIn: 37 },
    pw: { loft: 45, lie: 64.1, lengthIn: 35.5 },
    notes: "Fer 3 : 19° / 59° / 39\". Lie publié sur la base du code couleur Black à longueur standard.",
  },
  {
    brand: "PING", model: "Blueprint S", category: "Lames forgées",
    src: { label: "PING — Blueprint S", url: "https://eu.ping.com/en-gb/golf-clubs/irons/blueprint-s-iron" },
    iron7: { loft: 33, lie: 61.5, lengthIn: 37 },
    notes: "Série tour, tolérance réduite : le contrôle du lie dynamique y est particulièrement critique.",
  },
  {
    brand: "PING", model: "G440 / i530", category: "Distance et tolérance",
    src: { label: "PING — Irons", url: "https://ping.com/en-us/golf-clubs/irons" },
    iron7: { loft: null, lie: null, lengthIn: null },
    notes: "Lofts plus forts que les séries joueur : recontrôler le gapping des wedges après changement de série.",
  },
  {
    brand: "Callaway", model: "Apex Ai200", category: "Fers joueur-distance",
    src: { label: "Callaway — Iron Fitting Protocols (PDF)", url: "https://callawaymedia.com/wp-content/uploads/2025/02/CG24_SLS017_IronFittingProtocols_FlipBook_4x6_Ref-Only.pdf" },
    iron7: { loft: 27.5, lie: 62.5, lengthIn: null },
    notes: "Loft fer 7 très fort (27,5°) : ne jamais comparer une distance de fer 7 d'une marque à l'autre sans regarder le loft.",
  },
  {
    brand: "Callaway", model: "Apex Ai300", category: "Distance",
    src: { label: "Callaway — Iron Fitting Protocols (PDF)", url: "https://callawaymedia.com/wp-content/uploads/2025/02/CG24_SLS017_IronFittingProtocols_FlipBook_4x6_Ref-Only.pdf" },
    iron7: { loft: 28.5, lie: 62.5, lengthIn: null },
    notes: "Profil tolérant, départ haut.",
  },
  {
    brand: "Callaway", model: "Apex Ti Fusion", category: "Fers joueur",
    src: { label: "Callaway — Iron Fitting Protocols (PDF)", url: "https://callawaymedia.com/wp-content/uploads/2025/02/CG24_SLS017_IronFittingProtocols_FlipBook_4x6_Ref-Only.pdf" },
    iron7: { loft: 31.5, lie: 62.5, lengthIn: null },
    notes: "Loft plus traditionnel : gapping plus facile à étager vers les wedges.",
  },
  {
    brand: "Cobra", model: "DS-Adapt / Darkspeed", category: "Bois ajustables",
    src: { label: "Cobra Golf — Drivers", url: "https://www.cobragolf.com/collections/drivers" },
    iron7: { loft: null, lie: null, lengthIn: null },
    notes: "Système d'ajustement de loft et de lie sur le hosel : à exploiter pour corriger la courbe de balle avant tout changement de tête.",
  },
  {
    brand: "Titleist", model: "T100 / T150 / T250 / T350", category: "Gamme T, du tour au tolérant",
    src: { label: "Titleist — T-Series Irons", url: "https://www.titleist.com/golf-clubs/irons" },
    iron7: { loft: null, lie: null, lengthIn: null },
    notes: "Progression de lofts et de tolérance sur quatre niveaux : permet de mixer les modèles dans une même série (combo set).",
  },
  {
    brand: "Mizuno", model: "JPX / Pro 241-243-245", category: "Forgé",
    src: { label: "Mizuno — Shaft Optimizer", url: "https://mizunogolf.com/us/shaft-optimizer/" },
    iron7: { loft: null, lie: null, lengthIn: null },
    notes: "Le Shaft Optimizer mesure vitesse de tête, tempo, kick angle, toe-down et release factor pour prescrire le shaft : complément utile aux données Trackman.",
  },
  {
    brand: "Srixon", model: "ZX Mk II / ZXi", category: "Forgé joueur",
    src: { label: "Srixon — Irons", url: "https://www.srixon.com/collections/irons" },
    iron7: { loft: null, lie: null, lengthIn: null },
    notes: "Séries combinables (fers longs tolérants + fers courts lames).",
  },
  {
    brand: "PXG", model: "0311 P / XP / ST GEN7", category: "Sur mesure",
    src: { label: "PXG — 0311 GEN7 Irons", url: "https://www.pxg.com/en-us/clubs/irons" },
    iron7: { loft: null, lie: null, lengthIn: null },
    notes: "Offre de personnalisation étendue (lie, longueur, lofts, poids) : bon débouché quand les mesures sortent des plages standard.",
  },
];

export const MODEL_SPECS_NOTE =
  "Les lofts de fer 7 varient de 27,5° à 34° selon les marques et les gammes : une différence de distance entre deux séries s'explique d'abord par le loft, pas par la performance de la tête. Toujours comparer à loft équivalent.";
