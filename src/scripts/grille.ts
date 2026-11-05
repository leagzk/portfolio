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
const TRACE_DUREE = 0.5; // duree d'un filet
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
      L'AMORCE EST LE PREMIER FILET. Elle vit hors de la composition - dans la
      marge qui la separe du hero - parce qu'elle doit traverser une frontiere
      que .compo ne franchit pas. Elle est tracee ici, a l'instant ou le reste
      s'amorce : c'est elle qui amene le trait du hero jusqu'au coin haut
      gauche d'ou part la diagonale.
    */
    comp.parentElement?.querySelector('[data-amorce]')?.classList.add('tracee');

    const calque = document.createElement('div');
    calque.className = 'segs';
    calque.setAttribute('aria-hidden', 'true');
    const ep = 2;
    const vus = new Set<string>();

    const poser = (sens: 'v' | 'h', l: number, t: number, w: number, h: number) => {
      /* Deux cases voisines partagent un bord : sans ce garde le meme filet
         serait dessine - et anime - deux fois, et le recouvrement se verrait. */
      const cle = `${sens}${Math.round(l)}:${Math.round(t)}:${Math.round(w)}:${Math.round(h)}`;
      if (vus.has(cle)) return;
      vus.add(cle);
      const seg = document.createElement('span');
      seg.className = `seg seg--${sens}`;
      seg.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`;
      /* L'avance se mesure au point ou le filet COMMENCE a se tracer : son
         coin haut gauche, qui est aussi son transform-origin. */
      seg.style.animationDelay = `${(TRACE_DEBUT + avanceDe(l, t, cr) * TRACE_ETALEMENT).toFixed(2)}s`;
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

    comp.appendChild(calque);
    /* On rend la main au vrai fond noir quand le dernier filet a fini. Avant,
       il manquerait des lignes ; apres, les segments feraient doublon. */
    window.setTimeout(() => {
      comp.classList.remove('pre');
      calque.remove();
      comp.dataset.phase = 'fini';
    }, (TRACE_DEBUT + TRACE_ETALEMENT + TRACE_DUREE) * 1000);
  };

  /*
    Deux observateurs, deux seuils. Les filets partent des que la composition
    pointe (10%) - c'est la structure, elle doit preceder ce qu'elle contient.
    Chaque case, elle, attend d'etre vraiment entree (25%), sinon tout se
    declencherait d'un coup sur un grand ecran ou la composition tient presque
    entiere.
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
