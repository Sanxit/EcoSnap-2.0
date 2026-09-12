// Packages page: category tab switching to show/hide pricing grids.
// Extracted content mirrors js/packages.js.
document.addEventListener('DOMContentLoaded', function () {
  var tabs = document.querySelectorAll('.packages-tab');
  var grids = document.querySelectorAll('.package-grid-container');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      grids.forEach(function (grid) { grid.classList.remove('active'); });
      var targetId = tab.getAttribute('data-target');
      var targetGrid = document.getElementById(targetId);
      if (targetGrid) targetGrid.classList.add('active');
    });
  });
});
