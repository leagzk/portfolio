/*
  ═══ Audit mesure DANS LE NAVIGATEUR ═══

  Le pendant de scripts/audit.mjs, qui lit le HTML construit et ne connait donc
  ni la couleur calculee ni la taille rendue. Celui-ci mesure ce que seul un
  moteur de rendu sait : contrastes effectifs, cibles tactiles, debordements
  horizontaux, couverture des styles de focus, ordre de tabulation.

  Pour s'en servir :
      npm run build && cp scripts/audit-navigateur.mjs dist/_audit.mjs
      npx astro preview
  puis, dans la console de chaque page :
      (await import('/_audit.mjs')).auditer().then(r => console.table(r.contrastes))

  CE QU'IL NE FAUT PAS LUI FAIRE DIRE. Il ne sait pas lire un aplat peint par
  une image de fond - il s'arrete et ne juge pas. Il attend 600ms pour laisser
  les transitions se poser, sans quoi il releve des couleurs intermediaires. Et
  il peut manquer un aplat pose derriere le texte par un frere en position
  absolue dans certains cas : un contraste de 1:1 annonce sur du blanc se
  verifie a la main avant d'etre cru.
*/
const lum = (c) => { const [r,g,b]=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}); return 0.2126*r+0.7152*g+0.0722*b; };
const ratio = (a,b) => { const L1=lum(a),L2=lum(b); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); };
const rgb = (s) => { const m=s.match(/rgba?\(([^)]+)\)/); if(!m) return null; const n=m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return {c:n.slice(0,3), a:n.length>3?n[3]:1}; };
const fusion = (av,ar) => av.c.map((v,i)=>Math.round(av.a*v+(1-av.a)*ar[i]));
/*
  UN APLAT PEUT ETRE UN FRERE, PAS UN ANCETRE. Les boutons du gabarit posent
  leur couleur sur un <span> en position absolue DERRIERE le texte (.sb__carre),
  et les cases de la composition font pareil (.compo__plat, .dcarte__plat). En
  ne remontant que la chaine des parents, on lisait le blanc de la page sous un
  texte blanc : 1:1, et un faux positif a chaque bouton.
*/
const couvreur = (el, rect) => {
  let n = el.parentElement, trouve = null;
  while (n && n.nodeType === 1 && n !== document.body) {
    for (const f of n.children) {
      if (f === el || f.contains(el)) continue;
      const cs = getComputedStyle(f);
      if (cs.position !== 'absolute' && cs.position !== 'fixed') continue;
      const c = rgb(cs.backgroundColor);
      if (!c || c.a < 1) continue;
      const r = f.getBoundingClientRect();
      if (r.left <= rect.left + 1 && r.right >= rect.right - 1 && r.top <= rect.top + 1 && r.bottom >= rect.bottom - 1) trouve = c.c;
    }
    if (trouve) return trouve;
    n = n.parentElement;
  }
  return null;
};
const fond = (el) => { const pile=[]; let n=el;
  while (n && n.nodeType===1) { const cs=getComputedStyle(n);
    if (cs.backgroundImage!=='none') return {image:true};
    const c=rgb(cs.backgroundColor); if (c&&c.a>0){pile.push(c); if(c.a===1) break;}
    n=n.parentElement; }
  const dessous = couvreur(el, el.getBoundingClientRect());
  if (dessous) { let base = dessous; for (let i = pile.length - 1; i >= 0; i--) base = fusion(pile[i], base); return {couleur: base}; }
  if (!pile.length) return {couleur:[255,255,255]};
  let base = pile[pile.length-1].a===1 ? pile.pop().c : [255,255,255];
  for (let i=pile.length-1;i>=0;i--) base=fusion(pile[i],base);
  return {couleur:base}; };
const visible = (el) => { const cs=getComputedStyle(el);
  if (cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) return false;
  if (el.closest('[hidden]')||el.closest('.sr-only')) return false;
  const r=el.getBoundingClientRect(); return r.width>0&&r.height>0; };

export async function auditer() {
  /* On laisse les transitions se poser : mesurer pendant les 0,22s d'un
     changement de couleur donne une valeur intermediaire, et un faux positif de
     contraste avec elle. */
  await new Promise(r => setTimeout(r, 600));
  document.querySelectorAll('.pan').forEach((p)=>{p.hidden=false});
  const res={url:location.pathname,w:innerWidth,contrastes:[],cibles:[],debords:[],focusSansStyle:[]};

  const seuil=(cs)=>{const px=parseFloat(cs.fontSize);const gras=parseInt(cs.fontWeight,10)>=700;return px>=24||(px>=18.66&&gras)?3:4.5;};
  const vus=new Set();
  document.querySelectorAll('body *').forEach((el)=>{
    if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1)) return;
    if(!visible(el)) return;
    const cs=getComputedStyle(el); const f=rgb(cs.color); const b=fond(el);
    if(!f||b.image) return;
    /* une transition en cours donne une couleur intermediaire : on ne juge que
       ce qui est stable */
    if(cs.transitionProperty.includes('color')&&el.matches(':hover')) return;
    const avant=f.a<1?fusion(f,b.couleur):f.c;
    const r=ratio(avant,b.couleur); const min=seuil(cs);
    if(r<min){ const cle=`${cs.color}|${b.couleur}|${Math.round(parseFloat(cs.fontSize))}`;
      if(vus.has(cle)) return; vus.add(cle);
      res.contrastes.push({sel:(el.className||el.tagName)+'',px:Math.round(parseFloat(cs.fontSize)),gras:cs.fontWeight,fg:cs.color,bg:'rgb('+b.couleur.join(',')+')',ratio:+r.toFixed(2),min,texte:el.textContent.trim().slice(0,40)}); }
  });

  document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])').forEach((el)=>{
    if(!visible(el)) return;
    const r=el.getBoundingClientRect();
    /* la cible inclut une zone etendue par ::after, invisible au rect */
    const ap=getComputedStyle(el,'::after');
    let w=r.width,h=r.height;
    const neg = ['top','right','bottom','left'].map(k=>parseFloat(ap[k]));
    /* on n'etend que si les quatre decalages sont NEGATIFS : c'est la marque
       d'une zone de touche elargie, pas d'un soulignement ou d'une pastille. */
    if(ap.content!=='none'&&ap.position==='absolute'&&neg.every(v=>v<0)){
      const i=['top','right','bottom','left'].map(k=>parseFloat(ap[k])||0);
      w+=-i[1]-i[3]; h+=-i[0]-i[2];
    }
    if(Math.min(w,h)<24) res.cibles.push({sel:(el.className||el.tagName)+'',taille:Math.round(w)+'x'+Math.round(h),texte:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,30)});
  });

  const de=document.documentElement;
  res.scrollDoc=de.scrollWidth-de.clientWidth;
  document.querySelectorAll('body *').forEach((el)=>{
    if(!visible(el)) return;
    const cs=getComputedStyle(el);
    if(cs.overflowX!=='visible'&&cs.overflowX!=='clip') return;
    /* un element dans un rail qui defile n'est pas un debordement : c'est le
       rail qui le borne, et scrollDoc le dirait si la PAGE debordait */
    let p=el.parentElement,dansRail=false;
    while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){dansRail=true;break;}p=p.parentElement;}
    if(dansRail) return;
    const r=el.getBoundingClientRect();
    if(r.right>de.clientWidth+1) res.debords.push({sel:(el.className||el.tagName)+'',droite:Math.round(r.right)});
  });

  const sels=[];
  for(const f of document.styleSheets){ let rg; try{rg=f.cssRules}catch{continue}
    const go=(l)=>{for(const r of l){ if(r.cssRules) go(r.cssRules); else if(r.selectorText&&r.selectorText.includes(':focus')) sels.push(r.selectorText); }};
    go(rg); }
  const brut=sels.join(',').split(',').map(s=>s.replace(/:focus(-visible|-within)?/g,'').trim());
  const universel=brut.some(s=>s===''||s==='*');
  const nus=brut.filter(Boolean);
  document.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"])').forEach((el)=>{
    if(!visible(el)) return;
    const ok=universel||nus.some(s=>{try{return el.matches(s)||el.closest(s)}catch{return false}});
    if(!ok) res.focusSansStyle.push((el.className||el.tagName)+'');
  });
  res.focusSansStyle=[...new Set(res.focusSansStyle)];

  const foc=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(visible);
  res.nbFocalisables=foc.length;
  res.tabindexPositifs=foc.filter(el=>+(el.getAttribute('tabindex')||0)>0).length;
  return res;
}
