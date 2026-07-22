const PAGE_ID = '5664';
  const SHEET_ENDPOINT = `https://paymegpt.com/api/public/landing-pages/${PAGE_ID}/sheet-data`;
  const ARTICLE_BASE_URL = 'https://blog.franciscobenitez.digital/articulo/?slug='; // TODO: cambiar a URL bonita cuando sincronicemos a GitHub

  const headerEl = document.getElementById('site-header');
  const spacerEl = document.getElementById('header-spacer');
  function syncSpacerHeight() { spacerEl.style.height = headerEl.offsetHeight + 'px'; }
  window.addEventListener('resize', syncSpacerHeight);
  syncSpacerHeight();

  function onScroll() {
    if (window.scrollY > 20) headerEl.classList.add('scrolled');
    else headerEl.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', function () { mobileMenu.classList.toggle('open'); syncSpacerHeight(); });
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { mobileMenu.classList.remove('open'); syncSpacerHeight(); });
  });

  let allArticles = [];

  function estimateReadTime(html) {
    const text = (html || '').replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  function formatDate(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    if (isNaN(d)) return fecha;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function cardHTML(row) {
    const readMin = estimateReadTime(row.cuerpo_html);
    const desc = row.meta_description || '';
    return `
      <div class="card" data-categoria="${(row.categoria || '').toLowerCase()}">
        <div class="card-body">
          <span class="tag">${row.categoria || 'General'}</span>
          <div class="meta">${formatDate(row.fecha)} <span class="sep"></span> ${readMin} min</div>
          <h3>${row.titulo || ''}</h3>
          <p>${desc}</p>
          <a class="read" href="${ARTICLE_BASE_URL}${encodeURIComponent(row.slug)}">Leer artículo →</a>
        </div>
      </div>`;
  }

  function renderGrid(filter) {
    const grid = document.getElementById('posts-grid');
    const empty = document.getElementById('empty-state');
    const filtered = filter && filter !== 'Todo'
      ? allArticles.filter(function(r) { return (r.categoria || '').toLowerCase() === filter.toLowerCase(); })
      : allArticles;

    if (filtered.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = filtered.map(cardHTML).join('') + `
      <div class="card soon">
        <div class="card-body">
          <span class="tag">Muy pronto</span>
          <div class="meta">Nuevo artículo cada semana</div>
          <h3>El próximo artículo se publica pronto</h3>
          <p>Cada semana agregamos una noticia real de IA, explicada para tu negocio. Vuelve pronto para ver lo nuevo.</p>
        </div>
      </div>`;
  }

  function buildFilters() {
    const categorias = Array.from(new Set(allArticles.map(function(r) { return r.categoria; }).filter(Boolean)));
    const filtersEl = document.getElementById('filters');
    categorias.forEach(function(cat) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = cat;
      btn.dataset.filter = cat;
      filtersEl.appendChild(btn);
    });
    filtersEl.addEventListener('click', function(e) {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      filtersEl.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
      btn.classList.add('active');
      renderGrid(btn.dataset.filter);
    });
  }

  async function loadArticles() {
    try {
      const res = await fetch(SHEET_ENDPOINT);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const rows = Array.isArray(json) ? json : (json.rows || json.data || []);

      allArticles = rows
        .filter(function(r) { return String(r.publicado).toUpperCase() === 'TRUE'; })
        .sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });

      document.getElementById('loading-grid').style.display = 'none';
      buildFilters();
      renderGrid('Todo');
      syncSpacerHeight();
    } catch (e) {
      console.error(e);
      document.getElementById('loading-grid').textContent = 'Hubo un error al cargar los artículos.';
    }
  }

  loadArticles();