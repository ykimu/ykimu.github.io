/* インフラ構築基礎実習 (2026) : shared script. Dependency free. Only storage: localStorage['lab-progress']. */
(function(){
  'use strict';

  /* 1. top bar gains its hairline once scrolled */
  var bar = document.querySelector('header.bar');
  if (bar){
    var ticking = false, on = false;
    var apply = function(){
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var s = y > 8;
      if (s !== on){ on = s; bar.classList.toggle('stuck', s); }
    };
    var onScroll = function(){
      if (ticking) return; ticking = true;
      if (window.requestAnimationFrame) requestAnimationFrame(apply); else apply();
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    apply();
  }

  /* 2. copy buttons on code blocks.
        .code (terminal): copies only the .in lines, without the prompt and without .c comments.
        .code.file        : copies the whole code text verbatim. */
  function textOf(block){
    var code = block.querySelector('pre code');
    if (!code) return '';
    if (block.classList.contains('file')){
      return code.textContent.replace(/\s+$/,'') + '\n';
    }
    var lines = [];
    var ins = code.querySelectorAll('.in');
    for (var i = 0; i < ins.length; i++){
      var clone = ins[i].cloneNode(true);
      var cs = clone.querySelectorAll('.c');
      for (var j = 0; j < cs.length; j++) cs[j].parentNode.removeChild(cs[j]);
      var t = clone.textContent.replace(/\s+$/,'');
      if (t) lines.push(t);
    }
    return lines.join('\n') + (lines.length ? '\n' : '');
  }
  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly','');
    ta.style.position = 'fixed'; ta.style.top = '-1000px';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){ ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function flash(btn, label){
    var orig = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', orig);
    btn.classList.add('ok');
    btn.lastChild.nodeValue = label;
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){ btn.classList.remove('ok'); btn.lastChild.nodeValue = orig; }, 1600);
  }
  var icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>';
  var blocks = document.querySelectorAll('.code');
  for (var b = 0; b < blocks.length; b++){
    (function(block){
      var head = block.querySelector('.code-head');
      if (!head) return;
      if (!textOf(block).trim()){ block.classList.add('noin'); return; }
      var btn = head.querySelector('.copy');
      if (!btn){
        btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'copy';
        head.appendChild(btn);
      }
      btn.innerHTML = icon; btn.appendChild(document.createTextNode(block.classList.contains('file') ? '内容をコピー' : 'コマンドをコピー'));
      btn.setAttribute('aria-label', 'コードをクリップボードにコピー');
      btn.addEventListener('click', function(){
        var text = textOf(block);
        if (!text){ flash(btn, 'コピー対象なし'); return; }
        var done = function(){ flash(btn, 'コピーしました'); };
        var fail = function(){ if (fallbackCopy(text)) done(); else flash(btn, '手動でコピーしてください'); };
        if (navigator.clipboard && window.isSecureContext){
          navigator.clipboard.writeText(text).then(done, fail);
        } else { fail(); }
      });
    })(blocks[b]);
  }
  window.labCopyText = textOf; /* exposed for verification */

  /* 3. in page table of contents built from the document headings */
  var toc = document.querySelector('.toc ol');
  var doc = document.querySelector('.doc');
  if (toc && doc){
    var hs = doc.querySelectorAll('h2[id], h3[id]');
    var items = [];
    for (var h = 0; h < hs.length; h++){
      var el = hs[h];
      var li = document.createElement('li');
      if (el.tagName === 'H3') li.className = 'sub';
      var a = document.createElement('a');
      a.href = '#' + el.id;
      var label = el.cloneNode(true);
      var no = label.querySelector('.no'); if (no) no.parentNode.removeChild(no);
      a.textContent = label.textContent.trim();
      li.appendChild(a); toc.appendChild(li); items.push({el:el, a:a});
    }
    if ('IntersectionObserver' in window && items.length){
      var current = null;
      var setOn = function(a){ if (current) current.classList.remove('on'); current = a; if (a) a.classList.add('on'); };
      var io = new IntersectionObserver(function(entries){
        for (var e = 0; e < entries.length; e++){
          if (entries[e].isIntersecting){
            for (var k = 0; k < items.length; k++) if (items[k].el === entries[e].target){ setOn(items[k].a); break; }
          }
        }
      }, {rootMargin:'-20% 0px -70% 0px', threshold:0});
      for (var k2 = 0; k2 < items.length; k2++) io.observe(items[k2].el);
    }
  }

  /* 4. dropdown menus in the top bar: hover to open on fine pointers, tap or keyboard to toggle */
  var links = document.querySelector('header.bar .barlinks');
  if (links && !links.querySelector('.daymenu')){
    var topLink = links.querySelector('a');
    var rel = '';
    if (topLink){
      topLink.classList.add('top');
      var m = /^((?:\.\.\/)*)index\.html$/.exec(topLink.getAttribute('href') || '');
      if (m) rel = m[1];
    }
    var inRoot = rel === '';
    var here = (location.pathname.split('/').pop() || 'index.html');
    var DAYS = [
      ['day1.html','第1回','OSの導入・SSH接続・Linuxの基本操作'],
      ['day2.html','第2回','Luantiサーバの構築とサービス化'],
      ['day3.html','第3回','ユーザ管理・パーミッション・監視・ログ'],
      ['day4.html','第4回','バックアップと自動化'],
      ['day5.html','第5回','Dockerによる再構築とWeb監視ページ'],
      ['day6.html','第6回','最終課題：総合演習と技術記事の執筆・公開'],
      ['appendix.html','付録','チートシート・FAQ・参考資料', 'appx']
    ];
    var REFS = [
      ['ref/index.html','一覧','本資料について'],
      ['ref/ch01.html','第1章','OSとLinux'],
      ['ref/ch02.html','第2章','ファイルシステムとディレクトリ構造'],
      ['ref/ch03.html','第3章','シェルとコマンドライン'],
      ['ref/ch04.html','第4章','テキストエディタ（vi / Vim）'],
      ['ref/ch05.html','第5章','ユーザ・グループとパーミッション'],
      ['ref/ch06.html','第6章','プロセスとサービス管理'],
      ['ref/ch07.html','第7章','ネットワークの基礎'],
      ['ref/ch08.html','第8章','サーバ運用の基礎'],
      ['ref/ch09.html','第9章','シェルスクリプト入門'],
      ['ref/ch10.html','第10章','仮想化とコンテナ'],
      ['ref/ch11.html','第11章','Luantiサーバの技術'],
      ['ref/appendix.html','付録','さらに学ぶために', 'appx'],
      ['ref/glossary.html','用語集','114語を章ごとに一覧・検索', 'appx']
    ];
    var menus = [];
    var closeAll = function(except){
      for (var i = 0; i < menus.length; i++) if (menus[i].wrap !== except) menus[i].set(false);
    };
    function buildMenu(label, items, inSection, extraClass){
      var wrap = document.createElement('div'); wrap.className = 'daymenu' + (extraClass ? ' ' + extraClass : '');
      var btn = document.createElement('button'); btn.type = 'button';
      var pid = 'menu-' + (menus.length + 1);
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', pid);
      btn.innerHTML = label + ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      var panel = document.createElement('div'); panel.className = 'daypanel'; panel.id = pid;
      var isHere = false;
      for (var d = 0; d < items.length; d++){
        var a = document.createElement('a'); a.href = rel + items[d][0];
        var cls = items[d][3] || '';
        var file = items[d][0].split('/').pop();
        if (inSection && here === file){ cls += ' here'; a.setAttribute('aria-current', 'page'); isHere = true; }
        a.className = cls.trim();
        a.innerHTML = '<span class="dn">' + items[d][1] + '</span><span>' + items[d][2] + '</span>';
        panel.appendChild(a);
      }
      if (isHere) btn.classList.add('here');
      wrap.appendChild(btn); wrap.appendChild(panel);
      var set = function(o){ wrap.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
      btn.addEventListener('click', function(e){ e.preventDefault(); var o = !wrap.classList.contains('open'); closeAll(wrap); set(o); });
      wrap.addEventListener('focusout', function(){ setTimeout(function(){ if (!wrap.contains(document.activeElement)) set(false); }, 0); });
      menus.push({wrap:wrap, set:set, btn:btn});
      return wrap;
    }
    var dayMenu = buildMenu('実験回', DAYS, inRoot, '');
    if (topLink && topLink.nextSibling) links.insertBefore(dayMenu, topLink.nextSibling); else links.appendChild(dayMenu);
    var refLink = null, as = links.querySelectorAll('a');
    for (var r = 0; r < as.length; r++) if (as[r].textContent.replace(/\s+/g,'') === '基礎知識') refLink = as[r];
    var refMenu = buildMenu('基礎知識', REFS, !inRoot, 'wide');
    if (refLink) links.replaceChild(refMenu, refLink); else links.appendChild(refMenu);
    document.addEventListener('click', function(e){
      var inside = false;
      for (var i = 0; i < menus.length; i++) if (menus[i].wrap.contains(e.target)) inside = true;
      if (!inside) closeAll(null);
    });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape') return;
      for (var i = 0; i < menus.length; i++){
        if (menus[i].wrap.classList.contains('open')){ menus[i].set(false); menus[i].btn.focus(); }
      }
    });
  }

  /* 5. glossary filter */
  (function(){
    var q = document.getElementById('glo-q');
    if (!q) return;
    var cards = document.querySelectorAll('.glo .term');
    var groups = document.querySelectorAll('.glo');
    var none = document.getElementById('glo-none');
    var norm = function(s){ s = String(s || ''); if (s.normalize) s = s.normalize('NFKC'); return s.toLowerCase(); };
    var run = function(){
      var v = norm(q.value.trim());
      var shown = 0;
      for (var i = 0; i < cards.length; i++){
        var hit = !v || norm(cards[i].getAttribute('data-k')).indexOf(v) !== -1;
        cards[i].hidden = !hit; if (hit) shown++;
      }
      for (var g = 0; g < groups.length; g++){
        var any = groups[g].querySelector('.term:not([hidden])');
        groups[g].hidden = !any;
        var h = groups[g].previousElementSibling;
        if (h && h.tagName === 'H2') h.hidden = !any;
      }
      if (none) none.hidden = shown > 0;
    };
    q.addEventListener('input', run);
    if (q.value) run();
  })();

  /* 6. execution context badge on code blocks */
  var CTX = {server:'サーバで実行（自分のユーザ）', luanti:'サーバで実行（luantiユーザ）', byod:'BYODで実行', local:'Raspberry Pi 本体で実行（モニタ接続時）', chat:'ゲーム内チャットで入力', file:'ファイルの内容（エディタに貼り付け）'};
  var cblocks = document.querySelectorAll('.code[data-ctx]');
  for (var c = 0; c < cblocks.length; c++){
    var ctx = cblocks[c].getAttribute('data-ctx'), head = cblocks[c].querySelector('.code-head');
    if (!head || !CTX[ctx]) continue;
    var strip = document.createElement('span'); strip.className = 'ctx ctx-' + ctx;
    var lab = document.createElement('span'); lab.className = 'ctx-l'; lab.textContent = CTX[ctx]; strip.appendChild(lab);
    var cwd = cblocks[c].getAttribute('data-cwd');
    var ttl = head.querySelector('.code-title');
    if (cwd && !(ctx === 'file' && ttl && ttl.textContent.trim() === cwd)){ var cw = document.createElement('span'); cw.className = 'ctx-cwd'; cw.textContent = (ctx === 'file' ? '保存先 ' : '場所 ') + cwd; strip.appendChild(cw); }
    if (ttl && ttl.nextSibling) head.insertBefore(strip, ttl.nextSibling); else head.appendChild(strip);
  }

  /* 7. progress: real check boxes on 確認項目 and ここまでの確認, saved in localStorage['lab-progress'] */
  var PK = 'lab-progress';
  function loadP(){ try { return JSON.parse(localStorage.getItem(PK) || '{}') || {}; } catch(e){ return {}; } }
  function saveP(p){ try { localStorage.setItem(PK, JSON.stringify(p)); } catch(e){} }
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html','');
  var dayNo = /^day(\d)$/.test(page) ? RegExp.$1 : null;
  if (dayNo){
    var P = loadP(); P[page] = P[page] || {};
    var groups2 = [['check', document.querySelectorAll('ul.check li')], ['mini', document.querySelectorAll('.mini li')]];
    var pad = function(n){ return (n < 10 ? '0' : '') + n; };
    var summary = null;
    var refresh = function(){
      var st = P[page];
      var d = 0, t = 0; for (var i = 0; i < (st.check || []).length; i++){ t++; if (st.check[i]) d++; }
      st.checkTotal = t; st.checkDone = d;
      var md = 0, mt = 0; for (var j = 0; j < (st.mini || []).length; j++){ mt++; if (st.mini[j]) md++; }
      st.miniTotal = mt; st.miniDone = md; st.updated = Date.now();
      saveP(P);
      if (summary){ summary.textContent = '確認項目 ' + d + ' / ' + t + '　ここまでの確認 ' + md + ' / ' + mt; }
    };
    for (var g = 0; g < groups2.length; g++){
      var kind = groups2[g][0], items2 = groups2[g][1];
      var arr = P[page][kind] = P[page][kind] || [];
      while (arr.length < items2.length) arr.push(false);
      arr.length = items2.length;
      for (var i2 = 0; i2 < items2.length; i2++){
        (function(li, idx, kind){
          var cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'pcb'; cb.checked = !!P[page][kind][idx];
          var lbl = document.createElement('label'); lbl.className = 'plabel';
          var lid = 'pl-' + kind + '-' + idx; lbl.id = lid; cb.setAttribute('aria-labelledby', lid);
          while (li.firstChild) lbl.appendChild(li.firstChild);
          li.appendChild(cb); li.appendChild(lbl); li.classList.toggle('on', cb.checked);
          cb.addEventListener('change', function(){ P[page][kind][idx] = cb.checked; li.classList.toggle('on', cb.checked); refresh(); });
          lbl.addEventListener('click', function(e){ if (e.target.closest('a, button, code') || String(window.getSelection())) return; cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
          if (kind === 'check'){
            var tb = document.createElement('button'); tb.type = 'button'; tb.className = 'tpl';
            tb.textContent = '記録テンプレをコピー'; tb.title = '実験記録の雛形（日時・回・確認項目番号入り）をコピー';
            tb.addEventListener('click', function(e){
              e.stopPropagation();
              var now = new Date();
              var text = '[' + pad(now.getMonth() + 1) + '/' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + '] 第' + dayNo + '回 確認項目' + (idx + 1) + '\nコマンド: \n結果 : \nメモ : \n';
              var ok = function(){ tb.classList.add('ok'); tb.textContent = 'コピーしました'; setTimeout(function(){ tb.classList.remove('ok'); tb.textContent = '記録テンプレをコピー'; }, 1600); };
              if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function(){ if (fallbackCopy(text)) ok(); });
              else if (fallbackCopy(text)) ok();
            });
            li.appendChild(tb);
          }
        })(items2[i2], i2, kind);
      }
    }
    var checkUl = document.querySelector('ul.check');
    if (checkUl){
      var pbarEl = document.createElement('div'); pbarEl.className = 'pbar';
      summary = document.createElement('span'); summary.className = 'psum';
      var rs = document.createElement('button'); rs.type = 'button'; rs.className = 'preset'; rs.textContent = 'この回の記録をリセット';
      rs.addEventListener('click', function(){
        if (!window.confirm('この回のチェックをすべて外します。よろしいですか。')) return;
        var ins = document.querySelectorAll('.pcb');
        for (var k = 0; k < ins.length; k++){ if (ins[k].checked){ ins[k].checked = false; ins[k].dispatchEvent(new Event('change')); } }
      });
      pbarEl.appendChild(summary); pbarEl.appendChild(rs);
      checkUl.parentNode.insertBefore(pbarEl, checkUl);
    }
    refresh();
  }

  /* 8. progress on the lab index cards (shown from the start; totals fall back to the static counts) */
  var dcards = document.querySelectorAll('a.dcard[href^="day"]');
  if (dcards.length){
    var PP = loadP(), TOT = {day1:4, day2:3, day3:5, day4:4, day5:5};
    var tot = 0, done = 0;
    for (var cd = 0; cd < dcards.length; cd++){
      var key = dcards[cd].getAttribute('href').replace('.html',''), st2 = PP[key] || {};
      var t2 = st2.checkTotal || TOT[key] || 0, d2 = st2.checkDone || 0;
      if (!t2) continue;
      tot += t2; done += d2;
      var pr = document.createElement('span'); pr.className = 'dprog' + (d2 === t2 ? ' done' : '');
      var pct = Math.round(100 * d2 / t2);
      pr.innerHTML = '<span class="track"><i style="width:' + pct + '%"></i></span><b>確認項目 ' + d2 + ' / ' + t2 + (d2 === t2 ? '　達成' : '') + '</b>';
      dcards[cd].appendChild(pr);
    }
    var daysH = document.getElementById('days');
    if (daysH && tot){
      var ov = document.createElement('div'); ov.className = 'overall';
      var pc = Math.round(100 * done / tot);
      ov.innerHTML = '<div class="ov-row"><b>第1回から第5回の確認項目</b><span>' + done + ' / ' + tot + '（' + pc + '%）' + (done === tot ? '　すべて達成' : '') + '</span></div><div class="ov-bar"><i style="width:' + pc + '%"></i></div>' +
        '<p class="ov-note">確認項目は<a href="day6.html#s6-4">最終課題の提出物</a>（実験記録）の一部になる。各ページ末尾の「確認項目」にチェックを入れると、この画面に進み具合が表示される（記録はこのブラウザにだけ保存される）。</p>';
      daysH.parentNode.insertBefore(ov, daysH.nextSibling);
    }
  }

  /* 9. 詰まったら: floating trouble finder */
  var relRoot = (function(){ var a = document.querySelector('header.bar .barlinks a'); var m2 = /^((?:\.\.\/)*)index\.html$/.exec(a ? a.getAttribute('href') || '' : ''); return m2 ? m2[1] : ''; })();
  if (document.querySelector('main.page')){
    var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'help-fab'; fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5"/><circle cx="12" cy="17" r=".6"/></svg>詰まったら';
    var pan = document.createElement('div'); pan.className = 'help-panel'; pan.hidden = true; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'つまずきポイントを探す');
    pan.innerHTML = '<div class="hp-head"><b>症状から探す</b><button type="button" class="hp-close" aria-label="閉じる">×</button></div>' +
      '<input type="search" class="hp-q" placeholder="例: Permission denied, ssh, 起動しない">' +
      '<div class="hp-list"></div>' +
      '<p class="hp-foot">見つからなければ <a href="' + relRoot + 'appendix.html#b">付録B トラブルシューティングFAQ</a> へ。それでも解決しなければ教員・支援員へ。</p>';
    document.body.appendChild(fab); document.body.appendChild(pan);
    var list = pan.querySelector('.hp-list'), hq = pan.querySelector('.hp-q'), data = null;
    var here2 = location.pathname.split('/').pop() || 'index.html';
    var render = function(){
      var v = (hq.value || '').trim().toLowerCase(); list.innerHTML = '';
      if (!data){ list.innerHTML = '<p class="hp-empty">読み込み中…</p>'; return; }
      var groupsT = {}, order = [];
      for (var i = 0; i < data.length; i++){
        var e = data[i]; var hay = (e.symptom + ' ' + (e.tags || []).join(' ')).toLowerCase();
        if (v && hay.indexOf(v) === -1) continue;
        var gk = e.page; if (!groupsT[gk]){ groupsT[gk] = []; order.push(gk); }
        groupsT[gk].push(e);
      }
      if (!order.length){ list.innerHTML = '<p class="hp-empty">該当する症状がありません。</p>'; return; }
      order.sort(function(a, b){ return (a === here2 ? -1 : b === here2 ? 1 : 0) || a.localeCompare(b); });
      for (var o = 0; o < order.length; o++){
        var pg2 = order[o], h = document.createElement('div'); h.className = 'hp-g';
        h.textContent = '第' + pg2.replace(/\D/g, '') + '回' + (pg2 === here2 ? '（このページ）' : ''); list.appendChild(h);
        for (var k2 = 0; k2 < groupsT[pg2].length; k2++){
          var it = groupsT[pg2][k2], a2 = document.createElement('a'); a2.className = 'hp-i';
          a2.href = (pg2 === here2 ? '' : relRoot + pg2) + '#' + it.id; a2.textContent = it.symptom; list.appendChild(a2);
          a2.addEventListener('click', function(){ setHelp(false); });
        }
      }
    };
    var setHelp = function(o){ pan.hidden = !o; fab.setAttribute('aria-expanded', o ? 'true' : 'false'); document.body.classList.toggle('help-open', o); if (o){ render(); setTimeout(function(){ hq.focus(); }, 50); } };
    fab.addEventListener('click', function(){
      setHelp(pan.hidden);
      if (!data){
        var fb = function(){ data = []; var pits = document.querySelectorAll('.call.pit[id]'); for (var q = 0; q < pits.length; q++){ var p1 = pits[q].querySelector('p'); data.push({symptom:(p1 ? p1.textContent : '').slice(0, 26), page:here2, id:pits[q].id}); } render(); };
        if (window.fetch){ fetch(relRoot + 'trouble.json').then(function(r){ return r.json(); }).then(function(j){ data = j; render(); }).catch(fb); } else fb();
      }
    });
    pan.querySelector('.hp-close').addEventListener('click', function(){ setHelp(false); fab.focus(); });
    hq.addEventListener('input', render);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !pan.hidden){ setHelp(false); fab.focus(); } });
  }

  /* 10. term tooltips: first mention of each glossary term in the body text */
  var docEl = document.querySelector('.doc');
  if (docEl && !document.getElementById('glo-q') && window.fetch){
    fetch(relRoot + 'terms.json').then(function(r){ return r.json(); }).then(function(terms){
      terms.sort(function(a, b){ return b.term.length - a.term.length; });
      var tip = document.createElement('div'); tip.className = 'ttip'; tip.hidden = true; document.body.appendChild(tip);
      var skip = function(n){ for (var p = n.parentNode; p && p !== docEl; p = p.parentNode){ var tg = p.tagName; if (/^(A|CODE|KBD|PRE|H1|H2|H3|BUTTON|DT|VAR|SUMMARY)$/.test(tg)) return true; if (p.classList && (p.classList.contains('code') || p.classList.contains('term') || p.classList.contains('tt') || p.classList.contains('chapintro') || p.classList.contains('flow') || p.classList.contains('pager'))) return true; } return false; };
      var walker = document.createTreeWalker(docEl, NodeFilter.SHOW_TEXT, null);
      var nodes = []; var nd; while ((nd = walker.nextNode())) if (nd.nodeValue.trim().length > 1 && !skip(nd)) nodes.push(nd);
      var used = {};
      /* a match must not be part of a longer katakana or latin word (シェル in シェルスクリプト, cron in crontab) */
      var WORD = /[\u30A0-\u30FFA-Za-z]/;
      var findAt = function(txt, term){
        var from = 0, pos;
        while ((pos = txt.indexOf(term, from)) !== -1){
          var prev = pos > 0 ? txt.charAt(pos - 1) : '', next = txt.charAt(pos + term.length);
          var badNext = next && WORD.test(next) && WORD.test(term.charAt(term.length - 1));
          var badPrev = prev && WORD.test(prev) && WORD.test(term.charAt(0));
          if (!badNext && !badPrev) return pos;
          from = pos + 1;
        }
        return -1;
      };
      for (var t2 = 0; t2 < terms.length; t2++){
        var T = terms[t2]; if (T.term.length < 2 || used[T.term]) continue;
        for (var n2 = 0; n2 < nodes.length; n2++){
          var tn = nodes[n2]; if (!tn.parentNode) continue;
          var pos = findAt(tn.nodeValue, T.term); if (pos === -1) continue;
          var after = tn.splitText(pos), rest = after.splitText(T.term.length);
          var sp = document.createElement('span'); sp.className = 'tt'; sp.tabIndex = 0; sp.setAttribute('data-def', T.def); sp.setAttribute('data-src', T.chapter); sp.textContent = T.term;
          after.parentNode.replaceChild(sp, after);
          nodes.splice(n2, 1, tn, rest); used[T.term] = true; break;
        }
      }
      var hideTimer = null;
      var show = function(el){
        clearTimeout(hideTimer);
        tip._for = el; tip._at = Date.now();
        tip.innerHTML = '<b></b><span></span><a></a>';
        tip.querySelector('b').textContent = el.textContent; tip.querySelector('span').textContent = el.getAttribute('data-def');
        var la = tip.querySelector('a'); la.href = relRoot + 'ref/' + el.getAttribute('data-src') + '.html'; la.textContent = '用語集・該当章へ';
        tip.hidden = false;
        var r = el.getBoundingClientRect(), tw = Math.min(360, window.innerWidth - 24);
        tip.style.width = tw + 'px';
        var left = Math.max(12, Math.min(r.left, window.innerWidth - tw - 12));
        tip.style.left = left + 'px';
        var th = tip.offsetHeight;
        tip.style.top = (r.top - th - 8 > 80 ? r.top - th - 8 : r.bottom + 8) + window.pageYOffset + 'px';
      };
      var hideT = function(){ clearTimeout(hideTimer); tip.hidden = true; };
      var hideSoon = function(){ clearTimeout(hideTimer); hideTimer = setTimeout(hideT, 250); };
      var hideIfOut = function(){ setTimeout(function(){ var ae = document.activeElement; if (!tip.contains(ae) && ae !== tip._for) hideT(); }, 0); };
      var hoverable = window.matchMedia && window.matchMedia('(hover:hover)').matches;
      var tts = docEl.querySelectorAll('.tt');
      for (var u = 0; u < tts.length; u++){
        (function(el){
          if (hoverable){ el.addEventListener('mouseenter', function(){ show(el); }); el.addEventListener('mouseleave', hideSoon); }
          el.addEventListener('focus', function(){ if (!tip._mute) show(el); }); el.addEventListener('blur', hideIfOut);
          el.addEventListener('click', function(e){ e.preventDefault(); if (!tip.hidden && tip._for === el && Date.now() - tip._at > 400) hideT(); else show(el); });
        })(tts[u]);
      }
      tip.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); }); tip.addEventListener('mouseleave', hideSoon);
      tip.addEventListener('focusout', hideIfOut);
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !tip.hidden){ var f = tip._for, inTip = tip.contains(document.activeElement); hideT(); if (f && inTip){ tip._mute = true; f.focus(); tip._mute = false; } } });
      document.addEventListener('click', function(e){ if (!e.target.closest('.tt, .ttip')) hideT(); });
    }).catch(function(){});
  }

  /* 11. mobile: pin the current "いま何をするか" line to the bottom while its code block is on screen */
  var whys = document.querySelectorAll('.why');
  if (whys.length && 'IntersectionObserver' in window){
    var nb = document.createElement('div'); nb.className = 'nowbar'; nb.hidden = true; document.body.appendChild(nb);
    var map = [], cur = null;
    for (var w2 = 0; w2 < whys.length; w2++){
      var nxt = whys[w2].nextElementSibling; if (nxt && nxt.classList.contains('code')) map.push({why:whys[w2], code:nxt});
    }
    var io2 = new IntersectionObserver(function(entries){
      for (var e2 = 0; e2 < entries.length; e2++){
        for (var m3 = 0; m3 < map.length; m3++){
          if (map[m3].code !== entries[e2].target) continue;
          if (entries[e2].isIntersecting){ cur = map[m3]; nb.textContent = ''; var bb = document.createElement('b'); bb.textContent = 'いま：'; var nt = document.createElement('span'); nt.className = 'nb-t'; nt.appendChild(bb); nt.appendChild(document.createTextNode(map[m3].why.textContent.replace(/^いま何をするか：/, '').trim())); nb.appendChild(nt); nb.hidden = false; }
          else if (cur === map[m3]){ cur = null; nb.hidden = true; }
        }
      }
    }, {rootMargin:'-70px 0px -20% 0px', threshold:0});
    for (var m4 = 0; m4 < map.length; m4++) io2.observe(map[m4].code);
  }

  /* 12. figure lightbox */
  var figs = document.querySelectorAll('figure img');
  if (figs.length){
    var lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.innerHTML = '<button type="button" class="lb-x" aria-label="閉じる">×</button><img alt=""><p class="lb-cap"></p><p class="lb-hint">横にスクロールできる</p>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap');
    var lastImg = null;
    var closeLb = function(){ lb.hidden = true; document.body.classList.remove('lb-open'); if (lastImg) lastImg.focus(); };
    var openLb = function(img){ lastImg = img; lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; var fc = img.parentNode.querySelector('figcaption'); lbCap.textContent = fc ? fc.textContent : img.alt; lb.hidden = false; document.body.classList.add('lb-open'); lb.querySelector('.lb-x').focus(); };
    for (var fi = 0; fi < figs.length; fi++){
      (function(img){
        img.classList.add('zoomable'); img.tabIndex = 0; img.setAttribute('role', 'button'); img.title = 'クリックで拡大';
        img.addEventListener('click', function(){ openLb(img); });
        img.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLb(img); } });
      })(figs[fi]);
    }
    lb.addEventListener('click', function(e){ if (e.target !== lbImg) closeLb(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !lb.hidden) closeLb(); });
  }
})();
