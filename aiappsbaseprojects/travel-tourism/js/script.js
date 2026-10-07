// Horizon Travel — shared front-end behaviour (demo only, no backend)

document.addEventListener("DOMContentLoaded", function () {
  /* Sticky header background on scroll */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 40) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
  }

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  /* Category tabs */
  var tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".tab-panels .panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var panel = document.querySelector('.panel[data-panel="' + target + '"]');
      if (panel) panel.classList.add("active");
    });
  });

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!isOpen) item.classList.add("open");
    });
  });

  /* Demo login (frontend-only) */
  var loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = loginForm.querySelector("#email").value.trim();
      var password = loginForm.querySelector("#password").value.trim();
      var error = document.querySelector("#loginError");
      if (email === "demo@travelhorizon.com" && password === "Demo1234") {
        window.location.href = "dashboard.html";
      } else {
        if (error) error.style.display = "block";
      }
    });
  }

  /* Demo signup (frontend-only) */
  var signupForm = document.querySelector("#signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "dashboard.html";
    });
  }

  /* Newsletter form (demo) */
  var newsletterForm = document.querySelector(".newsletter form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = newsletterForm.querySelector("button");
      var original = btn.textContent;
      btn.textContent = "Subscribed!";
      setTimeout(function () { btn.textContent = original; newsletterForm.reset(); }, 2200);
    });
  }

  /* Search widget demo submit */
  var searchForm = document.querySelector(".search-card");
  if (searchForm && searchForm.tagName === "FORM") {
    searchForm.addEventListener("submit", function (e) { e.preventDefault(); });
  }
});
