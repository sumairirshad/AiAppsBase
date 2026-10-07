// PULSE Summit — shared front-end behaviour (demo only, no backend)

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) toggle.addEventListener("click", function () { nav.classList.toggle("open"); });

  /* Day tabs for agenda */
  document.querySelectorAll(".day-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-day");
      document.querySelectorAll(".day-tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".agenda-panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      document.querySelector('.agenda-panel[data-day="' + target + '"]').classList.add("active");
    });
  });

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.querySelector(".faq-q").addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!isOpen) item.classList.add("open");
    });
  });

  /* Countdown timer to event date */
  var countdown = document.querySelector("[data-countdown]");
  if (countdown) {
    var target = new Date(countdown.getAttribute("data-countdown")).getTime();
    var dEl = countdown.querySelector(".d"), hEl = countdown.querySelector(".h"),
        mEl = countdown.querySelector(".m"), sEl = countdown.querySelector(".s");
    function tick() {
      var diff = Math.max(0, target - Date.now());
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (dEl) dEl.textContent = String(d).padStart(2, "0");
      if (hEl) hEl.textContent = String(h).padStart(2, "0");
      if (mEl) mEl.textContent = String(m).padStart(2, "0");
      if (sEl) sEl.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);
  }

  var loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = loginForm.querySelector("#email").value.trim();
      var password = loginForm.querySelector("#password").value.trim();
      var error = document.querySelector("#loginError");
      if (email === "demo@pulsesummit.io" && password === "Pulse2025") {
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
      btn.textContent = "Subscribed!";
      setTimeout(function () { btn.textContent = original; newsletterForm.reset(); }, 2200);
    });
  }
});
