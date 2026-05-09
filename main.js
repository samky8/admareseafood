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

/* ---- Brand pronunciation audio ---- */
const pronunciationButtons = document.querySelectorAll('.pronunciation-button');
if (pronunciationButtons.length) {
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const pronunciationText = 'Ahd MAH ray';
  let preferredPronunciationVoice = null;

  const updatePreferredPronunciationVoice = () => {
    if (!speechSupported) return;

    const voices = window.speechSynthesis.getVoices();
    preferredPronunciationVoice = voices.find(voice => voice.lang === 'en-CA') ||
      voices.find(voice => voice.lang === 'en-US' && /google|samantha|alex|daniel|natural/i.test(voice.name)) ||
      voices.find(voice => voice.lang === 'en-US') ||
      voices.find(voice => voice.lang.startsWith('en-')) ||
      null;
  };

  if (!speechSupported) {
    pronunciationButtons.forEach(button => {
      button.disabled = true;
      button.title = 'Audio pronunciation is not supported in this browser';
    });
  } else {
    updatePreferredPronunciationVoice();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', updatePreferredPronunciationVoice);
    } else {
      window.speechSynthesis.onvoiceschanged = updatePreferredPronunciationVoice;
    }

    pronunciationButtons.forEach(button => {
      button.addEventListener('click', () => {
        window.speechSynthesis.cancel();

        updatePreferredPronunciationVoice();

        const utterance = new SpeechSynthesisUtterance(pronunciationText);
        utterance.lang = preferredPronunciationVoice ? preferredPronunciationVoice.lang : 'en-CA';
        if (preferredPronunciationVoice) {
          utterance.voice = preferredPronunciationVoice;
        }
        utterance.rate = 0.72;
        utterance.pitch = 1;
        utterance.volume = 1;

        button.classList.add('is-speaking');
        button.setAttribute('aria-label', 'Playing Ad Mare pronunciation');

        utterance.addEventListener('end', () => {
          button.classList.remove('is-speaking');
          button.setAttribute('aria-label', 'Hear Ad Mare pronounced');
        });

        utterance.addEventListener('error', () => {
          button.classList.remove('is-speaking');
          button.setAttribute('aria-label', 'Hear Ad Mare pronounced');
        });

        window.speechSynthesis.speak(utterance);
      });
    });
  }
}

/* ---- Current hours indicator ---- */
const updateCurrentHours = () => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  document.querySelectorAll('.hours-day').forEach(day => {
    const isToday = Number(day.dataset.day) === currentDay;
    const open = Number(day.dataset.open);
    const close = Number(day.dataset.close);
    const isOpenNow = isToday && Number.isFinite(open) && Number.isFinite(close) &&
      currentMinutes >= open && currentMinutes < close;
    const isClosedNow = isToday && !isOpenNow;

    day.classList.toggle('is-today', isToday);
    day.classList.toggle('open-now', isOpenNow);
    day.classList.toggle('closed-now', isClosedNow);
    if (isOpenNow) {
      day.setAttribute('aria-label', `${day.textContent.trim()} Open now`);
    } else if (isClosedNow) {
      day.setAttribute('aria-label', `${day.textContent.trim()} Closed now`);
    } else {
      day.removeAttribute('aria-label');
    }
  });
};

updateCurrentHours();
setInterval(updateCurrentHours, 60000);

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

/* ---- Reviews carousel ---- */
const reviewSlides = Array.from(document.querySelectorAll('[data-review-slide]'));
const reviewDots = Array.from(document.querySelectorAll('[data-review-dot]'));
const reviewPrev = document.querySelector('[data-review-prev]');
const reviewNext = document.querySelector('[data-review-next]');
const reviewCarousel = document.querySelector('.reviews-carousel');
let currentReview = 0;
let reviewTimer;

const showReview = (index) => {
  if (!reviewSlides.length) return;

  currentReview = (index + reviewSlides.length) % reviewSlides.length;

  reviewSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle('active', slideIndex === currentReview);
  });

  reviewDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === currentReview;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-selected', String(isActive));
  });
};

const startReviewTimer = () => {
  if (!reviewSlides.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.clearInterval(reviewTimer);
  reviewTimer = window.setInterval(() => showReview(currentReview + 1), 6500);
};

const restartReviewTimer = () => {
  window.clearInterval(reviewTimer);
  startReviewTimer();
};

reviewPrev?.addEventListener('click', () => {
  showReview(currentReview - 1);
  restartReviewTimer();
});

reviewNext?.addEventListener('click', () => {
  showReview(currentReview + 1);
  restartReviewTimer();
});

reviewDots.forEach(dot => {
  dot.addEventListener('click', () => {
    showReview(Number(dot.dataset.reviewDot));
    restartReviewTimer();
  });
});

reviewCarousel?.addEventListener('mouseenter', () => window.clearInterval(reviewTimer));
reviewCarousel?.addEventListener('mouseleave', startReviewTimer);
showReview(0);
startReviewTimer();

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
    const href = navLogo.getAttribute('href') || '';
    const isSamePageTop = href === '#top' || href === '#' || href === window.location.pathname;

    if (isSamePageTop) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
  '.menu-card, .photo-cell, .about-grid, .reviews-inner, .catering-inner, .visit-grid, .swag-card, .contact-grid'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});
