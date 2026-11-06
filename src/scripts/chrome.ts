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
    pas.

    LA LISTE ETAIT ECRITE A LA MAIN, ET ELLE A FINI PAR SE MORDRE LA QUEUE.
    Elle nommait '.hero,#main,.talk-card,a.sr-only' - or le menu est rendu par
    <Hero>, donc DANS <main>. Poser `inert` sur #main le posait sur un ANCETRE
    du menu : plus un lien tapable, plus un lien focalisable, et un tap au
    centre de « Experience System » atterrissait sur le .shell derriere le
    calque. Le menu s'ouvrait et ne menait nulle part.

    IL A TENU PARCE QUE `element.click()` IGNORE `inert`. Mes verifications le
    pilotaient en JavaScript : aria-expanded basculait, le panneau s'affichait,
    tout semblait juste. Un doigt, lui, n'obtenait rien. Un test qui clique en
    JS ne prouve pas qu'une cible est tapable - c'est elementFromPoint au
    centre de la cible qui le dit.

    ON NE NOMME DONC PLUS RIEN. On remonte du menu jusqu'a <body> et on met de
    cote TOUS SES VOISINS a chaque etage. Aucun ancetre du menu ne peut plus y
    passer, et la regle vaut ou qu'on deplace le menu demain.
  */
  const voisins = (el: Element): Element[] => {
    const out: Element[] = [];
    for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
      const p = n.parentElement;
      if (!p) break;
      for (const f of p.children) if (f !== n) out.push(f);
    }
    return out;
  };
  const derriere = voisins(mob);

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
