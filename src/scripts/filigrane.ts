/*
  Le mot en filigrane du hero, mis a l'echelle sur toute la largeur (BRIEF §4.2).

  LE PROBLEME QU'IL RESOUT. Ce mot etait du texte CSS dont la taille etait posee
  A LA MAIN, par page, en cqw : --culture-size valait 27.6 pour « System »,
  19.1 pour « Philosophy », 21.3 pour « Language »... Sept valeurs trouvees a
  l'oeil, parce que « pleine largeur » n'est pas une taille unique quand les
  mots n'ont pas la meme longueur. Toute retouche de police ou de graisse les
  fausse toutes les sept, en silence.

  CE QU'ON FAIT A LA PLACE. Le mot est un <text> dans un <svg>. On mesure sa
  boite reelle avec getBBox() et on la recopie dans le viewBox. Le SVG est pose
  en width:100%, height:auto : le navigateur en deduit le rapport du viewBox et
  met le dessin a l'echelle LUI-MEME, uniformement. Aucune valeur a regler, et
  l'espacement des lettres n'est pas etire - ce que ferait un
  preserveAspectRatio="none".

  getBBox() DONNE LES JAMBAGES. C'est l'autre raison du SVG : la boite inclut
  la descendante du « g » de Giezek, que la hauteur de ligne CSS coupait.

  ON ATTEND document.fonts.ready. Mesurer avant que Hanken Grotesk ne soit la,
  c'est mesurer la police de secours : le viewBox serait cale sur une autre
  largeur de glyphes et le mot deborderait ou flotterait. C'est aussi pour ca
  que la mesure ne peut pas se faire au build.
*/
export function ajusterFiligranes(): void {
  const mesurer = () => {
    document.querySelectorAll<SVGSVGElement>('[data-filigrane]').forEach((svg) => {
      const texte = svg.querySelector('text');
      if (!texte) return;
      let b: DOMRect;
      try {
        b = texte.getBBox();
      } catch {
        /* element non rendu (display:none, onglet jamais peint) : on garde le
           viewBox de secours ecrit dans le markup plutot que de poser du NaN */
        return;
      }
      if (!b.width || !b.height) return;
      svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`);
      svg.dataset.filigrane = 'mesure';
    });
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(mesurer);
  } else {
    mesurer();
  }
  /* La largeur du conteneur ne change pas la mesure - le viewBox est en unites
     de dessin - donc rien a recalculer au redimensionnement. Seul un changement
     de police le ferait, et il n'y en a qu'une. */
}
