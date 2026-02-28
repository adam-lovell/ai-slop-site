/* ==========================================================================
   SHINY RIDES — Main JavaScript
   Handles: smooth scroll, parallax, reveals, gallery filter,
            lightbox, mobile nav, and booking form AJAX.
   ========================================================================== */

(function () {
  'use strict';

  // ── Navbar scroll style ──────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  function updateNav() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ── Hamburger ────────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // ── Intersection Observer — Reveal on scroll ────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => revealObs.observe(el));

  // ── Parallax effect (hero + breaks) ─────────────────────────────────
  const parallaxSections = document.querySelectorAll('.parallax-section');
  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxSections.forEach(sec => {
      const speed = parseFloat(sec.dataset.speed) || 0.3;
      const offset = (scrollY - sec.offsetTop) * speed;
      sec.style.backgroundPositionY = `calc(50% + ${offset}px)`;
    });
  }
  window.addEventListener('scroll', updateParallax, { passive: true });

  // ── Gallery filter ──────────────────────────────────────────────────
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hidden-item');
        } else {
          item.classList.add('hidden-item');
        }
      });
    });
  });

  // ── Gallery lightbox ────────────────────────────────────────────────
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      lightboxImg.src = img.src.replace('w=600', 'w=1400');
      lightboxImg.alt = img.alt;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ── Pricing "Select" → auto-fill service dropdown ──────────────────
  document.querySelectorAll('[data-service]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serviceValue = btn.dataset.service;
      const select = document.getElementById('service');
      if (select) {
        for (const opt of select.options) {
          if (opt.value === serviceValue) { opt.selected = true; break; }
        }
      }
    });
  });

  // ── Booking form AJAX ──────────────────────────────────────────────
  const form     = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText  = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const feedback = document.getElementById('formFeedback');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.hidden = true;

    // Simple client-side validation
    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const phone   = form.phone.value.trim();
    const service = form.service.value;
    const message = form.message.value.trim();

    if (!name || !email || !service) {
      showFeedback('Please fill in all required fields.', false);
      return;
    }

    // UX: loading state
    btnText.textContent = 'Sending…';
    btnLoader.hidden = false;
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, service, message }),
      });
      const data = await res.json();

      if (data.ok) {
        showFeedback(data.message, true);
        form.reset();
      } else {
        showFeedback(data.errors.join(' '), false);
      }
    } catch {
      showFeedback('Network error — please try again.', false);
    } finally {
      btnText.textContent = 'Send Booking Request';
      btnLoader.hidden = true;
      submitBtn.disabled = false;
    }
  });

  function showFeedback(msg, success) {
    feedback.textContent = msg;
    feedback.className   = 'form-feedback ' + (success ? 'success' : 'error');
    feedback.hidden      = false;
  }

  // ── Smooth-scroll for anchor links (Safari fallback) ────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
