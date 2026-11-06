/*
  Les cases repliees de la composition Philosophy.

  TROIS CASES SUR SIX SEULEMENT en ont besoin : celles dont la description ne
  tient pas dans la case (voir l'en-tete de src/components/Conviction.astro).
  Les trois autres portent leur texte en clair et n'ont aucun bouton - ce
  script ne les voit donc pas, et c'est voulu.

  CE N'EST PAS initDossier. La ressemblance est de surface : la, une carte
  commande une <section> posee AILLEURS dans le document, et tout le travail
  du script est de relier deux noeuds eloignes puis de ramener le lecteur a la
  grille. Ici la description est DANS la case, voisine immediate du bouton :
  il n'y a rien a relier, rien ou aller. Reutiliser le meme script aurait
  demande d'y ajouter un mode, pour trente lignes qui n'auraient plus rien
  partage que le nom.

  UNE SEULE OUVERTE A LA FOIS. Chaque case a pourtant sa place propre, donc
  rien n'empeche techniquement d'en ouvrir trois. Mais une rangee de grille
  grandit avec la case la plus haute : trois ouvertes et la composition
  doublait de hauteur, les cases fermees se retrouvant etirees a cote d'un
  texte qu'elles ne portent pas. Mondrian n'y survit pas.

  L'ETAT VIT SUR LES NOEUDS - `aria-expanded` sur le bouton, `hidden` sur la
  description - et pas dans une variable de module : l'affichage et ce
  qu'annonce un lecteur d'ecran ne peuvent donc pas diverger.

  SANS SCRIPT, LES TROIS DESCRIPTIONS RESTENT FERMEES. Elles sont dans le HTML,
  donc indexees et presentes dans l'export de contenu ; c'est le meme compromis
  que les cartes des etudes de cas, et la page le dit en clair au lecteur avec
  le « + ».
*/
export function initConvictions(): void {
  const boutons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.conv--pliante .conv__tete'),
  );
  if (!boutons.length) return;

  const detail = (b: HTMLButtonElement): HTMLElement | null => {
    const id = b.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  };

  const fermer = (b: HTMLButtonElement) => {
    b.setAttribute('aria-expanded', 'false');
    const d = detail(b);
    if (d) d.hidden = true;
  };

  const ouvrir = (b: HTMLButtonElement) => {
    boutons.forEach((autre) => autre !== b && fermer(autre));
    b.setAttribute('aria-expanded', 'true');
    const d = detail(b);
    if (d) d.hidden = false;
  };

  /* Ferme au chargement. aria-expanded est deja ecrit a "false" au build et
     `hidden` est pose dans le markup : rien ne clignote, et l'etat de depart
     est le meme avec et sans JavaScript. */
  boutons.forEach(fermer);

  boutons.forEach((b) => {
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-expanded') === 'true') fermer(b);
      else ouvrir(b);
    });
  });
}
