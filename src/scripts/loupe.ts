/*
  LE SRCSET EST RECOPIE DEPUIS LA VIGNETTE, ET SEUL `sizes` CHANGE.

  C'est ce qui evite un second jeu de fichiers : Astro a deja fabrique toute
  l'echelle de largeurs, et `sizes` est ce qui dit au navigateur laquelle
  prendre. Passer de « 340px » a « 92vw » suffit a lui faire chercher la grande.
  On ecrit `sizes` AVANT `srcset` : dans l'autre ordre, le navigateur choisit
  avec l'ancienne valeur et telecharge la petite.
*/
export function initLoupe(): void {
  const loupe = document.querySelector<HTMLDialogElement>('#loupe');
  if (!loupe) return;

  const plate = loupe.querySelector<HTMLImageElement>('.loupe__img');
  const cadre = loupe.querySelector<HTMLElement>('.loupe__cadre');
  const legende = loupe.querySelector<HTMLElement>('.loupe__legende');
  if (!plate || !cadre || !legende) return;
  const dedans = cadre.querySelector<HTMLImageElement>('img');
  if (!dedans) return;

  const montrer = (bouton: HTMLElement) => {
    const source = bouton.querySelector<HTMLImageElement>('img');
    if (!source) return;
    const page = bouton.dataset.loupe === 'cadre';
    const cible = page ? dedans : plate;

    plate.hidden = page;
    cadre.hidden = !page;
    cible.sizes = '92vw';
    cible.srcset = source.srcset;
    cible.src = source.src;
    cible.alt = source.alt;
    /* le --r du fichier voyage avec l'image ; le --fr est celui du cadre de la
       loupe, qui le redeclare lui-meme selon la place disponible */
    if (page) cadre.style.setProperty('--r', bouton.style.getPropertyValue('--r'));
    legende.textContent = bouton.dataset.legende ?? '';
    loupe.showModal();
  };

  document.querySelectorAll<HTMLElement>('.zoom').forEach((b) =>
    b.addEventListener('click', () => montrer(b)),
  );

  /*
    Un seul ecouteur pour les deux fermetures. Le clic « en dehors » se
    reconnait a ce que sa cible EST le dialog : le fond assombri n'est pas un
    element, les evenements qu'il recoit sont attribues au dialog lui-meme.
  */
  loupe.addEventListener('click', (e) => {
    const cible = e.target as HTMLElement;
    if (cible === loupe || cible.closest('[data-fermer]')) loupe.close();
  });

  /* on vide l'image a la fermeture : laissee en place, elle continuerait a
     occuper sa memoire decodee pour une boite que personne ne regarde */
  loupe.addEventListener('close', () => {
    [plate, dedans].forEach((i) => {
      i.removeAttribute('srcset');
      i.removeAttribute('src');
    });
  });
}
