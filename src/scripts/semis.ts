import { mouvementReduit } from './motion';

/*
  ═══ LES CARRES DU HERO SE POSENT SUR LEURS CASES ═══

  La choregraphie demandee, de bout en bout :
    1. l'anneau finit de se tracer autour du portrait, puis s'efface ;
    2. trois carres naissent sous la photo, de trois tailles ;
    3. quand la composition entre dans le champ, ils VOLENT vers la case qui
       porte leur couleur - le bleu sur la bande de Governance, le jaune sur
       celle de Language, le rouge sur le carre de Surfaces ;
    4. chaque arrivee allume SA case, et le depart lance le trace des filets.

  POURQUOI DES CLONES EN position:fixed. Les carres vivent dans le hero, qui
  est en overflow:hidden : un vol qui sort de la bande serait coupe net. Et
  leur cible est plusieurs centaines de pixels plus bas, donc hors de la boite
  du hero quoi qu'il arrive. On fabrique donc un calque fixe, on y depose une
  copie de chaque carre a sa place exacte a l'ecran, et on anime la copie. Les
  originaux disparaissent a l'instant du depart ; les copies a l'arrivee.

  LE VOL NE PART QU'UNE FOIS, et seulement si les deux bouts existent. Sans
  cible, sans carre, ou sous mouvement reduit, rien ne vole : grille.ts reprend
  alors la main avec son propre observateur, et la page se construit comme
  partout ailleurs. C'est la meme regle que pour le loader - mieux vaut trois
  chemins qu'un seul elegant.
*/
const VOL = 900; // duree du vol, en ms
const ECART = 110; // decalage d'un carre au suivant

export function initSemis(): void {
  const comp = document.querySelector<HTMLElement>('[data-grille]');
  const carres = [...document.querySelectorAll<HTMLElement>('.hero__caillou')];
  if (!comp || !carres.length) return;

  /* Sous mouvement reduit on ne vole pas : on laisse grille.ts faire, et les
     carres restent ou ils sont. */
  if (mouvementReduit() || !('IntersectionObserver' in window)) return;

  /*
    NI QUAND LES CARRES NE S'AFFICHENT PAS. Sous 720px ils sont en display:none
    - la composition suit immediatement le hero, l'invitation n'a plus d'objet.
    Sans ce garde, trois copies de 0x0 partaient quand meme en vol, et c'etait
    elles qui donnaient le depart du trace au lieu de l'observateur : une
    seconde choregraphie, invisible, et un timing different de celui des six
    autres pages.
  */
  if (carres.some((c) => c.getBoundingClientRect().width === 0)) return;

  /* La composition attend desormais notre signal : voir grille.ts. */
  comp.dataset.semis = 'attente';

  const cible = (c: HTMLElement) =>
    c.dataset.couleur
      ? document.querySelector<HTMLElement>(`[data-cible="${c.dataset.couleur}"]`)
      : null;

  /* Pas de cible pour l'un d'eux : on ne tente rien et on rend la main. */
  if (carres.some((c) => !cible(c))) {
    comp.dataset.semis = 'sans';
    comp.dispatchEvent(new CustomEvent('semis'));
    return;
  }

  let parti = false;
  const voler = () => {
    if (parti) return;
    parti = true;

    const calque = document.createElement('div');
    calque.className = 'semis';
    calque.setAttribute('aria-hidden', 'true');
    document.body.appendChild(calque);

    let restants = carres.length;

    carres.forEach((carre, i) => {
      const but = cible(carre)!;
      const a = carre.getBoundingClientRect();
      /*
        LA CIBLE SE MESURE EN BOITE DE MISE EN PAGE, PAS EN RECTANGLE RENDU.
        L'aplat vise est en scale(0) tant que sa case n'est pas allumee :
        getBoundingClientRect() le rend alors ecrase sur son coin d'ancrage -
        (104, 972) pour la bande de Governance au lieu de son milieu. Les
        offset* ignorent les transformations ; combines au rectangle de la
        case, qui n'en porte aucune, ils donnent la place que l'aplat OCCUPERA.
      */
      const cellule = but.closest<HTMLElement>('.cell') ?? but.parentElement!;
      const rc = cellule.getBoundingClientRect();
      const b = {
        left: rc.left + but.offsetLeft,
        top: rc.top + but.offsetTop,
        width: but.offsetWidth,
        height: but.offsetHeight,
      };

      const copie = document.createElement('span');
      copie.className = 'semis__carre';
      copie.style.cssText =
        `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;` +
        `background:${getComputedStyle(carre).backgroundColor};` +
        `transition-duration:${VOL}ms;transition-delay:${i * ECART}ms`;
      calque.appendChild(copie);
      carre.style.opacity = '0';

      /* Lecture forcee : sans elle le navigateur regroupe l'ecriture de la
         position de depart et celle de la transformation, et la copie se
         retrouve a l'arrivee sans avoir voyage. */
      void copie.offsetWidth;

      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      copie.style.transform = `translate(${dx}px, ${dy}px) scale(1.25)`;
      copie.style.opacity = '0';

      const arrivee = () => {
        /*
          LA CASE S'ALLUME A L'ARRIVEE DE SON CARRE, et sans retard : le retard
          calcule par grille.ts fait suivre les couleurs au trace, ce qui est
          juste pour les cases qu'aucun carre ne vise. Celles-ci, elles, ont
          une raison d'arriver maintenant - un carre vient de s'y poser.
        */
        const caseCible = but.closest<HTMLElement>('.cell, .duo > *, .os');
        if (caseCible) {
          caseCible.style.setProperty('--retard', '0s');
          caseCible.classList.remove('attend');
          caseCible.classList.add('vu');
        }
        copie.remove();
        restants -= 1;
        if (!restants) calque.remove();
      };
      copie.addEventListener('transitionend', arrivee, { once: true });
      /* Filet : une transition qui ne demarre pas n'emet rien. */
      window.setTimeout(arrivee, VOL + i * ECART + 250);
    });

    /* Le trace part AVEC les carres, pas apres : les filets se dessinent
       pendant qu'ils descendent, et la grille est prete a les recevoir. */
    comp.dataset.semis = 'parti';
    comp.dispatchEvent(new CustomEvent('semis'));
  };

  new IntersectionObserver(
    (entrees, obs) => {
      entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        voler();
        obs.disconnect();
      });
    },
    { threshold: 0.15 },
  ).observe(comp);
}
