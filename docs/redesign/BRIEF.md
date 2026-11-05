# Portfolio Bauhaus — changelog & brief d'implémentation

> Brief pour Claude Code (repo Astro de leagiezek.design).
> Source de vérité visuelle : l'artefact canevas « Portfolio Bauhaus — exploration » (artboards `Main.dc.html` = landing, `Language.dc.html` = étude de cas Language).
> Statut : **session 1 — 4-5 nov. 2026**. À enrichir avec les derniers changements avant implémentation.

---

## 0. Intention

- Passer d'un thème « Bauhaus coloré sur crème » à une **identité Bauhaus / Mondrian sur fond blanc** : grille de filets noirs, trois primaires, aplats qui portent toujours du contenu.
- Positionnement **VP / Head of Design** : lecture rapide, preuves d'échelle, signature forte.
- Règle d'or : **pas de bloc de couleur sans fonction**. Chaque aplat est un contenu, un lien ou un état d'interaction.
- Le site doit se lire en deux niveaux : **scan** (titres, synthèses, tuiles) et **profondeur** (contenu déplié à la demande).

---

## 0 bis. Cible & positionnement : VP Design & Creative
- L'identité marquée est un **atout** pour ce poste : elle prouve un point de vue créatif tenu à travers tous les supports (site, LinkedIn, og:image, favicon, mobile).
- Équilibrer les deux casquettes dans chaque page :
  - **Creative** : Language (marque, personnages, système visuel) et Surfaces (événementiel, expérience live) le portent. Mettre Surfaces davantage en avant comme preuve que la créativité dépasse l'écran.
  - **VP** : rendre visibles l'échelle (équipes, budget, organisation), la stratégie de marque et l'impact business, surtout dans Governance et Operating System. Les chiffres et les décisions doivent être aussi visibles que les visuels.
- Ajouter dans Language et Surfaces un niveau **« direction créative »** explicite : comment le cap visuel a été fixé, comment les pistes ont été arbitrées, comment les créatifs ont été dirigés, pas seulement ce qui a été produit.
- La signature « Design systems ship standards. Experience systems grow culture. » couvre exactement le périmètre du poste (design produit + culture de marque) : la garder comme fil rouge.
- À vérifier avant mise en ligne : contrastes (gris `#CFCACB` sur noir, petits textes) et navigation clavier des cartes dépliables.

---

## 1. Design tokens

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `--ink` | `#0A0708` | Heros, footer, blocs noirs, carrés noirs |
| `--text` | `#111111` | Texte courant, filets de grille |
| `--red` | `#D0021B` | Primaire (carrés, emphases, CTA Operating System) |
| `--blue` | `#0B57A4` | Primaire (emphases italiques, CTA, liens) |
| `--yellow` | `#F5CD00` | Primaire (signature « That's my leadership bet », survol nav, CTA Download CV) |
| `--white` | `#FFFFFF` | Fond de page (le crème est **supprimé**) |
| `--grey-mondrian` | `#E4E4E1` | Uniquement dans la composition Language — **décision en attente** |
| `--placeholder` | `#F3F3F3` | Emplacements visuels (à remplacer par les vraies images) |
| Texte sur noir | `#E6E2E3` (intro), `#CFCACB` (eyebrow), `#A9A4A5` (copyright) | |

### Typographie
- **Display** : Hanken Grotesk 800/900 dans la maquette → **remplacer par la police display réelle du site**.
- **Texte** : Maven Pro dans la maquette → remplacer par la police texte réelle (piste : une grotesque plus neutre pour monter en premium).
- Échelle validée :
  | Niveau | Taille | Réglages |
  |---|---|---|
  | Eyebrow | 11px | capitales, `letter-spacing: .2em`, 700, **jamais de carré devant** |
  | Titre hero (H1) | 68px (44px mobile) | 900, `line-height: 1`, `letter-spacing: -.03em` |
  | Titres de section (landing, Operating System, citation) | 30px | 900 |
  | Lead (phrase forte des sections Language) | 34px | 900 |
  | Titres des carrés (niveau 3) | 17px | 900 — identique sur les 3 carrés de la landing |
  | Intro hero | 18px | |
  | Texte courant | 15–16px | `line-height: 1.65–1.7` |
  | Légendes | 13px | |
  | Mot en filigrane | pleine largeur (voir §4.3) | 900, `rgba(255,255,255,.07)` |

### Lignes, radius, espacements
- Filets de grille : **2px** (landing), **1.5px** (composition Language).
- Radius : **6px uniquement** sur les deux coins bas du footer « Let's talk ». Pas de radius sur les boutons ni sur les carrés. 4px sur les placeholders visuels. Pastilles « Retained / Not retained » en `999px`.
- Conteneur : `max-width: 1120px`, gouttière 24px.
- Marge intérieure des carrés de couleur : **48px sur les 4 côtés**.
- Alignement texte de la colonne gauche de la grille : 48px.

---

## 2. Composants globaux

### 2.1 Nav (dans le hero noir)
- Grille `48px 1fr` : à gauche emplacement vide (landing) ou **icône maison blanche seule, sans rond** (pages internes) ; à droite les liens **ferrés à droite**.
- Items : **Philosophy · Operations · System · Brand · Event · Connect**.
  - Brand → page Language ; Connect → ancre footer ; les autres pages restent à créer.
- Liens blancs, survol jaune. Page active : soulignement jaune 3px (`aria-current="page"`).
- Chevron éventuel en SVG (pas de caractère `⌄`, mal aligné).

### 2.2 Hero (identique sur toutes les pages)
- Bande **noire pleine largeur**, `min-height: min(80vh, 720px)`.
- Contenu démarre à **112px** sous la nav, aligné à gauche sur le conteneur (pas centré verticalement), padding bas 96px.
- Structure : eyebrow → titre 68px → intro 18px → CTA éventuel.
- **Mot en filigrane** en bas, bord à bord (voir §4.3).
- **72px de blanc** entre le hero et le contenu suivant.

### 2.3 Bouton « petit carré » (tous les CTA)
- Texte + petit carré 14×14px à gauche (padding-left 30px).
- Au survol / focus : le carré s'étend pour remplir tout le bouton (`width/height: 100%`, 0.4s), le texte change de couleur.
- Variantes : jaune (texte noir au survol), bleu (texte blanc), rouge (texte blanc).
- Plus aucun bouton arrondi / pilule.

### 2.4 Footer « Let's talk »
- Identique sur toutes les pages, **collé au contenu** au-dessus (`margin-top: 0`), radius **bas uniquement**.
- Liens jaunes Email / LinkedIn / Download CV, ligne de séparation, copyright « Designed by a human, developed with Claude… Never alone. ».
- **Effet au scroll** conservé sur « Let's talk. » : scale + fondu via `animation-timeline: view()` (fallback statique ; désactivé si `prefers-reduced-motion`). Caler les valeurs sur l'effet actuel du site.

### 2.5 Tuiles qui se retournent (flip)
- Grille de tuiles séparées par des filets noirs (`gap: 1.5px` sur fond `--text`).
- Recto : aplat primaire plein + titre + « + » en haut à droite. Verso : texte sur fond blanc.
- Flip `rotateY(180deg)` au survol **et au focus** (tap mobile), 0.7s.
- Utilisé pour : frise 2018→2023 (Language/Proof) et les 4 pratiques (Language/Approach — **sans eyebrow au verso**).

### 2.6 Carrousel
- Piste `overflow-x: auto` + `scroll-snap`, slide suivante qui dépasse.
- En-tête : eyebrow à gauche, deux boutons flèche carrés (bordure 1.5px, remplis noir au survol) à droite, `scrollBy(±75%)`.
- Utilisé pour : personnages (slides carrées, ~3,4 visibles) et écrans du pilote sanofi.com.

### 2.7 Icône d'action « + »
- Toujours **au même endroit** dans son encadré (aligné sur l'eyebrow ou en haut à droite selon le composant, mais constant dans un même ensemble).
- Pivote en × / devient ↓ quand le contenu est révélé. Indispensable sur mobile (pas de hover).

---

## 3. Landing (`Main.dc.html`)

### 3.1 Hero
- Eyebrow : **« Moving design practice forward »** (remplace « Design & experience systems lead »).
- Titre H1 68px : **« Design systems ship standards. Experience systems grow culture. »** (signature conservée, retours à la ligne de Léa).
- Intro : « Fifteen years across brand, retail, agency and product… not just the system. **That's my leadership bet.** » (en gras).
- CTA : **Download CV ↓** (carré jaune). Philosophy est descendu plus bas dans la page.
- Photo : cercle **360px**, **sans rond rouge autour**, alignée en haut sur l'eyebrow, 112px d'écart avec le texte. ⚠️ Photo actuelle extraite d'une capture (basse def, coin retouché) → **utiliser l'originale**.
- Filigrane : **« Léa Giezek »**, le L et le K touchent les bords de l'écran.
- Loader (à coder côté site, pas dans la maquette) : la photo apparaît seule au centre (remplace le piment), puis glisse et se pose dans le cercle du hero.

### 3.2 Composition Mondrian (sous le hero)
Grille 12 colonnes, filets 2px, bords extérieurs **ouverts** (pas de cadre), animation de construction (voir §4.1).

Rangées :
1. **Études de cas horizontales** (sans header « Selected work ») — Governance (6 col) · Language (3 col) · Surfaces (3 col).
   - Eyebrows homogènes **sans dates** : « Systematize a practice / a brand / a moment ».
   - Une même horizontale traverse les trois cases à 56px du haut.
   - Fragments : bande bleue en haut (Governance), bande jaune fine en bas (Language), rectangle rouge en haut à droite (Surfaces).
   - Survol : le fragment remplit la case, texte blanc (sauf jaune).
   - Textes alignés en haut ; **flèche → sur la ligne de l'eyebrow, à droite** (pas de « Read more »).
2. **Duo de principes** (7 col) + **Operating System** (5 col, sur 2 rangées).
   - Carré **rouge** « I lead the way I learned: hands dirty first. » + carré **jaune** « Direction earned, not assigned. » ; le jaune est aligné sur la verticale Governance/Language.
   - Au survol du rouge : il s'étend vers la droite, le jaune devient un bandeau vertical (et inversement) ; **la ligne noire de séparation reste toujours visible**.
   - Descriptions différenciées : rouge = comment je dirige les gens ; jaune = comment je prends les décisions (« …not the org chart » — à valider).
3. **Carré noir** « Enough engineering to earn the room. » (sous le rouge, même verticale ; description au survol uniquement) + **citation** (4 col) : « Cultivating practice, not just systems, through Design Leadership and Community Building. » en 30px, suivie du CTA **Philosophy** (carré bleu).
   - Pas de ligne entre le jaune et la citation (grand carré blanc).
   - Espace sous le noir = une colonne de grille (symétrie avec la bande blanche à droite du jaune).
- **Operating System** : eyebrow « Operating system », titre **« The best rules are the ones you don't have to police. »** (remplace « The best governance… » pour éviter le doublon avec Governance), texte, CTA Operating System (carré **rouge**), **bande bleue** en bas alignée sur le CTA Philosophy. Marges 48px partout.
- Les 3 carrés : **mêmes paddings (48px), même typo (17px titre / 14px description)**, icône + à 16px du coin.
4. Bande de lignes basse (rail) — une seule verticale conservée ; vérifier si elle reste utile.
- Footer collé à la composition.

---

## 4. Animations & techniques

### 4.1 Construction de la grille à l'ouverture
1. Les filets se **tracent** (verticales de haut en bas, horizontales de gauche à droite), en diagonale depuis le coin haut gauche, et se rejoignent en T.
2. Les aplats de couleur poussent depuis leur coin d'ancrage (`scale` 0→1, délais échelonnés).
3. Les textes apparaissent en fondu + légère montée vers 1s (heros ~0.25s).
- Implémentation maquette : mesure des cellules au montage → segments absolus animés, puis passage au vrai fond noir de la grille (~1.7s). Fallback : grille affichée directement.
- Respecter `prefers-reduced-motion`.

### 4.2 Filigrane de hero
- SVG `<text>` mesuré via `getBBox()` après `document.fonts.ready`, `viewBox` ajusté → **mise à l'échelle uniforme pleine largeur**, sans étirer l'espacement des lettres, jambages (g) entièrement visibles.

### 4.3 Bugs de rendu à éviter
- Filet parasite sur les bords de la grille (fond noir qui transparaît par arrondi) → rogner la composition (`clip-path: inset(0 1px 1px 1px)`) ou dessiner les lignes autrement.
- Ligne sous un bloc fusionné (ex. citation) → chevauchement de quelques px.

---

## 5. Étude de cas Language (`Language.dc.html`)

### 5.1 Hero
- Eyebrow « Systematize a brand · Sanofi · 2018 - 2022 » (sans carré), titre 68px **« At 2,500 people, a brand isn't a charter, it's a shared language. »**, intro 18px, filigrane **« Language »** pleine largeur. Pas d'illustration à droite (le rond + formes a été rejeté).

### 5.2 Chiffres clés (proof points)
- 4 colonnes séparées par des **filets verticaux** qui ne touchent pas le hero et descendent jusqu'à la composition : 2,500 · 200+ · 6,000 · 1 (+ intitulé + ligne de contexte).

### 5.3 Composition des 3 cartes (d'après la maquette de Léa)
- Grille 7 colonnes `20fr 9fr 20fr 24fr 25fr 4fr 16fr` × 5 rangées `170 75 30 245 60px`, filets 1.5px, cadre.
- Haut : bloc gris / blanc / bleu, puis blanc / **noir** / rouge · carte **02 Approach** · colonne fine blanc/bleu · gris.
- Bas : carte **01 Problem** · aplat jaune + case blanche · bande fine avec petit carré **noir** · carte **03 Proof**.
- Les 3 cartes : même construction — eyebrow + « + » aligné à droite, titre, **synthèse de 2-3 lignes** (lecture scan), contenu aligné en haut.
- Au clic : la carte se remplit de sa couleur (rouge / bleu / jaune) depuis son coin, le contenu se déplie dessous ; re-clic = refermer.
- **Aucune carte ouverte au chargement.**
- Mobile : blocs décoratifs masqués, ordre 01 → 02 → 03.
- Filet vertical à gauche du contenu déplié, qui descend jusqu'au footer sans le toucher.

### 5.4 Contenu déplié (texte de Léa, réintégré en entier puis simplifié)
Grammaire commune : eyebrow → phrase forte (lead) à gauche → texte/puces à droite → visuels.

- **01 Problem** : brief complet + « Understand first, systematize second ».
- **02 Approach** :
  - The solution (positionnement, territoire, personnalité, ton).
  - « The Sanofi brand was the constraint. The IT world was the playground. » → 8 couleurs de capacités (hex), **carrousel des 8 personnages**, visual strategy pairing.
  - Système & production line (« A template per intent », « PowerPoint included, yes sir »).
  - The adoption — « Nobody asks for an umbrella… » ; **visuels ITS R&D (report + newsletter) sous le lead**.
  - **Lead fusionné** : « Selling it was the start. Making it a language people use - not a charter they obey - was the job. » + **5 puces**.
  - The operations — **4 pratiques en tuiles flip** (rouge/bleu/jaune/noir, verso sans eyebrow).
  - Mesure trimestrielle, mentorat, 35+ contributeurs Elements ; « The what / the how / the why ».
- **03 Proof** :
  - The results — « A brand only counts… », citation, **frise 2018→2023 en tuiles flip** (rouge/bleu/jaune/noir) avec textes au verso (à valider).
  - The version change — **2 colonnes** : lead + intro + 7 puces à gauche, concepts Evolution (Retained) / Reinterpreted (Not retained) **empilés à droite**.
  - The turning point (bloc noir) — ajouts manuels de Léa à intégrer proprement (bloc à 976px + rectangle rouge en position absolue ⚠️ fragile).
  - Discovery (eyebrow daté « 2022 - The brand became the system ») — lead + paragraphe à gauche, **mosaïque** des 5 extraits à droite ; contraintes corporate en dessous.
  - « Converging to one standard to harmonize the experience of every digital touchpoints. » + 3 concepts (Clinical Revival, Pharma-zine, Connecting the Dot).
  - **Carrousel « The pilot · sanofi.com »** (4 écrans + origine des tokens Elements).
  - Bloc de fin : « A pilot isn't a proof… » → paragraphe Elements → CTA **Discover what came next →** (aligné à gauche sous le paragraphe).
- Boutons de fin de partie : **Next: the approach / Next: the proof / Discover what came next**, même style (carré bleu), même position.

---

## 6. Copy — décisions
| Avant | Après |
|---|---|
| Design & experience systems lead (eyebrow) | Moving design practice forward |
| Design systems ship standards, Experience systems grow culture. + I build/lead… | Titre : Design systems ship standards. Experience systems grow culture. · Intro : … **That's my leadership bet.** |
| The best governance is the kind you don't have to police. | The best rules are the ones you don't have to police. |
| Selling it was the start. Staying in the room was the job. / Not a charter people obey. A language people use. | Selling it was the start. Making it a language people use - not a charter they obey - was the job. |
| …it's a language. | …it's a shared language. |
| Read more → | → (flèche seule sur la ligne d'eyebrow) |
| Dates dans les eyebrows des cas | Supprimées |

---

## 7. À faire / ouvert
- [ ] Remplacer tous les placeholders par les vraies images (dont photo originale).
- [ ] Polices finales (display + texte).
- [ ] Trancher le gris Mondrian (`#E4E4E1`) vs blanc.
- [ ] Valider les textes rédigés par Claude : verso des tuiles 2018→2023, synthèses des 3 cartes, « not the org chart ».
- [ ] Intégrer proprement le rectangle rouge du « turning point » (pas d'absolu).
- [ ] Relecture/simplification restante de Language (adoption, operations, what/how/why) au format puces.
- [ ] Vérifier le rail de lignes bas de la landing.
- [ ] Loader photo → cercle (code).
- [ ] Recette mobile complète (tap = révélation, ordre, carrousels).
- [ ] Appliquer le système à Governance (System) et Surfaces (Event), créer Philosophy / Operations.
- [x] Bannière LinkedIn, miniature Featured / og:image, favicon (voir §8–10).
- [ ] Exporter bannière + miniature en PNG avec la police finale ; générer les tailles du favicon.
- [ ] **Aligner les chiffres et formulations du portfolio sur le CV final** (retravaillé dans un autre fil du projet, version du 4 nov.) : 45+ produits et plateformes, 2,000+ practitioners, budget jusqu'à 1 M€, équipe de 9, time-to-launch ÷3, 810+ jours de dev économisés, 35+ contributeurs en 18 mois, 4.7/5, finaliste Design System Awards 2025 (Governance). Signature identique sur les deux supports.
- [ ] Décliner le kit visuel sur le CV.

---

## 8. Bannière LinkedIn (version C retenue)
- Format 1584 × 396 px, fond `#0A0708`. Tiers gauche vide (photo de profil LinkedIn).
- Filets `rgba(255,255,255,.18)` 2px : verticale à x 520, horizontale à y 64 (de 520 au bord droit), verticale à x 1328.
- Bloc Mondrian à droite : bande bleue (x 1330→bord, y 0→64) ; colonne rouge (x 1330, 136px, y 66→bas) ; filet x 1466 ; case blanche (x 1468→bord, y 66→bas−122) ; bande jaune (x 1468→bord, 120px en bas), séparées par 2px noir.
- Texte en un seul bloc, x 612, centré verticalement sous le filet (top 145) : eyebrow « Moving design practice forward » 16px (Maven Pro 700, .2em, `#CFCACB`) → titre 43px 900 sur 2 lignes « Design systems ship standards. / Experience systems grow culture. » → petit carré jaune + « leagiezek.design » 17px.
- Marges noires ~90px de chaque côté du texte.
- À faire : export PNG avec la police finale.

## 9. Miniature LinkedIn Featured = image d'aperçu du site (`og:image`)
- Artboard `LinkedInFeatured.dc.html`, 1200 × 627 px, même système que la bannière. À exporter en PNG et déclarer comme `og:image` / `twitter:image` (1200×627) sur leagiezek.design, avec `og:title` et `og:description`.
- Filet horizontal y 96 pleine largeur ; bandeau haut volontairement vide (répond à la bande bleue).
- Bloc Mondrian à droite (filet x 898) : bleu (y 0→96), colonne rouge 136px, filet x 1036, case blanche, bande jaune 180px en bas.
- Texte à x 80, top 140 :
  - eyebrow « Moving design practice forward » 16px ;
  - titre 47px 900 sur 3 lignes : « I nurture the design practice / and the people, not just the system. / That's my leadership bet. » ;
  - signature : petit carré jaune + « LÉA GIEZEK » au style eyebrow (16px, capitales, .2em), en blanc.
- Marges : ~80px à gauche, ~105px avant le filet.
- Filigrane « portfolio » (getBBox, 948px de large, x −10, calé en bas), `rgba(255,255,255,.08)`, sous le texte sans le toucher.

## 10. Favicon (L + trois primaires — retenu)
- Artboard `Favicon.dc.html` (pistes A « fragment Mondrian » et C « trois primaires » écartées et supprimées).
- Fond noir `#0A0708`, L géométrique blanc (épaisseur 5 sur grille 32) et trois carrés 5×5 en escalier : jaune au bout de la barre horizontale, bleu au-dessus du jaune, rouge à gauche du bleu (posé sur la barre). Espacement 2. Uniquement des rectangles, sans police.
- `favicon.svg` :
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"><rect width="32" height="32" fill="#0A0708"/><rect x="7" y="6" width="5" height="20" fill="#fff"/><rect x="7" y="21" width="12" height="5" fill="#fff"/><rect x="14" y="14" width="5" height="5" fill="#D0021B"/><rect x="21" y="14" width="5" height="5" fill="#0B57A4"/><rect x="21" y="21" width="5" height="5" fill="#F5CD00"/></svg>
```
- **Variante mode sombre** (onglets sombres) : fond blanc, L noir `#111`, carrés inchangés — intégrée dans `assets/favicon.svg` via `@media (prefers-color-scheme: dark)`.
- À générer : `favicon.svg`, `favicon-32.png`, `favicon.ico` (16/32), `apple-touch-icon.png` 180×180 (ajouter ~15 % de marge noire autour), puis déclarer les `<link rel="icon">` dans le layout Astro.

## 11. Landing mobile (390px) — `MainMobile.dc.html`
- **Nav (64px)** : à gauche zone blanche avec hamburger noir (3 barres à angles droits) ; à droite bloc jaune plein « Download CV » + icône, qui touche le haut de l'écran et le hero ; filet noir 2px sous toute la nav et à gauche du bloc jaune.
- **Hero noir** : titre 36px → intro 16px (« …That's my leadership bet. ») → **signature** : avatar rond 56px + « Léa Giezek » 22px 900 + eyebrow « Moving design practice forward » 10px dessous. Pas de filigrane sur mobile.
- **Grille empilée** (marges 16px, filets 2px) :
  - Governance : bande bleue 56px, divider vertical à droite (56px du bord) ;
  - Language : carré noir 56×56 en haut à gauche, divider vertical à gauche (56px) jusqu'à la bande jaune du bas ;
  - Surfaces : carré rouge 56×56 en haut à droite, divider vertical à droite (56px) ;
  - citation + Philosophy → **carrousel des 3 principes** → Operating System (bande bleue 56px) → footer.
- **Carrousel principes** : cartes rouge / jaune / noire de 290px (on voit la suivante), scroll-snap, hauteur fermée = contenu ; tap = description + « + » → ×. Indicateur : 3 carrés 10px, actif `#0A0708`, inactifs `#E4E4E1`, « Swipe → ».
- **Boutons à carré : état « hover » par défaut sur mobile** (fond plein, texte blanc sur bleu/rouge, noir sur jaune), `:active` = opacité .85.
- Footer : « Let's talk. » 56px, liens empilés de 44px.

## 12. Icône Download (partout)
- Remplace « ↓ » : icône trait arrondie (cohérente avec les autres icônes Email / LinkedIn / +), stroke 2.25, `stroke-linecap/linejoin: round`, `currentColor`.
```svg
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>
```
- Appliquée : CTA hero desktop, footers landing + Language, nav et footer mobile.

---

## Journal
- **2026-11-04 → 05 (session 1)** : exploration blanc/noir, abandon du crème et des cartes arrondies ; landing en toile Mondrian ; hero noir pleine largeur ; nav à droite ; étude Language en 3 cartes dépliables ; réintégration de tout le contenu ; tuiles flip, carrousels, mosaïque ; simplification en puces (version change, staying in the room).
- **2026-11-05 (fin de session 1)** : kit LinkedIn & identité —
  - bannière : 3 pistes, C « fragments » retenue (case noire → blanche, bloc Mondrian décalé à droite, titre sur 2 lignes 43px, eyebrow 16px, texte centré entre les filets) ; pistes A et B supprimées ;
  - miniature Featured / og:image : message « I nurture… That's my leadership bet. », signature LÉA GIEZEK, filigrane « portfolio » calé en bas ;
  - favicon : L blanc + escalier rouge / bleu / jaune ; pistes A et C supprimées ;
  - landing mobile : nav blanche + bloc jaune CV, signature avatar, grille empilée avec dividers 56px, carrousel des principes, boutons pleins par défaut ;
  - nouvelle icône Download partout (style trait arrondi) ;
  - cible clarifiée : **VP Design & Creative** (voir §0 bis).
- **Session 2** : _à compléter_
