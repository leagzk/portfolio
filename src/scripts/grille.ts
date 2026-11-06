import { mouvementReduit } from './motion';

/*
  Apparition de la composition Mondrian AU DEFILEMENT.

  Elle se construisait au chargement de la page (BRIEF §4.1) : tout se jouait
  dans les 2 premieres secondes, donc au-dessus de la ligne de flottaison - et
  depuis que le hero occupe toute la fenetre, personne ne la voyait. Le trace
  part maintenant quand la composition entre dans le champ, et chaque case
  s'anime quand c'est son tour de monter a l'ecran.

  Trois temps, inchanges : les filets se TRACENT, les aplats POUSSENT depuis
  leur coin d'ancrage, les textes MONTENT en fondu.

  POURQUOI DES SEGMENTS EN ABSOLU, ET PAS LA GRILLE ELLE-MEME. Les filets ne
  sont pas des bordures : c'est le fond noir de la grille qui transparait par un
  `gap` de 2px. On ne peut donc pas les animer - un fond ne se trace pas. On
  mesure les cases, on pose par-dessus des segments absolus qui, eux, s'animent
  en scaleX/scaleY, et on garde la grille en blanc (classe `pre`) le temps du
  trace. A la fin on rend la main au vrai fond noir et on retire les segments :
  le resultat est identique au pixel, et plus rien ne tourne.

  LE DELAI VIENT DE LA POSITION, pas d'un index, et la position se mesure
  DEPUIS LE COIN HAUT GAUCHE - le point exact ou le trait du hero vient
  toucher la composition. Le trace part de la et se propage en diagonale : la
  ligne descend du bouton, change de couleur en entrant dans la page, et c'est
  elle qui amorce le premier filet. Tout le reste suit.

  LE FRONT EST FIN. Un filet mettait 1,1s a se tracer pendant que les suivants
  partaient dans les 1,8s : tous se chevauchaient, et l'ensemble se lisait
  comme une apparition groupee. A 0,5s de trace etalee sur 2,4s, il n'y a
  jamais que quelques filets en train de se faire - et c'est ce qui donne un
  TRACE qui avance, au lieu d'une grille qui apparait.

  SANS SCRIPT, LA COMPOSITION EST SIMPLEMENT LA. Toutes les classes d'animation
  sont posees ici ; le CSS n'en declare que les regles. Si ce fichier ne tourne
  pas - erreur, JS coupe, mouvement reduit - tout s'affiche d'un coup.
*/

/*
  LE RYTHME. Tout est etale sur ~3s au lieu de 1,5 : la construction doit se
  regarder, pas se subir. Les filets se tracent en diagonale depuis le coin
  haut gauche, et CHAQUE CASE SE REMPLIT QUAND LE FRONT DU TRACE LA DEPASSE -
  son retard se calcule avec la meme formule que les filets, plus un temps de
  retrait. Les couleurs suivent donc les lignes au lieu d'arriver ensemble, et
  plusieurs cases se remplissent en meme temps a des endroits differents.
*/
const TRACE_DEBUT = 0.1; // retard de la premiere vague
/*
  ═══ LE RYTHME EST CELUI D'UN FRONT, PAS D'UN DECOUPAGE ═══

  Trois modeles ont ete essayes avant celui-ci, et chacun a ete rejete a
  l'oeil : une file ou chaque trait partait 0,16s apres le precedent (« trop
  sequence »), puis des vagues par bandes d'avance diagonale (des micro-blocs
  qui ne voulaient rien dire), puis des vagues par croisement. Le modele
  retenu vient d'une reference posee par Lea - voir l'en-tete du front dans
  tracerFilets.

  LE FRONT TRAVERSE A 480px/s. Il met donc 2,2s a parcourir les 1072px d'une
  composition, et c'est lui qui donne son instant a chaque trait : un trait
  part quand le front atteint son bord gauche. Plus de vagues, plus de bandes.

  0,1s ENTRE DEUX DEPARTS. Les horizontales qui commencent au bord gauche
  partageraient l'instant zero : la composition s'ouvrirait sur un paquet au
  lieu d'un trait seul, qui est le premier geste de la reference.

  0,55s DE RETARD POUR LA COULEUR. Lu sur la reference, ou le treillis a
  franchi la moitie de la toile quand les premiers aplats se posent a gauche.

  0,08s ENTRE DEUX CASES. Une meme verticale en ferme plusieurs a la fois.
*/
const FRONT_VITESSE = 480; // px/s
const ECART_TRAIT = 0.1;
const RETARD_COULEUR = 0.55;
const ECART_CASE = 0.08;
/*
  UNE VITESSE, PAS UNE DUREE. Tous les traits mettaient 0,5s, quelle que soit
  leur longueur : un trait de 625px filait a 1250px/s pendant qu'un de 56px
  rampait a 112px/s - onze fois plus lent. Rien, dans ce geste, ne pouvait se
  lire comme UNE main : une main trace a vitesse a peu pres constante, et
  c'est la duree qui suit la longueur, pas l'inverse. Les bornes evitent les
  deux extremes - un tiret de 50px qui clignerait, une ligne pleine qui
  s'eterniserait.

  850px/s, ET PLUS 1100. Le trace n'est devenu lisible que le jour ou la
  courbe est passee en LINEAIRE : `cubic-bezier(.4,0,.2,1)` abattait 80% de la
  longueur dans la premiere moitie du temps, et le trait semblait jaillir puis
  se poser. Une fois la vitesse vraiment constante, il restait a lui laisser le
  temps d'etre lue - a 1100px/s, une verticale de 300px etait tiree en un quart
  de seconde. Voir l'en-tete de .seg--v dans src/styles/motion.css.
*/
const TRACE_VITESSE = 850; // px/s
const TRACE_DUREE_MIN = 0.3;
const TRACE_DUREE_MAX = 1.25;
/* Une case qui arrive bien apres la construction - on a defile jusqu'a elle -
   ne doit pas heriter d'un retard calcule pour l'ouverture. */
const RETARD_TARDIF = 0.08;

/*
  DEUX CROCHETS, UN SEUL GESTE.

  `data-grille` nomme une composition Mondrian. `data-filets` nomme un bloc
  dont les filets sont de VRAIES bordures CSS et non des `gap` - le bandeau de
  chiffres cles, qui porte trois traits verticaux entre ses colonnes et un
  trait sous l'ensemble.

  Ils sont traces par le meme code et a la meme vitesse de front, parce qu'ils
  ne font qu'un bloc : le bandeau de chiffres touche la composition qui le
  suit, l'ecart mesure entre les deux est de ZERO. Vus ensemble a l'ecran, les
  deux fronts partent au meme instant et c'est une seule onde qui traverse le
  tout de gauche a droite.

  `bordBas` est la seule difference : une composition a ses bords ouverts
  (BRIEF §3.2) et ne trace donc aucun bord exterieur, alors que le bandeau de
  chiffres se FERME par le sien - c'est ce trait qui en fait une mesure et pas
  une liste.
*/
export function tracerGrille(): void {
  if (mouvementReduit() || !('IntersectionObserver' in window)) return;
  document.querySelectorAll<HTMLElement>('[data-grille]').forEach((e) => construire(e));
  document.querySelectorAll<HTMLElement>('[data-filets]').forEach((e) => construire(e, true));
}

/*
  UNE COMPOSITION, PAS LA COMPOSITION. L'accueil en porte une, chaque etude de
  cas la sienne ; le trace est le meme geste et n'a pas a etre reecrit. Seules
  les regles .attend / .vu changent d'une page a l'autre, et elles sont dans le
  CSS de la page, pas ici.
*/
function construire(comp: HTMLElement, bordBas = false): void {
  /*
    LES CASES NE SONT PAS TOUJOURS LES ENFANTS DIRECTS. Un conteneur en
    `display:contents` - le rail des principes de l'accueil - disparait de la
    mise en page et ce sont SES enfants qui sont les cases de la grille. On le
    detecte au calcul plutot qu'au nom de classe : la regle vaut pour toute
    composition, presente ou a venir.
  */
  const cases = Array.from(comp.children).flatMap((el) =>
    getComputedStyle(el).display === 'contents'
      ? (Array.from(el.children) as HTMLElement[])
      : [el as HTMLElement],
  );

  /* Etat d'attente pose tout de suite : sans lui le contenu s'affiche puis
     disparait pour se re-animer quand l'observateur se declenche. */
  comp.classList.add('pre');
  cases.forEach((el) => el.classList.add('attend'));

  /*
    Le retard propre a chaque case, pose en variable CSS et lu par les regles
    `.vu` : le script decide QUAND, la feuille decide QUOI. Il se calcule sur le
    coin haut gauche de la case, avec la formule des filets - la couleur arrive
    donc juste apres les deux traits qui la bordent.
  */
  /*
    L'AVANCE D'UN POINT : sa distance au coin haut gauche, ramenee entre 0 et
    1. C'est de la que le trait du hero arrive, et le trace se propage en
    diagonale depuis ce point.
  */
  const avanceDe = (x: number, y: number, cr: DOMRect) => {
    const portee = cr.width + cr.height;
    if (!portee) return 0;
    return Math.max(0, Math.min(1, (x + y) / portee));
  };
  /*
    LE RETARD D'UNE CASE, POSE DEUX FOIS. Ici, sur la formule brute, pour que
    la composition soit servable avant meme que les filets existent ; puis une
    seconde fois dans tracerFilets, sur l'horloge REELLE du trace, une fois que
    les departs des filets sont connus. Voir retardSurLeTrace.
  */
  const placerRetards = () => {
    const cr = comp.getBoundingClientRect();
    if (!cr.width || !cr.height) return;
    cases.forEach((el) => {
      const r = el.getBoundingClientRect();
      /* Une case masquee au point de rupture courant - la pagination du rail
         n'existe que sous 720px - rend une boite nulle. avanceDe la borne. */
      const avance = avanceDe(r.left - cr.left, r.top - cr.top, cr);
      el.style.setProperty('--retard', `${(TRACE_DEBUT + avance * 2 + RETARD_COULEUR).toFixed(2)}s`);
    });
  };
  placerRetards();

  /*
    L'observateur des cases est cree AVANT le trace parce que le trace s'en
    sert : les cases deja a l'ecran quand il part lui sont rendues tout de
    suite, et il doit pouvoir cesser de les observer.
  */
  const libererCase = (cellule: HTMLElement) => {
    cellule.classList.remove('attend');
    cellule.classList.add('vu');
    ioCases.unobserve(cellule);
  };

  let traceeFait = false;
  const tracerFilets = () => {
    if (traceeFait) return;
    traceeFait = true;
    const cr = comp.getBoundingClientRect();
    const W = cr.width;
    const H = cr.height;
    if (!W || !H) {
      comp.classList.remove('pre');
      return;
    }

    /*
      ═══ UNE LIGNE, ET PLUS UN BORD DE CASE ═══

      Chaque case posait le filet de son bord droit et celui de son bord bas.
      Une « ligne verticale » de la composition etait donc TROIS OU QUATRE
      segments empiles, chacun avec son propre retard : rien ne se tracait du
      haut vers le bas, la ligne se remplissait par morceaux, souvent dans le
      desordre. C'est ce que Lea voyait - des traits qui apparaissent d'un coup
      plutot qu'un trait qu'on tire.

      Les bords sont donc releves puis FUSIONNES : meme abscisse, intervalles
      qui se touchent, une seule ligne. On releve les quatre bords de chaque
      case et pas seulement droite et bas - une case peut border a gauche une
      ligne qu'aucune autre ne borde a droite, quand la grille a des cellules
      a cheval sur plusieurs rangees.
    */
    /*
      4px ET NON 2. La tolerance servait a reunir les deux bords d un meme
      trait, distants du `gap` de la grille. Mais l accueil porte deux
      horizontales a TROIS pixels l une de l autre - le bas d une case et le
      haut du rail qui la suit -, et a 2px elles restaient deux lignes : le
      meme trait se tracait deux fois, a deux instants. Quatre pixels les
      reunissent sans risque, les vraies lignes voisines d une composition
      etant a des dizaines de pixels l une de l autre.
    */
    const TOL = 4;

    type Arete = { pos: number; a: number; b: number };
    const brutes: Record<'v' | 'h', Arete[]> = { v: [], h: [] };

    cases.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const l = r.left - cr.left;
      const t = r.top - cr.top;
      const d = l + r.width;
      const b = t + r.height;
      /* Les bords exterieurs sont ignores : la grille a ses bords ouverts
         (§3.2). Un bord est exterieur s'il touche le cadre de la composition. */
      if (l > TOL) brutes.v.push({ pos: l, a: t, b });
      if (d < W - TOL) brutes.v.push({ pos: d, a: t, b });
      if (t > TOL) brutes.h.push({ pos: t, a: l, b: d });
      /* Le bord bas n'est trace que si le bloc se ferme dessus - voir
         `bordBas` dans l'en-tete de tracerGrille. */
      if (b < H - TOL || bordBas) brutes.h.push({ pos: b, a: l, b: d });
    });

    /*
      LES DEUX BORDS D'UN MEME TRAIT SONT DISTANTS DE 2px, et c'est le `gap`
      de la grille : le trait noir EST cet ecart. Le bord droit d'une case
      tombe a x, le bord gauche de sa voisine a x + 2. Groupes par abscisse
      arrondie, ils donnaient DEUX lignes paralleles a 2px l'une de l'autre,
      tracees l'une apres l'autre - mesure sur l'accueil : seize lignes la ou
      il y en a huit, chacune en double. Le regroupement se fait donc par
      PROXIMITE, a la tolerance pres, et la ligne est posee sur le bord le
      plus a gauche (ou le plus haut) du groupe : c'est lui qui ouvre l'ecart.
    */
    const fusionner = (aretes: Arete[]): Arete[] => {
      if (!aretes.length) return [];
      const parPos: Arete[][] = [];
      [...aretes].sort((x, y) => x.pos - y.pos).forEach((e) => {
        const dernier = parPos[parPos.length - 1];
        if (dernier && e.pos - dernier[0].pos <= TOL) dernier.push(e);
        else parPos.push([e]);
      });
      const sorties: Arete[] = [];
      parPos.forEach((lot) => {
        const pos = lot[0].pos;
        lot.sort((x, y) => x.a - y.a);
        let courant = { pos, a: lot[0].a, b: lot[0].b };
        lot.slice(1).forEach((e) => {
          if (e.a <= courant.b + TOL) courant.b = Math.max(courant.b, e.b);
          else {
            sorties.push(courant);
            courant = { pos, a: e.a, b: e.b };
          }
        });
        sorties.push(courant);
      });
      return sorties;
    };

    type Ligne = {
      sens: 'v' | 'h';
      x: number; y: number; long: number;
      inverse: boolean;
      avance: number; duree: number; depart: number; fin: number;
    };

    const lignes: Ligne[] = [
      ...fusionner(brutes.v).map((e) => ({ sens: 'v' as const, x: e.pos, y: e.a, long: e.b - e.a })),
      ...fusionner(brutes.h).map((e) => ({ sens: 'h' as const, x: e.a, y: e.pos, long: e.b - e.a })),
    ].map((l) => ({
      ...l,
      inverse: false,
      /*
        L'AVANCE SE MESURE AU COIN HAUT GAUCHE DE LA LIGNE, pas a son milieu.
        C'est de ce coin-la que le trait du hero arrive, et une ligne qui
        commence haut a gauche doit partir tot meme si elle descend loin. Au
        milieu, toutes les grandes verticales se seraient retrouvees groupees
        au centre de l'ordre.
      */
      avance: Math.max(0, Math.min(1, (l.x + l.y) / (W + H))),
      duree: 0, depart: 0, fin: 0,
    }));

    if (!lignes.length) {
      comp.classList.remove('pre');
      comp.dataset.phase = 'fini';
      return;
    }

    /* La duree suit la longueur : tous les traits a la meme vitesse. */
    lignes.forEach((l) => {
      l.duree = Math.min(TRACE_DUREE_MAX, Math.max(TRACE_DUREE_MIN, l.long / TRACE_VITESSE));
    });

    /*
      ═══ UN FRONT QUI TRAVERSE, DE GAUCHE A DROITE ═══

      Reference posee par Lea : une construction de composition Mondrian ou
      le treillis se pose en balayant la toile, et ou la couleur remplit
      derriere. Releve image par image sur les neuf secondes de la video :
      a 0,3s un SEUL trait en haut a gauche ; a 1,0s un treillis partiel dans
      le quart gauche ; a 2,6s le treillis couvre la moitie gauche et les
      premieres couleurs sont posees pendant que la moitie droite est encore
      blanche ; a 3,4s tout est la.

      Trois traits de caractere en sortent, et ce sont eux qu'on reprend :
      ca commence par un trait SEUL, le front balaie HORIZONTALEMENT - et non
      en diagonale comme ici jusqu'a present -, et la couleur TRAINE derriere
      le front d'environ une seconde.

      LES TRAITS MENENT, ET C'EST UN CHOIX. Tout le site argumente qu'un
      systeme precede ce qu'il porte : que la structure ouvre et que la
      couleur vienne s'y loger dit cette these. L'inverse - des aplats qui
      apparaissent sur du blanc avant d'avoir un cadre - la contredit.

      LE FRONT EST UNE VITESSE, PAS UN DECOUPAGE. Chaque trait part quand le
      front atteint son bord gauche : une horizontale EST le front qui passe,
      une verticale est ce qu'il laisse en traversant. Plus de vagues, plus de
      bandes - la position seule donne l'instant, et la continuité vient de
      la, pas d'un groupement.
    */
    const avanceFront = (x: number) => x / FRONT_VITESSE;

    /*
      DEUX TRAITS NE PARTENT PAS ENSEMBLE. Les horizontales qui commencent au
      bord gauche partageraient toutes l'instant zero, et la composition
      s'ouvrirait sur un paquet au lieu d'un trait. Les departs sont donc
      repris dans l'ordre du front, chacun repousse a au moins ECART_TRAIT
      apres le precedent : le premier trait reste seul, et la densite monte.
    */
    lignes.sort((a, b) => avanceFront(a.x) - avanceFront(b.x) || a.y - b.y);
    let precedent = -Infinity;
    lignes.forEach((l, i) => {
      l.depart = Math.max(TRACE_DEBUT + avanceFront(l.x), precedent + ECART_TRAIT);
      precedent = l.depart;
      l.fin = l.depart + l.duree;
      /* Le sens alterne : une main qui trace une grille ne repart pas
         toujours du meme bord. */
      l.inverse = i % 2 === 1;
    });

    /*
      ═══ LA COULEUR TRAINE DERRIERE LE FRONT ═══

      Une case se remplit quand le front a fini de la TRAVERSER - donc sur son
      bord DROIT, pas sur son bord gauche : a ce moment-la ses deux verticales
      sont posees, elle est fermee. Plus RETARD_COULEUR, qui est le retard
      d'une seconde lu sur la reference : le treillis continue d'avancer a
      droite pendant que la couleur prend a gauche.

      Aucune case ne peut arriver avant le dernier des traits qui la bordent.
      Le calcul par le bord droit le garantit presque toujours ; la borne
      couvre les cas ou un trait lointain a ete repousse par la cadence.
    */
    const borde = (sens: 'v' | 'h', pos: number, a: number, b: number): Ligne | undefined =>
      lignes.find((l) => l.sens === sens
        && Math.abs((sens === 'v' ? l.x : l.y) - pos) <= TOL
        && (sens === 'v' ? l.y : l.x) <= a + TOL
        && (sens === 'v' ? l.y + l.long : l.x + l.long) >= b - TOL);

    const remplissages: { el: HTMLElement; quand: number; y: number; x: number; rang?: number }[] = [];
    cases.forEach((el) => {
      const r = el.getBoundingClientRect();
      /* Une case masquee au point de rupture courant - la pagination du rail
         n'existe que sous 720px - rend une boite nulle. Elle garde le retard
         de secours pose plus haut ; elle n'est de toute facon pas affichee. */
      if (!r.width || !r.height) return;
      const l = r.left - cr.left;
      const t = r.top - cr.top;
      const bords = [
        borde('v', l, t, t + r.height),
        borde('v', l + r.width, t, t + r.height),
        borde('h', t, l, l + r.width),
        borde('h', t + r.height, l, l + r.width),
      ].filter(Boolean) as Ligne[];
      const ferme = bords.length ? Math.max(...bords.map((b) => b.depart)) : 0;
      const rang = el.dataset.rang ? parseInt(el.dataset.rang, 10) : undefined;
      remplissages.push({
        el,
        quand: Math.max(TRACE_DEBUT + avanceFront(l + r.width), ferme) + RETARD_COULEUR,
        y: t,
        x: l,
        rang: Number.isNaN(rang) ? undefined : rang,
      });
    });

    /*
      ═══ UN RECIT NUMEROTE SE LIT DANS SON ORDRE, PAS DANS CELUI DU FRONT ═══

      « 01 The constraint », « 02 The system », « 03 The handover » : ces cases
      portent une chronologie, et le front ne la connait pas - il va de gauche
      a droite, et la carte 02 peut tres bien se trouver a gauche de la 01.
      Une case qui porte `data-rang` est donc retenue jusqu'a ce que la
      precedente soit servie. Le front continue de donner l'HEURE, le rang ne
      fait qu'interdire les inversions.

      SUR L'ACCUEIL, le meme mecanisme sert un regroupement et non une
      chronologie : « Cultivating practice, not just systems » annonce les
      trois principes qui la suivent - c'est un seul bloc de sens, et la
      citation doit ouvrir. Elle porte donc le rang 1, le duo le 2, le dernier
      principe le 3.

      LES CASES SANS RANG NE SONT PAS TOUCHEES : elles arrivent au passage du
      front, comme avant.
    */
    const suite = remplissages
      .filter((f) => f.rang !== undefined)
      .sort((a, b) => (a.rang as number) - (b.rang as number));
    let precedentRang = -Infinity;
    suite.forEach((f) => {
      f.quand = Math.max(f.quand, precedentRang + ECART_CASE);
      precedentRang = f.quand;
    });

    /*
      DEUX CASES NON PLUS. Une meme verticale ferme souvent plusieurs cases a
      la fois ; sans ce pas elles se coloreraient au meme centieme. Elles sont
      servies dans l'ordre de lecture, ECART_CASE l'une apres l'autre.
    */
    remplissages.sort((a, b) => a.quand - b.quand || a.y - b.y || a.x - b.x);
    let precedenteCase = -Infinity;
    remplissages.forEach((f) => {
      const quand = Math.max(f.quand, precedenteCase + ECART_CASE);
      precedenteCase = quand;
      f.el.style.setProperty('--retard', `${quand.toFixed(2)}s`);
    });

    const calque = document.createElement('div');
    calque.className = 'segs';
    calque.setAttribute('aria-hidden', 'true');
    lignes.forEach((l) => {
      const seg = document.createElement('span');
      seg.className = `seg seg--${l.sens}${l.inverse ? ' seg--inv' : ''}`;
      const w = l.sens === 'v' ? 2 : l.long;
      const h = l.sens === 'v' ? l.long : 2;
      seg.style.cssText = `left:${l.x}px;top:${l.y}px;width:${w}px;height:${h}px`;
      seg.style.animationDelay = `${l.depart.toFixed(2)}s`;
      seg.style.animationDuration = `${l.duree.toFixed(2)}s`;
      calque.appendChild(seg);
    });

    comp.appendChild(calque);

    /*
      LES CASES DEJA A L'ECRAN REJOIGNENT LE TRACE. Elles attendaient leur
      propre seuil de 25%, qui n'a aucun rapport avec l'horloge des lignes :
      mesure sur l'accueil pendant la construction, sept cases etaient servies
      et quatre attendaient encore, alors que leurs traits, eux, etaient en
      train de se poser.

      Une case seulement AMORCEE compte : c'est son retard qui la sequence, et
      la retenir jusqu'a 25% reviendrait a la sortir du geste. Celles qui sont
      encore hors champ gardent l'observateur - elles seront servies a leur
      arrivee, avec la cascade courte de RETARD_TARDIF.
    */
    cases.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
      libererCase(el);
    });

    /* On rend la main au vrai fond noir quand la derniere ligne a fini. Avant,
       il manquerait des traits ; apres, le calque ferait doublon. La fin se lit
       sur les lignes elles-memes : avec des durees qui suivent la longueur,
       elle ne se calcule plus d'avance. */
    const fin = lignes.reduce((max, l) => Math.max(max, l.fin), 0);
    window.setTimeout(() => {
      comp.classList.remove('pre');
      calque.remove();
      comp.dataset.phase = 'fini';
    }, fin * 1000);
  };

  /*
    Deux observateurs, deux seuils. Les filets partent des que la composition
    pointe (10%) - c'est la structure, elle doit preceder ce qu'elle contient.
    Chaque case, elle, attend d'etre vraiment entree (25%) - mais seulement si
    elle n'etait pas deja a l'ecran au depart du trace, auquel cas tracerFilets
    l'a deja servie.
  */
  /*
    L'ORDRE DE CREATION DES DEUX OBSERVATEURS COMPTE. Les rappels d'un meme
    cycle de rendu sont delivres dans l'ordre ou les observateurs ont ete
    crees : celui du trace passe donc en premier, pose l'horloge sur les cases
    deja a l'ecran, et celui des cases ne sert plus que ce qui arrive apres.
    Cree dans l'autre sens, il aurait lance les couleurs sur le retard brut une
    fraction de seconde avant que le trace le corrige - et changer un
    `animation-delay` en cours de route fait sauter l'animation.
  */
  new IntersectionObserver((entrees, obs) => {
    entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      tracerFilets();
      obs.disconnect();
    });
  }, { threshold: 0.1 }).observe(comp);

  const ioCases = new IntersectionObserver((entrees, obs) => {
    /* Les cases qui entrent ensemble sont servies dans l'ordre de lecture, pas
       dans celui - arbitraire - ou l'observateur les rend. */
    const arrivees = entrees
      .filter((e) => e.isIntersecting)
      .map((e) => e.target as HTMLElement)
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.top - rb.top || ra.left - rb.left;
      });

    arrivees.forEach((cellule, i) => {
      /* Deja servie par tracerFilets : ses entrees etaient en file avant qu'il
         cesse de l'observer. La re-servir rejouerait son animation. */
      if (cellule.classList.contains('vu')) {
        obs.unobserve(cellule);
        return;
      }
      /* Pendant la construction, la case garde le retard calcule sur sa
         position - c'est lui qui fait suivre les couleurs au trace. Une fois la
         grille posee, on a defile jusqu'a elle : un long retard ne serait plus
         une mise en scene, juste une latence. */
      if (comp.dataset.phase === 'fini') {
        cellule.style.setProperty('--retard', `${(i * RETARD_TARDIF).toFixed(2)}s`);
      }
      cellule.classList.remove('attend');
      cellule.classList.add('vu');
      obs.unobserve(cellule);
    });
  }, { threshold: 0.25 });
  cases.forEach((el) => ioCases.observe(el));

}
