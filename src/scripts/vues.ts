/*
  Les cadres qui defilent seuls.

  La classe est posee ET RETIREE, contrairement a une entree en scene qui ne
  fait qu'un aller simple : une animation infinie qui continue hors champ ferait
  tourner le compositeur pour personne, batterie comprise, sur une page qui fait
  dix ecrans de haut.

  C'est le CSS qui decide ensuite ce que `defile` declenche - rien du tout sur
  un cadre a survol pose sur un appareil pointeur, le defilement sur les autres.
  Voir .cadref dans src/styles/etude.css.
*/
export function suivreCadres(): void {
  const cadres = document.querySelectorAll<HTMLElement>('.cadref');
  if (!cadres.length) return;
  const vu = new IntersectionObserver(
    (entrees) => entrees.forEach((e) => e.target.classList.toggle('defile', e.isIntersecting)),
    { threshold: 0 },
  );
  cadres.forEach((c) => vu.observe(c));
}
