import { mouvementReduit } from './motion';

/*
  ═══ L'ECRAN D'ARRIVEE : UNE GRILLE QUI SE CONSTRUIT, PUIS SE DEFAIT ═══

  Il montrait une photo seule au centre d'un panneau noir, un trait qui
  s'ouvrait et trois carres qui poussaient dessus. C'etait deja la grammaire
  du site, mais dite a cote : rien ne reliait ce qu'on voyait la a ce qui
  arrivait ensuite.

  Il dit maintenant la MEME chose que la page : un front traverse l'ecran, les
  filets se tracent sous lui, les aplats prennent derriere - memes classes
  `.seg`, meme masque a pointe fondue, meme alternance de sens que
  src/scripts/grille.ts. Puis la grille SE DEFAIT, et les quatre formes
  qu'elle a en commun avec le hero - les trois primaires et le portrait - ne
  s'effacent pas : elles vont se poser a leur place.

  REFERENCE POSEE PAR LEA, relevee image par image : des formes qui
  apparaissent sur une grille, la grille qui se defait, et ce qui reste qui
  va trouver sa place.

  NOIR A FILETS BLANCS, la ou les compositions sont blanches a filets noirs.
  C'est ce qui permet au hero - noir lui aussi - d'apparaitre derriere sans
  rupture : la grille se defait, le fond ne change pas.

  TROIS SORTIES, VOLONTAIREMENT REDONDANTES : la fin du vol, un filet de
  securite, et le cas ou rien n'est mesurable. Un loader qui ne se retire pas
  rend le site inutilisable - mieux vaut trois chemins qu'un seul elegant.
*/

/*
  LA GRILLE, EN FRACTIONS DE LA FENETRE. Elle n'est pas reguliere : des traits
  qui s'arretent en chemin, des cases de tailles differentes - c'est une
  composition, pas un quadrillage. Les quatre formes tombent chacune au centre
  d'une case.
*/
type Trait = { sens: 'v' | 'h'; p: number; a: number; b: number };
const PAYSAGE: Trait[] = [
  { sens: 'v', p: 0.167, a: 0, b: 0.667 },
  { sens: 'v', p: 0.36, a: 0.267, b: 1 },
  { sens: 'v', p: 0.568, a: 0.267, b: 1 },
  { sens: 'v', p: 0.778, a: 0, b: 0.623 },
  { sens: 'h', p: 0.267, a: 0, b: 1 },
  { sens: 'h', p: 0.623, a: 0.36, b: 1 },
  { sens: 'h', p: 0.667, a: 0, b: 0.568 },
];
/*
  LE PORTRAIT A SA PROPRE GRILLE, et il le faut. Avec les fractions du
  paysage, les cases d'un telephone deviennent tres hautes et tres etroites :
  le carre inscrit prend leur largeur, et on obtenait des miettes - mesure a
  390x844, des aplats de 59, 77 et 73px perdus dans une toile de 844 de haut,
  et une photo de 51px. La composition de l'accueil change elle aussi de forme
  sous 720px ; le loader fait de meme.

  Moins de cases, plus larges : trois colonnes au lieu de quatre, et des
  carres qui pesent. A 390x844 : 140, 109 et 140px de cote, photo de 87.
*/
const PORTRAIT: Trait[] = [
  { sens: 'v', p: 0.36, a: 0, b: 1 },
  { sens: 'v', p: 0.72, a: 0.18, b: 1 },
  { sens: 'h', p: 0.18, a: 0, b: 1 },
  { sens: 'h', p: 0.46, a: 0.36, b: 1 },
  { sens: 'h', p: 0.74, a: 0, b: 1 },
];

/*
  LES ZONES, ET NON DES PLACES. Un aplat de composition ne se pose pas DANS
  une case, il EST la case : il la remplit bord a bord. Les trois primaires du
  loader faisaient 42px chacune, posees au milieu de leur zone - trois
  pastilles sur un quadrillage, pas une composition.

  Elles remplissent desormais leur zone, et les zones sont de tailles
  differentes.

  LES APLATS SONT CARRES, ET LEURS ZONES SONT DESSINEES POUR L'ETRE. Ils
  remplissaient des rectangles, et se repliaient donc sur leur primaire par un
  `scale` NON UNIFORME - un bloc de 432x234 devenant un carre de 42 se
  resserre deux fois plus en largeur qu'en hauteur, et ca se lit comme un
  ecrasement, pas comme un rangement. La photo, elle, se reduit uniformement,
  et c'est ce geste-la qui est juste.

  Les fractions sont donc choisies pour qu'a 16:10 - le rapport d'un ecran
  courant - les trois zones soient a peu pres carrees, et l'aplat y inscrit un
  carre de leur plus petit cote : il reste carre a tous les rapports, et sa
  reduction vers la primaire est uniforme. A 1440x900 : 234, 320 et 300px de
  cote, trois tailles bien distinctes.

  Dans l'ordre du markup : rouge, jaune, bleu, puis la case de la photo.
*/
type Zone = { x0: number; y0: number; x1: number; y1: number };
const ZONES_PAYSAGE: Zone[] = [
  { x0: 0, y0: 0, x1: 0.167, y1: 0.267 },
  { x0: 0.778, y0: 0.267, x1: 1, y1: 0.623 },
  { x0: 0.36, y0: 0.667, x1: 0.568, y1: 1 },
  { x0: 0.36, y0: 0.267, x1: 0.568, y1: 0.623 },
];
const ZONES_PORTRAIT: Zone[] = [
  { x0: 0, y0: 0, x1: 0.36, y1: 0.18 },
  { x0: 0.72, y0: 0.46, x1: 1, y1: 0.74 },
  { x0: 0.36, y0: 0.74, x1: 0.72, y1: 1 },
  { x0: 0.36, y0: 0.18, x1: 0.72, y1: 0.46 },
];
/* La photo n'emplit pas sa case : elle s'y POSE. Un disque bord a bord dans un
   carre ne serait plus une photo dans une grille, mais une bulle. */
const PART_PHOTO = 0.62;

/*
  LE FRONT NE PEUT PAS GARDER LA VITESSE DES COMPOSITIONS. A 480px/s, traverser
  1440px demanderait trois secondes - pour une composition qu'on regarde se
  construire, c'est juste ; pour un ecran qui retient l'entree sur le site,
  c'est une rancon. La vitesse s'adapte donc a la largeur pour que la
  construction tienne en 1,6s, avec un plancher pour qu'un telephone ne la voie
  pas passer en un clin d'oeil.

  LE PLANCHER EST A 520px/s ET NON 900. A 900, traverser les 390px d'un
  telephone prenait 0,43s : la grille etait complete avant qu'on ait eu le
  temps de la lire, et la pause de 0,35s qui suit ne laissait qu'un
  demi-instant pour la voir entiere. A 520 elle met 0,75s a se construire, et
  le bureau n'est pas touche - a 1440px c'est la largeur qui commande
  (1440/1,6 = 900).

  C'est le seul endroit du site ou la vitesse du front n'est pas constante, et
  c'est assume : un loader a un budget de temps, une page non.
*/
const CONSTRUCTION = 1.6;
const FRONT_MIN = 520;
const TRAIT_RAPIDITE = 1.8; // un trait se tire plus vite que le front n'avance
const TRAIT_MIN = 0.22;
const TRAIT_MAX = 0.8;
const RETARD_FORME = 0.45; // ce que la couleur attend derriere le front
const PAUSE = 0.35; // le temps de voir la grille entiere avant qu'elle se defaise
const VOL = 0.8; // duree du vol des formes communes

/*
  UNE SEULE FOIS PAR VISITE. Le loader presente le site ; revenir sur
  l'accueil depuis une autre page n'est pas une arrivee, et le rejouer a
  chaque retour le transforme en peage. `sessionStorage` et non
  `localStorage` : la memoire dure le temps de l'onglet, donc une vraie
  nouvelle visite - demain, ou dans une autre fenetre - le revoit.

  LE try/catch N'EST PAS DE LA PRUDENCE DECORATIVE : en navigation privee,
  `sessionStorage` peut lever a la simple lecture. Sans lui, le loader
  resterait en place pour toujours sur ces navigateurs.
*/
const DEJA_VU = 'loader-vu';

function dejaVu(): boolean {
  try {
    return sessionStorage.getItem(DEJA_VU) === '1';
  } catch {
    return false;
  }
}

function marquerVu(): void {
  try {
    sessionStorage.setItem(DEJA_VU, '1');
  } catch {
    /* navigation privee : le loader rejouera, c'est le moindre mal */
  }
}

export function initLoader(): void {
  const loaderEl = document.getElementById('loader');
  if (!loaderEl) return;

  /*
    RETIRER `app--reveal` EST OBLIGATOIRE QUAND ON SAUTE LE LOADER. Cette
    classe met la page a `opacity:0` et la fait entrer a 1,0s : la laisser en
    place sans loader laisserait l'accueil blanc une seconde entiere. Sous
    mouvement reduit, c'est le CSS qui la neutralise - ici, il n'y a pas de
    media query pour le faire, donc on la retire a la main.
  */
  const passer = () => {
    loaderEl.style.display = 'none';
    document.querySelector('.app')?.classList.remove('app--reveal');
  };

  if (mouvementReduit() || dejaVu()) {
    passer();
    return;
  }
  marquerVu();

  const grille = document.getElementById('grille');
  const panneau = document.getElementById('panneau');
  const anneau = document.getElementById('anneau');
  const app = document.querySelector<HTMLElement>('.app');
  const formes = grille
    ? [...grille.querySelectorAll<HTMLElement>('[data-vole]')]
    : [];

  let fini = false;
  const finir = () => {
    if (fini) return;
    fini = true;
    /*
      ON RETIRE LA PROPRIETE AU LIEU DE LA REMETTRE A 1. Les cibles du hero
      attendent leur propre animation d'entree ; leur ecrire `opacity:1` en
      ligne gagnerait contre elle et elles arriveraient sans. Retirer rend la
      main au CSS, quel que soit l'etat qu'il decrit.
    */
    formes.forEach((f) => {
      const cible = document.querySelector<HTMLElement>(f.dataset.vole ?? '');
      cible?.style.removeProperty('opacity');
    });
    loaderEl.style.display = 'none';
  };

  const W = window.innerWidth;
  const H = window.innerHeight;
  if (!grille || !panneau || !W || !H) {
    passer();
    return;
  }

  /* Le format commande la grille : voir PORTRAIT plus haut. */
  const portrait = W < H;
  const TRAITS = portrait ? PORTRAIT : PAYSAGE;
  const ZONES = portrait ? ZONES_PORTRAIT : ZONES_PAYSAGE;

  const front = Math.max(FRONT_MIN, W / CONSTRUCTION);
  const EP = 2;

  /*
    LES TRAITS SONT CREES ICI, PAS DANS LE MARKUP : leur longueur depend de la
    fenetre, et un trait qui se trace doit connaitre sa longueur pour tenir sa
    vitesse. Les classes sont celles des compositions - c'est le masque de
    motion.css qui fait tout le travail.
  */
  type Pose = { el: HTMLElement; nom: string; inverse: string; depart: number; duree: number };
  const poses: Pose[] = [];

  TRAITS.forEach((t, i) => {
    const el = document.createElement('span');
    const vertical = t.sens === 'v';
    const long = vertical ? (t.b - t.a) * H : (t.b - t.a) * W;
    const x = vertical ? t.p * W : t.a * W;
    const y = vertical ? t.a * H : t.p * H;
    /* Le sens alterne, comme sur les compositions : une main qui trace une
       grille ne repart pas toujours du meme bord. */
    const inv = i % 2 === 1;
    el.className = `seg seg--${t.sens}${inv ? ' seg--inv' : ''}`;
    el.style.cssText = `left:${x}px;top:${y}px;`
      + `width:${vertical ? EP : long}px;height:${vertical ? long : EP}px`;
    const depart = x / front;
    const duree = Math.min(TRAIT_MAX, Math.max(TRAIT_MIN, long / (front * TRAIT_RAPIDITE)));
    el.style.animationDelay = `${depart.toFixed(2)}s`;
    el.style.animationDuration = `${duree.toFixed(2)}s`;
    grille.appendChild(el);
    poses.push({
      el,
      nom: vertical ? (inv ? 'traitVinv' : 'traitV') : (inv ? 'traitHinv' : 'traitH'),
      inverse: vertical ? (inv ? 'traitV' : 'traitVinv') : (inv ? 'traitH' : 'traitHinv'),
      depart,
      duree,
    });
  });

  /*
    CHAQUE FORME PREND SA ZONE, et son retard est pris sur le front - a son
    bord GAUCHE, puisque c'est la que le front l'atteint.

    LA PHOTO EST LA SEULE A NE PAS REMPLIR : elle se pose au centre de la case
    centrale, a 62% de son plus petit cote. Un disque bord a bord dans un
    carre ne serait plus une photo dans une grille.
  */
  formes.forEach((f, i) => {
    const z = ZONES[i] ?? { x0: 0.4, y0: 0.4, x1: 0.6, y1: 0.6 };
    const x = z.x0 * W;
    const y = z.y0 * H;
    const larg = (z.x1 - z.x0) * W;
    const haut = (z.y1 - z.y0) * H;
    if (f.id === 'fly') {
      const d = Math.min(larg, haut) * PART_PHOTO;
      f.style.left = `${(x + (larg - d) / 2).toFixed(1)}px`;
      f.style.top = `${(y + (haut - d) / 2).toFixed(1)}px`;
      f.style.width = `${d.toFixed(1)}px`;
      f.style.height = `${d.toFixed(1)}px`;
    } else {
      /* Un carre du plus petit cote de la zone, cale sur son coin haut
         gauche : il reste carre quel que soit le rapport de la fenetre, donc
         son repli sur la primaire est uniforme. */
      const cote = Math.min(larg, haut);
      f.style.left = `${x.toFixed(1)}px`;
      f.style.top = `${y.toFixed(1)}px`;
      f.style.width = `${cote.toFixed(1)}px`;
      f.style.height = `${cote.toFixed(1)}px`;
    }
    const retard = x / front + RETARD_FORME;
    f.style.setProperty('--retard', `${retard.toFixed(2)}s`);
    /* L'anneau se trace quand la photo vient de se poser. */
    if (f.id === 'fly') f.style.setProperty('--retard-anneau', `${(retard + 0.35).toFixed(2)}s`);
  });

  const finConstruction = Math.max(
    ...poses.map((p) => p.depart + p.duree),
    ...formes.map((f) => parseFloat(f.style.getPropertyValue('--retard')) + 0.5),
  );
  const defaite = finConstruction + PAUSE;

  /*
    LA PAGE ENTRE QUAND LA GRILLE SE DEFAIT, pas a une heure fixe. Le CSS pose
    un retard de secours ; le script le recale sur le moment reel, qui depend
    de la largeur de la fenetre. Sans ca, le hero apparaitrait au milieu de la
    construction sur un grand ecran, et bien apres la fin sur un petit.
  */
  if (app) app.style.animationDelay = `${defaite.toFixed(2)}s`;

  window.setTimeout(() => {
    /*
      ═══ LA GRILLE SE DEFAIT ═══

      Le meme masque, joue avec les images-cles INVERSES : le trait s'efface
      dans le sens ou il a ete tire. Les departs repartent de gauche a droite,
      un peu plus vite que la construction - on defait plus vite qu'on ne
      construit, sans quoi la sortie traine.
    */
    poses.forEach((p) => {
      p.el.style.animationName = p.inverse;
      p.el.style.animationDelay = `${((p.depart / 1.6)).toFixed(2)}s`;
      p.el.style.animationDuration = `${p.duree.toFixed(2)}s`;
    });
    if (anneau) anneau.style.opacity = '0';
    panneau.style.opacity = '0';

    /*
      ═══ LES FORMES COMMUNES VONT SE POSER ═══

      On COUPE leur animation d'entree avant de poser le transform du vol :
      une animation en cours gagne contre une propriete en ligne. Leur etat de
      repos etant scale(1), la coupure ne les fait pas sauter.

      Une cible absente ou hors champ - ce que le hero peut tres bien produire
      a certaines largeurs - n'est pas une erreur : la forme s'efface sur
      place, et le reste continue.
    */
    formes.forEach((f) => {
      const cible = document.querySelector<HTMLElement>(f.dataset.vole ?? '');
      const r = f.getBoundingClientRect();
      f.style.animation = 'none';
      if (!cible) { f.style.opacity = '0'; return; }
      /*
        LA CIBLE EST MESUREE SUR SA BOITE DE MISE EN PAGE, PAS SUR SA BOITE
        RENDUE, et c'est ce qui faisait echouer tout le vol des aplats.

        Les trois primaires du hero sont a `transform:scale(0)` avec un retard
        de 2,6s - exactement l'instant ou le vol part. Leur
        `getBoundingClientRect()` rend donc une boite de largeur ZERO, le
        garde-fou « cible hors champ » se declenchait, et les trois aplats
        s'effacaient sur place au lieu de voler. Mesure : leur `transform`
        etait reste vide sur les trois. Le defaut etait la depuis le premier
        jour et ne se voyait pas, parce que les primaires du hero arrivent de
        toute facon par leur propre animation.

        `offsetWidth` / `offsetHeight` ignorent les transforms : c'est la
        taille que la cible AURA. Le centre, lui, se lit sur la boite rendue -
        une mise a l'echelle autour du centre le laisse en place, meme a
        l'echelle zero.
      */
      const c = cible.getBoundingClientRect();
      const cw = cible.offsetWidth;
      const ch = cible.offsetHeight;
      if (!cw || c.bottom < -ch || c.top > window.innerHeight + ch) { f.style.opacity = '0'; return; }
      cible.style.opacity = '0';
      /*
        TOUT SE REPLIE DEPUIS SON CENTRE, y compris les aplats.

        Ils se repliaient depuis leur coin haut gauche - l'origine de leur
        poussee d'entree, qu'on avait gardee par symetrie. A l'oeil, ca ne se
        lisait pas comme un deplacement mais comme un PLIAGE : le bloc etait
        aspire dans son propre coin, puis la translation l'emmenait. La photo,
        elle, se reduit autour de son centre et glisse - et c'est ce geste-la
        qui dit « le meme objet va se ranger ».

        L'origine est donc basculee au centre au moment du vol. A cet instant
        la forme est a l'identite - son animation d'entree est finie -, donc
        changer son origine ne la deplace pas d'un pixel.

        L'ECHELLE RESTE NON UNIFORME POUR LES APLATS, et elle doit l'etre :
        une zone de 432x234 ne peut devenir un carre de 42 qu'en se resserrant
        davantage en largeur qu'en hauteur. C'est la forme qui change, pas le
        geste - la photo, ronde, garde une echelle uniforme sans quoi elle
        s'ovaliserait en chemin.
      */
      f.style.transformOrigin = 'center';
      const dx = c.left + c.width / 2 - (r.left + r.width / 2);
      const dy = c.top + c.height / 2 - (r.top + r.height / 2);
      /* Toutes les formes sont carrees - les aplats comme la photo - et leurs
         cibles aussi : une seule echelle suffit, et elle est uniforme. */
      const sx = cw / r.width;
      const sy = ch / r.height;
      f.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
        + ` scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    });
  }, defaite * 1000);

  /* Filet de securite : la defaite plus le vol, large. */
  window.setTimeout(finir, (defaite + VOL + 0.3) * 1000);
}
