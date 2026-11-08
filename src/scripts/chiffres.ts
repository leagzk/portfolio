/*
  Les aplats depliables du bandeau de chiffres (forme « mondrian »).

  LE CLIC EN PLUS DU SURVOL, ET C'EST TOUT CE QUE CE FICHIER FAIT. Le depliage
  lui-meme est en CSS - `:hover`, `:focus-visible` et `[aria-expanded="true"]`
  partagent la meme regle dans etude.css. Mais sur telephone, ni survol ni
  focus clavier : sans le clic, le contexte serait inatteignable, et ce sont
  les lignes qui donnent leur valeur aux chiffres (BRIEF §2.7 et §11).

  PLUSIEURS OUVERTS A LA FOIS AU BUREAU, VOLONTAIREMENT. Ce ne sont pas les
  chapitres de l'etude, qui s'excluent parce qu'ils occupent la meme place ;
  ce sont cinq preuves cote a cote, et comparer deux contextes est une lecture
  legitime. La rangee est une bande flex : deux cases ouvertes s'y partagent
  la largeur, les autres se rangent a 28px, et rien ne se recouvre.

  UNE SEULE A LA FOIS AU TELEPHONE, et c'est la meme raison lue a l'envers :
  la case ouverte n'a pas sa propre place, elle PREND celle de sa voisine. En
  ouvrir une seconde, c'est demander a deux cases de tenir dans une rangee qui
  n'en porte qu'une. Taper sur une tuile referme donc celle qui etait
  ouverte - un seul geste, et la bande revient a sa grille.

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

    cases.forEach((c) => {
      const b = clef(c);
      if (!b) return;
      b.addEventListener('click', () => {
        const ouvre = b.getAttribute('aria-expanded') !== 'true';
        /* Sous le palier, ouvrir referme tout le reste : une case ouverte
           occupe la place d'une autre, donc deux ne tiennent pas. */
        if (ouvre && window.matchMedia(PALIER).matches) {
          cases.forEach((autre) => {
            if (autre !== c) clef(autre)?.setAttribute('aria-expanded', 'false');
          });
        }
        b.setAttribute('aria-expanded', ouvre ? 'true' : 'false');
        majCouvertes();
      });
    });

    /* Le palier peut etre franchi par une rotation ou un redimensionnement :
       ce qui etait couvert ne l'est plus, et l'inverse. */
    window.matchMedia(PALIER).addEventListener('change', majCouvertes);
  });
}
