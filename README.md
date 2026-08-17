# Portfolio Léa Giezek — Astro

Site statique, deploye sur Vercel.

## Lancer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genere dist/
```

## Deploiement Vercel

Vercel detecte Astro et utilise `npm run build` avec `dist/` comme dossier de
sortie. `vercel.json` n'ajoute que des en-tetes de reponse (voir ci-dessous) :
rien a configurer dans l'interface.

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

## Securite et reseaux d'entreprise

Le sujet n'est pas theorique : derriere un proxy d'entreprise (Zscaler,
Netskope, Cloudflare Gateway), le site declenchait une alerte. Deux causes, dont
une seule se corrige dans le code.

**Ce que le depot regle.** La politique se lit dans deux fichiers, qui vont
ensemble :

| Fichier | Porte |
| --- | --- |
| `astro.config.mjs` (`security.csp`) | `<meta>` Content-Security-Policy, avec les empreintes des blocs inline recalculees a chaque build |
| `vercel.json` | en-tetes qu'un `<meta>` ne peut pas porter : HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, `nosniff` |

Ne pas deplacer `script-src` / `style-src` vers `vercel.json` : leurs empreintes
changent des qu'on touche au contenu, et une empreinte perimee ne degrade pas le
site, elle le casse. C'est la raison du partage entre les deux fichiers.

Les polices sont servies par notre domaine (`src/styles/fonts.css`,
`public/fonts/`). Elles venaient de Google Fonts, que beaucoup de reseaux
europeens bloquent depuis l'arret de Munich de janvier 2022. Seule exception
restante : le kit Adobe Fonts de `/system-event`, que sa licence interdit
d'heberger soi-meme — il est donc charge sur cette page uniquement, via la prop
`brandFonts` de `Base.astro`. Le jour ou ce specimen disparait, retirer aussi
`use.typekit.net` des directives `font-src` et `style-src`.

Apres toute modification du `<head>`, des `<style>` ou des scripts, verifier la
console : une violation de CSP y apparait en clair.

**Ce qui ne se regle pas ici.** La cause la plus probable de l'alerte reste la
categorisation du domaine. `leagiezek.design` est un domaine personnel, peu
visite, sur un TLD recent : les proxys le classent « uncategorized », et la
politique par defaut de beaucoup d'entreprises avertit ou bloque cette
categorie — independamment du contenu servi. La correction se fait chez chaque
editeur, par leur formulaire public de revue d'URL (Zscaler Site Review,
Netskope, BrightCloud, Palo Alto Test A Site, Fortiguard, Talos), en demandant
une categorie du type « Personal Pages and Blogs » ou « Professional Services ».
Gratuit, quelques jours de traitement, a refaire si le domaine change.

## Themes

`spicy` (defaut) · `mondrian` (contraste renforce) · `mono`.
Bascule par le piment en haut a droite, valeur ecrite sur `<html data-theme>`.
