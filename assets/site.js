/* ============================================================
   RIRA KIM — site behavior
   페이지마다 필요한 블록만 골라 렌더합니다.
   ============================================================ */
(function () {
  'use strict';

  /* ── GNB: 현재 페이지 표시 + 스크롤 경계선 ──────────── */
  var gnb = document.querySelector('.gnb');
  if (gnb) {
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    Array.prototype.forEach.call(gnb.querySelectorAll('.gnb-menu a'), function (a) {
      var target = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (target === here) a.setAttribute('aria-current', 'page');
    });
    var autohide = gnb.classList.contains('gnb--autohide');
    var onScroll = function () {
      var y = window.scrollY;
      gnb.classList.toggle('is-stuck', y > 8);
      if (autohide) gnb.classList.toggle('is-shown', y > 80);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── 동료 리뷰 마퀴 (메인) ──────────────────────────── */
  var voicesEl = document.getElementById('voices');
  if (voicesEl && window.VOICES) {
    var escText = function (v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    var colors = window.VOICE_COLORS || {};
    var colorFor = function (role) {
      return colors[role] || colors._default || '#8A9099';
    };
    var card = function (v) {
      return '<figure class="voice-card">' +
               '<span class="voice-mark" aria-hidden="true" style="color:' + colorFor(v.role) + '">\u201C</span>' +
               '<blockquote>' + escText(v.text) + '</blockquote>' +
               '<figcaption>' + escText(v.role) + '</figcaption>' +
             '</figure>';
    };
    /* 끊김 없이 순환하도록 같은 묶음을 두 번 깔고 -50% 이동 */
    var group = window.VOICES.map(card).join('');
    var track = voicesEl.querySelector('.marquee-track');
    track.innerHTML = group + group;
    track.setAttribute('aria-hidden', 'false');
  }

  /* ── 프로젝트 데이터 ────────────────────────────────── */
  var DATA = window.PROJECTS || [];

  /* service('Tnear · 첫화면날씨')의 앞부분을 회사명으로 씀 */
  var companyOf = function (p) {
    return String(p.service || '').split('·')[0].trim();
  };

  var esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* ── 프로젝트 페이지: 목록 + 태그 필터 ──────────────── */
  var listEl = document.getElementById('prjList');
  var gridEl = document.getElementById('prjGrid');
  var hostEl = listEl || gridEl;
  if (hostEl) {
    var block = function (label, inner) {
      return '<div class="prj-block"><h4>' + label + '</h4>' + inner + '</div>';
    };
    var bullets = function (arr) {
      return '<ul>' + arr.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>';
    };

    /* 프로젝트 페이지는 썸네일이 있는 항목만, 파일명 순으로 보여줌 */
    var SOURCE = gridEl
      ? DATA.filter(function (p) { return p.thumb; })
            .sort(function (a, b) { return a.thumb.localeCompare(b.thumb); })
      : DATA;

    hostEl.innerHTML = SOURCE.map(function (p, idx) {
      var body = [];

      /* 프로젝트 조건 */
      if (p.scope || p.team) {
        var facts = [];
        if (p.scope) facts.push('<div><dt>서비스 범위</dt><dd>' + esc(p.scope) + '</dd></div>');
        if (p.team) facts.push('<div><dt>팀 구성</dt><dd>' + esc(p.team) + '</dd></div>');
        body.push('<dl class="prj-facts">' + facts.join('') + '</dl>');
      }

      if (p.summary) body.push('<p class="prj-lead">' + esc(p.summary) + '</p>');
      if (p.problem) body.push(block('문제 정의', '<p>' + esc(p.problem) + '</p>'));

      /* 리서치 */
      if (p.research) {
        var r = '';
        if (p.research.lead) r += '<p>' + esc(p.research.lead) + '</p>';
        if (p.research.items) r += bullets(p.research.items);
        if (p.research.requests) r += '<p class="prj-src">' + esc(p.research.requests) + '</p>';
        if (p.research.label) r += '<p class="prj-src">' + esc(p.research.label) + '</p>';
        body.push(block('리서치', r));
      }

      /* 가설 → 목표 지표 */
      if (p.hypotheses && p.hypotheses.length) {
        body.push(block('가설과 목표 지표', '<div class="hyp">' + p.hypotheses.map(function (h, i) {
          return '<div class="hyp-row">' +
                   '<div class="hyp-no">H' + (i + 1) + '</div>' +
                   '<div class="hyp-main">' +
                     '<div class="hyp-problem">' + esc(h.problem) + '</div>' +
                     '<p>' + esc(h.bet) + '</p>' +
                   '</div>' +
                   '<div class="hyp-goal"><span class="hyp-metric">' + esc(h.metric) + '</span><span class="hyp-target">' + esc(h.target) + '</span></div>' +
                 '</div>';
        }).join('') + '</div>'));
      }

      /* 해결 (AS-IS → TO-BE) */
      if (p.solutions && p.solutions.length) {
        body.push(block('해결', '<div class="sols">' + p.solutions.map(function (so, i) {
          return '<div class="sol">' +
                   '<div class="sol-head"><span class="sol-no">Solution 0' + (i + 1) + '</span><h5>' + esc(so.title) + '</h5></div>' +
                   (so.lead ? '<p class="sol-lead">' + esc(so.lead) + '</p>' : '') +
                   '<div class="sol-cols">' +
                     '<div class="sol-col sol-asis"><span class="sol-tag">AS-IS</span>' + bullets(so.asis || []) + '</div>' +
                     '<div class="sol-col sol-tobe"><span class="sol-tag">TO-BE</span>' + bullets(so.tobe || []) + '</div>' +
                   '</div>' +
                   (so.result ? '<div class="sol-result">' + esc(so.result) + '</div>' : '') +
                 '</div>';
        }).join('') + '</div>'));
      }

      /* 기존 간단 서술형 프로젝트용 */
      if (!p.solutions && p.approach && p.approach.length) body.push(block('접근', bullets(p.approach)));

      if (p.output) body.push(block('산출물', '<p>' + esc(p.output) + '</p>'));

      if (p.metrics && p.metrics.length) {
        body.push(block('결과',
          '<div class="prj-metrics">' + p.metrics.map(function (m) {
            return '<div><span class="m-val">' + esc(m.val) + '</span><span class="m-lab">' + esc(m.lab) + '</span></div>';
          }).join('') + '</div>' +
          (p.basis ? '<p class="prj-src">' + esc(p.basis) + '</p>' : '')));
      }

      if (p.insights && p.insights.length) body.push(block('인사이트', bullets(p.insights)));
      if (p.note) body.push(block('남은 과제', '<p>' + esc(p.note) + '</p>'));
      if (p.role) body.push('<div class="prj-role">' + esc(p.role) + '</div>');
      if (p.link) body.push('<a class="prj-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">케이스 스터디 보기 ↗</a>');

      var meta = [p.period, p.service].filter(Boolean).join(' · ');

      /* 프로젝트 페이지: 썸네일 카드 2단 그리드 */
      if (gridEl) {
        var inner =
          '<div class="pcard-visual">' +
            '<img src="' + esc(p.thumb) + '" alt="' + esc(p.title) + ' 썸네일" loading="lazy">' +
            (p.detail ? '<i class="pcard-plus" aria-hidden="true"></i>' : '') +
          '</div>' +
          '<div class="pcard-body">' +
            (meta ? '<span class="pcard-meta">' + esc(meta) + '</span>' : '') +
            '<h3 class="pcard-title">' + esc(p.title) + '</h3>' +
            ((p.tags && p.tags.length) ? '<div class="prj-tags">' + p.tags.map(function (t) {
                return '<span>' + esc(t) + '</span>';
              }).join('') + '</div>' : '') +
          '</div>';

        var attrs = ' id="' + esc(p.id) + '"' +
                    ' data-company="' + esc(companyOf(p)) + '"' +
                    ' data-tags="' + esc((p.tags || []).join('|')) + '"';

        /* 썸네일을 누르면 상세 페이지로 이동. 상세가 아직 없으면 정적 카드 */
        if (p.detail) {
          return '<a class="pcard pcard--link"' + attrs + ' href="' + esc(p.detail) + '">' + inner + '</a>';
        }
        return '<article class="pcard pcard--soon"' + attrs + '>' + inner + '</article>';
      }

      /* 이력서 Experience: 한 줄 목록 */
      return '<details class="prj" id="' + esc(p.id) + '"' +
               ' data-company="' + esc(companyOf(p)) + '"' +
               ' data-tags="' + esc((p.tags || []).join('|')) + '">' +
               '<summary>' +
                 '<div class="prj-main">' +
                   '<div class="prj-title">' + esc(p.title) + '</div>' +
                   (meta ? '<div class="prj-meta">' + esc(meta) + '</div>' : '') +
                 '</div>' +
                 '<div class="prj-side">' +
                   ((p.tags && p.tags.length) ? '<div class="prj-tags">' + p.tags.map(function (t) {
                       return '<span>' + esc(t) + '</span>';
                     }).join('') + '</div>' : '') +
                   '<i class="prj-caret" aria-hidden="true"></i>' +
                 '</div>' +
               '</summary>' +
               '<div class="prj-body"><div class="prj-body-inner">' + body.join('') + '</div></div>' +
             '</details>';
    }).join('') + '<p class="empty" id="prjEmpty" hidden>선택한 태그에 해당하는 프로젝트가 없습니다.</p>';

    /* 필터: 회사 · 태그 2단, 두 조건을 함께 적용 */
    var filterEl = document.getElementById('prjFilters');
    if (filterEl) {
      var companies = [];
      DATA.forEach(function (p) {
        var c = companyOf(p);
        if (c && companies.indexOf(c) === -1) companies.push(c);
      });
      var allTags = [];
      DATA.forEach(function (p) {
        (p.tags || []).forEach(function (t) { if (allTags.indexOf(t) === -1) allTags.push(t); });
      });
      var tagTotal = {};
      DATA.forEach(function (p) { (p.tags || []).forEach(function (t) { tagTotal[t] = (tagTotal[t] || 0) + 1; }); });
      allTags.sort(function (a, b) { return tagTotal[b] - tagTotal[a] || a.localeCompare(b, 'ko'); });

      var active = { company: '', tag: '' };

      var row = function (kind, legend, values) {
        return '<div class="filter-row" data-kind="' + kind + '">' +
                 '<span class="filter-legend">' + legend + '</span>' +
                 '<button class="chip" data-val="" aria-pressed="true">전체<span class="n"></span></button>' +
                 values.map(function (v) {
                   return '<button class="chip" data-val="' + esc(v) + '" aria-pressed="false">' + esc(v) + '<span class="n"></span></button>';
                 }).join('') +
               '</div>';
      };
      filterEl.innerHTML = row('company', '회사', companies) + row('tag', '태그', allTags);

      var emptyEl = document.getElementById('prjEmpty');
      var items = Array.prototype.slice.call(hostEl.querySelectorAll('[data-tags]'));

      /* 다른 축의 선택을 반영해 각 칩의 개수를 다시 계산 */
      var countFor = function (kind, val) {
        return DATA.filter(function (p) {
          var okC = kind === 'company'
            ? (!val || companyOf(p) === val)
            : (!active.company || companyOf(p) === active.company);
          var okT = kind === 'tag'
            ? (!val || (p.tags || []).indexOf(val) > -1)
            : (!active.tag || (p.tags || []).indexOf(active.tag) > -1);
          return okC && okT;
        }).length;
      };

      var apply = function () {
        var shown = 0;
        items.forEach(function (el) {
          var okC = !active.company || el.dataset.company === active.company;
          var okT = !active.tag || el.dataset.tags.split('|').indexOf(active.tag) > -1;
          var match = okC && okT;
          el.hidden = !match;
          if (!match) el.open = false;
          if (match) shown++;
        });
        if (emptyEl) emptyEl.hidden = shown > 0;

        Array.prototype.forEach.call(filterEl.querySelectorAll('.filter-row'), function (r) {
          var kind = r.dataset.kind;
          Array.prototype.forEach.call(r.querySelectorAll('.chip'), function (c) {
            var n = countFor(kind, c.dataset.val);
            c.querySelector('.n').textContent = n;
            var isActive = c.dataset.val === active[kind];
            c.setAttribute('aria-pressed', String(isActive));
            c.disabled = n === 0 && !isActive;
          });
        });
      };

      filterEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn || btn.disabled) return;
        var r = btn.closest('.filter-row');
        active[r.dataset.kind] = btn.dataset.val;
        apply();
      });
      apply();
    }

    /* 인쇄할 때는 접힌 상세를 펼쳐서 내용이 빠지지 않게 함 */
    var openedForPrint = [];
    window.addEventListener('beforeprint', function () {
      openedForPrint = [];
      Array.prototype.forEach.call(hostEl.querySelectorAll('[data-tags]:not([open])'), function (d) {
        openedForPrint.push(d);
        d.open = true;
      });
    });
    window.addEventListener('afterprint', function () {
      openedForPrint.forEach(function (d) { d.open = false; });
      openedForPrint = [];
    });

    /* 해시로 들어오면 해당 프로젝트를 펼치고 이동 */
    var openFromHash = function () {
      var id = decodeURIComponent(location.hash.replace('#', ''));
      if (!id) return;
      var target = document.getElementById(id);
      if (target && target.hasAttribute('data-tags')) {
        target.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }
})();
