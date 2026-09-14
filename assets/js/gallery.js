/* Brick TV - portfolio grids
   ------------------------------------------------------------------
   Each portfolio grid declares where its content lives:

     <div class="grid grid--photo"
          data-gallery="content/photo.json"
          data-kind="photo"
          data-slots="6"></div>

   The renderer fetches the JSON and fills the grid. With no entries yet -
   or if the fetch fails - it draws `data-slots` designed empty slots, so an
   unfilled grid reads as deliberate instead of broken.

   That is the whole point of the arrangement: a slot IS the empty state of a
   populated grid, so when the client uploads real work through /admin the
   layout does not move. No code change, just content.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="3" y="4" width="18" height="16"/>' +
    '<circle cx="8.5" cy="9.5" r="1.5"/>' +
    '<path d="m3 17 5-4 4 3 3-2 6 4"/></svg>';

  var LABEL = {
    video:   'Film slot',
    photo:   'Photo slot',
    audio:   'Track slot',
    fashion: 'Look slot',
    feature: 'Feature image slot'
  };

  var SHAPE = { video: '16x9', photo: '4x5', fashion: '4x5', feature: 'wide', audio: 'audio' };

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function slot(kind) {
    return el(
      '<div class="slot slot--' + (SHAPE[kind] || '16x9') + '">' +
        '<span class="slot__mark">' + ICON + '</span>' +
        '<p class="slot__label">' + esc(LABEL[kind] || 'Media slot') + '</p>' +
      '</div>'
    );
  }

  /* ---- item renderers, one per kind -------------------------------- */

  /* The CMS field accepts a full YouTube link or a bare ID, so normalise:
     youtu.be/ID, /watch?v=ID, /embed/ID, /shorts/ID all reduce to ID. */
  function youtubeId(value) {
    var v = String(value || '').trim();
    if (!v) return '';
    if (/^[\w-]{11}$/.test(v)) return v;
    var m = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  }

  function videoItem(item) {
    var id = youtubeId(item.youtube_id);
    if (!id) return null;
    var title = item.title || 'Brick TV film';
    var node = el(
      '<button type="button" class="video-card" aria-label="Play: ' + esc(title) + '">' +
        '<img src="https://i.ytimg.com/vi/' + esc(id) + '/hqdefault.jpg" alt="" loading="lazy">' +
        '<span class="video-card__play"></span>' +
        '<span class="video-card__title">' + esc(title) + '</span>' +
      '</button>'
    );
    node.addEventListener('click', function () {
      var frame = el(
        '<iframe title="' + esc(title) + '" allowfullscreen ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'src="https://www.youtube-nocookie.com/embed/' + esc(id) + '?autoplay=1&rel=0"></iframe>'
      );
      var holder = el('<div class="video-card"></div>');
      holder.appendChild(frame);
      node.replaceWith(holder);
    });
    return node;
  }

  function imageItem(item) {
    if (!item.image) return null;
    return el(
      '<figure class="shot shot--4x5" style="margin:0">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.alt || '') + '" loading="lazy">' +
        (item.caption ? '<figcaption class="shot__caption">' + esc(item.caption) + '</figcaption>' : '') +
      '</figure>'
    );
  }

  function audioItem(item) {
    if (!item.audio) return null;
    return el(
      '<div class="audio-track">' +
        '<strong class="audio-track__title">' + esc(item.title || 'Untitled') + '</strong>' +
        (item.note ? '<span class="audio-track__note">' + esc(item.note) + '</span>' : '') +
        '<audio controls preload="none" src="' + esc(item.audio) + '"></audio>' +
      '</div>'
    );
  }

  var RENDER = {
    video: videoItem, photo: imageItem,
    fashion: imageItem, feature: imageItem, audio: audioItem
  };

  /* ---- fill one grid ----------------------------------------------- */

  function fill(grid, items) {
    var kind = grid.getAttribute('data-kind') || 'photo';
    var want = parseInt(grid.getAttribute('data-slots'), 10) || 3;
    var render = RENDER[kind] || imageItem;

    var nodes = (items || []).map(render).filter(Boolean);
    grid.innerHTML = '';

    if (!nodes.length) {
      for (var i = 0; i < want; i++) grid.appendChild(slot(kind));
      grid.setAttribute('data-state', 'empty');
      return;
    }
    nodes.forEach(function (n) { grid.appendChild(n); });
    grid.setAttribute('data-state', 'filled');
  }

  function load(grid) {
    var src = grid.getAttribute('data-gallery');
    if (!src) { fill(grid, []); return; }

    fetch(src, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        fill(grid, data && Array.isArray(data.items) ? data.items : []);
      })
      .catch(function () { fill(grid, []); });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-kind]'), load);

  /* ---- home hero ---------------------------------------------------
     Any number of frames, cross-faded on a timer. Until the client uploads
     any, the hero runs on the scrim and the glitch wordmark alone, which is
     the intended placeholder state rather than a broken image. */
  var heroBox = document.querySelector('[data-hero]');
  var hero = heroBox && heroBox.closest('.hero');
  if (heroBox && hero) {
    fetch('content/home-hero.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var items = (data && Array.isArray(data.items) ? data.items : [])
          .filter(function (i) { return i && i.image; })
          .slice(0, 12);
        if (!items.length) return;
        // Markup ships with .hero--bare; frames exist, so restore full height.
        hero.classList.remove('hero--bare');

        var frames = items.map(function (item, i) {
          var img = el('<img src="' + esc(item.image) + '" alt="' + esc(item.alt || '') + '">');
          // Only the first frame is on the critical path; the rest load lazily
          // so nine hero images do not compete with first paint.
          if (i === 0) {
            img.setAttribute('fetchpriority', 'high');
          } else {
            img.setAttribute('fetchpriority', 'low');
            img.setAttribute('loading', 'lazy');
          }
          heroBox.appendChild(img);
          return img;
        });

        frames[0].classList.add('is-active');
        if (frames.length < 2 || reduced) return;   // nothing to cross-fade to

        var i = 0;
        setInterval(function () {
          // Skip advancing while the hero is scrolled out of view.
          if (hero.classList.contains('hero--paused')) return;
          var next = (i + 1) % frames.length;
          // Pull the next frame in before it is shown, in case it is still lazy.
          frames[next].loading = 'eager';
          frames[i].classList.remove('is-active');
          frames[next].classList.add('is-active');
          i = next;
        }, 6000);
      })
      .catch(function () { /* leave the placeholder hero as-is */ });
  }
})();
