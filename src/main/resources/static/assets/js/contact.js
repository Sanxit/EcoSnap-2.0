// Contact page: map click-to-interact and contact form submission simulation.
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
})();
