import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

/*
  ═══ Audit d'accessibilite du HTML construit ═══

      npm run build && node scripts/audit.mjs

  Il lit dist/, pas les sources : c'est ce qui est SERVI qui compte, et une
  partie de ces defauts n'apparait qu'apres le rendu des composants.

  CE QU'IL NE SAIT PAS FAIRE, et qu'il ne faut donc pas lui demander : les
  contrastes et les cibles tactiles se mesurent dans un navigateur, avec le CSS
  applique - un parseur HTML ne connait ni la couleur calculee ni la taille
  rendue. Ces deux-la se verifient a la main, dans le panneau.
*/

/*
  UN CADRE AU FORMAT RESERVE DISPENSE DE width/height. La paire d'attributs sert
  a reserver la place avant le chargement ; quand le PARENT porte deja un
  aspect-ratio - nos cadres de figure, nos cadres defilants, les cases de
  mosaique, les pastilles de nuancier - la place est reservee par le CSS et
  l'image ne peut pas faire sauter la mise en page.
*/
const CADRES_RESERVES = /fig__cadre|cadref|mosaic|swc|pilep__fig/;

const dist = 'dist';
const pages = [];
const walkDir = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkDir(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
};
walkDir(dist);

const INTERACTIF = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary']);
const TITRES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const attrs = (n) => Object.fromEntries((n.attrs || []).map((a) => [a.name, a.value]));
const texte = (n) => {
  let t = '';
  const go = (x) => {
    if (x.nodeName === '#text') t += x.value;
    (x.childNodes || []).forEach(go);
  };
  go(n);
  return t.replace(/\s+/g, ' ').trim();
};

let totalProblemes = 0;
for (const f of pages.sort()) {
  const doc = parse(fs.readFileSync(f, 'utf8'));
  const soucis = [];
  const ids = new Map();
  const titres = [];
  let html = null, nH1 = 0;
  const refsAria = [];

  const go = (n, ancetres) => {
    const nom = n.nodeName;
    const a = attrs(n);
    if (nom === 'html') html = a;
    if (a.id) ids.set(a.id, (ids.get(a.id) || 0) + 1);
    if (TITRES.includes(nom)) { titres.push(+nom[1]); if (nom === 'h1') nH1++; }

    if (nom === 'img') {
      if (a.alt === undefined) soucis.push(`<img> sans alt : ${a.src || '?'}`);
      /* Une image sans src est un REPLACEMENT a remplir au clic - les deux de la
         loupe. Elle ne charge rien et ne reserve rien : la juger ici n'aurait
         aucun sens. */
      if (a.src) {
        const cadre = ancetres.some((x) => CADRES_RESERVES.test(x.classe || ''));
        if ((!a.width || !a.height) && !(a.style || '').includes('aspect-ratio') && !cadre)
          soucis.push(`<img> sans dimensions (saut de mise en page) : ${a.src.slice(-46)}`);
        if (!a.loading && !/hero|portrait/.test(a.class || ''))
          soucis.push(`<img> sans loading : ${a.src.slice(-46)}`);
      }
    }

    if (INTERACTIF.has(nom)) {
      const dedans = ancetres.filter((x) => INTERACTIF.has(x.nom));
      if (dedans.length) soucis.push(`<${nom}> imbrique dans <${dedans[dedans.length - 1].nom}>`);
      const nomAcc = a['aria-label'] || a['aria-labelledby'] || texte(n) || a.title;
      if (!nomAcc && nom !== 'input') soucis.push(`<${nom}> sans nom accessible : ${JSON.stringify(a).slice(0, 90)}`);
      if (nom === 'a') {
        if (a.target === '_blank' && !/noopener/.test(a.rel || '')) soucis.push(`lien _blank sans rel=noopener : ${a.href}`);
        if (a.href === undefined) soucis.push(`<a> sans href (non focalisable) : ${texte(n).slice(0, 40)}`);
      }
    }

    for (const ref of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
      if (a[ref]) a[ref].split(/\s+/).forEach((id) => refsAria.push([ref, id, nom]));
    }
    if (nom === 'iframe' && !a.title) soucis.push('<iframe> sans title');

    (n.childNodes || []).forEach((c) => go(c, [...ancetres, { nom, classe: a.class }]));
  };
  go(doc, []);

  if (!html || !html.lang) soucis.push('<html> sans lang');
  if (nH1 !== 1) soucis.push(`${nH1} <h1> (il en faut exactement un)`);
  for (let i = 1; i < titres.length; i++) {
    if (titres[i] - titres[i - 1] > 1) soucis.push(`saut de niveau de titre : h${titres[i - 1]} → h${titres[i]}`);
  }
  for (const [id, n] of ids) if (n > 1) soucis.push(`id en double (${n}x) : #${id}`);
  for (const [ref, id, nom] of refsAria) if (!ids.has(id)) soucis.push(`<${nom} ${ref}="${id}"> pointe sur un id absent`);

  const page = f.replace('dist/', '').replace('/index.html', '') || '/';
  totalProblemes += soucis.length;
  console.log(`\n── ${page}  (${soucis.length} point${soucis.length > 1 ? 's' : ''})`);
  const vus = new Map();
  for (const s of soucis) vus.set(s, (vus.get(s) || 0) + 1);
  for (const [s, n] of vus) console.log(`   ${n > 1 ? `${n}x ` : ''}${s}`);
}
console.log(`\n═══ ${totalProblemes} point(s) sur ${pages.length} pages`);
