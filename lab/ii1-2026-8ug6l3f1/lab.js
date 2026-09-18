/* インフラ構築基礎実習 (2026) : shared script. Dependency free. No storage. */
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
    var code = block.querySelector('code');
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
      ['ref/appendix.html','付録','さらに学ぶために', 'appx']
    ];
    var menus = [];
    var closeAll = function(except){
      for (var i = 0; i < menus.length; i++) if (menus[i].wrap !== except) menus[i].set(false);
    };
    function buildMenu(label, items, inSection, extraClass){
      var wrap = document.createElement('div'); wrap.className = 'daymenu' + (extraClass ? ' ' + extraClass : '');
      var btn = document.createElement('button'); btn.type = 'button';
      btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = label + ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      var panel = document.createElement('div'); panel.className = 'daypanel'; panel.setAttribute('role', 'menu');
      var isHere = false;
      for (var d = 0; d < items.length; d++){
        var a = document.createElement('a'); a.href = rel + items[d][0]; a.setAttribute('role', 'menuitem');
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
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ closeAll(null); if (document.activeElement) document.activeElement.blur(); } });
  }
})();
