/* Careers listing: renders open positions, filters them, and expands full
   detail in place. Job content lives in careers-data.js so it can be edited
   without touching markup. */
(function () {
  var listEl = document.getElementById('job-list');
  if (!listEl || !window.MEDENX_JOBS) return;

  var jobs = window.MEDENX_JOBS;
  var filterEl = document.getElementById('job-filters');
  var countEl = document.getElementById('job-count');
  var activeFilter = 'all';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* Only renders a meta row when the value is actually present — unknown
     fields are omitted rather than shown to a candidate as a placeholder. */
  function metaRow(label, value) {
    if (!value) return '';
    return '<div class="job-meta-item"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  function bulletList(heading, items) {
    if (!items || !items.length) return '';
    var lis = items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('');
    return '<div class="job-detail-block"><h4>' + esc(heading) + '</h4><ul class="pill-list">' + lis + '</ul></div>';
  }

  function jobCard(job, index) {
    var panelId = 'job-panel-' + index;
    var btnId = 'job-toggle-' + index;
    var isClosed = job.status && job.status.toLowerCase() === 'closed';

    var chips = [job.department, job.type, job.arrangement, job.location, job.level]
      .filter(Boolean)
      .map(function (c) { return '<span class="job-chip">' + esc(c) + '</span>'; })
      .join('');

    var meta =
      metaRow('Job ID', job.id) +
      metaRow('Department', job.department) +
      metaRow('Employment type', job.type) +
      metaRow('Work arrangement', job.arrangement) +
      metaRow('Location', job.location) +
      metaRow('Career level', job.level) +
      metaRow('Experience', job.experience) +
      metaRow('Education', job.education) +
      metaRow('Application deadline', job.deadline);

    return '' +
      '<article class="job" data-category="' + esc(job.category) + '"' + (isClosed ? ' data-closed="true"' : '') + '>' +
        '<div class="job-head">' +
          '<div class="job-title-wrap">' +
            '<h3>' + esc(job.title) + '</h3>' +
            '<div class="job-chips">' + chips +
              (isClosed ? '<span class="job-chip job-chip--closed">Closed</span>' : '<span class="job-chip job-chip--open">Open</span>') +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-secondary btn-sm job-toggle" id="' + btnId + '" aria-expanded="false" aria-controls="' + panelId + '">' +
            '<span class="job-toggle-label">Details</span>' +
          '</button>' +
        '</div>' +
        '<p class="job-overview">' + esc(job.overview) + '</p>' +
        '<div class="job-panel" id="' + panelId + '" role="region" aria-labelledby="' + btnId + '" hidden>' +
          (meta ? '<dl class="job-meta">' + meta + '</dl>' : '') +
          bulletList('Responsibilities', job.responsibilities) +
          bulletList('Requirements', job.required) +
          bulletList('Preferred', job.preferred) +
          '<div class="job-apply-row">' +
            (isClosed
              ? '<p class="job-closed-note">This position is no longer accepting applications.</p>'
              : '<a class="btn btn-primary btn-sm" href="#apply" data-apply-for="' + esc(job.title) + '">Apply for this role</a>') +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var visible = jobs.filter(function (j) {
      return activeFilter === 'all' || j.category === activeFilter;
    });

    if (!visible.length) {
      listEl.innerHTML = '<p class="job-empty">No open positions in this area right now. You can still send us your details below — we keep applications on file.</p>';
    } else {
      listEl.innerHTML = visible.map(jobCard).join('');
    }

    if (countEl) {
      var openCount = visible.filter(function (j) {
        return !j.status || j.status.toLowerCase() !== 'closed';
      }).length;
      countEl.textContent = openCount === 1
        ? 'Showing 1 open position.'
        : 'Showing ' + openCount + ' open positions.';
    }

    wireCards();
  }

  function wireCards() {
    listEl.querySelectorAll('.job-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.hidden = open;
        btn.querySelector('.job-toggle-label').textContent = open ? 'Details' : 'Hide details';
      });
    });

    /* Clicking apply pre-selects the role in the application form so the
       candidate does not have to retype it. */
    listEl.querySelectorAll('[data-apply-for]').forEach(function (link) {
      link.addEventListener('click', function () {
        var role = link.getAttribute('data-apply-for');
        var field = document.getElementById('position');
        if (field) {
          field.value = role;
          field.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  if (filterEl) {
    filterEl.querySelectorAll('.category-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeFilter = chip.getAttribute('data-filter');
        filterEl.querySelectorAll('.category-chip').forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        render();
      });
    });
  }

  render();
})();
