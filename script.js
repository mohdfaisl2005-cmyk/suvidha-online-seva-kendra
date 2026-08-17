/* ==========================================================================
   SUVIDHA ONLINE SEVA KENDRA + SUVIDHA MOBILE CARE
   script.js — all interactive behaviour, vanilla JS, no dependencies
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIG — business contact details (edit here if they ever change)
     ------------------------------------------------------------------ */
  var CONFIG = {
    whatsappNumber: "918004376439", // country code + number, digits only
    email: "mf6742952@gmail.com"
  };

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function waLink(message) {
    return "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(message);
  }
  function mailtoLink(subject, body) {
    return "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------
     Default WhatsApp links (header, hero, floating, contact section)
     ------------------------------------------------------------------ */
  function setDefaultWhatsappLinks() {
    var generic = waLink("Hello, I would like to enquire about an online service.");
    var mobileCare = waLink("Hello, I would like to enquire about mobile repair.");

    ["headerWhatsapp", "heroWhatsapp", "floatingWhatsapp", "contactWhatsapp"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", generic);
    });
    ["mcWhatsappLink", "contactMcWhatsapp"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", mobileCare);
    });
  }

  /* ------------------------------------------------------------------
     Sticky header shadow on scroll
     ------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
     Mobile hamburger menu
     ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;

    function closeNav() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    function openNav() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("is-open");
      if (isOpen) { closeNav(); } else { openNav(); }
    });
    $all("a", nav).forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ------------------------------------------------------------------
     Smooth scroll for in-page anchors (native CSS handles most, this
     just ensures focus lands correctly for accessibility)
     ------------------------------------------------------------------ */
  function initAnchorFocus() {
    $all('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (target) {
          setTimeout(function () {
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
          }, 400);
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Service search + category filter
     ------------------------------------------------------------------ */
  function initServiceSearch() {
    var input = document.getElementById("serviceSearch");
    var clearBtn = document.getElementById("clearSearch");
    var status = document.getElementById("searchStatus");
    var empty = document.getElementById("serviceEmpty");
    var tabs = $all(".service-tab");
    var cards = $all(".service-card", document.getElementById("serviceGrid"));
    if (!input) return;

    var activeCategory = "all";

    function applyFilters() {
      var query = input.value.trim().toLowerCase();
      var visibleCount = 0;

      cards.forEach(function (card) {
        var isRefCard = card.hasAttribute("data-always-hidden");
        var category = card.getAttribute("data-category");
        var keywords = (card.getAttribute("data-keywords") || "").toLowerCase();
        var title = card.querySelector("h3").textContent.toLowerCase();

        var matchesCategory = activeCategory === "all" || category === activeCategory;
        var matchesQuery = query === "" || keywords.indexOf(query) !== -1 || title.indexOf(query) !== -1;

        var show;
        if (isRefCard) {
          // Only ever show the "mobile" reference card, only during an active text search
          show = query !== "" && keywords.indexOf(query) !== -1;
        } else {
          show = matchesCategory && matchesQuery;
        }

        card.hidden = !show;
        if (show) visibleCount++;
      });

      clearBtn.hidden = query === "";
      empty.hidden = visibleCount !== 0;

      if (query !== "") {
        status.textContent = visibleCount === 0
          ? "No services matched \u201c" + input.value.trim() + "\u201d."
          : visibleCount + " service" + (visibleCount === 1 ? "" : "s") + " found for \u201c" + input.value.trim() + "\u201d.";
      } else {
        status.textContent = "";
      }
    }

    input.addEventListener("input", applyFilters);
    clearBtn.addEventListener("click", function () {
      input.value = "";
      applyFilters();
      input.focus();
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        activeCategory = tab.getAttribute("data-filter");
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ------------------------------------------------------------------
     Dynamic WhatsApp message per service card "Enquire" link
     ------------------------------------------------------------------ */
  function initServiceCardLinks() {
    $all(".service-card__link[data-service]").forEach(function (link) {
      var service = link.getAttribute("data-service");
      link.setAttribute("href", waLink("Hello, I would like to enquire about: " + service + "."));
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    });
  }

  /* ------------------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------------------ */
  function initAccordion() {
    $all(".accordion__item").forEach(function (item) {
      var trigger = item.querySelector(".accordion__trigger");
      var panel = item.querySelector(".accordion__panel");
      if (!trigger || !panel) return;
      panel.style.maxHeight = "0px";

      trigger.addEventListener("click", function () {
        var isOpen = trigger.getAttribute("aria-expanded") === "true";

        // close all others
        $all(".accordion__trigger").forEach(function (t) {
          if (t !== trigger) {
            t.setAttribute("aria-expanded", "false");
            t.closest(".accordion__item").querySelector(".accordion__panel").style.maxHeight = "0px";
          }
        });

        if (isOpen) {
          trigger.setAttribute("aria-expanded", "false");
          panel.style.maxHeight = "0px";
        } else {
          trigger.setAttribute("aria-expanded", "true");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal (IntersectionObserver)
     ------------------------------------------------------------------ */
  function initScrollReveal() {
    var items = $all(".reveal");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------
     Back to top button
     ------------------------------------------------------------------ */
  function initBackToTop() {
    var btn = document.getElementById("backToTop");
    if (!btn) return;
    function toggle() {
      btn.hidden = window.scrollY < 500;
    }
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------------
     Generic form validation engine
     ------------------------------------------------------------------ */
  function validateField(field, rules) {
    var value = field.value.trim();
    var errorEl = document.getElementById(field.id + "-error");
    var fieldWrap = field.closest(".field");
    var message = "";

    if (rules.required && value === "") {
      message = "This field is required.";
    } else if (rules.pattern && value !== "" && !rules.pattern.test(value)) {
      message = rules.patternMessage || "Please enter a valid value.";
    } else if (rules.minLength && value.length > 0 && value.length < rules.minLength) {
      message = "Please enter at least " + rules.minLength + " characters.";
    }

    if (fieldWrap) fieldWrap.classList.toggle("has-error", message !== "");
    if (errorEl) errorEl.textContent = message;
    return message === "";
  }

  var MOBILE_PATTERN = /^[6-9]\d{9}$/;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ------------------------------------------------------------------
     Mobile repair enquiry form
     ------------------------------------------------------------------ */
  function initRepairForm() {
    var form = document.getElementById("repairForm");
    if (!form) return;

    var msg = document.getElementById("repairMsg");
    var sendBox = document.getElementById("repairSend");
    var submitBtn = document.getElementById("repairSubmitBtn");
    var waBtn = document.getElementById("repairSendWhatsapp");
    var emailBtn = document.getElementById("repairSendEmail");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "";
      msg.className = "form-msg";

      var name = document.getElementById("rName");
      var mobile = document.getElementById("rMobile");
      var problem = document.getElementById("rProblem");
      var desc = document.getElementById("rDesc");

      var ok = true;
      ok = validateField(name, { required: true }) && ok;
      ok = validateField(mobile, { required: true, pattern: MOBILE_PATTERN, patternMessage: "Enter a valid 10-digit mobile number." }) && ok;
      ok = validateField(problem, { required: true }) && ok;
      ok = validateField(desc, { required: true, minLength: 8 }) && ok;

      if (!ok) {
        msg.textContent = "Please fix the highlighted fields above.";
        msg.classList.add("is-error");
        return;
      }

      var brand = document.getElementById("rBrand").value.trim();
      var model = document.getElementById("rModel").value.trim();
      var contactMethod = document.getElementById("rContact").value;

      var lines = [
        "Mobile Repair Enquiry — Suvidha Mobile Care",
        "Name: " + name.value.trim(),
        "Mobile: " + mobile.value.trim(),
        "Brand: " + (brand || "-"),
        "Model: " + (model || "-"),
        "Problem: " + problem.value,
        "Description: " + desc.value.trim(),
        "Preferred Contact: " + contactMethod
      ];
      var text = lines.join("\n");

      waBtn.setAttribute("href", waLink(text));
      emailBtn.setAttribute("href", mailtoLink("Mobile Repair Enquiry - " + problem.value, text));

      sendBox.hidden = false;
      submitBtn.hidden = true;
      msg.textContent = "Thank you! Your repair enquiry has been received. We will contact you regarding your mobile issue.";
      msg.classList.add("is-success");
      sendBox.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ------------------------------------------------------------------
     Main online enquiry form
     ------------------------------------------------------------------ */
  function initEnquiryForm() {
    var form = document.getElementById("enquiryForm");
    if (!form) return;

    var msg = document.getElementById("enquiryMsg");
    var sendBox = document.getElementById("enquirySend");
    var submitBtn = document.getElementById("enquirySubmitBtn");
    var waBtn = document.getElementById("enquirySendWhatsapp");
    var emailBtn = document.getElementById("enquirySendEmail");

    // Pre-select service if a service card link pointed here with a hash param
    var params = new URLSearchParams(window.location.search);
    var presetService = params.get("service");
    if (presetService) {
      var serviceSelect = document.getElementById("eService");
      var match = Array.prototype.find.call(serviceSelect.options, function (o) { return o.value === presetService; });
      if (match) serviceSelect.value = presetService;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "";
      msg.className = "form-msg";

      var name = document.getElementById("eName");
      var mobile = document.getElementById("eMobile");
      var email = document.getElementById("eEmail");
      var service = document.getElementById("eService");
      var message = document.getElementById("eMessage");

      var ok = true;
      ok = validateField(name, { required: true }) && ok;
      ok = validateField(mobile, { required: true, pattern: MOBILE_PATTERN, patternMessage: "Enter a valid 10-digit mobile number." }) && ok;
      ok = validateField(email, { required: false, pattern: email.value.trim() ? EMAIL_PATTERN : null, patternMessage: "Enter a valid email address." }) && ok;
      ok = validateField(service, { required: true }) && ok;
      ok = validateField(message, { required: true, minLength: 8 }) && ok;

      if (!ok) {
        msg.textContent = "Please fix the highlighted fields above.";
        msg.classList.add("is-error");
        return;
      }

      var fileInput = document.getElementById("eFile");
      var fileName = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "";

      var lines = [
        "Online Enquiry — Suvidha Online Seva Kendra",
        "Name: " + name.value.trim(),
        "Mobile: " + mobile.value.trim(),
        "Email: " + (email.value.trim() || "-"),
        "Service: " + service.value,
        "Message: " + message.value.trim()
      ];
      if (fileName) lines.push("Attachment to include manually: " + fileName);
      var text = lines.join("\n");

      waBtn.setAttribute("href", waLink(text));
      emailBtn.setAttribute("href", mailtoLink("Online Enquiry - " + service.value, text));

      sendBox.hidden = false;
      submitBtn.hidden = true;
      msg.textContent = "Thank you! Your enquiry is ready to send — choose WhatsApp or Email below to complete it.";
      msg.classList.add("is-success");
      sendBox.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    setDefaultWhatsappLinks();
    initHeaderScroll();
    initMobileNav();
    initAnchorFocus();
    initServiceSearch();
    initServiceCardLinks();
    initAccordion();
    initScrollReveal();
    initBackToTop();
    initRepairForm();
    initEnquiryForm();
  });
})();
