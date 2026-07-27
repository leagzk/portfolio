# content/ — la base textuelle du site

Un fichier Markdown par page, contenant tout le texte rédactionnel de cette page.
**Ces fichiers sont générés, pas écrits.** La source de vérité reste le `.astro`.

## Régénérer

```bash
npm run content
```

La commande reconstruit le site puis relance l'extraction, pour que le Markdown
ne puisse pas décrire une version périmée. Le script seul
(`node scripts/export-content.mjs`) suppose un `dist/` déjà à jour et s'arrête
s'il n'en trouve pas.

## À quoi ça sert

Ces fichiers ne sont pas publiés — le dossier vit à la racine, hors de `src/` et
de `public/`, donc Astro les ignore. Ils sont là pour :

- **relire la copy d'une page d'un bloc**, sans la traverser à travers du markup,
  des tableaux de frontmatter et des slots de composants ;
- **voir ce qui a changé dans le texte** entre deux commits. Le diff d'un
  `.astro` mélange copy, classes CSS et structure ; ici le diff ne montre que
  les mots ;
- **donner le texte à quelqu'un** — relecture, traduction, SEO — sans lui
  demander de lire du code.

C'est pour ça qu'ils sont versionnés plutôt qu'ignorés : sans historique, le
deuxième usage disparaît.

## Ce que contient chaque fichier

Un en-tête reprenant le `<title>`, la `description` et si la page est indexable,
puis le contenu du `<main>` : la bannière, l'intro et les chapitres. Les textes
alternatifs des visuels sont regroupés en fin de fichier — sur ce site ils
décrivent des images qui portent l'argument, donc ils comptent comme de la copy.

La navigation et le pied de page sont exclus : identiques sur les sept pages,
ils n'apprendraient rien page par page.

## Limites connues

L'extraction lit le HTML rendu avec des expressions régulières, sans dépendance.
Elle connaît le vocabulaire de balises de ce site (`h1`–`h3`, `p`, `li`, `dt`,
`dd`, `figcaption`, et les `div` qui n'enveloppent rien d'autre). Si une page
introduit une structure nouvelle — un `<table>`, un `<blockquote>` — elle sera
silencieusement absente de l'export. Le compteur de blocs affiché par la
commande est le garde-fou : une page qui maigrit sans raison signale un trou.
