/*
  ═══ Fabrique des visuels d'identite (BRIEF §9 et §10) ═══

  Un seul script produit les cinq fichiers de public/ qui ne sont pas des
  photos : le favicon et ses trois rasterisations, et l'image d'apercu du site.

    npm run identite

  POURQUOI UN SCRIPT ET NON DES FICHIERS POSES A LA MAIN. Ces visuels reprennent
  les tokens du site - les trois primaires, le noir, les deux polices. Le jour ou
  une couleur bouge, un PNG depose a la main ne bouge pas avec elle et personne
  ne s'en apercoit. Ici les valeurs sont ecrites une fois, en haut, et les cinq
  fichiers se refont d'une commande.

  LE TEXTE EST CONVERTI EN TRACES, et ce n'est pas un raffinement. Les deux
  polices du site sont VARIABLES (axe wght 100-900 pour Hanken Grotesk, 400-900
  pour Maven Pro) et resvg ne sait pas instancier un axe : il rendrait tout en
  400, donc une carte d'apercu en graisse normale la ou la maquette demande du
  900. fontkit, lui, sait poser l'axe (`getVariation`) et sortir le trace de
  chaque glyphe - avec le crenage de la police, puisque c'est elle qui compose.
  Le PNG ne depend donc d'aucune police installee sur la machine.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import wawoff from 'wawoff2';
import * as fontkit from 'fontkit';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (f) => path.join(racine, 'public', f);

/* ─── Les valeurs, au meme endroit ─── */
const NOIR = '#0A0708';
const ROUGE = '#D0021B';
const BLEU = '#0B57A4';
const JAUNE = '#F5CD00';
const BLANC = '#FFFFFF';
const EYEBROW = '#CFCACB';
const FILET = 'rgba(255,255,255,.18)';

/* ─── Les polices, en traces ─── */
const charger = async (nom) => {
  const woff2 = fs.readFileSync(path.join(racine, 'public', 'fonts', `${nom}.woff2`));
  return fontkit.create(Buffer.from(await wawoff.decompress(woff2)));
};

/*
  Un bloc de texte en <g> de traces. Retourne aussi sa largeur reelle, mesuree
  sur les avances de la police : c'est ce qui permet de verifier qu'une ligne
  tient dans sa colonne au lieu de l'estimer.
*/
const tracer = (police, { texte, taille, wght, x, y, fill, lettrage = 0 }) => {
  const f = police.getVariation({ wght });
  const run = f.layout(texte);
  const s = taille / f.unitsPerEm;
  let dx = 0;
  const morceaux = [];
  run.glyphs.forEach((g, i) => {
    const d = g.path.toSVG();
    if (d) morceaux.push(`<path transform="translate(${dx.toFixed(2)} 0)" d="${d}"/>`);
    dx += run.positions[i].xAdvance + (lettrage * f.unitsPerEm) / taille;
  });
  const largeur = dx * s;
  /* scale(s,-s) : le trace d'une police monte depuis la ligne de base, l'axe
     SVG descend. Le y passe est donc bien la LIGNE DE BASE, pas le haut. */
  return {
    largeur,
    svg: `<g fill="${fill}" transform="translate(${x} ${y}) scale(${s} ${-s})">${morceaux.join('')}</g>`,
  };
};

/* ═══ 1. Le favicon (BRIEF §10) ═══ */
/*
  Que des rectangles sur une grille de 32, sans police : un L blanc epais de 5 et
  trois carres de 5 en escalier - jaune au bout de la barre horizontale, bleu
  au-dessus, rouge a gauche du bleu. `shape-rendering:crispEdges` parce qu'a
  16px un antialiasing sur des aretes droites les rend sales.
*/
const formesFavicon = (fondSombre) => `
  <rect width="32" height="32" fill="${fondSombre ? NOIR : BLANC}"/>
  <rect x="7" y="6" width="5" height="20" fill="${fondSombre ? BLANC : '#111111'}"/>
  <rect x="7" y="21" width="12" height="5" fill="${fondSombre ? BLANC : '#111111'}"/>
  <rect x="14" y="14" width="5" height="5" fill="${ROUGE}"/>
  <rect x="21" y="14" width="5" height="5" fill="${BLEU}"/>
  <rect x="21" y="21" width="5" height="5" fill="${JAUNE}"/>`;

/*
  LA VARIANTE SOMBRE EST DANS LE MEME FICHIER. Un onglet sombre pose un favicon
  noir sur du noir : le L disparait et il ne reste que trois carres flottants.
  `prefers-color-scheme` est lu par le navigateur DANS le SVG du favicon - c'est
  la seule raison pour laquelle ce fichier porte un <style>.
*/
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" role="img" aria-label="Léa Giezek">
  <style>
    .fond{fill:${NOIR}} .l{fill:${BLANC}}
    @media (prefers-color-scheme: dark){ .fond{fill:${BLANC}} .l{fill:#111111} }
  </style>
  <rect class="fond" width="32" height="32"/>
  <rect class="l" x="7" y="6" width="5" height="20"/>
  <rect class="l" x="7" y="21" width="12" height="5"/>
  <rect x="14" y="14" width="5" height="5" fill="${ROUGE}"/>
  <rect x="21" y="14" width="5" height="5" fill="${BLEU}"/>
  <rect x="21" y="21" width="5" height="5" fill="${JAUNE}"/>
</svg>
`;

const rendre = (svg, largeur) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: largeur }, background: 'rgba(0,0,0,0)' })
    .render()
    .asPng();

/*
  L'ICO est un conteneur, pas un format d'image : en-tete de 6 octets, une
  entree de 16 par taille, puis les images bout a bout. Depuis Vista il accepte
  des PNG tels quels, donc on empile les deux rendus sans les reencoder.
  Une dependance de plus pour six octets d'en-tete n'aurait rien simplifie.
*/
const ico = (images) => {
  const tete = Buffer.alloc(6);
  tete.writeUInt16LE(0, 0); tete.writeUInt16LE(1, 2); tete.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entrees = [];
  for (const { taille, png } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(taille >= 256 ? 0 : taille, 0);
    e.writeUInt8(taille >= 256 ? 0 : taille, 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    entrees.push(e); offset += png.length;
  }
  return Buffer.concat([tete, ...entrees, ...images.map((i) => i.png)]);
};

/* ═══ 2. Les images d'apercu (BRIEF §9) ═══ */
/*
  UNE CARTE PAR PAGE, ET NON UNE POUR TOUT LE SITE. Les six pages
  partageaient og-default : une etude partagee dans une conversation
  annoncait le titre de l'accueil, pas le sien. Le gabarit ne bouge pas - il
  est decrit une seule fois ici - seules changent les trois choses qui
  identifient la page : son surtitre, son titre et son filigrane. Ce sont
  exactement celles que le <Hero> porte, donc la carte et la page ne peuvent
  pas diverger sans qu'on le voie.
*/
const PAGES = [
  { fichier: 'og-default.png', surtitre: 'MOVING DESIGN PRACTICE FORWARD', filigrane: 'portfolio',
    lignes: ['Design systems ship standards.', 'Experience systems grow culture.', "That's my leadership bet."] },
  { fichier: 'og-practice.png', surtitre: 'SYSTEMATIZE A PRACTICE · GOVERNANCE', filigrane: 'Governance',
    lignes: ["At global scale, a system isn't", "managed. It's governed."] },
  { fichier: 'og-brand.png', surtitre: 'SYSTEMATIZE A BRAND · LANGUAGE', filigrane: 'Language',
    lignes: ['A function run like a brand.', 'A brand run like a service.'] },
  { fichier: 'og-event.png', surtitre: 'SYSTEMATIZE A MOMENT · SURFACES', filigrane: 'Surfaces',
    lignes: ['Same systems thinking,', 'just off the org chart.'] },
  { fichier: 'og-philosophy.png', surtitre: 'PHILOSOPHY · WHAT I HOLD', filigrane: 'Philosophy',
    lignes: ['Almost everything is negotiable.', "One thing isn't: community."] },
  { fichier: 'og-operating.png', surtitre: 'OPERATING SYSTEM · PRACTICE PRINCIPLES', filigrane: 'Ownership',
    lignes: ["I don't want a team that executes.", 'I want a team of owners.'] },
];

async function apercu(hanken, maven, page) {
  const L = 1200, H = 627;
  /*
    LE TITRE EST CELUI DU SITE, et c'est un ecart assume a la maquette §9.
    Elle porte « I nurture the design practice... », qui etait le titre du hero
    a l'epoque ; depuis, c'est l'INTRO de la page d'accueil, et le titre est
    « Design systems ship standards. Experience systems grow culture. » - le
    meme que la banniere LinkedIn (§8) et que le CV. Une carte d'apercu qui
    annonce autre chose que la page qu'elle previent se lit comme une erreur.
  */
  const lignes = page.lignes;
  const GAUCHE = 80;
  const FILET_X = 898;
  const DISPO = FILET_X - GAUCHE - 25; // la marge avant le filet, §9

  /* On DESCEND la taille jusqu'a ce que la plus longue ligne tienne, au lieu de
     la fixer a 47 et de laisser le texte toucher le filet. */
  let taille = 47;
  let mesures;
  for (; taille >= 34; taille -= 1) {
    mesures = lignes.map((t) => tracer(hanken, { texte: t, taille, wght: 900, x: 0, y: 0, fill: BLANC, lettrage: -0.03 }));
    if (Math.max(...mesures.map((m) => m.largeur)) <= DISPO) break;
  }
  const interligne = Math.round(taille * 1.0);

  const eb = tracer(maven, { texte: page.surtitre, taille: 16, wght: 700, x: GAUCHE, y: 0, fill: EYEBROW, lettrage: 0.2 });
  const sig = tracer(maven, { texte: 'LÉA GIEZEK', taille: 16, wght: 700, x: GAUCHE + 28, y: 0, fill: BLANC, lettrage: 0.2 });

  /* Le filigrane : 190px, 8% de blanc, cale en bas a gauche et DEBORDANT - il
     passe sous le texte sans le toucher (§9). */
  const fil = tracer(hanken, { texte: page.filigrane, taille: 190, wght: 900, x: -10, y: H - 24, fill: 'rgba(255,255,255,.08)', lettrage: -0.03 });

  /* Mise en page verticale : eyebrow a 140, titre dessous, signature en bas du
     bloc - les valeurs de la maquette, l'interligne suivant la taille retenue. */
  const yEb = 152;
  const yTitre = yEb + 54;
  const ySig = yTitre + interligne * (lignes.length - 1) + 78;

  const corps = lignes
    .map((t, i) => tracer(hanken, { texte: t, taille, wght: 900, x: GAUCHE, y: yTitre + i * interligne, fill: BLANC, lettrage: -0.03 }).svg)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}">
  <rect width="${L}" height="${H}" fill="${NOIR}"/>
  ${fil.svg}
  <rect x="0" y="96" width="${L}" height="2" fill="${FILET}"/>
  <rect x="${FILET_X}" y="0" width="2" height="${H}" fill="${FILET}"/>
  <rect x="900" y="0" width="${L - 900}" height="96" fill="${BLEU}"/>
  <rect x="900" y="98" width="136" height="${H - 98}" fill="${ROUGE}"/>
  <rect x="1036" y="98" width="2" height="${H - 98}" fill="${FILET}"/>
  <rect x="1038" y="98" width="${L - 1038}" height="${H - 98 - 180}" fill="${BLANC}"/>
  <rect x="1038" y="${H - 180}" width="${L - 1038}" height="180" fill="${JAUNE}"/>
  ${tracer(maven, { texte: page.surtitre, taille: 16, wght: 700, x: GAUCHE, y: yEb, fill: EYEBROW, lettrage: 0.2 }).svg}
  ${corps}
  <rect x="${GAUCHE}" y="${ySig - 13}" width="16" height="16" fill="${JAUNE}"/>
  ${tracer(maven, { texte: 'LÉA GIEZEK', taille: 16, wght: 700, x: GAUCHE + 28, y: ySig, fill: BLANC, lettrage: 0.2 }).svg}
</svg>`;

  fs.writeFileSync(pub(page.fichier), rendre(svg, L));
  return { fichier: page.fichier, taille, largeurs: mesures.map((m) => Math.round(m.largeur)), dispo: DISPO, eb: Math.round(eb.largeur), sig: Math.round(sig.largeur), fil: Math.round(fil.largeur) };
}

/* ═══ Execution ═══ */
const hanken = await charger('HankenGrotesk-latin');
const maven = await charger('MavenPro-latin');

fs.writeFileSync(pub('favicon.svg'), faviconSvg);

const svg32 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">${formesFavicon(true)}</svg>`;
const png32 = rendre(svg32, 32);
const png16 = rendre(svg32, 16);
fs.writeFileSync(pub('favicon-32.png'), png32);
fs.writeFileSync(pub('favicon.ico'), ico([{ taille: 16, png: png16 }, { taille: 32, png: png32 }]));

/*
  APPLE-TOUCH : 180x180 AVEC UNE MARGE NOIRE DE 15% (§10). iOS rogne l'icone
  dans un carre arrondi genereux ; sans marge, le L et les carres touchent la
  courbe et deux d'entre eux se font manger par le coin.
*/
const marge = Math.round(180 * 0.15);
const dedans = 180 - marge * 2;
fs.writeFileSync(
  pub('apple-touch-icon.png'),
  await sharp({ create: { width: 180, height: 180, channels: 4, background: NOIR } })
    .composite([{ input: rendre(svg32, dedans), top: marge, left: marge }])
    .png()
    .toBuffer(),
);

const ogs = [];
for (const page of PAGES) ogs.push(await apercu(hanken, maven, page));

const taille = (f) => (fs.statSync(pub(f)).size / 1024).toFixed(1) + ' ko';
console.log(`favicon.svg          ${taille('favicon.svg')}`);
console.log(`favicon-32.png       ${taille('favicon-32.png')}  32x32`);
console.log(`favicon.ico          ${taille('favicon.ico')}  16 + 32`);
console.log(`apple-touch-icon.png ${taille('apple-touch-icon.png')}  180x180, marge ${marge}px`);
for (const og of ogs) {
  console.log(`${og.fichier.padEnd(21)}${taille(og.fichier)}  1200x627`);
  console.log(`  titre a ${og.taille}px - lignes ${og.largeurs.join(' / ')}px pour ${og.dispo} disponibles`);
  console.log(`  eyebrow ${og.eb}px - signature ${og.sig}px - filigrane ${og.fil}px`);
}
