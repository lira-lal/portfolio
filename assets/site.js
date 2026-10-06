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

  /* ── Cover: 독립된 물방울 레이어마다 다른 패럴랙스 적용 ── */
  var cover = document.querySelector('.cover');
  var coverDrops = cover ? Array.prototype.slice.call(cover.querySelectorAll('.cover-drop')) : [];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (cover && coverDrops.length && window.requestAnimationFrame) {
    var coverTicking = false;
    var moveCoverDrops = function () {
      var bounds = cover.getBoundingClientRect();
      var progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
      var distance = window.innerWidth <= 720 ? 125 : 200;
      if (reduceMotion) distance *= .55;
      coverDrops.forEach(function (drop) {
        var depth = drop.classList.contains('cover-drop--structure') ? -.82 :
                    (drop.classList.contains('cover-drop--experience') ? 1.18 : 1);
        var y = (progress * distance * depth).toFixed(1);
        drop.style.transform = 'translate3d(0,' + y + 'px,0) rotate(var(--drop-rot,0deg))';
      });
      coverTicking = false;
    };
    var scheduleCoverBg = function () {
      if (!coverTicking) {
        coverTicking = true;
        window.requestAnimationFrame(moveCoverDrops);
      }
    };
    moveCoverDrops();
    window.addEventListener('scroll', scheduleCoverBg, { passive: true });
    window.addEventListener('resize', scheduleCoverBg, { passive: true });
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

    /* 메인의 요약 띠는 data-limit 만큼만 */
    var limit = gridEl && parseInt(gridEl.getAttribute('data-limit'), 10);
    if (limit > 0) SOURCE = SOURCE.slice(0, limit);

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
            (p.detail ? '<i class="pcard-go" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" width="20" height="20">' +
                '<path d="M5 12h13M12.4 5.8l6.2 6.2-6.2 6.2" fill="none" stroke="currentColor" ' +
                'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg></i>' : '') +
          '</div>' +
          '<div class="pcard-body">' +
            '<h3 class="pcard-title">' + esc(p.title) + '</h3>' +
            (meta ? '<span class="pcard-meta">' + esc(meta) + '</span>' : '') +
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
      /* 태그 노출 순서는 data/projects.js 의 TAG_ORDER 를 따르고,
         거기 없는 태그만 개수 순으로 뒤에 붙인다. */
      var order = window.TAG_ORDER || [];
      allTags.sort(function (a, b) {
        var ia = order.indexOf(a), ib = order.indexOf(b);
        if (ia !== -1 || ib !== -1) {
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        }
        return tagTotal[b] - tagTotal[a] || a.localeCompare(b, 'ko');
      });

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

  /* ── 아직 받지 않은 목업은 자리표시로 대체 ───────────── */
  var placehold = function (img) {
    var ph = document.createElement('div');
    ph.className = 'mock-ph';
    var name = document.createElement('span');
    name.textContent = img.getAttribute('alt') || 'Mockup';
    var file = document.createElement('em');
    file.textContent = img.getAttribute('src') || '';
    ph.appendChild(name);
    ph.appendChild(file);
    if (img.parentNode) img.parentNode.replaceChild(ph, img);
  };
  Array.prototype.forEach.call(document.querySelectorAll('.case img'), function (img) {
    /* 스크립트가 늦게 실행되면 error 를 놓치므로 이미 실패한 것도 함께 처리 */
    if (img.complete && img.naturalWidth === 0) { placehold(img); return; }
    img.addEventListener('error', function () { placehold(img); });
  });

  /* ── 상세 페이지 진입·이탈 슬라이드 ─────────────────── */
  var stage = document.querySelector('.case-stage');
  if (stage) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var clearEnter = function (e) {
      if (e && e.target !== stage) return;   /* 자식 애니메이션 버블링 무시 */
      stage.classList.remove('is-entering');
    };

    if (!reduce) {
      stage.classList.add('is-entering');
      stage.addEventListener('animationend', clearEnter);
      /* transform 이 남으면 fixed 인 닫기 버튼이 무대 기준이 되므로 반드시 걷어낸다 */
      setTimeout(clearEnter, 700);
    }

    /* 뒤로가기로 되돌아왔을 때 남은 상태 정리 */
    window.addEventListener('pageshow', function () {
      stage.classList.remove('is-leaving');
    });

  /* ── 상세 페이지 섹션 인디케이터 ──────────────────────
     섹션 수만큼 막대를 세로로 놓고, 현재 위치를 표시한다.
     .case-stage 가 스크롤 주체라 스크롤 이벤트도 거기서 받는다. */
  (function () {
    var st = document.querySelector('.case-stage');
    if (!st) return;
    var caseEl = st.querySelector('.case');
    if (!caseEl) return;
    var secs = Array.prototype.filter.call(caseEl.children, function (el) {
      return el.tagName === 'SECTION';
    });
    if (secs.length < 3) return;

    var nav = document.createElement('nav');
    nav.className = 'case-nav';
    nav.setAttribute('aria-label', '섹션 이동');

    secs.forEach(function (sec, i) {
      var lab = sec.querySelector('.case-label');
      var name = lab ? lab.textContent.trim() : (i === 0 ? 'Cover' : 'Section ' + (i + 1));
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'case-nav-i';
      b.title = name;
      b.setAttribute('aria-label', name);
      b.addEventListener('click', function () {
        st.scrollTo({ top: sec.offsetTop, behavior: 'smooth' });
      });
      nav.appendChild(b);
    });
    st.appendChild(nav);

    /* 섹션 배경이 어두운지 판단 — 배경색이 투명하면 그라데이션의 첫 색을 본다 */
    var isDark = function (sec) {
      var cs = getComputedStyle(sec);
      var pick = function (str) {
        var m = str.match(/rgba?\(([^)]+)\)/);
        if (m) {
          var v = m[1].split(',').map(parseFloat);
          if (v.length > 3 && v[3] < .5) return null;
          return v;
        }
        var h = str.match(/#([0-9a-f]{6})/i);
        if (h) return [parseInt(h[1].slice(0,2),16), parseInt(h[1].slice(2,4),16), parseInt(h[1].slice(4,6),16)];
        return null;
      };
      var v = pick(cs.backgroundColor) || (cs.backgroundImage !== 'none' ? pick(cs.backgroundImage) : null);
      if (!v) return false;
      return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255 < 0.62;
    };
    var dark = secs.map(isDark);

    var items = nav.children;
    var sync = function () {
      var y = st.scrollTop + st.clientHeight * 0.35;
      var cur = 0;
      secs.forEach(function (sec, i) { if (sec.offsetTop <= y) cur = i; });
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('is-on', i === cur);
      }
      nav.classList.toggle('on-dark', dark[cur]);
    };
    st.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }());


    var closeBtn = document.querySelector('.case-close');
    if (closeBtn && !reduce) {
      closeBtn.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var href = closeBtn.getAttribute('href');
        /* 들어온 곳으로 되돌린다. 메인에서 썸네일로 바로 들어오므로
           정해진 목적지로 보내면 가 본 적 없는 화면으로 나가게 된다.
           referrer 는 믿을 수 없다 — file:// 로 열면 비어 있고 HTTP 에서도
           정책에 따라 빈다. 사이트 안에서 눌렀다는 표식을 직접 남겨 본다. */
        var canBack = (function () {
          if (history.length <= 1) return false;
          try { if (sessionStorage.getItem('pf:internal') === '1') return true; } catch (err) {}
          try { return !!document.referrer && new URL(document.referrer).origin === location.origin; }
          catch (err) { return false; }
        }());
        var done = false;
        var go = function () {
          if (done) return;
          done = true;
          if (canBack) history.back();
          else location.href = href;
        };
        stage.classList.remove('is-entering');
        stage.classList.add('is-leaving');
        stage.addEventListener('animationend', function (ev) {
          if (ev.target === stage) go();
        });
        setTimeout(go, 700);   /* 애니메이션 이벤트가 오지 않을 때 대비 */
      });
    }
  }
})();


/* ── 메인: 스크롤 진입 디졸브 ────────────────────────────
   섹션이 보이기 시작하면 안쪽 블록을 순차로 띄운다. 표지는 첫 화면이라 제외.
   IntersectionObserver 대신 스크롤 시 위치를 직접 재는 방식 — 대상이 4개뿐이라
   비용이 없고, 콜백 전달 타이밍에 기대지 않아 동작이 결정적이다. */
(function () {
  'use strict';
  var main = document.querySelector('main');
  if (!main) return;

  var secs = Array.prototype.slice.call(main.querySelectorAll('.sec'))
    .filter(function (s) { return s.parentNode === main; });
  if (!secs.length) return;

  document.documentElement.classList.add('js-reveal');

  var PICK = '.sec-inner, .pcard, .how-title, .pillar, .voices-head, .marquee, .voices-source';
  var groups = secs.map(function (sec) {
    var units = sec.querySelectorAll(PICK);
    var list = units.length ? Array.prototype.slice.call(units) : [sec];
    list.forEach(function (el) {
      /* rv 를 붙이기 전에 본다 — 이미 transform 으로 자리를 잡은 블록이면
         이동은 건드리지 않고 투명도만 다룬다. */
      if (getComputedStyle(el).transform === 'none') el.classList.add('rv-lift');
      el.classList.add('rv');
    });
    return { sec: sec, list: list, done: false };
  });

  /* 블록 단위로 다룬다 — 섹션 통째로 발동하면 세로로 긴 섹션의
     아래쪽 블록이 화면에 들어오기도 전에 재생을 끝낸다. */
  var units = [];
  groups.forEach(function (g, gi) {
    g.list.forEach(function (el) { units.push({ el: el, sec: gi, done: false }); });
  });

  /* 숨김이 완전히 반영된 다음 틱에 전환을 건다. 같은 틱에서 붙이면
     .rv 가 붙는 순간이 전환의 시작점이 돼 1→0 으로 흐려지는 게 보인다.
     강제 리플로우(offsetHeight)만으로는 막히지 않았다 — 첫 블록만 멀쩡하고
     나머지는 그대로 흐려졌다. 틱을 넘겨야 확실하다. */
  var arm = function () {
    units.forEach(function (u) { u.el.classList.add('rv-anim'); });
  };
  void main.offsetHeight;
  setTimeout(arm, 0);

  /* 섹션마다 '앞 블록이 실제로 뜨는 시각'을 기억한다. 늦게 걸린 아래
     블록이 지연 0 으로 먼저 떠서 위아래가 뒤집히는 걸 막는다. */
  var GAP = 150;
  var secLast = {};

  var show = function (u, instant) {
    if (u.done) return;
    u.done = true;
    var d = 0;
    if (!instant) {
      var now = Date.now();
      var at = Math.max(now, (secLast[u.sec] || 0) + GAP);
      secLast[u.sec] = at;
      d = (at - now) / 1000;
    }
    u.el.style.transitionDelay = d + 's';
    u.el.classList.add('is-in');
  };

  var check = function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var left = 0;
    units.forEach(function (u) {
      if (u.done) return;
      left++;
      var r = u.el.getBoundingClientRect();
      /* height 0 은 아직 레이아웃 전이라는 뜻 — 그때는 판단하지 않는다 */
      if (r.height <= 0) return;
      if (r.bottom < 0) { show(u, true); return; }   /* 이미 지나침 */
      if (r.top < vh * 0.86) show(u);
    });
    if (!left) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', check);
    }
  };

  /* rAF 에만 기대면 콜백이 안 올 때 아무것도 드러나지 않는다.
     대상이 열 개 남짓이라 동기 호출 + 시간 스로틀로 충분하다. */
  var last = 0;
  var onScroll = function () {
    var now = Date.now();
    if (now - last < 60) return;
    last = now;
    check();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', check);

  /* 파싱 시점엔 레이아웃이 없어 높이가 0 이다 — 그려진 뒤 다시 본다 */
  var recheck = function () { check(); };
  recheck();
  window.addEventListener('load', recheck);
  setTimeout(recheck, 300);

  /* 안전장치 — 레이아웃 자체가 안 잡혔을 때만 전부 드러낸다.
     무조건 푸는 타이머를 두면 표지에 4초만 머물러도 아래가 다 끝나 있다.
     '아직 아무것도 안 떴는지' 로 판단해서도 안 된다 — 표지가 한 화면을
     다 쓰므로 처음엔 원래 아무것도 안 뜬 상태가 정상이다.
     높이를 못 재는 경우, 즉 측정이 실패한 때만 콘텐츠를 살린다. */
  setTimeout(function () {
    var measurable = units.some(function (u) {
      return u.el.getBoundingClientRect().height > 0;
    });
    if (!measurable) units.forEach(function (u) { show(u, true); });
  }, 4000);
}());


/* ── 상세 페이지: 스크롤 진입 연출 ───────────────────────
   .case-stage 가 스크롤을 소유하므로 window 가 아니라 거기에 붙인다.
   트리거는 섹션이 아니라 블록 단위다 — 섹션이 뷰포트보다 커서
   섹션 기준으로 잡으면 아래쪽 블록이 화면 밖에서 애니메이션을 끝낸다. */
(function () {
  'use strict';
  var stage = document.querySelector('.case-stage');
  var root  = stage && stage.querySelector('.case');
  if (!stage || !root) return;

  var PICK = [
    /* 커버는 한 덩어리로 묶지 않고 조각으로 둔다 — 로고·제목·성과·정보·목업이
       차례로 들어와야 첫 화면이 읽히는 순서대로 열린다. */
    '.case-brand', '.case-hero-grid h1', '.case-pills', '.case-meta',
    '.case-hero-visual', '.case-hero-mock',
    '.case-label', '.case-h2', '.case-lead', '.case-inner > p',
    /* 01 위젯 */
    '.dcard', '.keypoint', '.voc-split', '.voc-meta', '.strat-row',
    '.sol-text', '.sol-ab', '.sol-mocks', '.out-layout',
    /* 02 지금날씨 */
    '.nw-card', '.nw-steps', '.nw-research', '.nw-venn', '.nw-split',
    '.nw-shot-wide', '.dsx-panels', '.nw-out-text', '.nw-out-mocks',
    /* 03 말하는번역기 */
    '.tr-stats', '.tr-split', '.tr-insight', '.tr-ps', '.tr-research',
    '.tr-entry', '.tr-abbar', '.tr-ab', '.tr-out-text', '.tr-out-mocks',
    /* 04 디자인 옵스 */
    '.op-shot', '.op-ps', '.op-flow', '.op-flow-head', '.op-asis',
    '.op-sys-head > p',                       /* 라벨·제목 옆 2단 설명 문단 */
    '.op-sys-grid', '.op-scale-text', '.op-scale-mock',
    /* 공통 — 결과 */
    '.res-head', '.res-metrics', '.res-insights'
  ].join(', ');

  var picked = Array.prototype.slice.call(root.querySelectorAll(PICK));
  if (!picked.length) return;

  /* 이미 선택된 조상이 있으면 뺀다 — 부모·자식이 겹쳐 두 번 흐려지는 걸 막는다 */
  picked = picked.filter(function (el) {
    for (var p = el.parentElement; p && p !== root; p = p.parentElement) {
      if (picked.indexOf(p) !== -1) return false;
    }
    return true;
  });

  document.documentElement.classList.add('js-cv');

  /* 좌측 인덱스(.case-nav)가 세는 것과 같은 섹션 목록 */
  var secs = Array.prototype.filter.call(root.children, function (el) {
    return el.tagName === 'SECTION';
  });
  /* 커버는 <header> 라 섹션 목록에 없다. -1 로 두고 따로 다룬다. */
  var secOf = function (el) {
    for (var p = el; p && p !== root; p = p.parentElement) {
      var i = secs.indexOf(p);
      if (i !== -1) return i;
    }
    return -1;
  };

  /* 0 에서 자라야 할 막대들 — 페이지마다 구현이 다르다 */
  /* 03 은 값이 li 에 적혀 있고 안쪽 b 가 상속받아 폭을 잡는다 —
     값은 li 에서 바꾸고, 전환은 CSS 에서 b 에 걸어 둔다. */
  var BARS = ['.bar-fill', '.nw-bar-fill', '.nw-stack-seg',
              '.tr-survey-list li'].join(', ');

  var CIRC = 2 * Math.PI * 59;          /* 도넛 반지름 59 의 둘레 */

  var units = picked.map(function (el) {
    /* cv 를 붙이기 전에 본다 — 이미 transform 으로 자리를 잡은 블록이면
       이동은 건드리지 않고 투명도만 다룬다. */
    if (getComputedStyle(el).transform === 'none') el.classList.add('cv-lift');
    el.classList.add('cv');

    /* 막대는 폭을 0 으로 내려 두었다가 블록이 뜰 때 되돌린다.
       02 는 width 를 직접 쓰고 03 은 --value 로 width 를 계산해서,
       어느 쪽으로 적힌 값인지 보고 같은 자리에 돌려 놓는다. */
    var bars = Array.prototype.map.call(el.querySelectorAll(BARS), function (b) {
      var v = b.style.getPropertyValue('--value');
      if (v) {
        b.style.setProperty('--value', '0%');
        return { el: b, prop: '--value', v: v };
      }
      var w = b.style.width || '0%';
      b.style.width = '0%';
      return { el: b, prop: 'width', v: w };
    });
    /* 꺾은선은 길이만큼 dash 를 밀어 두었다가 0 으로 되돌려 그려 낸다.
       .tr-mark 는 점선 모양 자체가 dasharray 라 건드리지 않는다. */
    var draws = Array.prototype.map.call(el.querySelectorAll('.tr-line'), function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len.toFixed(1);
      p.style.strokeDashoffset = len.toFixed(1);
      return { el: p, len: len };
    });

    /* 선이 다 그려진 뒤에 얹히는 것들 — 면·기준점·보조선·말풍선 */
    var lates = draws.length
      ? Array.prototype.slice.call(el.querySelectorAll('.tr-area, .tr-dot, .tr-mark, .tr-cross, .tr-tag'))
      : [];
    lates.forEach(function (e) { e.classList.add('cv-late'); });

    var arcs = Array.prototype.map.call(el.querySelectorAll('.donut circle'), function (c, i) {
      var d = c.getAttribute('stroke-dasharray');
      c.setAttribute('stroke-dasharray', '0 ' + CIRC.toFixed(1));
      c.style.transitionDelay = (0.16 + i * 0.16) + 's';
      return { el: c, d: d };
    });

    /* 커버는 01 이 <header>, 02~04 가 <section> 이라 섹션 판정이 갈린다.
       태그가 아니라 .case-hero 안에 있는지로 본다. */
    return {
      el: el, sec: secOf(el), hero: !!el.closest('.case-hero'),
      bars: bars, arcs: arcs, draws: draws, lates: lates, done: false
    };
  });

  /* 숨김 상태를 먼저 한 번 반영시킨 뒤에 전환을 건다.
     순서를 바꾸면 .cv 가 붙는 순간이 전환의 시작점이 돼
     내용이 1초에 걸쳐 흐려지는 게 보인다. 리플로우는 여기 한 번뿐이다. */
  void root.offsetHeight;
  units.forEach(function (u) { u.el.classList.add('cv-anim'); });

  /* 섹션마다 '앞 블록이 실제로 뜨는 시각'을 기억한다.
     한 번에 걸린 묶음에만 지연을 매기면, 나중에 따로 걸린 아래 블록이
     지연 0 으로 먼저 떠서 위아래 순서가 뒤집힌다. 절대 시각으로 줄을
     세워야 위에서부터 아래로 순서가 지켜진다. */
  var GAP = 160;                        /* 블록 사이 최소 간격(ms) */
  var secLast = {};

  var show = function (u, instant) {
    if (u.done) return;
    u.done = true;
    var d = 0;
    if (!instant) {
      var now = Date.now();
      var at = Math.max(now, (secLast[u.sec] || 0) + GAP);
      secLast[u.sec] = at;
      d = (at - now) / 1000;
    }
    u.el.style.transitionDelay = d + 's';
    /* 0 값은 준비 단계에서 이미 반영돼 있어 바로 되돌려도 전환이 걸린다.
       rAF 에 맡기면 콜백이 안 올 때 0% 가 남아 수치가 틀리게 보인다. */
    u.bars.forEach(function (b, i) {
      b.el.style.transitionDelay = (d + 0.1 + i * 0.07) + 's';
      if (b.prop === '--value') b.el.style.setProperty('--value', b.v);
      else b.el.style.width = b.v;
    });
    u.arcs.forEach(function (a, i) {
      a.el.style.transitionDelay = (d + 0.16 + i * 0.16) + 's';
      a.el.setAttribute('stroke-dasharray', a.d);
    });
    u.draws.forEach(function (p, i) {
      p.el.style.transitionDelay = (d + 0.14 + i * 0.22) + 's';
      p.el.style.strokeDashoffset = '0';
    });
    u.lates.forEach(function (e, i) {
      e.style.transitionDelay = (d + 1.05 + i * 0.07) + 's';
      e.classList.add('is-in');
    });
    u.el.classList.add('is-in');
  };

  /* 좌측 인덱스가 켜지는 섹션만 재생한다.
     현재 섹션 판정은 .case-nav 의 sync() 와 같은 식(화면 35% 선)을 쓴다.
     아직 인덱스가 안 켜진 아래 섹션은 손대지 않으므로 줄줄이 터지지 않고,
     켜진 섹션 안에서는 블록이 화면에 들어온 것부터 움직여
     긴 섹션의 아래쪽도 지나치지 않는다. */
  var check = function () {
    var vh = stage.clientHeight;
    var line = stage.scrollTop + vh * 0.35;
    var cur = 0;
    secs.forEach(function (sec, i) { if (sec.offsetTop <= line) cur = i; });

    var left = 0;
    units.forEach(function (u) {
      if (u.done) return;
      left++;
      /* 커버는 항상 첫 화면이다. 위치를 재지 않고 바로 연다 —
         .case-stage 진입 애니메이션이 측정을 한 화면만큼 어긋내는 동안
         기다리면 커버가 1초 가까이 늦게 열린다. */
      if (u.hero || u.sec < 0) { show(u); return; }
      if (u.sec > cur) return;                    /* 인덱스가 아직 안 켜짐 */
      if (u.sec < cur) { show(u, true); return; } /* 지나친 섹션 — 즉시, 연출 없이 */
      var r = u.el.getBoundingClientRect();
      if (r.height <= 0) return;                  /* 아직 레이아웃 전 */
      if (r.top < vh * 0.88) show(u);             /* 켜진 섹션 안에서 화면에 든 것 */
    });
    if (!left) {
      stage.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', check);
    }
  };

  /* rAF 에만 기대면 콜백이 안 올 때 아무것도 드러나지 않는다.
     대상이 수십 개라 동기 호출 + 시간 스로틀로 충분하다. */
  var last = 0;
  var onScroll = function () {
    var now = Date.now();
    if (now - last < 60) return;
    last = now;
    check();
  };

  stage.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', check);

  /* .case-stage 는 한 화면 아래에서 올라오는 진입 애니메이션을 갖는다.
     그 동안은 모든 블록이 뷰포트 밖으로 측정되므로, 끝난 뒤 다시 본다. */
  var recheck = function () { check(); };
  recheck();
  window.addEventListener('load', recheck);
  stage.addEventListener('animationend', recheck);
  stage.addEventListener('transitionend', recheck);
  [300, 800, 1500].forEach(function (ms) { setTimeout(recheck, ms); });

  /* 안전장치 — 장치가 통째로 불발됐을 때만 전부 드러낸다.
     무조건 푸는 타이머를 두면 한 섹션에 오래 머무르는 것만으로
     아래 섹션이 전부 재생돼 버린다. 첫 화면 블록조차 안 드러났을 때,
     즉 측정이 실패한 경우에만 콘텐츠를 살린다. */
  setTimeout(function () {
    var measurable = units.some(function (u) {
      return u.el.getBoundingClientRect().height > 0;
    });
    if (!measurable) units.forEach(function (u) { show(u, true); });
  }, 4500);
}());


/* ── 커버 타이틀 타이핑 ─────────────────────────────────
   한 줄을 다 친 뒤 다음 줄로 넘어가고, 끝나면 커서만 깜빡인다.
   원문은 지우지 않고 숨긴 채 자리만 잡아 둬서 레이아웃이 밀리지 않는다.
   JS 가 꺼져 있거나 모션을 줄이는 설정이면 원문이 그대로 보인다. */
(function () {
  'use strict';
  var cover = document.querySelector('.cover');
  if (!cover) return;

  /* 타이틀 외 글자들 — 타이틀을 다 친 뒤 차례로 떠오른다.
     시각을 한곳에 두려고 타이핑과 같은 자리에서 다룬다. */
  var ENTER = [
    ['.cover-brand',        160],     /* 이름은 타이틀보다 먼저 */
    ['.cover-sub',         1620],     /* 타이틀이 끝나는 즈음 */
    ['.cover-bottom-left',  1900],
    ['.cover-bottom-right', 2160]
  ];
  var fades = ENTER.map(function (row) {
    var el = cover.querySelector(row[0]);
    if (el) el.classList.add('cv-co');
    return { el: el, at: row[1] };
  }).filter(function (f) { return f.el; });

  /* 숨김을 먼저 반영시킨 뒤에 전환을 건다 — 순서를 바꾸면
     클래스가 붙는 순간이 전환의 시작점이 돼 흐려지는 게 보인다. */
  if (fades.length) {
    void cover.offsetHeight;
    fades.forEach(function (f) {
      f.el.classList.add('cv-co-anim');
      setTimeout(function () { f.el.classList.add('is-in'); }, f.at);
    });
  }

  /* 물방울 — 흐릿하게 깔렸다가 풀린다. 셋이 조금씩 어긋나야
     한 장의 그림이 통째로 선명해지는 게 아니라 깊이가 생긴다. */
  var drops = Array.prototype.slice.call(cover.querySelectorAll('.cover-drop'));
  if (drops.length) {
    void cover.offsetHeight;                     /* 흐린 상태를 먼저 반영 */
    drops.forEach(function (d, i) {
      d.classList.add('dr-anim');
      setTimeout(function () { d.classList.add('is-clear'); }, 120 + i * 180);
      /* 다 풀리면 합성 힌트를 거둔다 — 남겨 두면 메모리만 잡는다 */
      d.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'filter') d.classList.add('is-settled');
      });
    });
  }

  var h1 = cover.querySelector('h1');
  if (!h1) return;

  var lines = Array.prototype.filter.call(h1.children, function (e) {
    return e.tagName === 'SPAN';
  });
  if (!lines.length) return;

  var full = lines.map(function (l) { return l.textContent.trim(); });
  h1.setAttribute('aria-label', full.join(' '));      /* 읽히는 건 완성된 문장 */

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var live = [], txts = [];
  lines.forEach(function (l, i) {
    l.textContent = '';
    l.setAttribute('aria-hidden', 'true');
    var box   = document.createElement('i'); box.className   = 'ty-box';
    var ghost = document.createElement('i'); ghost.className = 'ty-ghost';
    var out   = document.createElement('i'); out.className   = 'ty-live';
    var txt   = document.createElement('span');
    ghost.textContent = full[i];
    out.appendChild(txt);
    box.appendChild(ghost); box.appendChild(out);
    l.appendChild(box);
    live.push(out); txts.push(txt);
  });

  var SPEED = 34, JITTER = 24, LINE_GAP = 200, START = 300;
  var li = 0, ci = 0;

  var tick = function () {
    if (li >= full.length) { h1.classList.add('ty-done'); return; }
    var s = full[li];
    if (ci < s.length) {
      txts[li].textContent = s.slice(0, ++ci);
      setTimeout(tick, SPEED + Math.random() * JITTER);
    } else {
      li++; ci = 0;
      setTimeout(tick, LINE_GAP);
    }
  };
  setTimeout(tick, START);
}());


/* ── 사이트 안에서 이동했는지 기록 ───────────────────────
   상세 페이지의 닫기가 '뒤로 가기' 를 쓸지 판단하는 근거다.
   document.referrer 는 file:// 로 열면 비어 있고 HTTP 에서도 정책에 따라
   비어서, 같은 사이트 링크를 눌렀다는 사실을 직접 남긴다. */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = t && t.closest ? t.closest('a[href]') : null;
    if (!a || a.target === '_blank') return;
    var href = a.getAttribute('href') || '';
    /* 바깥 주소 · 같은 문서 안 앵커 · 메일은 제외 */
    if (!href || href.charAt(0) === '#') return;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !/^https?:/i.test(href)) return;
    if (/^https?:/i.test(href)) {
      try { if (new URL(href).origin !== location.origin) return; }
      catch (err) { return; }
    }
    try { sessionStorage.setItem('pf:internal', '1'); } catch (err) {}
  }, true);
}());

/* 뒤로 가기로 상세가 되살아나면 떠나는 애니메이션이 남아 있다 — 지운다 */
window.addEventListener('pageshow', function () {
  var st = document.querySelector('.case-stage');
  if (st) st.classList.remove('is-leaving');
});
