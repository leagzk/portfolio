# design-reference — maquettes validées (canevas Claude Design)

Source de vérité **visuelle**. Le **pourquoi** et les règles sont dans `../BRIEF.md`.

| Fichier | Contenu | Largeur |
|---|---|---|
| `Main.dc.html` | Landing desktop (hero noir, composition Mondrian, footer) | 1440 |
| `MainMobile.dc.html` | Landing mobile | 390 |
| `Language.dc.html` | Étude de cas Language (composition de cartes dépliables + contenu) | 1440 |
| `BannerC.dc.html` | Bannière LinkedIn | 1584×396 |
| `LinkedInFeatured.dc.html` | Miniature LinkedIn Featured = `og:image` | 1200×627 |
| `Favicon.dc.html` | Favicon (voir aussi `../assets/favicon.svg`) | — |

## Comment lire ces fichiers
- Format propre à l'outil de maquette : `<x-dc>` = la page, `<helmet>` = le `<head>` (polices + CSS), `{{…}}` = valeurs dynamiques, le `<script type="text/x-dc">` (classe `DCLogic`) = l'état et les interactions (ouverture des cartes, carrousels, construction animée de la grille, ajustement du mot en filigrane).
- **Les styles sont inline par commodité de maquette** : ce sont des **valeurs de référence** (couleurs, tailles, espacements, positions), pas une architecture. À traduire en tokens + composants Astro + CSS scoped.
- `/_blob/…` = la photo de profil hébergée dans l'outil : **à remplacer par la photo originale** fournie par Léa.
- Polices Hanken Grotesk / Maven Pro = **provisoires** : utiliser celles du repo.
- On peut ouvrir ces fichiers dans un navigateur pour voir le markup, mais ils ne s'affichent pas à l'identique hors de l'outil (support.js absent).
