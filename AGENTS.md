# Consignes pour les agents de code

Ce fichier s'applique à Codex, Claude Code et tout autre assistant travaillant sur ce dépôt. Lire `README.md` en premier pour l'architecture.

## Langue

**Tout est en français.** Interface, libellés, messages d'erreur, textes de chargement, contenu des PDF. Les accents doivent être corrects, y compris dans les messages d'erreur techniques. Les commentaires de code sont en français mais **sans accents** (les fichiers `api/` sont lus par des runtimes où l'encodage n'est pas garanti). Les messages de commit sont en français sans accents.

## Domaine métier

C'est un outil de fitting de club de golf utilisé par un professionnel en baie, souvent d'une seule main, sur téléphone. Les exigences non négociables du propriétaire :

- L'**envergure** est une mesure de premier plan, pas un détail.
- Le **lie upright / flat** doit être déduit du test lie board et exprimé en degrés.
- Le **loft dynamique** est central dans l'analyse Trackman.
- La **taille de gant** se calcule depuis longueur de main, tour de main et majeur, avec la variante cadet.
- Marques prioritaires : **Callaway, Ping, Cobra**, puis Titleist, Mizuno, Srixon, PXG, TaylorMade.

Ne jamais inventer une valeur de charte constructeur. Toute donnée de référence ajoutée dans `client/src/data/` doit porter sa source (URL) et cette source doit apparaître dans l'onglet Référence et dans le PDF.

## Distinguer mesure et prescription

Le code sépare partout ce qui est **mesuré**, ce qui est **prescrit** et ce qui est **hypothèse**, avec un niveau de confiance. C'est le cœur de la fiabilité de l'outil : une valeur extraite d'une dictée où le fitter dit « environ » ne doit pas remonter comme une mesure. Voir le champ `flags` dans `api/_lib/schema-transcript.ts`. Préserver cette distinction dans toute évolution.

## Avant de livrer

```bash
npm run check     # tsc --noEmit doit être propre
npm run build     # doit passer
```

Ajouter un `data-testid` sur tout élément interactif et sur tout élément affichant une donnée utile, en `{action}-{cible}` ou `{type}-{contenu}`, suffixé d'un identifiant unique pour les listes.

## Pièges déjà rencontrés — ne pas les rejouer

- Imports relatifs dans `api/` : garder l'extension `.js`.
- Routage : `<Router hook={useHashLocation}>` autour de `<Switch>`, le `hook` ne va pas sur `<Switch>`. Jamais de `href="#ancre"`.
- Navigation interne dans une page : `document.getElementById(id)?.scrollIntoView(...)`.
- `client/src/lib/pdf.ts` : jsPDF en WinAnsi, aucun caractère hors latin-1 (`≈ − → ↔ …` cassent le rendu).
- Sorties structurées LLM : aucun champ optionnel (`.nullable()`), aucun dictionnaire à clés libres, `additionalProperties: false`, toutes les propriétés requises.
- Pas de `localStorage`, `sessionStorage`, `indexedDB` direct hors de `store.ts`, ni de cookies.
- `<SelectItem>` exige une prop `value` non vide.
- TanStack Query v5 : forme objet uniquement, `useQuery({ queryKey: [...] })`.
- Clés de cache hiérarchiques en tableau : `['/api/fittings', id]`, pas de template string.
- Tailwind v3 : directives `@tailwind base/components/utilities`, pas de syntaxe v4 (`@theme`, `@import "tailwindcss"`).
- Titres : `text-xl` au maximum dans l'application.
- Ne pas modifier `vite.config.ts`, `tsconfig.json` ni `vercel.json` sans nécessité réelle.

## Style d'interface

Palette verte : primaire clair `155 52% 26%`, primaire sombre `152 46% 44%`, fond `40 20% 97%`, `theme-color` `#1b3a2c`. Polices Satoshi (Fontshare) et JetBrains Mono. Thème sombre de première classe, maintenu en parallèle du clair. Icônes `lucide-react`.

Les écrans doivent rester remplissables au pouce : cibles tactiles généreuses, une colonne sur mobile, pas de tableau à défilement horizontal sans indication.
