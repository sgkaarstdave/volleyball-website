// Mobile Menu Toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  if (toggleButton && mobileMenu) {
    toggleButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Termine laden
  fetch("data/site.json")
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("termine-list");
      if (!list) return;

      data.termine.forEach((t) => {
        const el = document.createElement("div");
        el.className =
          "bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between";
        el.innerHTML = `
          <div>
            <p class="text-sm text-gray-500">${t.datum}</p>
            <h3 class="font-semibold text-lg text-gray-800">${t.gegner}</h3>
            <p class="text-gray-600 text-sm">${t.info}</p>
          </div>
          <div class="mt-2 sm:mt-0 text-right">
            <p class="font-semibold text-blue-600">${t.ort}</p>
            <p class="text-sm text-gray-500">${t.anpfiff}</p>
          </div>
        `;
        list.appendChild(el);
      });
    });
});
