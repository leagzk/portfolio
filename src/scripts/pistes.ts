/*
  LES BANDES D'IMAGES DEVIENNENT DES PISTES SOUS LE PALIER, et une piste qui
  defile DOIT etre focalisable : c'est ce qui donne les fleches du clavier a
  qui n'a pas de souris. Au-dessus du palier ces memes bandes sont des grilles,
  ou l'arret de tabulation ne menerait nulle part.

  L'ATTRIBUT SUIT DONC LE DEBORDEMENT REEL, ET NON LE PALIER. Une requete media
  ne peut pas retirer un attribut, et une largeur de fenetre ne dit pas si la
  bande deborde - trois planches a 88% defilent, deux a 88% aussi, une seule
  non. On mesure, au premier rendu comme au redimensionnement. Meme regle que
  la piste du carrousel, pour la meme raison.

  L'ETIQUETTE EST LE SURTITRE QUI PRECEDE. Chacune de ces bandes en a un -
  « Three directions explored », « Sample of corporate constraints » - et c'est
  deja le nom de la serie. L'ecrire une seconde fois en dur ferait deux
  endroits a tenir d'accord. La mosaique, elle, porte deja les siens dans le
  HTML : on ne touche pas a ce qui est ecrit.

  Voir les regles de piste dans src/styles/etude.css (@media max-width:860px).
*/
export function initPistes(): void {
  const bandes = document.querySelectorAll<HTMLElement>(
    /* `.pilep` porte deja son `aria-label` et son role de liste : il ne vient
       chercher ici que le `tabindex`, pour que la piste se parcoure au clavier
       comme les autres. */
    '.pan .three:not(.three--pile), .pan .two, .pan .four, .pan .mosaic, .pan .pilep',
  );
  if (!bandes.length) return;

  /*
    DEBORDER NE SUFFIT PAS, ENCORE FAUT-IL DEFILER. `scrollWidth` depasse aussi
    quand le contenu sort d'une boite en `overflow:visible` - c'est le cas de
    la pile des concepts au bureau, dont les sept planches sont posees en
    absolu les unes sur les autres. Elle y annoncait donc un `tabindex` vers
    un defilement qui n'existe pas. On verifie l'axe lui-meme.
  */
  const defile = (e: HTMLElement) => {
    const ox = getComputedStyle(e).overflowX;
    return (ox === 'auto' || ox === 'scroll') && e.scrollWidth > e.clientWidth + 1;
  };

  const suivre = () => {
    bandes.forEach((bande) => {
      if (defile(bande)) {
        bande.setAttribute('tabindex', '0');
        if (!bande.hasAttribute('role')) bande.setAttribute('role', 'group');
        if (!bande.hasAttribute('aria-label')) {
          const avant = bande.previousElementSibling;
          const nom = avant?.classList.contains('eb')
            ? avant.textContent?.trim()
            : '';
          if (nom) bande.dataset.nomPose = nom, bande.setAttribute('aria-label', nom);
        }
      } else {
        bande.removeAttribute('tabindex');
        /* on ne retire que ce qu'on a pose : la mosaique porte les siens. */
        if (bande.dataset.nomPose) {
          bande.removeAttribute('role');
          bande.removeAttribute('aria-label');
          delete bande.dataset.nomPose;
        }
      }
    });
  };

  /*
    UN OBSERVATEUR DE TAILLE, ET PAS SEULEMENT `resize`. Les bandes vivent
    dans des chapitres masques au chargement : sans mise en page, elles ne
    debordent pas, donc aucune ne recevait son `tabindex` - et comme rien ne
    repassait a l'ouverture du chapitre, elles ne l'ont JAMAIS eu. Le defaut
    ne touchait pas que la pile : toutes les pistes des trois etudes etaient
    hors d'atteinte au clavier.

    L'observateur se declenche quand la bande passe de 0 a sa largeur, donc a
    l'ouverture, et aussi a chaque changement de largeur - ce que faisait
    `resize`, qui n'a plus lieu d'etre.
  */
  suivre();
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(suivre);
    bandes.forEach((b) => ro.observe(b));
  } else {
    addEventListener('resize', suivre, { passive: true });
  }
}
