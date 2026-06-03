/* ===================================================
   BELLA STUDIO · ADMIN DASHBOARD
   js/dashboard.js  (plain script, no ES modules)
   Depends on: supabase-js@2 CDN, gsap@3.12 CDN, config.js
   =================================================== */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     CONFIG & CONSTANTS
  ──────────────────────────────────────────────── */
  const POLL_INTERVAL_MS = 30_000;
  const ROWS_PER_PAGE    = 10;

  const TIME_SLOTS = [
    '9:00am','10:00am','11:00am','12:00pm',
    '2:00pm','3:00pm','4:00pm','5:00pm'
  ];

  const WEEK_DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const MONTH_NAMES = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
  ];

  const PAYMENT_COLORS = {
    'Efectivo':         '#4d8b6a',
    'Transferencia':    '#2a7a8a',
    'Tarjeta':          '#7a5ca8',
    'Nequi':            '#8b3a6a',
    'Daviplata':        '#d4a843',
    'Otro':             '#8fa496',
  };

  /* ─────────────────────────────────────────────
     STATE
  ──────────────────────────────────────────────── */
  let supabaseClient   = null;
  let allAppointments  = [];    // raw data from Supabase
  let filteredAppts    = [];    // after search/filter
  let currentPage      = 1;
  let currentWeekStart = null;  // Monday of displayed week
  let lastUpdated      = null;
  let pollTimer        = null;
  let knownIds         = new Set();

  /* ─────────────────────────────────────────────
     INIT SUPABASE
  ──────────────────────────────────────────────── */
  function initSupabase() {
    try {
      if (
        window.supabase &&
        typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL &&
        typeof SUPABASE_KEY !== 'undefined' && SUPABASE_KEY
      ) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      }
    } catch (e) {
      console.warn('Supabase no disponible, usando datos de demostración.', e);
    }
  }

  /* ─────────────────────────────────────────────
     FETCH DATA
  ──────────────────────────────────────────────── */
  async function fetchAppointments() {
    if (!supabaseClient) {
      showConnectionError('Supabase no está configurado. Verifica config.js.');
      return [];
    }
    try {
      const { data, error } = await supabaseClient
        .from('appointments')
        .select('*, specialists(name)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        showConnectionError('Error al conectar con la base de datos.');
        return [];
      }

      hideConnectionError();
      return (data || []).map(row => ({
        ...row,
        _specialist_name: row.specialists?.name || (row.specialist_id === 1 ? 'Lina' : 'Alejandra'),
      }));
    } catch (e) {
      console.error('Fetch failed:', e);
      showConnectionError('Error de red al consultar Supabase.');
      return [];
    }
  }

  function showConnectionError(msg) {
    let banner = document.getElementById('db-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'db-error-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#c0392b;color:#fff;text-align:center;padding:10px 16px;font-size:.82rem;font-family:Montserrat,sans-serif;font-weight:600;letter-spacing:.04em;';
      document.body.prepend(banner);
    }
    banner.textContent = '⚠ ' + msg;
    banner.style.display = 'block';
  }

  function hideConnectionError() {
    const banner = document.getElementById('db-error-banner');
    if (banner) banner.style.display = 'none';
  }

  /* ─────────────────────────────────────────────
     DATE HELPERS
  ──────────────────────────────────────────────── */
  function today() {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }

  function isoDate(d) {
    return d.toISOString().slice(0,10);
  }

  function getMondayOf(d) {
    const day = d.getDay();          // 0=Sun
    const diff = (day === 0) ? -6 : 1 - day;
    const m = new Date(d);
    m.setDate(d.getDate() + diff);
    m.setHours(0,0,0,0);
    return m;
  }

  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  function formatShortDate(d) {
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }

  function formatLongDate(d) {
    return d.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /* ─────────────────────────────────────────────
     KPI CALCULATION
  ──────────────────────────────────────────────── */
  function calcKPIs(appts) {
    const t   = isoDate(today());
    const mon = getMondayOf(today());
    const sun = addDays(mon, 6);

    const todayAppts  = appts.filter(a => a.appointment_date === t);
    const weekAppts   = appts.filter(a => {
      const d = a.appointment_date;
      return d >= isoDate(mon) && d <= isoDate(sun);
    });
    const futureAppts = appts.filter(a => a.appointment_date >= t);

    // Most active specialist this week
    const specCount = {};
    weekAppts.forEach(a => {
      const n = a._specialist_name || 'Desconocida';
      specCount[n] = (specCount[n] || 0) + 1;
    });
    const topSpec = Object.entries(specCount).sort((a,b) => b[1]-a[1])[0];

    return {
      todayCount:    todayAppts.length,
      weekCount:     weekAppts.length,
      pendingCount:  futureAppts.length,
      topSpecName:   topSpec ? topSpec[0] : '—',
      topSpecCount:  topSpec ? topSpec[1] : 0,
    };
  }

  /* ─────────────────────────────────────────────
     ANIMATED COUNTER
  ──────────────────────────────────────────────── */
  function animateCounter(el, target, duration) {
    if (!el) return;
    const start    = parseInt(el.textContent, 10) || 0;
    const startTs  = performance.now();
    const range    = target - start;

    function step(ts) {
      const elapsed = ts - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + range * ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function flipUpdate(el, newValue) {
    if (!el) return;
    const str = String(newValue);
    if (el.textContent === str) return;
    el.classList.add('flipping');
    setTimeout(() => {
      el.textContent = str;
      el.classList.remove('flipping');
    }, 200);
  }

  /* ─────────────────────────────────────────────
     RENDER KPIs
  ──────────────────────────────────────────────── */
  let kpiInitialized = false;

  function renderKPIs(appts) {
    const kpis = calcKPIs(appts);

    const elToday     = document.getElementById('kpiToday');
    const elTodaySub  = document.getElementById('kpiTodaySub');
    const elWeek      = document.getElementById('kpiWeek');
    const elWeekSub   = document.getElementById('kpiWeekSub');
    const elPending   = document.getElementById('kpiPending');
    const elSpec      = document.getElementById('kpiSpecialist');
    const elSpecSub   = document.getElementById('kpiSpecialistSub');

    if (!kpiInitialized) {
      // First time: count-up animation
      animateCounter(elToday,   kpis.todayCount,   900);
      animateCounter(elWeek,    kpis.weekCount,    1100);
      animateCounter(elPending, kpis.pendingCount, 1300);
      if (elSpec)    elSpec.textContent    = kpis.topSpecName;
      if (elSpecSub) elSpecSub.textContent = kpis.topSpecCount + ' cita' + (kpis.topSpecCount !== 1 ? 's' : '') + ' esta semana';
      kpiInitialized = true;
    } else {
      // Subsequent updates: flip animation
      flipUpdate(elToday,   kpis.todayCount);
      flipUpdate(elWeek,    kpis.weekCount);
      flipUpdate(elPending, kpis.pendingCount);
      if (elSpec)    elSpec.textContent    = kpis.topSpecName;
      if (elSpecSub) elSpecSub.textContent = kpis.topSpecCount + ' cita' + (kpis.topSpecCount !== 1 ? 's' : '') + ' esta semana';
    }

    // Subtitles
    const t = today();
    if (elTodaySub) elTodaySub.textContent = t.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'});

    const mon = getMondayOf(t);
    const sun = addDays(mon, 6);
    if (elWeekSub) elWeekSub.textContent =
      formatShortDate(mon) + ' – ' + formatShortDate(sun);
  }

  /* ─────────────────────────────────────────────
     RENDER CALENDAR
  ──────────────────────────────────────────────── */
  function buildWeekGrid(appts) {
    const grid = document.getElementById('weekGrid');
    if (!grid) return;

    const todayDate = today();
    const monday    = currentWeekStart;

    // Update title
    const sun = addDays(monday, 6);
    const titleEl = document.getElementById('weekTitle');
    if (titleEl) {
      if (monday.getMonth() === sun.getMonth()) {
        titleEl.textContent =
          monday.getDate() + ' – ' + sun.getDate() + ' de ' +
          MONTH_NAMES[monday.getMonth()] + ' ' + monday.getFullYear();
      } else {
        titleEl.textContent =
          formatShortDate(monday) + ' – ' + formatShortDate(sun) + ', ' + monday.getFullYear();
      }
    }

    // Filter appointments for this week
    const weekStart = isoDate(monday);
    const weekEnd   = isoDate(addDays(monday, 6));
    const weekAppts = appts.filter(a =>
      a.appointment_date >= weekStart && a.appointment_date <= weekEnd
    );

    // Build lookup: date+time → [appt, ...]
    const lookup = {};
    weekAppts.forEach(a => {
      const key = a.appointment_date + '|' + a.appointment_time;
      if (!lookup[key]) lookup[key] = [];
      lookup[key].push(a);
    });

    // Clear & rebuild
    grid.innerHTML = '';

    // Header row: empty + 7 day headers
    const emptyHeader = document.createElement('div');
    emptyHeader.className = 'wg-header-empty';
    grid.appendChild(emptyHeader);

    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const cell = document.createElement('div');
      cell.className = 'wg-day-header' + (isoDate(d) === isoDate(todayDate) ? ' is-today' : '');
      cell.innerHTML =
        '<div class="wg-day-name">' + WEEK_DAYS[i] + '</div>' +
        '<div class="wg-day-num">' + d.getDate() + '</div>';
      grid.appendChild(cell);
    }

    // Time rows
    const rowEls = [];
    TIME_SLOTS.forEach(slot => {
      const rowWrap = document.createElement('div');
      rowWrap.className = 'cal-row';
      rowWrap.style.display = 'contents';

      // Time label
      const timeLabel = document.createElement('div');
      timeLabel.className = 'wg-time-label';
      timeLabel.textContent = slot;
      rowWrap.appendChild(timeLabel);

      for (let i = 0; i < 7; i++) {
        const d     = addDays(monday, i);
        const key   = isoDate(d) + '|' + slot;
        const dayAppts = lookup[key] || [];
        const isToday  = isoDate(d) === isoDate(todayDate);

        const cell = document.createElement('div');
        cell.className = 'wg-cell' + (isToday ? ' is-today-col' : '');

        dayAppts.forEach(a => {
          const chip = document.createElement('div');
          const specClass = (a._specialist_name || '').toLowerCase() === 'alejandra'
            ? 'appt-chip--alejandra' : 'appt-chip--lina';
          chip.className = 'appt-chip ' + specClass;
          chip.title = a.customer_name + ' · ' + a.service_name + ' (' + a._specialist_name + ')';
          chip.innerHTML =
            '<div class="appt-chip-name">' + escapeHtml(a.customer_name) + '</div>' +
            '<div class="appt-chip-svc">'  + escapeHtml(a.service_name)  + '</div>';
          cell.appendChild(chip);
        });

        rowWrap.appendChild(cell);
      }

      grid.appendChild(rowWrap);
      rowEls.push(rowWrap);
    });

    // Animate rows in with GSAP stagger
    if (window.gsap) {
      const cells = Array.from(grid.querySelectorAll('.wg-time-label, .wg-cell'));
      gsap.fromTo(cells,
        { opacity: 0, x: -6 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.012, ease: 'power2.out', clearProps: 'all' }
      );
    } else {
      rowEls.forEach(r => { r.style.opacity = '1'; });
    }
  }

  function setupCalendarNav(appts) {
    const prevBtn     = document.getElementById('prevWeek');
    const nextBtn     = document.getElementById('nextWeek');
    const todayBtn    = document.getElementById('weekTodayBtn');

    if (prevBtn) {
      prevBtn.onclick = function () {
        currentWeekStart = addDays(currentWeekStart, -7);
        buildWeekGrid(allAppointments);
      };
    }
    if (nextBtn) {
      nextBtn.onclick = function () {
        currentWeekStart = addDays(currentWeekStart, 7);
        buildWeekGrid(allAppointments);
      };
    }
    if (todayBtn) {
      todayBtn.onclick = function () {
        currentWeekStart = getMondayOf(today());
        buildWeekGrid(allAppointments);
      };
    }
  }

  /* ─────────────────────────────────────────────
     RENDER TABLE
  ──────────────────────────────────────────────── */
  function applyFilters() {
    const search = (document.getElementById('tableSearch')?.value || '').toLowerCase().trim();
    const spec   = (document.getElementById('filterSpecialist')?.value || '');
    const t      = isoDate(today());

    filteredAppts = allAppointments
      .filter(a => a.appointment_date >= t)  // upcoming only
      .filter(a => {
        if (spec && a._specialist_name !== spec) return false;
        if (search) {
          const haystack = [
            a.customer_name, a.service_name, a._specialist_name,
            a.appointment_date, a.payment_method
          ].join(' ').toLowerCase();
          return haystack.includes(search);
        }
        return true;
      })
      .sort((a,b) => {
        if (a.appointment_date !== b.appointment_date)
          return a.appointment_date.localeCompare(b.appointment_date);
        return a.appointment_time.localeCompare(b.appointment_time);
      });

    currentPage = 1;
    renderTable();
    renderPagination();
  }

  function renderTable(newIds) {
    const tbody = document.getElementById('apptsTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const slice = filteredAppts.slice(start, start + ROWS_PER_PAGE);

    if (slice.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">' +
        '<div class="table-empty">' +
        '<svg class="table-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>' +
        '</svg>' +
        '<div>No hay citas que coincidan</div>' +
        '</div></td></tr>';
      return;
    }

    tbody.innerHTML = slice.map(a => {
      const isNew   = newIds && newIds.has(a.id);
      const specCls = a._specialist_name === 'Alejandra' ? 'badge--alejandra' : 'badge--lina';
      const dateStr = new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'short', day: 'numeric', month: 'short'
      });

      return '<tr class="' + (isNew ? 'table-row-new' : '') + '">' +
        '<td>' + escapeHtml(dateStr) + '</td>' +
        '<td>' + escapeHtml(a.appointment_time) + '</td>' +
        '<td><strong>' + escapeHtml(a.customer_name) + '</strong></td>' +
        '<td>' + escapeHtml(a.service_name) + '</td>' +
        '<td><span class="badge ' + specCls + '">' + escapeHtml(a._specialist_name) + '</span></td>' +
        '<td><span class="badge badge--payment">' + escapeHtml(a.payment_method || '—') + '</span></td>' +
        '</tr>';
    }).join('');
  }

  function renderPagination() {
    const el = document.getElementById('pagination');
    if (!el) return;

    const total = filteredAppts.length;
    const pages = Math.ceil(total / ROWS_PER_PAGE);
    const start = (currentPage - 1) * ROWS_PER_PAGE + 1;
    const end   = Math.min(currentPage * ROWS_PER_PAGE, total);

    if (total === 0) { el.innerHTML = ''; return; }

    let html = '<div class="pagination-info">Mostrando ' + start + '–' + end + ' de ' + total + ' citas</div>';
    html += '<div class="pagination-pages">';

    // Prev
    html += '<button class="page-btn" id="pgPrev"' + (currentPage <= 1 ? ' disabled' : '') + '>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</button>';

    // Page numbers (show up to 5 around current)
    const range = getPageRange(currentPage, pages);
    range.forEach(p => {
      if (p === '…') {
        html += '<span style="color:var(--text-muted);padding:0 4px;font-size:.8rem">…</span>';
      } else {
        html += '<button class="page-btn' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
      }
    });

    // Next
    html += '<button class="page-btn" id="pgNext"' + (currentPage >= pages ? ' disabled' : '') + '>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>';

    html += '</div>';
    el.innerHTML = html;

    el.querySelector('#pgPrev')?.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderTable(); renderPagination(); }
    });
    el.querySelector('#pgNext')?.addEventListener('click', () => {
      if (currentPage < pages) { currentPage++; renderTable(); renderPagination(); }
    });
    el.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page, 10);
        renderTable();
        renderPagination();
      });
    });
  }

  function getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const range = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) range.push(i);
      range.push('…'); range.push(total);
    } else if (current >= total - 3) {
      range.push(1); range.push('…');
      for (let i = total - 4; i <= total; i++) range.push(i);
    } else {
      range.push(1); range.push('…');
      for (let i = current - 1; i <= current + 1; i++) range.push(i);
      range.push('…'); range.push(total);
    }
    return range;
  }

  function setupTableFilters() {
    const searchEl = document.getElementById('tableSearch');
    const filterEl = document.getElementById('filterSpecialist');
    if (searchEl) searchEl.addEventListener('input', debounce(applyFilters, 250));
    if (filterEl) filterEl.addEventListener('change', applyFilters);
  }

  /* ─────────────────────────────────────────────
     CHARTS — Canvas con DPR correcto
  ──────────────────────────────────────────────── */

  // Escala el canvas al tamaño real del contenedor × devicePixelRatio
  // para evitar pixelación en pantallas Retina/HiDPI
  function setupCanvas(canvas) {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W    = Math.floor(rect.width)  || canvas.offsetWidth  || 500;
    const H    = Math.floor(rect.height) || canvas.offsetHeight || 280;
    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, W, H };
  }

  function renderBarChart(appts) {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    const { ctx, W, H } = setupCanvas(canvas);
    const pad = { top: 32, right: 24, bottom: 52, left: 44 };

    // Contar por día de semana (últimos 30 días)
    const cutoff    = new Date(today());
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = isoDate(cutoff);

    const counts = [0,0,0,0,0,0,0];
    appts.forEach(a => {
      if (a.appointment_date < cutoffStr) return;
      const d   = new Date(a.appointment_date + 'T12:00:00');
      const dow = (d.getDay() + 6) % 7;
      counts[dow]++;
    });

    const labels  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const maxVal  = Math.max(...counts, 1);
    const chartW  = W - pad.left - pad.right;
    const chartH  = H - pad.top  - pad.bottom;
    const barGap  = 10;
    const barW    = (chartW - barGap * (labels.length + 1)) / labels.length;
    const gridLines = 4;

    // ── Fondo degradado sutil ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, 'rgba(242,247,244,0)');
    bgGrad.addColorStop(1, 'rgba(194,221,208,0.08)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Líneas de cuadrícula ──
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + chartH - (i / gridLines) * chartH;
      ctx.strokeStyle = i === 0
        ? 'rgba(90,112,96,0.25)'
        : 'rgba(194,221,208,0.45)';
      ctx.lineWidth = i === 0 ? 1.5 : 1;
      ctx.setLineDash(i === 0 ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Etiquetas Y
      ctx.fillStyle = '#8fa496';
      ctx.font = '500 10px Montserrat, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round((i / gridLines) * maxVal), pad.left - 8, y);
    }

    // Etiquetas X
    const barData = labels.map((label, i) => ({
      label, count: counts[i],
      x: pad.left + barGap + i * (barW + barGap)
    }));
    barData.forEach(({ label, x }) => {
      ctx.fillStyle = '#5a7060';
      ctx.font = '600 11px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x + barW / 2, pad.top + chartH + 12);
    });

    const prog = { v: 0 };

    function drawBars(p) {
      ctx.clearRect(pad.left, pad.top, chartW, chartH + 2);

      // Redibujar guías dentro del área de barras
      for (let i = 1; i <= gridLines; i++) {
        const y = pad.top + chartH - (i / gridLines) * chartH;
        ctx.strokeStyle = 'rgba(194,221,208,0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      barData.forEach(({ count, x }) => {
        const fullH = (count / maxVal) * chartH;
        const animH = fullH * p;
        if (animH < 1) return;
        const y = pad.top + chartH - animH;
        const r = Math.min(8, barW / 2, animH);

        // Sombra sutil bajo la barra
        ctx.shadowColor   = 'rgba(77,139,106,0.18)';
        ctx.shadowBlur    = 10;
        ctx.shadowOffsetY = 4;

        // Degradado vertical
        const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
        grad.addColorStop(0, '#4d8b6a');
        grad.addColorStop(0.6, '#5fa07c');
        grad.addColorStop(1, 'rgba(77,139,106,0.2)');

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.arcTo(x + barW, y, x + barW, y + r, r);
        ctx.lineTo(x + barW, pad.top + chartH);
        ctx.lineTo(x, pad.top + chartH);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;
        ctx.shadowOffsetY = 0;

        // Valor encima de la barra
        if (p >= 0.98 && count > 0) {
          ctx.fillStyle    = '#36694f';
          ctx.font         = '700 11px Montserrat, sans-serif';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(count, x + barW / 2, y - 4);
        }
      });
    }

    if (window.gsap) {
      gsap.fromTo(prog, { v: 0 }, {
        v: 1, duration: 1.4,
        ease: 'expo.out',
        onUpdate: () => drawBars(prog.v),
        onComplete: () => drawBars(1),
      });
    } else {
      drawBars(1);
    }
  }

  function renderDonutChart(appts) {
    const canvas   = document.getElementById('donutChart');
    const legendEl = document.getElementById('donutLegend');
    if (!canvas || !legendEl) return;

    const { ctx, W, H } = setupCanvas(canvas);
    const cx     = W / 2;
    const cy     = H / 2;
    const outerR = Math.min(W, H) / 2 - 16;
    const innerR = outerR * 0.58;

    // Contar métodos de pago
    const counts = {};
    appts.forEach(a => {
      const m = a.payment_method || 'Otro';
      counts[m] = (counts[m] || 0) + 1;
    });

    const total   = Object.values(counts).reduce((s, v) => s + v, 0) || 0;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const colors  = entries.map(([name]) => PAYMENT_COLORS[name] || '#8fa496');

    // Leyenda
    legendEl.innerHTML = entries.length === 0
      ? '<p style="color:#8fa496;font-size:.75rem;text-align:center;padding:12px 0">Sin datos</p>'
      : entries.map(([name, count], i) =>
          '<div class="donut-legend-item">' +
          '<div class="donut-legend-color" style="background:' + colors[i] + ';box-shadow:0 2px 6px ' + colors[i] + '55"></div>' +
          '<span class="donut-legend-label">' + escapeHtml(name) + '</span>' +
          '<span class="donut-legend-pct">' + Math.round((count / (total || 1)) * 100) + '%</span>' +
          '</div>'
        ).join('');

    if (total === 0) {
      ctx.fillStyle    = '#c2ddd0';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = '500 12px Montserrat, sans-serif';
      ctx.fillText('Sin citas aún', cx, cy);
      return;
    }

    const prog = { v: 0 };

    function drawDonut(p) {
      ctx.clearRect(0, 0, W, H);

      // Pista de fondo
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR, Math.PI * 2, 0, true);
      ctx.fillStyle = 'rgba(194,221,208,0.18)';
      ctx.fill();

      let startAngle = -Math.PI / 2;
      const gap      = 0.03;

      entries.forEach(([, count], i) => {
        const fraction   = count / total;
        const sliceAngle = fraction * Math.PI * 2 * p;
        const endAngle   = startAngle + sliceAngle - gap;
        if (sliceAngle <= gap) { startAngle += sliceAngle; return; }

        // Sombra
        ctx.shadowColor   = colors[i] + '44';
        ctx.shadowBlur    = 12;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;

        startAngle += sliceAngle;
      });

      // Texto central
      const labelAlpha = Math.max(0, (p - 0.85) / 0.15);
      if (labelAlpha > 0) {
        ctx.globalAlpha  = labelAlpha;
        ctx.fillStyle    = '#1a2a1e';
        ctx.font         = '700 30px Cormorant Garamond, serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 9);
        ctx.font         = '500 10px Montserrat, sans-serif';
        ctx.fillStyle    = '#8fa496';
        ctx.letterSpacing = '0.08em';
        ctx.fillText('citas', cx, cy + 12);
        ctx.globalAlpha  = 1;
      }
    }

    if (window.gsap) {
      gsap.fromTo(prog, { v: 0 }, {
        v: 1, duration: 1.5,
        ease: 'expo.out',
        onUpdate: () => drawDonut(prog.v),
        onComplete: () => drawDonut(1),
      });
    } else {
      drawDonut(1);
    }
  }

  /* ─────────────────────────────────────────────
     UPDATE INDICATOR
  ──────────────────────────────────────────────── */
  function setUpdateStatus(state) {
    // state: 'loading' | 'live' | 'error'
    const dot   = document.getElementById('updateDot');
    const text  = document.getElementById('updateText');
    const mdot  = document.getElementById('mobileStatusDot');

    if (!dot || !text) return;

    if (state === 'live') {
      dot.classList.add('live');
      if (mdot) mdot.classList.add('live');
      lastUpdated = Date.now();
      updateRelativeTime();
    } else if (state === 'loading') {
      dot.classList.remove('live');
      if (mdot) mdot.classList.remove('live');
      text.textContent = 'Actualizando…';
    } else if (state === 'error') {
      dot.classList.remove('live');
      text.textContent = 'Error al actualizar';
    }
  }

  function updateRelativeTime() {
    const text = document.getElementById('updateText');
    if (!text || !lastUpdated) return;
    const secs = Math.floor((Date.now() - lastUpdated) / 1000);
    if (secs < 10)       text.textContent = 'Actualizado ahora';
    else if (secs < 60)  text.textContent = 'Actualizado hace ' + secs + 's';
    else                 text.textContent = 'Actualizado hace ' + Math.floor(secs/60) + 'min';
  }

  /* ─────────────────────────────────────────────
     MAIN LOAD & POLL
  ──────────────────────────────────────────────── */
  async function loadData(isRefresh) {
    if (!isRefresh) setUpdateStatus('loading');

    const fresh = await fetchAppointments();

    // Detect new appointments
    const newIds = new Set();
    if (isRefresh && knownIds.size > 0) {
      fresh.forEach(a => {
        if (!knownIds.has(a.id)) newIds.add(a.id);
      });
    }
    fresh.forEach(a => knownIds.add(a.id));

    allAppointments = fresh;

    renderKPIs(allAppointments);
    buildWeekGrid(allAppointments);
    applyFilters();
    renderBarChart(allAppointments);
    renderDonutChart(allAppointments);

    setUpdateStatus('live');

    if (newIds.size > 0) {
      console.log('Nuevas citas detectadas:', newIds.size);
    }
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(() => loadData(true), POLL_INTERVAL_MS);
    // Update relative time label every 15s
    setInterval(updateRelativeTime, 15_000);
  }

  /* ─────────────────────────────────────────────
     PAGE HEADER DATE
  ──────────────────────────────────────────────── */
  function renderHeaderDate() {
    const el = document.getElementById('currentDateLabel');
    if (!el) return;
    el.textContent = formatLongDate(today());
  }

  /* ─────────────────────────────────────────────
     SIDEBAR & MOBILE NAV
  ──────────────────────────────────────────────── */
  function setupNav() {
    const sidebar  = document.getElementById('sidebar');
    const burger   = document.getElementById('hamburger');
    const overlay  = document.getElementById('sidebarOverlay');

    // Hamburger toggle
    if (burger && sidebar && overlay) {
      burger.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');
        overlay.classList.toggle('visible', open);
      });
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      });
    }

    // Active nav items on scroll
    const sections = document.querySelectorAll('.dash-section');
    const navItems = document.querySelectorAll('.nav-item[data-section]');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('section-', '');
          navItems.forEach(n => {
            n.classList.toggle('active', n.dataset.section === id);
          });
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(s => observer.observe(s));

    // Smooth close on nav click (mobile)
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          overlay?.classList.remove('visible');
        }
      });
    });
  }

  /* ─────────────────────────────────────────────
     GSAP ENTRANCE ANIMATIONS
  ──────────────────────────────────────────────── */
  function runEntranceAnimations() {
    if (!window.gsap) return;

    // KPI cards stagger
    gsap.to('.kpi-card', {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.15,
    });

    // Header
    gsap.from('.dash-title', {
      opacity: 0, y: -12, duration: 0.6, ease: 'power2.out'
    });
    gsap.from('.dash-subtitle', {
      opacity: 0, y: -8, duration: 0.6, delay: 0.12, ease: 'power2.out'
    });
    gsap.from('.update-indicator', {
      opacity: 0, x: 14, duration: 0.5, delay: 0.25, ease: 'power2.out'
    });

    // Sections
    gsap.from('.section-label', {
      opacity: 0, x: -10, duration: 0.4, stagger: 0.08, delay: 0.3, ease: 'power2.out'
    });
    gsap.from('.week-card, .table-wrap, .chart-card', {
      opacity: 0, y: 16, duration: 0.6, stagger: 0.08, delay: 0.4, ease: 'power2.out'
    });
  }

  /* ─────────────────────────────────────────────
     UTILITY
  ──────────────────────────────────────────────── */
  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function escapeHtml(str) {
    if (!str) return '—';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* ─────────────────────────────────────────────
     BOOT
  ──────────────────────────────────────────────── */
  function boot() {
    initSupabase();
    currentWeekStart = getMondayOf(today());

    renderHeaderDate();
    setupNav();
    setupTableFilters();
    runEntranceAnimations();

    loadData(false).then(() => {
      startPolling();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
