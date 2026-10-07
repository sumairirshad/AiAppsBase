// Lumière Beauty & Spa — shared front-end behaviour (demo only, no backend)

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) toggle.addEventListener("click", function () { nav.classList.toggle("open"); });

  /* Services menu tabs */
  document.querySelectorAll(".menu-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-menu");
      document.querySelectorAll(".menu-tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".menu-panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      document.querySelector('.menu-panel[data-menu="' + target + '"]').classList.add("active");
    });
  });

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
      if (email === "demo@lumierespa.com" && password === "Glow2025") {
        window.location.href = "index.html";
      } else if (error) { error.style.display = "block"; }
    });
  }

  var signupForm = document.querySelector("#signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "login.html";
    });
  }

  var bookingForm = document.querySelector(".booking-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = bookingForm.querySelector("button");
      var original = btn.textContent;
      btn.textContent = "Request Sent";
      setTimeout(function () { btn.textContent = original; bookingForm.reset(); }, 2500);
    });
  }

  var newsletterForm = document.querySelector(".newsletter-row form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = newsletterForm.querySelector("button");
      var original = btn.textContent;
      btn.textContent = "Subscribed";
      setTimeout(function () { btn.textContent = original; newsletterForm.reset(); }, 2200);
    });
  }
});
