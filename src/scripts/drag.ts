/*
  Cartes et formes deplacables a la souris.

  Le code etait duplique entre index.astro (.dcard) et system-event.astro
  (.ls-shape) - identique au caractere pres, seul le breakpoint de desactivation
  changeait. Au-dela de ce seuil le conteneur devient un carrousel a defilement :
  laisser le drag actif y volerait les gestes tactiles.

  Le compteur de z-index est partage par appel, pour que la derniere carte
  saisie passe devant les precedentes.
*/
export function rendreDeplacable(sel: string, desactiverSi: string): void {
  let z = 10;
  const mq = window.matchMedia(desactiverSi);

  document.querySelectorAll<HTMLElement>(sel).forEach((c) => {
    let ox = 0;
    let oy = 0;
    let dragging = false;

    c.addEventListener('pointerdown', (e) => {
      if (mq.matches) return;
      dragging = true;
      c.setPointerCapture(e.pointerId);
      c.classList.add('grabbing');
      c.style.zIndex = String(++z);
      const r = c.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
    });

    c.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const p = c.parentElement!.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - p.left - ox, p.width - c.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - p.top - oy, p.height - c.offsetHeight));
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
    });

    const fin = () => {
      dragging = false;
      c.classList.remove('grabbing');
    };
    c.addEventListener('pointerup', fin);
    c.addEventListener('pointercancel', fin);
  });
}
