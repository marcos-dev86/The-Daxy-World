/* ===================================================================
   THE DAXY'S WORLD - interações gerais do site
   =================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Daxy JS] DOM carregado, iniciando scripts da página:', location.pathname);

  /* ---- menu mobile ---- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      console.log('[Daxy JS] menu mobile:', open ? 'aberto' : 'fechado');
    });
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  } else {
    console.log('[Daxy JS] menu mobile não encontrado nesta página');
  }

  /* ---- marca o link ativo do menu (compatível com URLs limpas, ex: /paginas/personagens) ---- */
  const segments = location.pathname.split('/').filter(Boolean);
  let here;
  if (segments.length === 0) {
    here = 'inicio';
  } else {
    let last = segments[segments.length - 1];
    if (last === 'index.html') {
      // fallback: alguém acessou a URL antiga com /index.html no final
      segments.pop();
      last = segments[segments.length - 1];
    }
    here = last ? last.replace(/\.html$/, '') : 'inicio';
  }
  console.log('[Daxy JS] página atual detectada:', here);
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === here) {
      a.classList.add('active');
      console.log('[Daxy JS] link ativo marcado:', here);
    }
  });

  /* ---- ano no rodapé ---- */
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = year;
  });
  console.log('[Daxy JS] ano do rodapé definido:', year);

  /* ---- lightbox simples para a galeria ---- */
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    function openItem(item) {
      const src = item.getAttribute('data-lightbox');
      lbImg.src = src;
      lbImg.alt = item.getAttribute('data-caption') || '';
      lightbox.classList.add('open');
      console.log('[Daxy JS] lightbox aberto:', src);
    }

    document.querySelectorAll('[data-lightbox]').forEach(item => {
      item.addEventListener('click', () => openItem(item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openItem(item);
        }
      });
    });

    function close() {
      lightbox.classList.remove('open');
      lbImg.src = '';
      console.log('[Daxy JS] lightbox fechado');
    }
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    console.log('[Daxy JS] lightbox pronto, itens encontrados:', document.querySelectorAll('[data-lightbox]').length);
  } else {
    console.log('[Daxy JS] nenhuma galeria com lightbox nesta página');
  }
});