/* ============================================================
   AD MARE — MAIN JS
   ============================================================ */

/* ---- Sticky nav scroll effect ---- */
const header = document.querySelector('.site-header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---- Mobile nav toggle ---- */
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', isOpen);
});

// Close nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---- Contact form (client-side validation + Formspree submit) ---- */
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const formspreePlaceholder = 'YOUR_FORMSPREE_FORM_ID';

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const subject = (form.subject.value || 'Website contact form').trim();
    const message = form.message.value.trim();
    let valid = true;

    [form.name, form.email, form.message].forEach(f => f.classList.remove('error'));

    if (!name)  { form.name.classList.add('error');    valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.email.classList.add('error'); valid = false;
    }
    if (!message) { form.message.classList.add('error'); valid = false; }

    if (!valid) {
      status.textContent = 'Please fill in all required fields.';
      status.className = 'form-status error';
      return;
    }

    if (form.action.includes(formspreePlaceholder)) {
      status.textContent = 'Add your real Formspree form ID in index.html before publishing.';
      status.className = 'form-status error';
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: new FormData(form)
      });

      if (!response.ok) {
        throw new Error('Form submission failed.');
      }

      status.textContent = "Thanks! Your message has been sent.";
      status.className = 'form-status success';
      form.reset();
      form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
      form.subject.value = '';
      form.message.value = '';
    } catch (error) {
      status.textContent = 'We could not send your message right now. Please try again or email us directly.';
      status.className = 'form-status error';
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

/* ---- Button click ripple ---- */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    this.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

/* ---- Back to top ---- */
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  const updateBackToTop = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
    backToTop.classList.toggle('visible', pct >= 0.75);
  };
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();

  backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---- Logo scroll to top ---- */
const navLogo = document.querySelector('.nav-logo');
if (navLogo) {
  navLogo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---- Scroll-in animation ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.menu-card, .photo-cell, .about-grid, .catering-inner, .visit-grid, .swag-card, .contact-grid'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});
