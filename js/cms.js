// Busca textos e personagens publicados no painel admin-daxy e aplica no
// site. Se a API estiver fora do ar, ou algum campo não tiver sido
// preenchido no painel, o HTML estático original é mantido — nada quebra.
(function () {
  var API_BASE = window.DAXY_CMS_API;
  if (!API_BASE) return;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applyTextos(textos) {
    if (!textos) return;
    document.querySelectorAll('[data-cms-text]').forEach(function (el) {
      var key = el.getAttribute('data-cms-text');
      var value = textos[key];
      if (typeof value === 'string' && value.trim() !== '') {
        el.textContent = value;
      }
    });
  }

  function buildCharCard(p) {
    var traits = (p.traits || [])
      .map(function (t) {
        return '<span class="trait">' + escapeHtml(t) + '</span>';
      })
      .join('');

    var bio = (p.bio || [])
      .map(function (paragraph) {
        return '<p>' + escapeHtml(paragraph) + '</p>';
      })
      .join('');

    var frase = p.frase ? '<p class="quote-bubble">&quot;' + escapeHtml(p.frase) + '&quot;</p>' : '';

    return (
      '<article class="char-card">' +
      '<div class="char-portrait">' +
      '<img src="' +
      escapeHtml(p.imagemUrl || '') +
      '" alt="' +
      escapeHtml(p.imagemAlt || p.nome || '') +
      '" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="char-info">' +
      '<span class="char-name">' +
      escapeHtml(p.nome || '') +
      '</span>' +
      '<span class="char-role">' +
      escapeHtml(p.cargo || '') +
      '</span>' +
      '<div class="trait-list">' +
      traits +
      '</div>' +
      '<div class="char-bio">' +
      bio +
      '</div>' +
      frase +
      '</div>' +
      '</article>'
    );
  }

  function applyPersonagens(personagens) {
    var container = document.querySelector('[data-cms-personagens]');
    if (!container || !Array.isArray(personagens) || personagens.length === 0) return;
    container.innerHTML = personagens.map(buildCharCard).join('');
  }

  fetch(API_BASE + '/api/public/content', { headers: { Accept: 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('cms fetch failed: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      applyTextos(data.textos);
      applyPersonagens(data.personagens);
    })
    .catch(function () {
      // Falha silenciosa — o conteúdo estático do HTML continua exibido.
    });
})();
