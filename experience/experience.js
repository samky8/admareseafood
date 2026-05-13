const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJybyQeVQEzkwRWc2P4r-hico';
const HOME_URL = '../index.html';

const googleReviewLink = document.querySelector('[data-google-review-link]');
if (googleReviewLink) {
  googleReviewLink.href = GOOGLE_REVIEW_URL;
}

const feedbackToggle = document.querySelector('[data-feedback-toggle]');
const feedbackSection = document.getElementById('experienceFeedback');
const feedbackForm = document.getElementById('experienceForm');
const feedbackStatus = document.getElementById('experienceStatus');
const experienceOptions = document.querySelector('[data-experience-options]');
const reviewRedirect = document.getElementById('reviewRedirect');
const reviewRedirectButton = document.getElementById('reviewRedirectButton');
const reviewCountdown = document.querySelector('[data-review-countdown]');
const feedbackRedirect = document.getElementById('feedbackRedirect');
const feedbackRedirectButton = document.getElementById('feedbackRedirectButton');
const feedbackCountdown = document.querySelector('[data-feedback-countdown]');
let reviewTimer;
let feedbackTimer;

const trackExperienceEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, {
    page_location: window.location.href,
    ...eventParams
  });
};

if (reviewRedirectButton) {
  reviewRedirectButton.href = GOOGLE_REVIEW_URL;
}

if (feedbackRedirectButton) {
  feedbackRedirectButton.href = HOME_URL;
}

const startRedirectCountdown = ({ button, countdown, label, url, timerSetter }) => {
  let secondsRemaining = 5;
  countdown.textContent = String(secondsRemaining);
  button.textContent = '';
  button.append(`${label}... (`);
  button.append(countdown);
  button.append(')');

  const timer = window.setInterval(() => {
    secondsRemaining -= 1;
    countdown.textContent = String(secondsRemaining);

    if (secondsRemaining <= 0) {
      window.clearInterval(timer);
      window.location.href = url;
    }
  }, 1000);

  timerSetter(timer);
};

googleReviewLink?.addEventListener('click', (event) => {
  event.preventDefault();
  trackExperienceEvent('experience_card_click', {
    feedback_choice: 'loved_it',
    destination: 'google_review'
  });

  if (!reviewRedirect || !reviewRedirectButton || !reviewCountdown) {
    window.location.href = GOOGLE_REVIEW_URL;
    return;
  }

  window.clearInterval(reviewTimer);
  window.clearInterval(feedbackTimer);
  if (feedbackSection) {
    feedbackSection.hidden = true;
  }
  if (experienceOptions) {
    experienceOptions.hidden = true;
  }
  if (feedbackRedirect) {
    feedbackRedirect.hidden = true;
  }
  reviewRedirect.hidden = false;

  reviewRedirect.scrollIntoView({ behavior: 'smooth', block: 'center' });
  reviewRedirectButton.focus({ preventScroll: true });

  startRedirectCountdown({
    button: reviewRedirectButton,
    countdown: reviewCountdown,
    label: 'Redirecting to Google reviews',
    url: GOOGLE_REVIEW_URL,
    timerSetter: (timer) => {
      reviewTimer = timer;
    }
  });
});

feedbackToggle?.addEventListener('click', () => {
  if (!feedbackSection) return;
  trackExperienceEvent('experience_card_click', {
    feedback_choice: 'could_have_been_better',
    destination: 'private_feedback'
  });

  if (reviewRedirect) {
    reviewRedirect.hidden = true;
  }
  if (feedbackRedirect) {
    feedbackRedirect.hidden = true;
  }
  if (experienceOptions) {
    experienceOptions.hidden = false;
  }
  window.clearInterval(reviewTimer);
  window.clearInterval(feedbackTimer);
  feedbackSection.hidden = false;
  feedbackToggle.setAttribute('aria-expanded', 'true');
  feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  window.setTimeout(() => {
    document.getElementById('experienceMessage')?.focus({ preventScroll: true });
  }, 450);
});

feedbackForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = feedbackForm.message.value.trim();
  const email = feedbackForm.email.value.trim();
  const submitButton = feedbackForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || 'Send';

  feedbackStatus.className = 'form-status';
  feedbackStatus.textContent = '';
  feedbackForm.message.classList.remove('error');
  feedbackForm.email.classList.remove('error');

  if (!message) {
    feedbackForm.message.classList.add('error');
    feedbackStatus.textContent = 'Please add a quick message before sending.';
    feedbackStatus.className = 'form-status error';
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    feedbackForm.email.classList.add('error');
    feedbackStatus.textContent = 'Please check the email address or leave it blank.';
    feedbackStatus.className = 'form-status error';
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
  }

  try {
    const response = await fetch(feedbackForm.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(feedbackForm)
    });

    if (!response.ok) {
      throw new Error('Form submission failed.');
    }

    feedbackForm.reset();
    trackExperienceEvent('experience_private_feedback_submit', {
      feedback_choice: 'could_have_been_better'
    });
    feedbackSection.hidden = true;
    if (experienceOptions) {
      experienceOptions.hidden = true;
    }
    if (reviewRedirect) {
      reviewRedirect.hidden = true;
    }

    if (!feedbackRedirect || !feedbackRedirectButton || !feedbackCountdown) {
      window.location.href = HOME_URL;
      return;
    }

    feedbackRedirect.hidden = false;
    feedbackRedirect.scrollIntoView({ behavior: 'smooth', block: 'center' });
    feedbackRedirectButton.focus({ preventScroll: true });
    window.clearInterval(feedbackTimer);

    startRedirectCountdown({
      button: feedbackRedirectButton,
      countdown: feedbackCountdown,
      label: 'Redirecting to Ad Mare website',
      url: HOME_URL,
      timerSetter: (timer) => {
        feedbackTimer = timer;
      }
    });
  } catch (error) {
    feedbackStatus.textContent = 'We could not send that right now. Please try again or email admare@outlook.com.';
    feedbackStatus.className = 'form-status error';
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
