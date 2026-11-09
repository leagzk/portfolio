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
    '.pan .three, .pan .four, .pan .mosaic',
  );
  if (!bandes.length) return;

  const suivre = () => {
    bandes.forEach((bande) => {
      if (bande.scrollWidth > bande.clientWidth + 1) {
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

  suivre();
  addEventListener('resize', suivre, { passive: true });
}
