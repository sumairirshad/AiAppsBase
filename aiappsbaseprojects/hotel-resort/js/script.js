// Aurelia Resorts — shared front-end behaviour (demo only, no backend)

document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 40) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
  }

  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.querySelector(".faq-q").addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!isOpen) item.classList.add("open");
    });
  });

  /* Rotating testimonial dots (static set, cosmetic only) */
  var dots = document.querySelectorAll(".testi-dots span");
  var quotes = document.querySelectorAll(".testimonial-single .quote-set");
  if (dots.length && quotes.length) {
    var idx = 0;
    setInterval(function () {
      quotes[idx].style.display = "none";
      dots[idx].classList.remove("active");
      idx = (idx + 1) % quotes.length;
      quotes[idx].style.display = "block";
      dots[idx].classList.add("active");
    }, 5000);
  }

  var loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = loginForm.querySelector("#email").value.trim();
      var password = loginForm.querySelector("#password").value.trim();
      var error = document.querySelector("#loginError");
      if (email === "demo@aurelia-resorts.com" && password === "Stay2025!") {
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

  var newsletterForm = document.querySelector(".newsletter-band form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = newsletterForm.querySelector("button");
      var original = btn.textContent;
      btn.textContent = "Thank you";
      setTimeout(function () { btn.textContent = original; newsletterForm.reset(); }, 2200);
    });
  }
});
