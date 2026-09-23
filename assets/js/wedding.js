/* Brick TV - Wedding page renderer
   ------------------------------------------------------------------
   The rest of the site keeps its copy in the HTML and fetches only media
   lists. The wedding page is different by contract: the client has to be able
   to edit every word, image, package and quote from /admin without code.

   So the page ships with its current copy written into the HTML, and this
   script patches it from content/wedding.json on load. Two consequences worth
   knowing:

     - with JavaScript off, or before the fetch lands, the page is already
       complete and readable. Nothing pops in.
     - the HTML is the copy as of the last deploy. Once the client edits in the
       CMS, the live text comes from the JSON. Crawlers that run JS (Google
       does) see the edit; ones that do not see the deployed version.

   If that ever matters more than it does today, the fix is a build step
   (Eleventy), and this JSON carries straight over to it.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* "hero.headline" -> data.hero.headline, without throwing on a missing branch */
  function at(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return (o && Object.prototype.hasOwnProperty.call(o, k)) ? o[k] : undefined;
    }, obj);
  }

  /* The CMS text boxes give us whatever the client typed, which is a straight
     apostrophe. Curl the ones sitting between two letters, so "Else's" sets
     properly without touching 6' 2" or a stray quotation mark. */
  function curl(s) {
    return s.replace(/(\w)'(\w)/g, '$1’$2');
  }

  function text(v) {
    return typeof v === 'string' && v.trim() ? curl(v.trim()) : null;
  }

  /* The items list is a plain list of strings in the CMS, but a list widget
     configured with sub-fields would hand us [{item: "..."}] instead. Accept
     both so a later config change cannot silently empty the page. */
  function itemText(entry) {
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object') return entry.item || entry.text || '';
    return '';
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  /* Accepts a full YouTube or Vimeo link, or a bare YouTube ID. */
  function video(url) {
    var v = String(url || '').trim();
    if (!v) return null;
    if (/^[\w-]{11}$/.test(v)) return { kind: 'youtube', id: v };
    var y = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    if (y) return { kind: 'youtube', id: y[1] };
    var m = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: 'vimeo', id: m[1] };
    return null;
  }

  function embed(v, title) {
    var src = v.kind === 'youtube'
      ? 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0'
      : 'https://player.vimeo.com/video/' + v.id + '?autoplay=1';
    return '<iframe title="' + esc(title) + '" allowfullscreen ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
      'src="' + src + '"></iframe>';
  }

  /* Click to play rather than six live iframes, the same bargain the Video
     page makes. Vimeo has no thumbnail without an extra API call, so it gets
     the designed panel instead of a poster frame. */
  function filmCard(v, title) {
    var poster = v.kind === 'youtube'
      ? '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/maxresdefault.jpg" alt="" loading="lazy">'
      : '';
    var card = el(
      '<button type="button" class="video-card" aria-label="Play: ' + esc(title) + '">' +
        poster +
        '<span class="video-card__play"></span>' +
        '<span class="video-card__title">' + esc(title) + '</span>' +
      '</button>'
    );
    card.addEventListener('click', function () {
      var holder = el('<div class="video-card"></div>');
      holder.appendChild(el(embed(v, title)));
      card.replaceWith(holder);
    });
    return card;
  }

  function packageRow(p) {
    var items = (p.items || []).map(itemText).map(curl).filter(Boolean);
    var note = text(p.note), tail = text(p.tail);
    return el(
      '<div class="wed-pk-row">' +
        '<div>' +
          '<h3 class="wed-display wed-h3">' + esc(curl(p.name || '')) + '</h3>' +
          (note ? '<p class="wed-pk-row__note">' + esc(note) + '</p>' : '') +
          (tail ? '<p class="wed-pk-row__note">' + esc(tail) + '</p>' : '') +
        '</div>' +
        '<span class="wed-pk-row__price">' + esc(curl(p.price || '')) + '</span>' +
        (items.length
          ? '<ul class="wed-pk-row__items">' +
              items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') +
            '</ul>'
          : '') +
        (p.cta
          ? '<div class="wed-pk-row__cta"><button class="btn btn--outline" type="button" data-book>' +
            esc(p.cta_text || 'Book an appointment') + '</button></div>'
          : '') +
      '</div>'
    );
  }

  /* One quote stands alone and large. Two or more drop a size and sit side by
     side, so adding a second in the CMS does not need a redesign. */
  function quotes(list) {
    var ok = list.filter(function (q) { return text(q && q.quote); });
    if (!ok.length) return null;
    var wrap = el('<div' + (ok.length > 1 ? ' class="wed-quotes--multi"' : '') + '></div>');
    ok.forEach(function (q) {
      var by = text(q.attribution);
      wrap.appendChild(el(
        '<figure class="wed-quote">' +
          '<blockquote>&ldquo;' + esc(text(q.quote)) + '&rdquo;</blockquote>' +
          (by ? '<figcaption>' + esc(by) + '</figcaption>' : '') +
        '</figure>'
      ));
    });
    return wrap;
  }

  function apply(data) {
    if (!data || typeof data !== 'object') return;

    // --- plain text nodes -------------------------------------------------
    document.querySelectorAll('[data-wed]').forEach(function (node) {
      var v = text(at(data, node.getAttribute('data-wed')));
      if (v !== null) node.textContent = v;
    });

    // --- images -----------------------------------------------------------
    document.querySelectorAll('[data-wed-img]').forEach(function (img) {
      var block = at(data, img.getAttribute('data-wed-img'));
      if (!block) return;
      if (text(block.image)) img.setAttribute('src', block.image);
      if (typeof block.alt === 'string') img.setAttribute('alt', block.alt);
    });

    // --- packages ---------------------------------------------------------
    var pkHost = document.querySelector('[data-wed-packages]');
    if (pkHost && Array.isArray(data.packages)) {
      var rows = data.packages.filter(function (p) { return p && text(p.name); });
      if (rows.length) {
        pkHost.innerHTML = '';
        rows.forEach(function (p) { pkHost.appendChild(packageRow(p)); });
      }
    }

    // --- testimonials -----------------------------------------------------
    var qHost = document.querySelector('[data-wed-quotes]');
    if (qHost && Array.isArray(data.testimonials)) {
      var q = quotes(data.testimonials);
      var section = qHost.closest('section');
      if (q) { qHost.innerHTML = ''; qHost.appendChild(q); }
      else if (section) section.hidden = true;   // no quotes: drop the section, not an empty frame
    }

    // --- film -------------------------------------------------------------
    var fHost = document.querySelector('[data-wed-film]');
    if (fHost && data.film) {
      var v = video(data.film.url);
      var fSection = fHost.closest('section');
      if (v) {
        fHost.innerHTML = '';
        fHost.appendChild(filmCard(v, data.film.title || 'Wedding film'));
      } else if (fSection) {
        fSection.hidden = true;                  // no URL yet: hide it cleanly
      }
    }

    // --- head -------------------------------------------------------------
    if (data.seo) {
      if (text(data.seo.title)) document.title = data.seo.title.trim();
      var d = text(data.seo.description);
      if (d) {
        ['meta[name="description"]', 'meta[property="og:description"]'].forEach(function (s) {
          var m = document.querySelector(s);
          if (m) m.setAttribute('content', d);
        });
      }
    }
  }

  /* Wire the film card that ships in the HTML, so it plays even if the fetch
     below never lands. apply() replaces this card when the JSON arrives. */
  document.querySelectorAll('[data-wed-film] [data-film]').forEach(function (card) {
    var v = video(card.getAttribute('data-film'));
    if (!v) return;
    card.addEventListener('click', function () {
      var holder = el('<div class="video-card"></div>');
      holder.appendChild(el(embed(v, card.getAttribute('aria-label').replace(/^Play: /, ''))));
      card.replaceWith(holder);
    });
  });

  fetch('content/wedding.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(apply)
    .catch(function () { /* keep the copy that shipped in the HTML */ });
})();
