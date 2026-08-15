# FitLab Pro

Application de fitting **fers et bois** pour professionnels de golf. PWA installable, utilisable hors ligne dans la baie, avec analyse assistée des dictées de séance et génération de rapport PDF client.

Production : https://fitlab-pro-five.vercel.app

---

## Ce que fait l'application

Un assistant en 7 étapes qui va du joueur au rapport signé :

| Étape | Écran | Contenu |
| --- | --- | --- |
| 1 | Joueur | Identité, main dominante, index, fréquence de jeu, tempo, objectifs |
| 2 | Transcription | Collage de la dictée de séance, extraction assistée des mesures, report dans la fiche |
| 3 | Mesures | Taille, poignet-sol, **envergure**, longueur et tour de main, majeur → taille de gant |
| 4 | Matériel | Série actuelle, shafts, longueurs, grips, marque cible |
| 5 | Lie | Test lie board par club, marque pointe/talon/centre → correction **upright / flat** |
| 6 | Trackman | Saisie manuelle ou import photo (OCR), dont **loft dynamique**, spin loft, angle d'attaque |
| 7 | Diagnostic | Prescription calculée, justifications, export PDF 2 pages |

Le moteur de prescription (`client/src/lib/engine.ts`) croise les mesures statiques, le test de lie et les données Trackman avec les chartes constructeurs de `client/src/data/` — Callaway, Ping, Cobra, Titleist, Mizuno, Srixon, PXG, TaylorMade. Chaque recommandation cite sa source ; les 14 sections de référence sourcées sont dans `client/src/data/reference.ts` et consultables dans l'onglet Référence de l'application.

---

## Architecture

```
api/                    Fonctions serverless Vercel (Node, ESM)
  _lib/llm.ts           Client LLM unifié, sorties structurées par schéma, diagnostic de durée
  _lib/transcript-parse.ts   Extraction des mesures depuis une dictée
  _lib/trackman-ocr.ts  Lecture d'une photo d'écran Trackman
  status.ts             État de la configuration IA
client/
  src/pages/fitting.tsx L'assistant en 7 étapes
  src/lib/engine.ts     Moteur de prescription (~600 lignes)
  src/lib/pdf.ts        Rapport jsPDF A4, 2 pages
  src/lib/store.ts      IndexedDB (idb) — source de vérité locale
  src/lib/sync.ts       Synchronisation Supabase, dernière écriture gagnante
  src/data/             Chartes constructeurs et sections de référence sourcées
```

**Stack** : React 18 + Vite + TypeScript, Tailwind CSS v3 + shadcn/ui, TanStack Query v5, wouter, jsPDF, Supabase (auth + Postgres), Vercel Functions.

**Local d'abord.** Toutes les données vivent dans IndexedDB (base `fitlab-pro`, stores `fittings` / `reports` / `meta`). La synchronisation Supabase est optionnelle et se déclenche toutes les 5 minutes, au retour en ligne et au retour d'onglet. L'application reste entièrement fonctionnelle sans réseau et sans compte ; seules les analyses de dictée et l'OCR nécessitent une connexion.

Les bases locales sont séparées par utilisateur dès qu'une session Supabase est active. Les fiches créées explicitement en mode local peuvent être adoptées par le compte lors de la première connexion, sans être exposées à un autre compte sur le même appareil. La connexion en ligne se fait sans mot de passe : Supabase envoie un code e-mail à 6 chiffres, puis l'application le vérifie avec `verifyOtp`.

**Deux clés API suffisent** pour que tout tourne en autonomie : Supabase (sauvegarde) et OpenAI (analyse à la demande). Aucune autre dépendance de service.

### Points de vigilance dans le code

- Les imports relatifs dans `api/` **doivent garder l'extension `.js`** (ESM + `"type": "module"`).
- Le routage utilise le hash : `<Router hook={useHashLocation}><Switch>…</Switch></Router>`. Pas de `href="#section"`, cela serait intercepté comme un changement de route.
- `client/src/lib/pdf.ts` écrit en WinAnsi : pas de `≈ − → ↔` dans le PDF, uniquement du latin-1.
- Les schémas de sorties structurées n'acceptent pas de champs optionnels ni de dictionnaires à clés libres : utiliser `.nullable()` et des tableaux.
- Variables CSS de couleur au format `H S% L%` sans `hsl()`, thème clair et sombre maintenus en parallèle dans `index.css`.
- Pas de `localStorage` / `sessionStorage` / cookies : bloqués dans l'iframe de prévisualisation. État React ou IndexedDB.

---

## Démarrer

```bash
npm install
cp .env.example .env.local     # renseigner les clés
npm run dev                    # front seul, port 5173
```

`npm run dev` ne lance que Vite. Pour travailler sur les fonctions de `api/`, il faut le runtime Vercel :

```bash
npx vercel dev                 # front + fonctions serverless sur un seul port
```

Autres commandes :

```bash
npm run check                  # tsc --noEmit, à faire passer avant tout commit
npm run build                  # sortie dans dist/public
```

## Variables d'environnement

Voir `.env.example`. Les clés `VITE_*` sont exposées au navigateur (l'anon key Supabase est publique par conception, protégée par RLS) ; `OPENAI_API_KEY` reste strictement côté serveur.

En production, `AI_REQUIRE_AUTH=true` impose un JWT Supabase valide sur les routes OCR et transcription. Les routes refusent aussi les payloads trop volumineux, limitent les appels rapprochés et n'acceptent que les niveaux de raisonnement prévus par l'interface.

`OPENAI_REASONING_EFFORT` pilote le compromis vitesse/profondeur. Mesuré sur une séance complète avec `gpt-5.6-luna`, pour une qualité d'extraction identique :

| Effort | Durée | Jetons de réflexion |
| --- | --- | --- |
| low | ~9 s | ~80 |
| medium (défaut) | ~19 s | ~1 000 |
| high | ~50 s | ~4 100 |

Au-delà de `medium` on approche la limite de 60 s des fonctions Vercel. L'interface expose un sélecteur Rapide / Standard / Approfondie qui surcharge ce défaut requête par requête.

## Base de données

Supabase, projet `whhpqdhiwhsfsigchbxx` (eu-west-1). Tables `public.fitlab_fittings` et `public.fitlab_reports`, RLS active avec politique `owner = auth.uid()`. Pour recevoir le code à 6 chiffres, le modèle **Authentication → Emails → Magic Link** doit contenir `{{ .Token }}` dans son corps. Le lien magique ne doit pas être le seul contenu du modèle.

## Déploiement

```bash
npx vercel deploy --prod
```

La migration `supabase/migrations/202608150001_harden_fitlab_rls.sql` doit être appliquée au projet Supabase avant le déploiement du client corrigé. Elle remplace les anciennes policies générales par des policies explicites réservées au propriétaire authentifié.

L'auteur git du commit doit avoir accès à l'équipe Vercel, sinon le déploiement est bloqué avec `TEAM_ACCESS_REQUIRED`. `vercel.json` fixe `maxDuration: 60` et `memory: 1024` pour `api/*.ts`.
