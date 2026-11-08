/*
  Les aplats depliables du bandeau de chiffres (forme « mondrian »).

  LE CLIC EN PLUS DU SURVOL, ET C'EST TOUT CE QUE CE FICHIER FAIT. Le depliage
  lui-meme est en CSS - `:hover`, `:focus-visible` et `[aria-expanded="true"]`
  partagent la meme regle dans etude.css. Mais sur telephone, ni survol ni
  focus clavier : sans le clic, le contexte serait inatteignable, et ce sont
  les lignes qui donnent leur valeur aux chiffres (BRIEF §2.7 et §11).

  PLUSIEURS OUVERTS A LA FOIS, VOLONTAIREMENT. Ce ne sont pas les chapitres de
  l'etude, qui s'excluent parce qu'ils occupent la meme place ; ce sont cinq
  preuves cote a cote, et comparer deux contextes est une lecture legitime.

  L'ETAT VIT SUR LE BOUTON (`aria-expanded`), jamais dans une variable de
  module : ce qui s'affiche et ce qu'annonce un lecteur d'ecran ne peuvent donc
  pas diverger, et l'etat de la page se lit dans l'inspecteur.

  ═══ UNE SEULE VOISINE SE TAIT, ET C'EST CELLE QU'ON RECOUVRE ═══

  Sous le palier la case ouverte s'etend sur sa voisine et ne lui laisse que
  36px : il n'y a pas de place pour une ligne de texte, et un mot coupe en
  pleine lettre se lit comme un bug. Cette voisine-la perd donc son contenu.

  LES AUTRES LE GARDENT. Le CSS vidait toutes les cases de la bande d'un coup,
  parce que c'est ce que fait le bureau - ou le geste est au SURVOL, donc se
  defait des que le curseur bouge. Au doigt il n'y a pas de survol : l'etat
  reste, et retrouver les quatre autres chiffres demandait un tap de plus.
  Recopier le geste n'etait pas le transposer.

  QUELLE VOISINE : au telephone les cases se rangent deux par deux dans
  l'ordre du front, donc celle de rang i est couverte par celle de rang i^1 -
  0 avec 1, 2 avec 3, 4 avec 5. Le CSS ne sait pas exprimer ca : la paire
  peut enjamber deux `.clef-rangee` (celle de Governance en porte trois pour
  deux colonnes), donc aucun selecteur de fratrie ne l'atteint.

  ET LES DEUX D'UNE PAIRE NE S'OUVRENT PAS ENSEMBLE, sous le palier
  seulement : elles se disputeraient la meme largeur de rangee et se
  recouvriraient l'une l'autre. Au-dela, les rangees sont des bandes flex et
  rien n'empeche plus d'en ouvrir plusieurs - c'est le propos du paragraphe
  ci-dessus.
*/
const PALIER = '(max-width: 860px)';

export function initChiffres(): void {
  document.querySelectorAll<HTMLElement>('.cles--mondrian').forEach((bande) => {
    const cases = [...bande.querySelectorAll<HTMLElement>('.clef-case')];
    const clef = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('.clef');

    /* La voisine de chaque case ouverte se tait ; toutes les autres parlent. */
    const majCouvertes = () => {
      cases.forEach((c) => c.classList.remove('clef-case--couverte'));
      if (!window.matchMedia(PALIER).matches) return;
      cases.forEach((c, i) => {
        if (clef(c)?.getAttribute('aria-expanded') !== 'true') return;
        cases[i ^ 1]?.classList.add('clef-case--couverte');
      });
    };

    cases.forEach((c, i) => {
      const b = clef(c);
      if (!b) return;
      b.addEventListener('click', () => {
        const ouvre = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', ouvre ? 'true' : 'false');
        /* La derniere case d'un compte impair n'a pas de voisine : c'est
           l'aplat de bouchage qui lui fait face, et il n'a rien a fermer. */
        const voisine = cases[i ^ 1];
        if (ouvre && voisine && window.matchMedia(PALIER).matches) {
          clef(voisine)?.setAttribute('aria-expanded', 'false');
        }
        majCouvertes();
      });
    });

    /* Le palier peut etre franchi par une rotation ou un redimensionnement :
       ce qui etait couvert ne l'est plus, et l'inverse. */
    window.matchMedia(PALIER).addEventListener('change', majCouvertes);
  });
}
