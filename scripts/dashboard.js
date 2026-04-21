const DATA_URL = 'data/loc-history.json';
const CACHE_KEY = 'ecosystem-dashboard-cache-v2';
const CACHE_TTL_MS = 5 * 60 * 1000;

const state = {
  data: null,
  selectedRepo: null,
  compareRepos: [],
  windowSize: 21,
  chartMode: 'daily',
  usingCache: false,
  hoverLocked: false
};

const el = {
  repoSelect: document.getElementById('repoSelect'),
  compareSelect: document.getElementById('compareSelect'),
  windowSelect: document.getElementById('windowSelect'),
  modeSelect: document.getElementById('modeSelect'),
  reloadButton: document.getElementById('reloadButton'),
  summaryCards: document.getElementById('summaryCards'),
  repoTableBody: document.getElementById('repoTableBody'),
  chartSvg: document.getElementById('chartSvg'),
  chartEmpty: document.getElementById('chartEmpty'),
  chartMeta: document.getElementById('chartMeta'),
  repoNote: document.getElementById('repoNote'),
  lastUpdated: document.getElementById('lastUpdated'),
  statusBannerTitle: document.getElementById('statusBannerTitle'),
  statusBannerCopy: document.getElementById('statusBannerCopy'),
  cacheBadge: document.getElementById('cacheBadge'),
  tooltip: document.getElementById('chartTooltip')
};

const comparisonPalette = ['#5865f2', '#00a3ff', '#8b5cf6', '#0f9f6e', '#d84d57'];

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatDate(dateStr) {
  try {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function statusMeta(status) {
  if (status === 'private-token-required') {
    return { label: 'Needs token', className: 'badge-warning' };
  }
  if (status === 'error') {
    return { label: 'Fetch error', className: 'badge-error' };
  }
  return { label: 'OK', className: 'badge-ok' };
}

function getCachedPayload() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || !parsed.data) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Ignore localStorage failures.
  }
}

function aggregateRepo(days, repoName) {
  return days.reduce((acc, day) => {
    const metric = day.metrics?.[repoName] || {};
    acc.additions += metric.additions || 0;
    acc.deletions += metric.deletions || 0;
    acc.changes += metric.changes || 0;
    acc.commits += metric.commits || 0;
    acc.sparkline.push(metric.changes || 0);

    if (metric.status === 'private-token-required') {
      acc.status = 'private-token-required';
    } else if (metric.status === 'error' && acc.status !== 'private-token-required') {
      acc.status = 'error';
    }

    return acc;
  }, { additions: 0, deletions: 0, changes: 0, commits: 0, status: 'ok', sparkline: [] });
}

function getWindowedDays() {
  return state.data.days.slice(-Number(state.windowSize || 21));
}

function buildSummary(days) {
  const totals = days.reduce((acc, day) => {
    Object.values(day.metrics || {}).forEach(metric => {
      acc.additions += metric.additions || 0;
      acc.deletions += metric.deletions || 0;
      acc.changes += metric.changes || 0;
      acc.commits += metric.commits || 0;
    });
    return acc;
  }, { additions: 0, deletions: 0, changes: 0, commits: 0 });

  const cards = [
    ['Tracked repos', state.data.repos.length, 'Repositories available in the current telemetry contract'],
    ['Additions', totals.additions, 'Total lines added across the selected time window'],
    ['Deletions', totals.deletions, 'Total lines removed across the selected time window'],
    ['Commits', totals.commits, 'Commits captured across all tracked repositories']
  ];

  el.summaryCards.innerHTML = cards.map(([label, value, footnote]) => `
    <article class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value mono">${formatNumber(value)}</div>
      <div class="kpi-footnote">${footnote}</div>
    </article>
  `).join('');
}

function buildSparkline(values) {
  const width = 110;
  const height = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return `
    <svg width="110" height="28" viewBox="0 0 110 28" aria-hidden="true">
      <polyline fill="none" stroke="#aeb8cd" stroke-width="1.5" points="${points}" />
      <polyline fill="none" stroke="#5865f2" stroke-width="2" points="${points}" />
    </svg>
  `;
}

function renderTable(days) {
  el.repoTableBody.innerHTML = state.data.repos.map(repo => {
    const totals = aggregateRepo(days, repo.name);
    const visibilityClass = repo.visibility === 'private' ? 'badge-private' : 'badge-public';
    const status = statusMeta(totals.status);

    return `
      <tr>
        <td>
          <a class="repo-link" href="https://github.com/${repo.name}" target="_blank" rel="noreferrer">${repo.name}</a>
        </td>
        <td><span class="badge ${visibilityClass}">${repo.visibility}</span></td>
        <td class="mono">${repo.branch}</td>
        <td class="mono">${formatNumber(totals.additions)}</td>
        <td class="mono">${formatNumber(totals.deletions)}</td>
        <td class="mono">${formatNumber(totals.changes)}</td>
        <td class="mono">${formatNumber(totals.commits)}</td>
        <td><span class="badge ${status.className}">${status.label}</span></td>
        <td><a class="repo-link" href="https://github.com/${repo.name}/blame/${repo.branch}" target="_blank" rel="noreferrer">View</a></td>
        <td>${buildSparkline(totals.sparkline)}</td>
      </tr>
    `;
  }).join('');
}

function updateRepoNote() {
  const selected = state.data.repos.find(repo => repo.name === state.selectedRepo);
  if (!selected) {
    el.repoNote.textContent = '';
    return;
  }

  if (state.compareRepos.length) {
    el.repoNote.textContent = 'Comparison mode overlays multiple repositories on the same net-change chart while keeping the original data source and filters intact.';
    return;
  }

  el.repoNote.textContent = selected.visibility === 'private'
    ? 'This repository is private. If metrics are empty or warn for token access, set ECOSYSTEM_GH_TOKEN with repo read scope in the site repository secrets.'
    : 'Public repositories should refresh from the scheduled workflow without extra setup.';
}

function updateStatusBanner(days) {
  const statuses = new Set();
  days.forEach(day => {
    Object.values(day.metrics || {}).forEach(metric => {
      if (metric?.status) statuses.add(metric.status);
    });
  });

  if (statuses.has('error')) {
    el.statusBannerTitle.textContent = 'Some repositories reported fetch errors';
    el.statusBannerCopy.textContent = 'At least one repository returned an error in the selected window. The dashboard still renders available metrics from the same loc-history data contract.';
  } else if (statuses.has('private-token-required')) {
    el.statusBannerTitle.textContent = 'Private repositories need cross-repo access';
    el.statusBannerCopy.textContent = 'Private repository metrics require ECOSYSTEM_GH_TOKEN with repo read access for the scheduled workflow to populate telemetry.';
  } else {
    el.statusBannerTitle.textContent = 'Telemetry reporting is healthy';
    el.statusBannerCopy.textContent = 'All tracked repositories in the selected window are reporting without token or fetch issues.';
  }
}

function updateCacheBadge() {
  el.cacheBadge.textContent = state.usingCache ? 'Local cache active' : 'Live data';
}

function updateLastUpdated() {
  if (!state.data?.generated_at) {
    el.lastUpdated.textContent = 'Updated time unavailable';
    return;
  }

  try {
    const date = new Date(state.data.generated_at);
    el.lastUpdated.textContent = `Updated ${date.toLocaleString()}`;
  } catch {
    el.lastUpdated.textContent = `Updated ${state.data.generated_at}`;
  }
}

function getMetricSeries(days, repoName) {
  let running = 0;
  return days.map(day => {
    const metric = day.metrics?.[repoName] || {};
    const dailyNet = (metric.additions || 0) - (metric.deletions || 0);
    running += dailyNet;
    return {
      date: day.date,
      additions: metric.additions || 0,
      deletions: metric.deletions || 0,
      net: dailyNet,
      plotNet: state.chartMode === 'cumulative' ? running : dailyNet,
      changes: metric.changes || 0
    };
  });
}

function buildPath(series, width, height, padding, minY, maxY) {
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const step = series.length > 1 ? plotWidth / (series.length - 1) : 0;

  const scaleY = value => {
    if (maxY === minY) return padding.top + plotHeight / 2;
    return padding.top + ((maxY - value) / (maxY - minY)) * plotHeight;
  };

  const points = series.map((item, index) => {
    const x = padding.left + (series.length > 1 ? index * step : plotWidth / 2);
    const y = scaleY(item.plotNet);
    return { x, y, item };
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  return { points, path, scaleY, plotWidth, plotHeight, step };
}

function showTooltip(event, lines) {
  if (state.hoverLocked) return;
  el.tooltip.innerHTML = lines.join('');
  el.tooltip.hidden = false;

  const bounds = el.chartSvg.getBoundingClientRect();
  const left = Math.min(bounds.width - 220, Math.max(12, event.clientX - bounds.left + 12));
  const top = Math.max(12, event.clientY - bounds.top - 12);

  el.tooltip.style.left = `${left}px`;
  el.tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  if (state.hoverLocked) return;
  el.tooltip.hidden = true;
}

function drawChart(days) {
  const compareRepos = state.compareRepos.filter(Boolean);
  const reposToPlot = compareRepos.length ? [state.selectedRepo, ...compareRepos] : [state.selectedRepo];
  const uniqueRepos = [...new Set(reposToPlot)].filter(Boolean);

  if (!uniqueRepos.length) {
    el.chartSvg.innerHTML = '';
    el.chartEmpty.style.display = 'grid';
    el.chartMeta.textContent = 'No repository selected.';
    return;
  }

  const primarySeries = getMetricSeries(days, state.selectedRepo);
  const hasPrimaryActivity = primarySeries.some(item => item.additions || item.deletions || item.plotNet);

  if (!hasPrimaryActivity && uniqueRepos.length === 1) {
    el.chartSvg.innerHTML = '';
    el.chartEmpty.style.display = 'grid';
    el.chartMeta.textContent = 'No activity recorded for the selected repository and time window.';
    return;
  }

  el.chartEmpty.style.display = 'none';

  const width = Math.max(860, days.length * 66);
  const height = 360;
  const padding = { top: 18, right: 30, bottom: 52, left: 54 };

  const seriesByRepo = uniqueRepos.map((repoName, index) => ({
    repoName,
    color: comparisonPalette[index % comparisonPalette.length],
    series: getMetricSeries(days, repoName)
  }));

  const allNetValues = seriesByRepo.flatMap(entry => entry.series.map(item => item.plotNet));
  const allBarValues = primarySeries.flatMap(item => [item.additions, -item.deletions]);
  const minY = Math.min(0, ...allNetValues, ...allBarValues);
  const maxY = Math.max(0, ...allNetValues, ...allBarValues, 1);
  const zeroSpanSafeMin = minY === maxY ? minY - 1 : minY;
  const zeroSpanSafeMax = minY === maxY ? maxY + 1 : maxY;

  const basePathMeta = buildPath(primarySeries, width, height, padding, zeroSpanSafeMin, zeroSpanSafeMax);
  const plotHeight = height - padding.top - padding.bottom;
  const step = primarySeries.length > 1 ? basePathMeta.plotWidth / (primarySeries.length - 1) : 0;
  const barWidth = Math.min(22, (primarySeries.length > 1 ? step : 80) * 0.45);
  const scaleY = value => {
    if (zeroSpanSafeMax === zeroSpanSafeMin) return padding.top + plotHeight / 2;
    return padding.top + ((zeroSpanSafeMax - value) / (zeroSpanSafeMax - zeroSpanSafeMin)) * plotHeight;
  };

  const gridLines = 5;
  const parts = [];

  for (let i = 0; i <= gridLines; i += 1) {
    const ratio = i / gridLines;
    const y = padding.top + ratio * plotHeight;
    const value = zeroSpanSafeMax - ratio * (zeroSpanSafeMax - zeroSpanSafeMin);
    parts.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e7edf6" stroke-width="1" />`);
    parts.push(`<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#8b97af">${Math.round(value)}</text>`);
  }

  const zeroY = scaleY(0);
  parts.push(`<line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="#c8d3e5" stroke-width="1.4" />`);

  primarySeries.forEach((item, index) => {
    const x = padding.left + (primarySeries.length > 1 ? index * step : basePathMeta.plotWidth / 2);
    const addTop = scaleY(item.additions);
    const delBottom = scaleY(-item.deletions);
    const addHeight = zeroY - addTop;
    const delHeight = delBottom - zeroY;

    if (addHeight > 0) {
      parts.push(`<rect x="${x - barWidth / 2}" y="${addTop}" width="${barWidth}" height="${addHeight}" rx="6" fill="#0f9f6e" opacity="0.82" />`);
    }
    if (delHeight > 0) {
      parts.push(`<rect x="${x - barWidth / 2}" y="${zeroY}" width="${barWidth}" height="${delHeight}" rx="6" fill="#d84d57" opacity="0.72" />`);
    }

    parts.push(`<text x="${x}" y="${height - 18}" text-anchor="middle" font-size="10" fill="#8b97af">${formatDate(item.date)}</text>`);
  });

  seriesByRepo.forEach(entry => {
    const pathMeta = buildPath(entry.series, width, height, padding, zeroSpanSafeMin, zeroSpanSafeMax);
    parts.push(`<path d="${pathMeta.path}" fill="none" stroke="${entry.color}" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" />`);
    pathMeta.points.forEach(point => {
      parts.push(`<circle cx="${point.x}" cy="${point.y}" r="4" fill="${entry.color}" />`);
    });
  });

  primarySeries.forEach((item, index) => {
    const x = padding.left + (primarySeries.length > 1 ? index * step : basePathMeta.plotWidth / 2);
    const hitWidth = Math.max(barWidth + 18, 32);
    const compareLines = seriesByRepo.map(entry => {
      const value = entry.series[index]?.plotNet || 0;
      return `<div><span class="tooltip-key" style="background:${entry.color}"></span>${entry.repoName}: ${formatNumber(value)} net</div>`;
    }).join('');

    parts.push(`<rect class="chart-hitbox" data-index="${index}" x="${x - hitWidth / 2}" y="${padding.top}" width="${hitWidth}" height="${plotHeight}" fill="transparent" />`);
    item._tooltipHtml = `
      <div class="tooltip-date">${formatDate(item.date)}</div>
      <div><span class="tooltip-key tooltip-add"></span>Additions: ${formatNumber(item.additions)}</div>
      <div><span class="tooltip-key tooltip-del"></span>Deletions: ${formatNumber(item.deletions)}</div>
      <div><span class="tooltip-key tooltip-net"></span>${state.chartMode === 'cumulative' ? 'Cumulative net' : 'Daily net'}: ${formatNumber(item.plotNet)}</div>
      ${compareLines}
    `;
  });

  el.chartSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  el.chartSvg.innerHTML = parts.join('');

  el.chartSvg.querySelectorAll('.chart-hitbox').forEach((node, index) => {
    node.addEventListener('mouseenter', event => {
      showTooltip(event, [primarySeries[index]._tooltipHtml]);
    });
    node.addEventListener('mousemove', event => {
      showTooltip(event, [primarySeries[index]._tooltipHtml]);
    });
    node.addEventListener('mouseleave', hideTooltip);
    node.addEventListener('click', event => {
      state.hoverLocked = !state.hoverLocked;
      if (!state.hoverLocked) {
        hideTooltip();
      } else {
        showTooltip(event, [primarySeries[index]._tooltipHtml]);
      }
    });
  });

  const totalChanges = primarySeries.reduce((sum, item) => sum + item.changes, 0);
  const compareLabel = uniqueRepos.length > 1 ? ` · comparing ${uniqueRepos.length} repos` : '';
  const modeLabel = state.chartMode === 'cumulative' ? 'cumulative net mode' : 'daily delta mode';
  el.chartMeta.textContent = `${days.length} day window · ${formatNumber(totalChanges)} total changed lines for ${state.selectedRepo}${compareLabel} · ${modeLabel}`;
}

function populateControls() {
  const repoOptions = state.data.repos.map(repo => `<option value="${repo.name}">${repo.name}</option>`).join('');
  el.repoSelect.innerHTML = repoOptions;
  el.compareSelect.innerHTML = `<option value="">No comparison</option>${repoOptions}`;

  if (!state.selectedRepo && state.data.repos[0]) {
    state.selectedRepo = state.data.repos[0].name;
  }

  el.repoSelect.value = state.selectedRepo;
  el.windowSelect.value = String(state.windowSize);
  el.modeSelect.value = state.chartMode;

  const compareValue = state.compareRepos[0] || '';
  el.compareSelect.value = compareValue;
}

function render() {
  if (!state.data) return;
  const days = getWindowedDays();
  buildSummary(days);
  renderTable(days);
  drawChart(days);
  updateRepoNote();
  updateStatusBanner(days);
  updateLastUpdated();
  updateCacheBadge();
}

async function fetchLiveData() {
  const response = await fetch(`${DATA_URL}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function loadDashboard({ forceLive = false } = {}) {
  const cached = !forceLive ? getCachedPayload() : null;
  if (cached?.data) {
    state.data = cached.data;
    state.usingCache = true;
    populateControls();
    render();
  }

  try {
    const liveData = await fetchLiveData();
    state.data = liveData;
    state.usingCache = false;
    saveCache(liveData);
    populateControls();
    render();
  } catch (error) {
    if (!state.data) {
      el.statusBannerTitle.textContent = 'Unable to load dashboard data';
      el.statusBannerCopy.textContent = error.message;
    } else {
      state.usingCache = true;
      updateCacheBadge();
      el.statusBannerTitle.textContent = 'Showing cached dashboard data';
      el.statusBannerCopy.textContent = `Live refresh failed: ${error.message}. Cached data remains available locally.`;
    }
  }
}

el.repoSelect.addEventListener('change', () => {
  state.selectedRepo = el.repoSelect.value;
  if (state.compareRepos.includes(state.selectedRepo)) {
    state.compareRepos = state.compareRepos.filter(repo => repo !== state.selectedRepo);
    el.compareSelect.value = state.compareRepos[0] || '';
  }
  render();
});

el.compareSelect.addEventListener('change', () => {
  const value = el.compareSelect.value;
  state.compareRepos = value && value !== state.selectedRepo ? [value] : [];
  render();
});

el.windowSelect.addEventListener('change', () => {
  state.windowSize = Number(el.windowSelect.value || 21);
  render();
});

el.modeSelect.addEventListener('change', () => {
  state.chartMode = el.modeSelect.value;
  state.hoverLocked = false;
  hideTooltip();
  render();
});

el.reloadButton.addEventListener('click', () => {
  state.hoverLocked = false;
  hideTooltip();
  loadDashboard({ forceLive: true });
});

window.addEventListener('resize', () => {
  if (state.data) {
    render();
  }
});

loadDashboard();
