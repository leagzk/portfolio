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

  LE DELAI VIENT DE LA POSITION, pas d'un index. `(gauche + haut) / (largeur +
  hauteur)` donne une diagonale depuis le coin haut gauche : les filets se
  rejoignent en T au lieu d'arriver en ordre disperse.

  SANS SCRIPT, LA COMPOSITION EST SIMPLEMENT LA. Toutes les classes d'animation
  sont posees ici ; le CSS n'en declare que les regles. Si ce fichier ne tourne
  pas - erreur, JS coupe, mouvement reduit - tout s'affiche d'un coup.
*/

/* Les aplats, avec le retard qu'ils prennent sur l'entree de LEUR case. Ce
   n'est plus un calendrier absolu : chaque case a le sien, puisqu'elles
   n'arrivent plus toutes en meme temps. */
const APLATS: Record<string, number> = {
  '.wt__fragment': 0.15,
  '.pr': 0.2,
  '.os__bande': 0.35,
};

export function tracerGrille(): void {
  const comp = document.querySelector<HTMLElement>('[data-grille]');
  if (!comp) return;
  if (mouvementReduit() || !('IntersectionObserver' in window)) return;

  /*
    `.principes` est en display:contents : ses enfants sont des cases de la
    grille sans etre enfants directs de .comp, d'ou les deux sources.
  */
  const cases = [
    ...Array.from(comp.children).filter((el) => !el.classList.contains('principes')),
    ...Array.from(comp.querySelector('.principes')?.children ?? []),
  ] as HTMLElement[];

  /* Etat d'attente pose tout de suite : sans lui le contenu s'affiche puis
     disparait pour se re-animer quand l'observateur se declenche. */
  comp.classList.add('pre');
  cases.forEach((el) => el.classList.add('attend'));

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

    const poser = (sens: 'v' | 'h', l: number, t: number, w: number, h: number) => {
      /* Deux cases voisines partagent un bord : sans ce garde le meme filet
         serait dessine - et anime - deux fois, et le recouvrement se verrait. */
      const cle = `${sens}${Math.round(l)}:${Math.round(t)}:${Math.round(w)}:${Math.round(h)}`;
      if (vus.has(cle)) return;
      vus.add(cle);
      const seg = document.createElement('span');
      seg.className = `seg seg--${sens}`;
      seg.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`;
      seg.style.animationDelay = `${(0.05 + ((l + t) / (W + H)) * 0.8).toFixed(2)}s`;
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
    window.setTimeout(() => {
      comp.classList.remove('pre');
      calque.remove();
    }, 1700);
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
    entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      const cellule = e.target as HTMLElement;
      cellule.classList.remove('attend');
      cellule.classList.add('vu');
      Object.entries(APLATS).forEach(([sel, retard]) => {
        cellule.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.animationDelay = `${retard}s`;
        });
      });
      obs.unobserve(cellule);
    });
  }, { threshold: 0.25 });
  cases.forEach((el) => ioCases.observe(el));
}
