/* Preference systeme de mouvement reduit, lue au moment de l'appel. */
export const mouvementReduit = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
