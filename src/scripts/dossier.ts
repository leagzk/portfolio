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
    LE SOMMAIRE DE LA MOITIE BLANCHE, ET IL SE CHOISIT. Les phrases sont
    balisees `data-sommaire` dans la page, une par une.

    IL A D'ABORD PRIS TOUTES LES `.lead`, et c'etait une facilite : chaque
    sous-partie s'ouvre sur une phrase forte, donc le sommaire se faisait
    tout seul. Sauf qu'une phrase forte n'est pas forcement DE LA CATEGORIE
    DU CHAPITRE. Le chapitre 01 s'appelle « The problem » et ses puces
    annoncaient l'enjeu du systeme puis la decision de l'internaliser - deux
    choses tres bien ecrites, mais qui ne sont pas des bloquants. Un sommaire
    qui annonce autre chose que son titre fait perdre le fil plus surement
    qu'un sommaire absent.

    ON NE RECOPIE TOUJOURS RIEN. La balise se pose sur la phrase LA OU ELLE
    VIT - sur une `.lead`, sur un <strong> au milieu d'un paragraphe, sur un
    <span> autour du seul membre voulu. Le sommaire ne peut donc pas deriver
    de ce qu'il annonce, et il n'y a pas deux versions d'une meme phrase a
    tenir a jour. L'ordre des puces est celui du document.

    ON CLONE LE CONTENU, ON NE COPIE PAS LE TEXTE. Les phrases portent des
    <em> qui colorent un membre - « That's the tax. » en rouge - et c'est la
    moitie de leur forme. `textContent` les aurait aplaties.

    LE SOMMAIRE EST UN FRERE DE LA CARTE, pas un enfant : la carte est un
    <button>, qui ne peut contenir que du contenu de phrase - une <ul> dedans
    serait du HTML invalide. Il prend donc sa case dans la grille, a cote
    d'elle. Voir .compo__sommaire dans etude.css.
  */
  const COULEURS = ['rouge', 'bleu', 'jaune', 'noir'] as const;
  const sommaire = (carte: HTMLButtonElement, pan: HTMLElement) => {
    compo?.querySelector('.compo__sommaire')?.remove();
    const phrases = Array.from(pan.querySelectorAll<HTMLElement>('[data-sommaire]'));
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

  /*
    LES MEMES PHRASES, SUR LA CARTE FERMEE, POUR LE TELEPHONE. Le sommaire
    ci-dessus prend une case de la composition : il n'y a pas de case libre
    sous le palier, ou la bande EST la carte. Les trois puces y sont donc
    posees DANS la carte, sous sa synthese, et elles s'y lisent avant qu'on
    ouvre - c'est le moment ou elles servent, puisque c'est la qu'on decide
    d'ouvrir.

    EN <span> ET NON EN <ul> : la carte est un <button>, qui n'accepte que du
    contenu de phrase. C'est deja la raison pour laquelle le sommaire du
    bureau est un FRERE de la carte et non son enfant.

    `aria-hidden` SUR LE BLOC ENTIER, et ce n'est pas un detail de confort :
    le nom accessible d'un bouton est son texte, donc trois phrases de plus
    le rendraient interminable a l'ecoute. Le contenu, lui, est annonce dans
    le panneau - le meme arbitrage que pour le sommaire du bureau.

    POSEES UNE FOIS AU CHARGEMENT, pas a l'ouverture : elles existent quand la
    carte est fermee, donc leur cycle de vie n'est pas celui du panneau.
  */
  cartes.forEach((carte) => {
    const pan = section(carte);
    const corps = carte.querySelector<HTMLElement>('.dcarte__corps');
    if (!pan || !corps) return;
    const phrases = Array.from(pan.querySelectorAll<HTMLElement>('[data-sommaire]'));
    if (!phrases.length) return;
    const bloc = document.createElement('span');
    bloc.className = 'dcarte__points';
    bloc.setAttribute('aria-hidden', 'true');
    phrases.forEach((p) => {
      const point = document.createElement('span');
      point.className = 'dcarte__point';
      point.append(...Array.from(p.cloneNode(true).childNodes));
      bloc.appendChild(point);
    });
    corps.appendChild(bloc);
  });

  /*
    LE DEFILEMENT DOUX A UNE PORTEE, AU-DELA IL FAIT ATTENDRE. D'un bouton
    « Next: ... », pose tout en bas d'un chapitre, la composition est a plus de
    mille pixels : le trajet dure presque une seconde, pendant laquelle le
    contenu demande est deja la mais invisible. Mesure : 1164px depuis la fin
    du chapitre 01.

    AU-DELA D'UN ECRAN, ON COUPE au lieu de glisser : des que la cible est hors
    champ d'une hauteur entiere, le glissement ne montre plus rien - il fait
    defiler du contenu qu'on ne lit pas. C'est un SAUT demande, pas un
    parcours. En deca, le glissement garde son role : dire d'ou l'on vient
    quand on vient de tout pres.

    UN ECRAN ET NON UN ECRAN ET DEMI, mesure : le bouton « Next: the approach »
    est a 1106px de la composition pour une fenetre de 1050. A 1.5 il glissait
    encore, et c'est precisement le cas que Lea a signale.

    « instant » ET NON « auto », ET LA NUANCE FAIT TOUTE LA DIFFERENCE.
    `behavior: 'auto'` ne veut pas dire « saute » : il veut dire « applique le
    `scroll-behavior` de l'element ». Or reset.css pose
    `html{scroll-behavior:smooth}`. La branche qui devait couper rendait donc
    exactement le meme glissement que l'autre - le reglage ne faisait rien.
    Mesure : clic sur le retour en haut a 7015px de la composition, position
    inchangee a la ligne suivante. Seul `instant` passe outre la feuille de
    style.
  */
  const PORTEE_DOUCE = 1;
  const remonter = () => {
    if (!compo) return;
    const trajet = Math.abs(compo.getBoundingClientRect().top);
    const doux = !mouvementReduit() && trajet < innerHeight * PORTEE_DOUCE;
    compo.scrollIntoView({ block: 'start', behavior: doux ? 'smooth' : 'instant' });
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
    Le bouton de fin du dernier chapitre partage ce gestionnaire : apres le
    dernier « Next » il n'y a pas de tuile suivante, et la seule suite possible
    est le sommaire lui-meme, que la reduction de la composition avait fait
    disparaitre.
  */
  /*
    RETOUR EN HAUT : ON REFERME TOUT. Le bouton se contentait de remonter, en
    laissant le chapitre deplie - l'idee etant qu'on revient au sommaire sans
    perdre sa lecture. Mais ce qu'on retrouve alors n'est pas le sommaire :
    c'est `.compo--solo`, une seule carte sur toute la largeur. Le geste
    promet un retour a la page et rend un etat intermediaire.

    IL FAIT DONC EXACTEMENT CE QUE FAIT LE BOUTON DE FIN DE DOSSIER, d'ou un
    seul gestionnaire pour les deux : fermer, recomposer, remonter, et rendre
    le focus a la carte du chapitre qu'on quitte - pas a la premiere des
    quatre, qui obligerait a retraverser le sommaire a la tabulation.

    ET RIEN NE SE REJOUE. La composition restauree ramene a l'ecran des cartes
    qui etaient en `display:none`, ce qui RELANCE leurs animations d'entree ;
    `poser` dans grille.ts les neutralise une fois l'entree faite. Le
    defilement, lui, est deja coupe par la portee de `remonter` : depuis le
    bas d'un chapitre la composition est a plus d'un ecran.
  */
  document.querySelectorAll<HTMLElement>('[data-haut],[data-ferme]').forEach((b) => {
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
