import { mouvementReduit } from './motion';

/*
  Ecran de chargement de l'accueil : la photo apparait seule au centre d'un
  panneau noir, puis glisse et se pose sur le portrait rond de la page
  (BRIEF §3.1). Elle y remplace le piment, qui rejoignait la pastille de choix
  de theme - pastille supprimee avec le selecteur.

  LA CIBLE EST DESIGNEE PAR ATTRIBUT, `[data-portrait]`, et non par une classe.
  Deux elements le portent aujourd'hui et un seul est visible a la fois : le
  portrait de la banniere sous 720px, la carte ronde de l'accueil au-dessus.
  On prend le premier qui a une boite non nulle. L'etape 3 remplacera cette
  carte par le cercle de 360px du hero : il suffira qu'il porte le meme
  attribut pour que le loader le vise, sans retoucher ce fichier.

  Trois sorties possibles, volontairement redondantes : la fin de la transition,
  un filet de securite a 2600 ms, et le cas ou aucune cible n'est visible.
  Un loader qui ne se retire pas rend le site inutilisable - mieux vaut trois
  chemins qu'un seul elegant.
*/
export function initLoader(): void {
  const loaderEl = document.getElementById('loader');
  if (!loaderEl) return;

  if (mouvementReduit()) {
    loaderEl.style.display = 'none';
    return;
  }

  const fly = document.getElementById('fly');
  const halo = document.getElementById('halo');
  const panel = loaderEl.querySelector<HTMLElement>('.loader__panel');
  /* visible = boite non nulle. `offsetParent` ne suffirait pas : il vaut null
     sur un element en position:fixed, ce que la banniere pourrait devenir. */
  const cible = [...document.querySelectorAll<HTMLElement>('[data-portrait]')].find(
    (el) => el.getBoundingClientRect().width > 0,
  );
  let done = false;

  const finir = () => {
    if (done) return;
    done = true;
    /*
      On RETIRE la propriete au lieu de la remettre a 1. La cible de l'accueil
      est une carte qui attend sa propre animation d'entree (.js .drag .dcard
      est a opacity:0) : lui ecrire `opacity:1` en ligne gagnerait contre cette
      animation et la carte arriverait sans elle. Retirer rend la main au CSS,
      quel que soit l'etat qu'il decrit.
    */
    cible?.style.removeProperty('opacity');
    loaderEl.style.display = 'none';
  };

  /*
    LE HALO S'EFFACE AU DEPART DU VOL, et c'est le script qui le fait.
    Les trois anneaux vivent dans .loader__fly : ils suivraient la photo et se
    mettraient a l'echelle de la cible, donc une onde de 2,1 fois un portrait
    de 360px balaierait la moitie de l'ecran. Appele dans les trois sorties -
    y compris celles ou le vol n'a pas lieu - pour qu'aucun chemin ne laisse
    les anneaux pulser sur un panneau qui disparait.
  */
  const eteindreHalo = () => { if (halo) halo.style.opacity = '0'; };

  setTimeout(() => {
    eteindreHalo();
    if (!cible || !fly || !panel) {
      if (panel) panel.style.opacity = '0';
      setTimeout(finir, 600);
      return;
    }
    const t = cible.getBoundingClientRect();
    const f = fly.getBoundingClientRect();
    /*
      LA CIBLE DOIT ETRE A L'ECRAN, sinon la photo s'envole vers du vide.
      Au bureau le seul portrait rond de l'accueil vit aujourd'hui dans la zone
      des cartes, 1100px sous la ligne de flottaison : le vol sortirait du
      cadre par le bas. Tant que le hero n'a pas son cercle de 360px (BRIEF
      §3.1, etape 3), on degrade - la photo s'efface sur place avec le panneau.
      Le garde-fou reste utile apres : il protege de toute cible hors champ.
    */
    if (t.bottom < 0 || t.top > window.innerHeight) {
      fly.style.opacity = '0';
      panel.style.opacity = '0';
      setTimeout(finir, 600);
      return;
    }
    const dx = t.left + t.width / 2 - (f.left + f.width / 2);
    const dy = t.top + t.height / 2 - (f.top + f.height / 2);
    cible.style.opacity = '0';
    panel.style.opacity = '0';
    fly.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${t.width / f.width})`;
  }, 1450);

  fly?.addEventListener('transitionend', (e) => {
    if ((e as TransitionEvent).propertyName === 'transform') finir();
  });
  /* Filet de securite, releve avec le depart du vol : 1 450 + 850 de vol =
     2 300, il faut lui laisser de la marge. */
  setTimeout(finir, 2900);
}
