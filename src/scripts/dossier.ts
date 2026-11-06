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

  ET ON REMONTE AUSSI AU CLIC DIRECT SUR UNE CARTE, pour la meme raison. Des
  qu'une carte s'ouvre, la composition se reduit a elle seule (`.compo--solo`,
  etude.css) : la carte 02, qui etait en quatrieme rangee, se retrouve tout en
  haut. Sans remontee, elle sortirait par le haut de l'ecran au moment meme ou
  on vient de la demander. Le geste est donc le meme partout : la carte ouverte
  devient l'en-tete du chapitre, cale sous le chrome, et le contenu part dessous.
*/
export function initDossier(): void {
  const cartes = Array.from(document.querySelectorAll<HTMLButtonElement>('.dcarte'));
  if (!cartes.length) return;

  const compo = document.querySelector<HTMLElement>('.compo');
  const section = (carte: HTMLButtonElement): HTMLElement | null => {
    const id = carte.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  };

  /*
    La classe qui reduit la composition a la carte ouverte. Ce n'est qu'un
    REFLET de l'etat : la verite reste sur les boutons (`aria-expanded`), et on
    recalcule apres chaque bascule plutot que de tenir un compteur a jour.
  */
  const majCompo = () => {
    const ouverte = cartes.some((c) => c.getAttribute('aria-expanded') === 'true');
    compo?.classList.toggle('compo--solo', ouverte);
    if (!ouverte) compo?.querySelector('.compo__sommaire')?.remove();
  };

  /*
    LE SOMMAIRE DE LA MOITIE BLANCHE. Chaque sous-partie du panneau s'ouvre sur
    une `.lead` - « Nobody meets. That's the tax. » - et ces phrases sont deja
    le resume des idees couvertes. On les reprend telles quelles plutot que de
    les ressaisir dans la page : un sommaire recopie a la main finit toujours
    par annoncer autre chose que ce qui suit.

    `[data-sommaire]` POUR CE QUI N'EST PAS UNE `.lead`. Une idee peut porter
    ailleurs que dans la phrase d'ouverture d'une sous-partie - un chiffre en
    exergue, par exemple. On balise alors le passage dans la page, et il monte
    avec les autres. L'attribut se pose sur un <span> AUTOUR du membre de
    phrase voulu, et non sur le paragraphe entier : c'est ce qui permet de
    n'en prendre qu'une partie sans la recopier. L'ordre des puces est celui
    du document, pas celui des selecteurs.

    ON CLONE LE CONTENU, ON NE COPIE PAS LE TEXTE. Les phrases portent des
    <em> qui colorent un membre - « That's the tax. » en rouge - et c'est la
    moitie de leur forme. `textContent` les aurait aplaties.

    LE SOMMAIRE EST UN FRERE DE LA CARTE, pas un enfant : la carte est un
    <button>, qui ne peut contenir que du contenu de phrase - une <ul> dedans
    serait du HTML invalide. Il prend donc sa case dans la grille, a cote
    d'elle. Voir .compo__sommaire dans etude.css.
  */
  const COULEURS = ['rouge', 'bleu', 'jaune'] as const;
  const sommaire = (carte: HTMLButtonElement, pan: HTMLElement) => {
    compo?.querySelector('.compo__sommaire')?.remove();
    const phrases = Array.from(pan.querySelectorAll<HTMLElement>('.lead,[data-sommaire]'));
    if (!compo || !phrases.length) return;
    const liste = document.createElement('ul');
    const couleur = COULEURS.find((c) => carte.classList.contains(`dcarte--${c}`));
    liste.className = `compo__sommaire${couleur ? ` compo__sommaire--${couleur}` : ''}`;
    /* doublon visuel d'un contenu qui suit : rien a redire a l'oreille */
    liste.setAttribute('aria-hidden', 'true');
    phrases.forEach((p) => {
      const item = document.createElement('li');
      item.append(...Array.from(p.cloneNode(true).childNodes));
      liste.appendChild(item);
    });
    compo.appendChild(liste);
  };

  const remonter = () => {
    compo?.scrollIntoView({
      block: 'start',
      behavior: mouvementReduit() ? 'auto' : 'smooth',
    });
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
    majCompo();
    sommaire(carte, pan);
    remonter();
  };

  /* Ferme au chargement - l'attribut est deja ecrit a "false" dans le HTML,
     donc rien ne clignote ; on pose seulement `hidden` sur les sections. */
  cartes.forEach((carte) => fermer(carte));
  majCompo();

  cartes.forEach((carte) => {
    carte.addEventListener('click', () => {
      if (carte.getAttribute('aria-expanded') === 'true') {
        fermer(carte);
        majCompo();
      } else ouvrir(carte);
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
      /* `ouvrir` reduit la composition et remonte dessus : il ne reste que le
         focus a poser. preventScroll, parce que le defilement doux fait deja le
         trajet et qu'un focus qui saute en meme temps l'annulerait. */
      ouvrir(cible);
      cible.focus({ preventScroll: true });
    });
  });

  /*
    Le bouton de fin du dernier chapitre. Apres « 03 · The proof » il n'y a pas
    de tuile suivante : la seule suite possible est le sommaire lui-meme, que la
    reduction de la composition a fait disparaitre. Ce bouton le rouvre, remonte
    dessus, et rend le focus a la carte qu'on vient de lire - pas a la premiere
    des trois, qui obligerait a retraverser le sommaire a la tabulation.
  */
  document.querySelectorAll<HTMLElement>('[data-ferme]').forEach((b) => {
    b.addEventListener('click', () => {
      const pan = b.closest<HTMLElement>('.pan');
      const cible = cartes.find((c) => c.getAttribute('aria-controls') === pan?.id);
      cartes.forEach((carte) => fermer(carte));
      majCompo();
      remonter();
      cible?.focus({ preventScroll: true });
    });
  });
}
