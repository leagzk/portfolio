/*
  Export du contenu redactionnel de chaque page, en Markdown.

  POURQUOI depuis dist/ et non depuis src/ : le texte des pages n'est pas dans
  les .astro sous une forme lisible. Il est eclate entre du markup, des tableaux
  de frontmatter (`resultats`, `capacites`, `produits`, `preuves`...) et des
  slots de composants. Le seul endroit ou la page existe comme un texte suivi,
  c'est le HTML rendu. Consequence : `npm run build` doit avoir tourne avant.

  POURQUOI un script et non une transcription : l'interet de ces fichiers est
  d'etre a jour. Ecrits a la main ils derivent des la prochaine retouche de
  copy. Ici on relance, on commit, et le `git diff` montre exactement ce qui a
  change dans le texte - ce que le diff d'un .astro ne montre pas lisiblement.

  Ce qui est extrait : le <main>, donc la banniere, l'intro et les chapitres.
  Ce qui ne l'est pas : la nav et le pied de page, identiques sur les 7 pages.
*/
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(racine, 'dist');
const sortie = join(racine, 'content');

/*
  Blocs dont on veut le texte.

  `div` en fait partie, ce qui surprend : c'est un conteneur. Mais la regle des
  feuilles (voir blocs()) le neutralise partout ou il en est un - un div qui
  contient un <p> est jete, seul le <p> sort. Il ne subsiste que les div qui ne
  contiennent aucun autre bloc, et ceux-la portent bien du texte : l'en-tete des
  cards de l'accueil (.case__top) et le bandeau des capacites (.el-axis__top)
  sont des <span> dans un <div>, sans quoi ils disparaissaient de l'export.
*/
const BLOCS = ['h1', 'h2', 'h3', 'p', 'li', 'dt', 'dd', 'figcaption', 'div'];

const entites = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&copy;/g, '©')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

/* Le HTML inline devient du Markdown. L'ordre compte : les liens avant le
   nettoyage des balises restantes, sinon on perd les href. */
function inline(html) {
  return entites(
    html
      /* .sr-only porte des mentions destinees aux lecteurs d'ecran
         (« (opens in a new tab) ») : c'est de l'accessibilite, pas de la copy */
      .replace(/<span class="sr-only"[^>]*>.*?<\/span>/gs, '')
      .replace(/<br\s*\/?>/g, '\n')
      /* deux <span> voisins sont deux informations distinctes - le rang et le
         nom d'une etape, la categorie et le titre d'une card. Colles bord a
         bord au moment du strip, ils donnaient « 01Token architecture ». */
      .replace(/<\/span>\s*<span/g, '</span>\n<span')
      .replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs, (_, href, txt) => `[${txt}](${href})`)
      .replace(/<(b|strong)\b[^>]*>(.*?)<\/\1>/gs, '**$2**')
      .replace(/<(em|i)\b[^>]*>(.*?)<\/\1>/gs, '*$2*')
      .replace(/<code\b[^>]*>(.*?)<\/code>/gs, '`$1`')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

/* Retire ce qui n'est pas du contenu redactionnel avant le decoupage en blocs.
   Les <button> sont les pastilles de carrousel : ils n'ont qu'un aria-label. */
function nettoyer(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .replace(/<button[\s\S]*?<\/button>/g, '');
}

/*
  Renvoie les blocs FEUILLES dans l'ordre du document.

  Une regex ne sait pas gerer l'imbrication, et il y en a : un <dd> peut
  contenir des <p>, un <li> peut contenir un <p>. On collecte donc tous les
  candidats, puis on jette ceux qui en contiennent un autre - il ne reste que
  les feuilles, chacune emise une seule fois, dans l'ordre des positions.
*/
function blocs(html) {
  const trouves = [];
  for (const tag of BLOCS) {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
    let m;
    while ((m = re.exec(html))) {
      trouves.push({ tag, debut: m.index, fin: m.index + m[0].length, inner: m[1] });
    }
  }
  return trouves
    .filter((b) => !trouves.some((a) => a !== b && a.debut > b.debut && a.fin <= b.fin))
    .sort((a, b) => a.debut - b.debut);
}

function versMarkdown(bloc) {
  const txt = inline(bloc.inner);
  if (!txt) return '';
  switch (bloc.tag) {
    case 'h1':
      return `# ${txt}`;
    case 'h2':
      return `## ${txt}`;
    case 'h3':
      return `### ${txt}`;
    case 'li':
      return `- ${txt.replace(/\n/g, ' ')}`;
    /*
      Le terme d'une definition. Ses deux <span> ont donne deux lignes ; on les
      recolle, sinon le gras enjambe un retour et le fichier brut devient
      illisible (« **Rigour \n nothing ships on a hunch.** »).
    */
    case 'dt':
      return `**${txt.replace(/\n/g, ' — ')}**`;
    /* legende d'image : en citation, pour la distinguer du corps */
    case 'figcaption':
      return `> ${txt.replace(/\n/g, ' ')}`;
    default:
      return txt;
  }
}

/* Les alt sont de la copy sur ce site - ils decrivent des visuels qui portent
   l'argument. On les garde, reperables, sans les confondre avec le corps. */
function visuels(html) {
  return [...html.matchAll(/<img\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((t) => !/aria-hidden/.test(t))
    .map((t) => entites((t.match(/\balt="([^"]*)"/) || [, ''])[1]))
    .filter(Boolean);
}

function exporter(fichier, slug) {
  const html = readFileSync(fichier, 'utf8');
  const titre = entites((html.match(/<title>([\s\S]*?)<\/title>/) || [, slug])[1]);
  const desc = entites((html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1]);
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);

  const main = (html.match(/<main id="main"[^>]*>([\s\S]*)<\/main>/) || [, ''])[1];
  const propre = nettoyer(main);

  const corps = blocs(propre)
    .map(versMarkdown)
    .filter(Boolean)
    .join('\n\n');

  const alts = visuels(propre);

  const entete = [
    '---',
    `page: ${slug === '' ? '/' : `/${slug}`}`,
    `title: ${JSON.stringify(titre)}`,
    `description: ${JSON.stringify(desc)}`,
    `indexable: ${!noindex}`,
    '---',
    '',
    '<!-- Genere par `npm run content` depuis dist/. Ne pas editer a la main :',
    '     la source de verite reste le .astro, ce fichier en est le reflet. -->',
    '',
    '',
  ].join('\n');

  const annexe = alts.length
    ? `\n\n---\n\n## Textes alternatifs des visuels\n\n${alts.map((a) => `- ${a}`).join('\n')}\n`
    : '\n';

  const nom = slug === '' ? 'index' : slug.replace(/\//g, '-');
  writeFileSync(join(sortie, `${nom}.md`), `${entete}${corps}${annexe}`);
  return { nom, blocs: corps.split('\n\n').length, alts: alts.length, noindex };
}

/* --- */

try {
  statSync(dist);
} catch {
  console.error("dist/ est absent : lancer `npm run build` avant l'export.");
  process.exit(1);
}

mkdirSync(sortie, { recursive: true });

const pages = [];
(function parcourir(rep, prefixe = '') {
  for (const e of readdirSync(rep, { withFileTypes: true })) {
    const chemin = join(rep, e.name);
    if (e.isDirectory()) {
      if (e.name === '_astro') continue;
      parcourir(chemin, prefixe ? `${prefixe}/${e.name}` : e.name);
    } else if (e.name === 'index.html') {
      pages.push({ fichier: chemin, slug: prefixe });
    } else if (e.name.endsWith('.html')) {
      pages.push({ fichier: chemin, slug: e.name.replace(/\.html$/, '') });
    }
  }
})(dist);

const resultats = pages
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .map((p) => exporter(p.fichier, p.slug));

console.log(`${resultats.length} page(s) exportee(s) vers content/`);
for (const r of resultats) {
  console.log(`  ${r.nom}.md — ${r.blocs} bloc(s), ${r.alts} alt(s)${r.noindex ? ' [noindex]' : ''}`);
}
