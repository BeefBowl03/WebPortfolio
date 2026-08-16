/**
 * Contact form — Formspree over fetch(), never navigating away.
 *
 * Progressive enhancement: the <form> carries a real `action` and `method`, so
 * with JavaScript disabled the native POST still works. With JavaScript on we
 * intercept, validate inline, and stay on the page.
 *
 * Accessibility: every control is wired to its error node via
 * `aria-describedby`; errors set `aria-invalid`; the status region is
 * `role="alert" aria-live="assertive"`; the submit button reports `aria-busy`
 * while in flight and focus is moved to the outcome.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusBox = document.getElementById('form-status');
  const submit = form.querySelector('button[type="submit"]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const successTpl = document.getElementById('form-success-template');
  const errorTpl = document.getElementById('form-error-template');

  const idleLabel = submitLabel ? submitLabel.textContent : 'Send';
  const busyLabel = form.dataset.loadingLabel || 'Sending…';

  const fields = [...form.querySelectorAll('[data-field]')].map((wrap) => ({
    wrap,
    control: wrap.querySelector('.field__control'),
    error: wrap.querySelector('.field__error'),
  })).filter((f) => f.control && f.error);

  /* ── validation ───────────────────────────────────────────────────── */

  function validate(field, { silent = false } = {}) {
    const { control, error, wrap } = field;
    const value = control.value.trim();
    let message = '';

    if (control.required && !value) {
      message = error.dataset.message || 'This field is required.';
    } else if (control.type === 'email' && value && !EMAIL_RE.test(value)) {
      message = error.dataset.message || 'Please enter a valid email address.';
    }

    if (silent) return !message;

    error.textContent = message;
    wrap.classList.toggle('is-invalid', Boolean(message));
    control.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  for (const field of fields) {
    // Don't shout before they've typed: validate on blur, then live-correct.
    field.control.addEventListener('blur', () => validate(field));
    field.control.addEventListener('input', () => {
      if (field.wrap.classList.contains('is-invalid')) validate(field);
    });
  }

  /* ── submission ───────────────────────────────────────────────────── */

  /* `submit.disabled = true` on the button that the user just activated pulls
   * focus out from under them — a disabled control cannot hold focus, so the
   * browser drops it on <body> and a screen-reader user loses their place mid
   * request. `aria-disabled` + an in-flight guard communicates the same state
   * while keeping the button focusable (WCAG 2.4.3). */
  let inFlight = false;

  const setBusy = (busy) => {
    inFlight = busy;
    if (!submit) return;
    submit.setAttribute('aria-disabled', String(busy));
    submit.setAttribute('aria-busy', String(busy));
    if (submitLabel) submitLabel.textContent = busy ? busyLabel : idleLabel;
  };

  const showError = () => {
    if (!statusBox) return;
    statusBox.textContent = '';
    if (errorTpl) statusBox.appendChild(errorTpl.content.cloneNode(true));
    else statusBox.textContent = 'That didn’t send. Please try again.';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (inFlight) return;
    if (statusBox) statusBox.textContent = '';

    let firstBad = null;
    let badCount = 0;
    for (const field of fields) {
      if (!validate(field)) {
        badCount++;
        if (!firstBad) firstBad = field;
      }
    }
    if (firstBad) {
      /* Moving focus to the first bad field makes that ONE error audible, but
       * says nothing about the other three. A short count in the alert region
       * gives the whole picture up front (WCAG 3.3.1). Written before focus
       * moves so the two announcements queue rather than clobber each other. */
      if (statusBox) {
        statusBox.textContent =
          badCount === 1
            ? '1 field needs attention before this can send.'
            : `${badCount} fields need attention before this can send.`;
      }
      firstBad.control.focus();
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(form.action, {
        method: (form.method || 'POST').toUpperCase(),
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`Formspree responded ${response.status}`);

      if (successTpl) {
        const panel = successTpl.content.cloneNode(true);
        const host = form.parentElement;
        form.remove();
        host.appendChild(panel);
        const heading = host.querySelector('.form__success h3');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }
      } else {
        /* No success template: the form stays on screen, so it MUST be taken
         * out of the busy state or it is stranded on "Sending…" / aria-busy
         * forever and can never be submitted again. (The template branch above
         * removes the form entirely, so it needs no reset.) */
        form.reset();
        setBusy(false);
      }
    } catch (err) {
      console.error('[form]', err);
      setBusy(false);
      showError();
      const banner = statusBox && statusBox.querySelector('.form__error-banner');
      if (banner) {
        banner.setAttribute('tabindex', '-1');
        banner.focus();
      }
    }
  });
}
