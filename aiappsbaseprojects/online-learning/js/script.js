// SkillNest — shared front-end behaviour (demo only, no backend)

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) toggle.addEventListener("click", function () { nav.classList.toggle("open"); });

  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.querySelector(".faq-q").addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!isOpen) item.classList.add("open");
    });
  });

  var loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = loginForm.querySelector("#email").value.trim();
      var password = loginForm.querySelector("#password").value.trim();
      var error = document.querySelector("#loginError");
      if (email === "demo@skillnest.com" && password === "Learn2025") {
        window.location.href = "dashboard.html";
      } else if (error) { error.style.display = "block"; }
    });
  }

  var signupForm = document.querySelector("#signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "dashboard.html";
    });
  }

  var searchForm = document.querySelector(".hero-search");
  if (searchForm && searchForm.tagName === "FORM") {
    searchForm.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  var newsletterForm = document.querySelector(".newsletter-band form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = newsletterForm.querySelector("button");
      var original = btn.textContent;
      btn.textContent = "Subscribed!";
      setTimeout(function () { btn.textContent = original; newsletterForm.reset(); }, 2200);
    });
  }
});
