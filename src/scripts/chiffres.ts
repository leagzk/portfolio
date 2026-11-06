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
*/
export function initChiffres(): void {
  const aplats = document.querySelectorAll<HTMLButtonElement>('.clef');
  aplats.forEach((b) => {
    b.addEventListener('click', () => {
      b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });
}
