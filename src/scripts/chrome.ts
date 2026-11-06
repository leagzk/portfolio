/*
  Le menu mobile : ouverture, fermeture, et mise a l'ecart du reste de la page
  pendant qu'il est ouvert.

  CE FICHIER A BEAUCOUP MAIGRI. Il pilotait aussi le menu deroulant « Selected
  work », les deux barres collees au defilement et le choix de theme. Le brief
  supprime les trois : la nav est desormais une ligne de six liens dans le hero
  (§2.1), elle ne colle plus, elle ne se deplie plus, et il n'y a plus qu'un
  seul jeu de valeurs. Ne restent que les deux boutons du menu mobile.

  Ce qui n'est PAS ici : la pose de la classe .js, qui doit s'executer avant le
  premier rendu et vit dans le <script is:inline> du <head>. Un module bundle
  est type="module", donc differe.
*/
export function initChrome(): void {
  const hamb = document.getElementById('hamb');
  const mob = document.getElementById('mobmenu');
  const mobc = document.getElementById('mobclose');
  if (!hamb || !mob) return;

  /*
    Le menu est en position:fixed par-dessus la page, mais le contenu derriere
    restait atteignable au Tab. `inert` le retire d'un coup de l'ordre de
    tabulation ET de l'arbre d'accessibilite - ce que aria-hidden seul ne fait
    pas. La liste a suivi le demenagement de la nav : ce sont maintenant le
    hero, le contenu, le pied de page et le lien d'evitement.
  */
  const derriere = [...document.querySelectorAll('.hero,#main,.talk-card,a.sr-only')];

  const ouvrir = (o: boolean) => {
    mob.classList.toggle('open', o);
    hamb.setAttribute('aria-expanded', o ? 'true' : 'false');
    mob.setAttribute('aria-hidden', o ? 'false' : 'true');
    document.body.style.overflow = o ? 'hidden' : '';
    derriere.forEach((el) => (o ? el.setAttribute('inert', '') : el.removeAttribute('inert')));
    /* sans ce deplacement, le focus reste sur le hamburger devenu inerte */
    if (o) mobc?.focus();
  };

  hamb.addEventListener('click', () => ouvrir(true));
  mobc?.addEventListener('click', () => {
    ouvrir(false);
    hamb.focus();
  });
  mob.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => ouvrir(false)));

  /*
    Le « + » du hero pivote en x quand on l'active, comme toutes les autres
    revelations du site. Le defilement lui-meme est celui du navigateur - c'est
    un <a href="#...">, et `scroll-behavior` sur html le rend doux et le coupe
    tout seul sous mouvement reduit.
  */
  const defiler = document.querySelector('.hero__defiler');
  defiler?.addEventListener('click', () => defiler.classList.add('ouvert'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mob.classList.contains('open')) {
      ouvrir(false);
      hamb.focus();
    }
  });
}
