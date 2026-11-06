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
  ═══ LE TRACE AVANCE PAR VAGUES, PAS PAR FILE ═══

  Chaque trait partait 0,16s apres le precedent, un par un, du premier au
  dernier. C'etait lisible et c'etait mecanique : « trop sequence », et le
  dessin se lisait comme une liste qu'on deroule plutot que comme une
  composition qui se construit.

  Les elements sont donc ranges en VAGUES, par bandes d'avance diagonale, et
  une vague part d'un seul tenant. Ce qui tombe dans la meme bande arrive
  ensemble, quel que soit son genre : une verticale en bas a gauche, une
  verticale en haut a droite et un aplat de couleur partagent la meme
  anti-diagonale - (x + y) egal - donc la meme vague. C'est exactement la
  lecture que Lea decrit, et c'est ce que la diagonale disait depuis le
  debut : la casser trait par trait l'avait perdue.

  SIX VAGUES, DECOUPEES PAR RANG ET NON PAR VALEUR. Les anti-diagonales d'une
  composition se distribuent en cloche - celle du milieu traverse le plus
  d'elements -, donc tailler des bandes d'egale LARGEUR entassait tout au
  centre : mesure sur l'accueil, deux vagues dont une de ONZE elements sur
  dix-huit, puis deux vagues d'un seul. On trie donc par avance et on coupe en
  six groupes de meme EFFECTIF : chaque vague compte trois ou quatre membres,
  quelle que soit la composition, et ses membres restent voisins en diagonale.

  0,3s ENTRE DEUX VAGUES, pour des traces de 0,2 a 1s : la suivante part
  pendant que la precedente se tire encore. C'est le recouvrement qui rend le
  geste continu.

  LE SOUFFLE INTERNE EST BORNE, ET C'EST TOUT L'ECART ENTRE UNE VAGUE ET UNE
  FILE. A 0,04s PAR MEMBRE, une bande de huit s'etalait sur 0,32s - plus que
  les 0,3s qui separent deux bandes : les vagues se recouvraient, et le trace
  redevenait l'echelle reguliere qu'on venait de quitter. Mesure sur
  l'accueil : 0,70 / 0,74 / 0,78 / 0,82 / 0,86 / 0,90 / 0,94 / 0,98 - une file,
  pas un groupe.

  Les membres d'une bande se repartissent donc sur une FENETRE FIXE de 0,08s,
  quel que soit leur nombre. A zero ils s'alignaient au centieme et le groupe
  claquait ; a 0,08 reparti, le groupe respire et reste un groupe - quatre
  fois moins que l'ecart entre deux vagues.
*/
const BANDES = 6;
const PAS_BANDE = 0.3;
const ETALE_BANDE = 0.08;
/*
  UNE VITESSE, PAS UNE DUREE. Tous les traits mettaient 0,5s, quelle que soit
  leur longueur : un trait de 625px filait a 1250px/s pendant qu'un de 56px
  rampait a 112px/s - onze fois plus lent. Rien, dans ce geste, ne pouvait se
  lire comme UNE main : une main trace a vitesse a peu pres constante, et
  c'est la duree qui suit la longueur, pas l'inverse. Les bornes evitent les
  deux extremes - un tiret de 50px qui clignerait, une ligne pleine qui
  s'eterniserait.
*/
const TRACE_VITESSE = 1100; // px/s
const TRACE_DUREE_MIN = 0.22;
const TRACE_DUREE_MAX = 1;
/* Une case qui arrive bien apres la construction - on a defile jusqu'a elle -
   ne doit pas heriter d'un retard calcule pour l'ouverture. */
const RETARD_TARDIF = 0.08;

export function tracerGrille(): void {
  if (mouvementReduit() || !('IntersectionObserver' in window)) return;
  document.querySelectorAll<HTMLElement>('[data-grille]').forEach(construire);
}

/*
  UNE COMPOSITION, PAS LA COMPOSITION. L'accueil en porte une, chaque etude de
  cas la sienne ; le trace est le meme geste et n'a pas a etre reecrit. Seules
  les regles .attend / .vu changent d'une page a l'autre, et elles sont dans le
  CSS de la page, pas ici.
*/
function construire(comp: HTMLElement): void {
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
      el.style.setProperty('--retard', `${(TRACE_DEBUT + avance * BANDES * PAS_BANDE).toFixed(2)}s`);
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
    const TOL = 2; // le `gap` de la grille : deux bords distants de 2px se touchent

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
      if (b < H - TOL) brutes.h.push({ pos: b, a: l, b: d });
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

    /*
      ═══ LA VAGUE D'UN ELEMENT EST SA BANDE D'AVANCE DIAGONALE ═══

      Verticales, horizontales et cases sont rangees ENSEMBLE, sur la seule
      avance diagonale, puis quantifiees en BANDES vagues. Ce qui tombe dans la
      meme bande part ensemble : les deux sens s'entrelacent d'eux-memes, et un
      aplat arrive avec les traits de sa zone plutot qu'apres toute la grille.
    */
    lignes.forEach((l) => {
      l.duree = Math.min(TRACE_DUREE_MAX, Math.max(TRACE_DUREE_MIN, l.long / TRACE_VITESSE));
    });

    /*
      ═══ UNE CASE REJOINT LA VAGUE DE SON DERNIER TRAIT ═══

      Pas celle de sa propre position : une case dont le bord bas est trace
      dans la derniere vague ne peut pas se colorer dans la deuxieme, elle ne
      serait pas encore fermee. Elle prend donc la bande du plus tardif des
      traits qui la bordent - elle arrive AVEC lui, dans la meme vague, et non
      0,3s apres toute la grille.

      Les bords exterieurs n'existent pas (grille ouverte) : une case de coin
      n'a que deux ou trois traits a attendre, et c'est bien le dernier d'entre
      eux qui compte.
    */
    const borde = (sens: 'v' | 'h', pos: number, a: number, b: number): Ligne | undefined =>
      lignes.find((l) => l.sens === sens
        && Math.abs((sens === 'v' ? l.x : l.y) - pos) <= TOL
        && (sens === 'v' ? l.y : l.x) <= a + TOL
        && (sens === 'v' ? l.y + l.long : l.x + l.long) >= b - TOL);

    type Membre = { avance: number; bande: number; y: number; x: number; ligne?: Ligne; el?: HTMLElement };
    const membres: Membre[] = lignes.map((l) => ({
      avance: l.avance, bande: 0, y: l.y, x: l.x, ligne: l,
    }));

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
      const avance = bords.length
        ? Math.max(...bords.map((b) => b.avance))
        : Math.max(0, Math.min(1, (l + t) / (W + H)));
      membres.push({ avance, bande: 0, y: t, x: l, el });
    });

    /*
      ═══ L'HEURE D'UNE VAGUE, ET LE SOUFFLE A L'INTERIEUR ═══

      Tous les membres d'une bande partent a l'heure de la bande ; a
      l'interieur, ils sont ranges dans l'ordre de lecture et decales de
      JITTER_BANDE. Le groupe reste un groupe - c'est ce que Lea demande -
      sans que ses membres s'alignent au centieme.

      LE SENS DU TRACE ALTERNE sur l'ordre global des traits : une ligne sur
      deux part de l'autre bout, bas vers haut pour une verticale, droite vers
      gauche pour une horizontale. Une main qui trace une grille ne repart pas
      toujours du meme bord. L'alternance suit un ordre stable, donc elle est
      la meme d'un chargement a l'autre.
    */
    /*
      LA COUPE SE FAIT PAR RANG : on trie par avance, puis on taille six
      groupes de meme effectif. Deux elements de meme avance - un trait et
      l'aplat qu'il ferme, par exemple - ne sont jamais separes par une coupe.
    */
    membres.sort((a, b) => a.avance - b.avance || a.y - b.y || a.x - b.x);
    membres.forEach((m, i) => {
      m.bande = Math.min(BANDES - 1, Math.floor((i * BANDES) / membres.length));
    });
    membres.forEach((m, i) => {
      if (i > 0 && m.avance === membres[i - 1].avance) m.bande = membres[i - 1].bande;
    });
    /*
      ON RESSERRE LES NUMEROS. Le regroupement ci-dessus vide parfois une
      bande - ses premiers membres sont tires dans la precedente -, et une
      bande vide se voyait : 0,6s de silence avant la derniere vague, mesure
      sur l'accueil. Les bandes restantes sont renumerotees a la suite, donc
      l'ecart entre deux vagues est toujours celui qu'on a choisi.
    */
    let numero = -1;
    let precedenteBande = -1;
    membres.forEach((m) => {
      if (m.bande !== precedenteBande) {
        precedenteBande = m.bande;
        numero += 1;
      }
      m.bande = numero;
    });
    const tailles = new Map<number, number>();
    membres.forEach((m) => tailles.set(m.bande, (tailles.get(m.bande) ?? 0) + 1));
    let bandeCourante = -1;
    let rangDansBande = 0;
    let nTrait = 0;
    membres.forEach((m) => {
      if (m.bande !== bandeCourante) {
        bandeCourante = m.bande;
        rangDansBande = 0;
      }
      const n = tailles.get(m.bande) ?? 1;
      const quand = TRACE_DEBUT + m.bande * PAS_BANDE
        + (n > 1 ? (rangDansBande / (n - 1)) * ETALE_BANDE : 0);
      rangDansBande += 1;
      if (m.ligne) {
        m.ligne.depart = quand;
        m.ligne.fin = quand + m.ligne.duree;
        m.ligne.inverse = nTrait % 2 === 1;
        nTrait += 1;
      } else if (m.el) {
        m.el.style.setProperty('--retard', `${quand.toFixed(2)}s`);
      }
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
