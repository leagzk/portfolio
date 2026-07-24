import { mouvementReduit } from './motion';

/*
  Apparition au defilement. Etait ecrit deux fois, au caractere pres, dans
  philosophy.astro et system-event.astro.

  Sous prefers-reduced-motion, on ne se contente pas de ne rien animer : on pose
  la classe tout de suite sur chaque element. Les regles .js .tenet et
  .js .ls-reveal mettent opacity:0 en attendant l'animation - sans cet
  ajout immediat, le contenu resterait invisible.
*/
export function reveal(
  els: Element[],
  opts?: IntersectionObserverInit,
  cls = 'in',
): void {
  if (mouvementReduit() || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add(cls));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add(cls);
        io.unobserve(e.target);
      }
    });
  }, opts);
  els.forEach((e) => io.observe(e));
}

/** raccourci : revele tous les elements correspondant au selecteur */
export function revealAll(sel: string, opts?: IntersectionObserverInit, cls = 'in'): void {
  reveal([...document.querySelectorAll(sel)], opts, cls);
}
