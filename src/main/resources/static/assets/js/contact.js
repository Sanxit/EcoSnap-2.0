// Contact page: map click-to-interact and real backend contact form submission.
(function () {
  'use strict';

  // Enable map interaction only after clicking inside the container
  var container = document.getElementById('mapContainer');
  if (container) {
    container.addEventListener('click', function () {
      this.classList.add('active');
    });

    container.addEventListener('mouseleave', function () {
      this.classList.remove('active');
    });

    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) {
        container.classList.remove('active');
      }
    });
  }

  // Wire the contact form to the backend inquiry endpoint.
  var form = document.getElementById('contactForm') || document.querySelector('.contact-card form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var name = (document.getElementById('fullName') || {}).value || '';
      var email = (document.getElementById('email') || {}).value || '';
      var subject = (document.getElementById('subject') || {}).value || '';
      var message = (document.getElementById('message') || {}).value || '';

      name = name.trim();
      email = email.trim();
      subject = subject.trim();
      message = message.trim();

      if (!name || !email || !subject || !message) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Sending...';
      }

      try {
        await EcoSnapAPI.contactInquiry({ name: name, email: email, subject: subject, message: message });
        if (submitBtn) submitBtn.innerHTML = '<i class="ri-checkbox-circle-line"></i> Sent!';
        showToast('Your message has been sent. We will get back to you soon.', 'success');
        form.reset();
        setTimeout(function () {
          if (submitBtn) {
            submitBtn.innerHTML = originalLabel;
            submitBtn.disabled = false;
          }
        }, 2500);
      } catch (err) {
        if (submitBtn) {
          submitBtn.innerHTML = originalLabel;
          submitBtn.disabled = false;
        }
        showToast(err.message || 'Could not send your message. Please try again later.', 'error');
      }
    });
  }

  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) { alert(msg); return; }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    t.innerHTML = '<i class="ri-' + (type === 'success' ? 'check-circle' : 'error-warning') + '-line"></i> ' + msg;
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
})();