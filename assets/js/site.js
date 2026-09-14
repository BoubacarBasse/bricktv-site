/* Brick TV - site behavior
   ------------------------------------------------------------------
   1. Booking (the one conversion action, shared by every Book button)
   2. Glitch wordmark
   3. Mobile nav drawer
   4. Hero cycle pause when off-screen
   5. Ask-a-question form
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* --- Site config -------------------------------------------------
     Confirm the booking URL with the client before launch. Clearing it
     routes every Book button to the call/email fallback modal instead. */
  var CONFIG = {
    bookingUrl: 'https://calendly.com/boubacarbasse333/onboarding-call',
    phone: '204-998-3654',
    phoneHref: 'tel:2049983654',
    email: 'Mohamedouldmoulaye0510@gmail.com'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================
     1. Booking
     ================================================================ */
  var modal = null;
  var lastFocused = null;

  function buildModal() {
    var el = document.createElement('div');
    el.className = 'modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'book-modal-title');
    el.hidden = true;
    el.innerHTML =
      '<div class="modal__panel">' +
        '<h3 id="book-modal-title">Book an appointment</h3>' +
        '<p>Online booking is being wired up. For now, call or email - ' +
          'we&rsquo;ll set the consultation up directly.</p>' +
        '<div class="modal__actions">' +
          '<a class="modal__call" href="' + CONFIG.phoneHref + '">Call ' + CONFIG.phone + '</a>' +
          '<a class="modal__email" href="mailto:' + CONFIG.email +
            '?subject=' + encodeURIComponent('Booking request - Brick TV') + '">Email us</a>' +
          '<button type="button" class="modal__close">Close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el) closeModal();
    });
    el.querySelector('.modal__close').addEventListener('click', closeModal);
    return el;
  }

  function openModal() {
    if (!modal) modal = buildModal();
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var first = modal.querySelector('a, button');
    if (first) first.focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onModalKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    var items = modal.querySelectorAll('a[href], button');
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function book() {
    if (CONFIG.bookingUrl) {
      var win = window.open(CONFIG.bookingUrl, '_blank', 'noopener');
      if (win) return;           // popup blocked -> fall through to the modal
    }
    openModal();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-book]');
    if (!trigger) return;
    e.preventDefault();
    book();
  });

  /* ================================================================
     2. Glitch wordmark
     ================================================================ */
  var TEX = {
    brick: {
      color: '#5a2a20',
      image: 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(0,0,0,.5)), ' +
             'repeating-linear-gradient(0deg, transparent 0 14px, rgba(0,0,0,.85) 14px 17px), ' +
             'repeating-linear-gradient(90deg, rgba(0,0,0,.7) 0 2px, transparent 2px 46px), ' +
             'linear-gradient(90deg,#6a3226,#3a1a14,#5a281e)',
      size: 'auto', pos: '0 0'
    },
    paper: {
      color: '#EDE3D3',
      image: 'radial-gradient(rgba(120,90,70,.28) 1px, transparent 1.4px), ' +
             'radial-gradient(rgba(60,40,30,.16) 1px, transparent 2px)',
      size: '3px 3px, 7px 7px', pos: '0 0'
    },
    halftone: {
      color: '#f6efe2',
      image: 'radial-gradient(#FF1E3C 30%, transparent 32%), ' +
             'radial-gradient(#12C2E9 30%, transparent 32%)',
      size: '6px 6px, 6px 6px', pos: '0 0, 3px 3px'
    },
    ink: {
      color: '#0d0d0d',
      image: 'radial-gradient(rgba(255,255,255,.95) 32%, transparent 34%), ' +
             'linear-gradient(180deg,#1a1a1a,#050505)',
      size: '5px 5px, 100% 100%', pos: '0 0'
    },
    graffiti: {
      color: '#151515',
      image: 'radial-gradient(circle at 20% 30%, rgba(255,30,60,.95), transparent 34%), ' +
             'radial-gradient(circle at 76% 68%, rgba(18,194,233,.9), transparent 36%), ' +
             'radial-gradient(circle at 52% 82%, rgba(247,214,72,.85), transparent 28%)',
      size: '100% 100%', pos: '0 0'
    }
  };
  var ALT_TEX = ['paper', 'halftone', 'ink', 'graffiti'];

  function BrickWordmark(root) {
    this.root = root;
    this.subtle = root.getAttribute('data-intensity') === 'subtle';
    this.auto = root.getAttribute('data-auto') !== 'false';
    this.text = (root.textContent || 'BRICK TV').trim();
    this.busy = false;
    this.last = -Infinity;   // not 0: performance.now() is ms since navigation
                             // start, so 0 would swallow bursts for 900ms.
    this.build();

    if (reduced) return;
    root.addEventListener('mouseenter', this.burst.bind(this, false));
    root.addEventListener('click', this.burst.bind(this, true));
    if (this.auto) this.schedule();
  }

  BrickWordmark.prototype.build = function () {
    var t = this.text;
    this.root.textContent = '';
    this.root.innerHTML =
      '<span class="wordmark__scale">' +
        '<span class="wordmark__layer wordmark__ghost-c" aria-hidden="true"></span>' +
        '<span class="wordmark__layer wordmark__ghost-r" aria-hidden="true"></span>' +
        '<span class="wordmark__base"></span>' +
        '<span class="wordmark__layer wordmark__clip" aria-hidden="true"></span>' +
        '<span class="wordmark__layer wordmark__flash" aria-hidden="true"></span>' +
        '<span class="wordmark__layer wordmark__scan" aria-hidden="true"></span>' +
        '<span class="wordmark__slices" aria-hidden="true"></span>' +
      '</span>';
    var q = this.root.querySelector.bind(this.root);
    this.scale = q('.wordmark__scale');
    this.gc = q('.wordmark__ghost-c');
    this.gr = q('.wordmark__ghost-r');
    this.base = q('.wordmark__base');
    this.clip = q('.wordmark__clip');
    this.flash = q('.wordmark__flash');
    this.scan = q('.wordmark__scan');
    this.slices = q('.wordmark__slices');
    [this.gc, this.gr, this.base, this.clip, this.flash, this.scan]
      .forEach(function (el) { el.textContent = t; });
  };

  BrickWordmark.prototype.applyTex = function (el, key) {
    var t = TEX[key];
    el.style.backgroundColor = t.color;
    el.style.backgroundImage = t.image;
    el.style.backgroundSize = t.size;
    el.style.backgroundPosition = t.pos;
  };

  BrickWordmark.prototype.schedule = function () {
    var self = this;
    var base = this.subtle ? 11000 : 8000;
    this.timer = setTimeout(function () {
      self.burst(false);
      self.schedule();
    }, base + Math.random() * 4000);
  };

  BrickWordmark.prototype.burst = function (strong) {
    if (reduced || this.busy) return;
    var now = performance.now();
    if (now - this.last < 900) return;      // debounce rapid hovers
    this.last = now;
    this.busy = true;

    var self = this;
    var subtle = this.subtle;
    var s = strong ? (subtle ? 3 : 9) : (subtle ? 2 : 6);
    var n = subtle ? 2 + (Math.random() < .5 ? 0 : 1)
                   : 3 + Math.floor(Math.random() * 3);
    var alt = ALT_TEX[Math.floor(Math.random() * ALT_TEX.length)];

    // chromatic separation
    this.gr.style.opacity = subtle ? '.6' : '.85';
    this.gc.style.opacity = subtle ? '.6' : '.85';
    this.gr.style.transform = 'translate(' + s + 'px,-1px)';
    this.gc.style.transform = 'translate(' + (-s) + 'px,1px)';

    // skew / scale
    this.scale.style.transition = 'transform 60ms steps(2)';
    this.scale.style.transform =
      'skewX(' + (strong ? -2 : -1.2) + 'deg) scale(' + (subtle ? 1.008 : 1.015) + ')';

    // scan tear
    this.scan.style.opacity = '1';
    this.scan.style.animation = 'brkwScan 360ms linear';

    // reveal the brick fill
    this.applyTex(this.clip, 'brick');
    this.clip.style.transition = 'opacity 40ms';
    this.clip.style.opacity = subtle ? '.55' : '1';
    if (!subtle) this.base.style.opacity = '.15';

    // swap the texture mid-burst
    if (!subtle) {
      setTimeout(function () {
        if (self.busy) self.applyTex(self.clip, alt);
      }, strong ? 120 : 90);
    }

    // horizontal slice clones
    this.slices.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var top = Math.random() * 78;
      var h = 8 + Math.random() * 16;
      var dx = (Math.random() * 8 + 2) * (Math.random() < .5 ? -1 : 1);
      var c = this.base.cloneNode(true);
      c.style.position = 'absolute';
      c.style.inset = '0';
      c.style.opacity = '1';
      c.style.color = subtle ? '#EDE3D3' : '#f0d9c8';
      c.style.clipPath = 'inset(' + top + '% 0 ' + (100 - top - h) + '% 0)';
      c.style.transform = 'translateX(' + dx + 'px)';
      this.slices.appendChild(c);
    }

    // high-contrast printed frame
    if (!subtle) {
      this.flash.style.transition = 'none';
      this.flash.style.opacity = strong ? '.85' : '.6';
      setTimeout(function () {
        self.flash.style.transition = 'opacity 110ms';
        self.flash.style.opacity = '0';
      }, 65);
    }

    // clean return
    var dur = subtle ? 260 : (strong ? 460 : 360);
    setTimeout(function () {
      self.slices.innerHTML = '';
      self.clip.style.transition = 'opacity 180ms';
      self.clip.style.opacity = '0';
      self.base.style.transition = 'opacity 180ms';
      self.base.style.opacity = '1';
      self.scan.style.opacity = '0';
      self.scan.style.animation = 'none';
      self.scale.style.transition = 'transform 200ms cubic-bezier(.2,.8,.2,1)';
      self.scale.style.transform = 'none';
      self.gr.style.opacity = '0';
      self.gc.style.opacity = '0';
      self.gr.style.transform = 'none';
      self.gc.style.transform = 'none';
      self.busy = false;
    }, dur);
  };

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-wordmark]'),
    function (el) { new BrickWordmark(el); }
  );

  /* ================================================================
     3. Mobile nav drawer
     ================================================================ */
  var nav = document.querySelector('.nav');
  var navToggle = document.querySelector('.nav__toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav--open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close the drawer after tapping a link.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav__links a')) {
        nav.classList.remove('nav--open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    window.matchMedia('(min-width: 641px)').addEventListener('change', function (m) {
      if (m.matches) {
        nav.classList.remove('nav--open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ================================================================
     4. Pause the hero cycle when it scrolls out of view
     ================================================================ */
  var hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        hero.classList.toggle('hero--paused', !entry.isIntersecting);
      });
    }, { threshold: 0 }).observe(hero);
  }

  /* ================================================================
     5. Ask-a-question form (Netlify Forms, with a mailto fallback)
     ================================================================ */
  var form = document.querySelector('.ask-form');
  if (form) {
    var status = form.querySelector('.ask-status');
    var submit = form.querySelector('button[type="submit"]');

    function say(message, kind) {
      status.innerHTML = message;
      status.className = 'ask-status ask-status--' + kind;
      status.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email.value.trim();
      var question = form.elements.question.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        say('Enter an email address we can reply to.', 'error');
        form.elements.email.focus();
        return;
      }
      if (!question) {
        say('Add your question and we&rsquo;ll come back to you.', 'error');
        form.elements.question.focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Sending…';
      status.hidden = true;

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        say('Question sent - we&rsquo;ll come back to you.', 'ok');
      }).catch(function () {
        var body = encodeURIComponent(question + '\n\n- from ' + email);
        say('That didn&rsquo;t send. Email us directly at ' +
            '<a href="mailto:' + CONFIG.email +
            '?subject=' + encodeURIComponent('Question from the Brick TV site') +
            '&amp;body=' + body + '">' + CONFIG.email + '</a>.', 'error');
      }).then(function () {
        submit.disabled = false;
        submit.textContent = 'Send the question';
      });
    });
  }
})();
