import { mouvementReduit } from './motion';

/*
  Les trois cartes depliables d'une etude de cas (BRIEF §5.3).

  Une seule section ouverte a la fois, aucune a l'ouverture de la page, et
  re-cliquer sur la carte ouverte la referme. L'etat vit sur le bouton
  (`aria-expanded`) et sur la section (`hidden`) - pas dans une variable de
  module : l'affichage et ce qu'annonce un lecteur d'ecran ne peuvent donc pas
  diverger, et on peut lire l'etat de la page dans l'inspecteur.

  LE CONTENU EST DANS LE HTML, MASQUE - pas charge au clic. Il est donc indexe,
  il sort dans l'export de contenu, et le depliage ne demande aucun aller-retour.
  Le revers, assume : sans JavaScript les trois sections restent fermees. Le
  reste de la page ne tient pas davantage sans script - menu mobile, carrousels,
  construction de la grille - et le contenu, lui, n'est pas perdu : il est la,
  lisible par tout ce qui lit le document plutot que la mise en page.

  LE DEFILEMENT N'EST PAS UNE COQUETTERIE. Les boutons « Next: the approach » et
  « Next: the proof » sont tout en BAS de la section qu'ils ferment. Sans rien
  faire, on se retrouverait au milieu de la suivante - ou apres sa fin si elle
  est plus courte. On remonte donc a la composition, et le focus va sur la carte
  qui vient de s'ouvrir : celui qui navigue au clavier reprend la ou le contenu
  commence, pas la ou le bouton a disparu.
*/
export function initDossier(): void {
  const cartes = Array.from(document.querySelectorAll<HTMLButtonElement>('.dcarte'));
  if (!cartes.length) return;

  const compo = document.querySelector<HTMLElement>('.compo');
  const section = (carte: HTMLButtonElement): HTMLElement | null => {
    const id = carte.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  };

  const fermer = (carte: HTMLButtonElement) => {
    carte.setAttribute('aria-expanded', 'false');
    const pan = section(carte);
    if (!pan) return;
    pan.hidden = true;
    pan.classList.remove('pan--ouvre');
  };

  const ouvrir = (carte: HTMLButtonElement) => {
    cartes.forEach((autre) => autre !== carte && fermer(autre));
    carte.setAttribute('aria-expanded', 'true');
    const pan = section(carte);
    if (!pan) return;
    pan.hidden = false;
    /* La classe est retiree a la fin pour que la meme section puisse se
       re-animer si on la referme et la rouvre : une animation deja posee ne
       rejoue pas. */
    pan.classList.add('pan--ouvre');
    pan.addEventListener('animationend', () => pan.classList.remove('pan--ouvre'), { once: true });
  };

  /* Ferme au chargement - l'attribut est deja ecrit a "false" dans le HTML,
     donc rien ne clignote ; on pose seulement `hidden` sur les sections. */
  cartes.forEach((carte) => fermer(carte));

  cartes.forEach((carte) => {
    carte.addEventListener('click', () => {
      if (carte.getAttribute('aria-expanded') === 'true') fermer(carte);
      else ouvrir(carte);
    });
  });

  /*
    Les boutons de fin de partie. `data-suite` porte l'id de la carte a ouvrir,
    et non celui de la section : c'est la carte qui est la commande, et c'est
    par elle qu'on passe pour que le remplissage de couleur se joue aussi.
  */
  document.querySelectorAll<HTMLElement>('[data-suite]').forEach((b) => {
    b.addEventListener('click', () => {
      const cible = cartes.find((c) => c.id === b.dataset.suite);
      if (!cible) return;
      ouvrir(cible);
      compo?.scrollIntoView({
        block: 'start',
        behavior: mouvementReduit() ? 'auto' : 'smooth',
      });
      /* preventScroll : le defilement doux ci-dessus fait le trajet, et un
         focus qui saute en meme temps l'annulerait. */
      cible.focus({ preventScroll: true });
    });
  });
}
