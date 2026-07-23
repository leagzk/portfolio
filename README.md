# Portfolio Léa Giezek — Astro

Site statique, deploye sur Vercel.

## Lancer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genere dist/
```

## Deploiement Vercel

Aucune configuration necessaire : Vercel detecte Astro et utilise
`npm run build` avec `dist/` comme dossier de sortie.

## Structure

```
src/layouts/Base.astro   couche systeme partagee : tokens, 3 themes,
                         barre collee, socle des controles, nav + menu
                         deroulant, menu mobile, footer, scripts
src/pages/*.astro        une page = son contenu, rien d'autre
public/                  assets servis a la racine du site
```

### Ajouter une page

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Titre - Léa Giezek" current="cle-de-nav">
  ... contenu ...
</Base>
```

- `current` : `philosophy` · `operating-system` · `system-practice-elements` ·
  `system-brand` · `system-event`. Pilote `aria-current`, le filet d'accent
  et l'etat estompe des autres entrees quand le menu s'ouvre.
- `loader` : ecran de chargement, reserve a la page d'accueil.

Les liens de navigation sont declares une seule fois, en tete de `Base.astro`.

## A deposer dans `public/`

- `Lea-Giezek-portrait.webp` (present)
- `Lea-Giezek-CV.pdf` (a ajouter)

## Themes

`spicy` (defaut) · `mondrian` (contraste renforce) · `mono`.
Bascule par le piment en haut a droite, valeur ecrite sur `<html data-theme>`.
