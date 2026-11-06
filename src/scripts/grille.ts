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
const TRACE_DEBUT = 0.1; // retard du premier filet
const TRACE_ETALEMENT = 2.4; // ecart entre le premier filet et le dernier
/*
  UNE VITESSE, PAS UNE DUREE. Tous les filets mettaient 0,5s, quelle que soit
  leur longueur : sur l'accueil, un filet de 625px filait a 1250px/s pendant
  qu'un de 56px rampait a 112px/s - onze fois plus lent. Rien, dans ce geste,
  ne pouvait se lire comme UNE main : une main trace a vitesse a peu pres
  constante, et c'est la duree qui suit la longueur, pas l'inverse.

  900px/s est la vitesse moyenne de l'ancien reglage sur la composition de
  l'accueil : l'ensemble garde donc son tempo, ce sont les ecarts entre filets
  qui disparaissent. Les bornes evitent les deux extremes du geste - un tiret
  de 50px qui clignerait, un filet de 900px qui s'eterniserait.
*/
const TRACE_VITESSE = 900; // px/s
const TRACE_DUREE_MIN = 0.26;
const TRACE_DUREE_MAX = 0.8;
/*
  DEUX FILETS NE PARTENT JAMAIS ENSEMBLE. Le front se propage en diagonale
  depuis le coin haut gauche - (x + y) / (W + H) -, et deux filets poses sur la
  meme anti-diagonale recevaient donc le meme retard, au centieme pres. Mesure
  sur l'accueil : deux verticales a 1,90s exactement, deux a 1,47 et 1,49,
  trois a 1,06 / 1,07 / 1,20. Sur sept verticales, l'essentiel du tableau
  partait par paquets, et un paquet ne se lit pas comme une suite de traits.

  Les departs sont donc repris apres coup, dans l'ordre du front : chacun est
  repousse pour qu'il reste au moins ECART_MIN apres le precedent. L'ordre
  diagonal est conserve - c'est le concept, le trait du hero touche le coin
  haut gauche et tout part de la -, seules les egalites sont defaites.

  0,07s : en dessous l'oeil ne separe plus deux departs, au-dessus la
  construction s'etire et le collectif se perd.
*/
const ECART_MIN = 0.07;
const RETRAIT = 0.3; // ce que la couleur attend apres les filets qui la bordent
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
      el.style.setProperty('--retard', `${(TRACE_DEBUT + avance * TRACE_ETALEMENT + RETRAIT).toFixed(2)}s`);
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

    const calque = document.createElement('div');
    calque.className = 'segs';
    calque.setAttribute('aria-hidden', 'true');
    const ep = 2;
    const vus = new Set<string>();
    /*
      Les filets sont COLLECTES avant d'etre cadences : leur depart depend de
      celui des autres (voir ECART_MIN), donc aucun ne peut etre fixe tant
      qu'on ne les a pas tous.
    */
    const filets: { seg: HTMLElement; avance: number; duree: number; depart: number }[] = [];

    const poser = (sens: 'v' | 'h', l: number, t: number, w: number, h: number) => {
      /* Deux cases voisines partagent un bord : sans ce garde le meme filet
         serait dessine - et anime - deux fois, et le recouvrement se verrait. */
      const cle = `${sens}${Math.round(l)}:${Math.round(t)}:${Math.round(w)}:${Math.round(h)}`;
      if (vus.has(cle)) return;
      vus.add(cle);
      const seg = document.createElement('span');
      seg.className = `seg seg--${sens}`;
      seg.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`;
      const longueur = sens === 'v' ? h : w;
      filets.push({
        seg,
        /* L'avance se mesure au point ou le filet COMMENCE a se tracer : son
           coin haut gauche, qui est aussi son transform-origin. */
        avance: avanceDe(l, t, cr),
        duree: Math.min(TRACE_DUREE_MAX, Math.max(TRACE_DUREE_MIN, longueur / TRACE_VITESSE)),
        depart: 0,
      });
      calque.appendChild(seg);
    };

    /* Chaque filet interieur est le bord DROIT ou BAS d'au moins une case. Les
       bords exterieurs sont ignores : la grille a ses bords ouverts (§3.2). */
    cases.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const l = r.left - cr.left;
      const t = r.top - cr.top;
      if (r.right - cr.left < W - 1) poser('v', l + r.width, t, ep, r.height);
      if (r.bottom - cr.top < H - 1) poser('h', l, t + r.height, r.width, ep);
    });

    /*
      LA CADENCE. Les filets sont ranges dans l'ordre du front - leur avance
      diagonale - puis chacun est pousse a au moins ECART_MIN apres le
      precedent. L'ordre ne change jamais ; seuls les ex aequo sont separes.
    */
    filets.sort((a, b) => a.avance - b.avance);
    let precedent = -Infinity;
    filets.forEach((f) => {
      f.depart = Math.max(TRACE_DEBUT + f.avance * TRACE_ETALEMENT, precedent + ECART_MIN);
      precedent = f.depart;
      f.seg.style.animationDelay = `${f.depart.toFixed(2)}s`;
      f.seg.style.animationDuration = `${f.duree.toFixed(2)}s`;
    });

    /*
      L'HORLOGE DES COULEURS EST CELLE DES FILETS, et plus une formule
      parallele. Le retard brut d'une case supposait des filets partis a
      l'heure brute ; depuis que la cadence les decale, l'aplat arrivait avant
      les deux traits qui le bordent. On lit donc le depart REEL du trace a
      l'avance de la case, en interpolant entre les deux filets qui l'encadrent,
      et la couleur attend RETRAIT apres lui.
    */
    const retardSurLeTrace = (avance: number): number => {
      if (!filets.length) return TRACE_DEBUT + avance * TRACE_ETALEMENT;
      if (avance <= filets[0].avance) return filets[0].depart;
      const dernier = filets[filets.length - 1];
      if (avance >= dernier.avance) return dernier.depart;
      for (let i = 1; i < filets.length; i += 1) {
        const a = filets[i - 1];
        const b = filets[i];
        if (avance <= b.avance) {
          const ecart = b.avance - a.avance;
          const part = ecart ? (avance - a.avance) / ecart : 0;
          return a.depart + part * (b.depart - a.depart);
        }
      }
      return dernier.depart;
    };

    cases.forEach((el) => {
      const r = el.getBoundingClientRect();
      const avance = avanceDe(r.left - cr.left, r.top - cr.top, cr);
      el.style.setProperty('--retard', `${(retardSurLeTrace(avance) + RETRAIT).toFixed(2)}s`);
    });

    comp.appendChild(calque);

    /*
      LES CASES DEJA A L'ECRAN REJOIGNENT LE TRACE. Elles attendaient leur
      propre seuil de 25%, qui n'a aucun rapport avec l'horloge des filets :
      mesure sur l'accueil pendant la construction, sept cases etaient servies
      et quatre attendaient encore, alors que leurs filets, eux, etaient en
      train de se poser. La couleur ne suivait donc pas la grille, elle
      arrivait quand le defilement voulait bien.

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

    /* On rend la main au vrai fond noir quand le dernier filet a fini. Avant,
       il manquerait des lignes ; apres, les segments feraient doublon. La fin
       se lit sur les filets eux-memes : avec des durees qui suivent la
       longueur, elle ne se calcule plus d'avance. */
    const fin = filets.reduce((max, f) => Math.max(max, f.depart + f.duree), 0);
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
