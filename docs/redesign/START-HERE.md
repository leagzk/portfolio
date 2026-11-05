# Démarrage Claude Code — Portfolio Bauhaus

## 1. Mettre le kit dans le repo
Copier ce dossier à la racine du repo sous `docs/redesign/` :
```
docs/redesign/
├── START-HERE.md          ← ce fichier
├── BRIEF.md               ← le changelog / brief complet (intention, tokens, composants, specs, to-do)
├── design-reference/      ← maquettes validées (.dc.html) + README de lecture
└── assets/favicon.svg     ← favicon final (avec variante mode sombre)
```
À fournir en plus : **la photo de profil originale** (haute définition) → `public/` ou `src/assets/`.

## 2. Prompt de démarrage à coller dans Claude Code

```
Je refonds l'identité visuelle de mon portfolio (ce repo Astro, leagiezek.design) dans un style Bauhaus / Mondrian validé en maquette. Cible : poste de VP Design & Creative.

Lis d'abord, dans cet ordre :
1. docs/redesign/BRIEF.md (intention, tokens, composants, specs page par page, to-do)
2. docs/redesign/design-reference/README.md puis les fichiers .dc.html (valeurs exactes)

Règles :
- Travaille sur une branche `redesign/bauhaus`, un commit par étape, et montre-moi l'aperçu local à la fin de chaque étape avant de passer à la suivante.
- Les maquettes donnent les valeurs ; le brief donne les règles. En cas de conflit, le brief + la maquette la plus récente gagnent ; si c'est ambigu, demande-moi.
- Traduis les styles inline des maquettes en tokens CSS + composants Astro réutilisables. Pas de copier-coller de styles inline.
- Garde les polices, le contenu et les pages existants du repo tant que le brief ne dit pas de les changer. Ne supprime rien sans me demander.
- Respecte prefers-reduced-motion, la navigation clavier (cartes dépliables, carrousels, tuiles flip) et les contrastes AA.

Étape 0 — sans rien modifier : explore le repo et fais-moi un état des lieux (structure, pages, composants, styles, polices, contenu existant) + un plan d'implémentation en étapes, mappé sur le brief. Attends ma validation.
```

## 3. Étapes attendues (pour valider le plan de Claude Code)
1. **Tokens & base** — couleurs, échelle typo, filets, radius, espacements (BRIEF §1), fond blanc, suppression du crème.
2. **Composants globaux** — Nav desktop + nav mobile (blanc + bloc jaune CV), Hero (desktop : filigrane SVG ajusté ; mobile : signature avatar), bouton à petit carré (hover desktop / plein mobile), Footer « Let's talk », tuiles flip, carrousel, icône « + », icônes trait arrondi (download, mail, LinkedIn) (BRIEF §2, §12).
3. **Landing** — composition Mondrian desktop (+ animation de construction de la grille), version mobile empilée avec dividers 56px et carrousel des principes (BRIEF §3, §4, §11).
4. **Étude de cas Language** — composition des 3 cartes dépliables + tout le contenu (BRIEF §5).
5. **Méta & identité** — favicon (svg + ico + 32px + apple-touch 180px), `og:image` 1200×627, titres/descriptions (BRIEF §9, §10).
6. **QA** — mobile réel, clavier, reduced-motion, contrastes (gris `#CFCACB` sur noir), Lighthouse.

Ensuite : Governance et Surfaces sur le même gabarit (seule leur composition de cartes sera maquettée à part), puis Philosophy / Operations.

## 4. Après chaque session de maquette
Les nouveaux changements sont ajoutés au journal de `BRIEF.md` (copie maître dans le projet Claude « Portfolio » : `claude/portfolio-bauhaus-changelog.md`). Remplacer le fichier dans le repo et dire à Claude Code : « Relis BRIEF.md, section Journal, et applique ce qui a changé depuis la session X. »
