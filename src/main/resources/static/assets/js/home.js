// Homepage hero search: redirects to photographers catalog with query params.
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('btnHeroSearch');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var specialty = document.getElementById('searchSpecialty').value;
    var location = document.getElementById('searchLocation').value;
    var budget = document.getElementById('searchBudget').value;

    var params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (location) params.set('location', location);
    if (budget) params.set('budget', budget);

    var qs = params.toString();
    window.location.href = 'pages/photographers.html' + (qs ? '?' + qs : '');
  });
});
