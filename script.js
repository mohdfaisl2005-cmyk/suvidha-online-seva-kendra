/* ==========================================================================
   SUVIDHA ONLINE SEVA KENDRA + SUVIDHA MOBILE CARE
   script.js — vanilla JS, no build step, GitHub Pages compatible

   UPGRADE NOTE (read this before deploying):
   This file now saves every enquiry to a real Supabase database instead
   of only opening WhatsApp/email. Fill in the CONFIG block below with
   your own Supabase + EmailJS values — see SETUP_INSTRUCTIONS.md.

   Everything else (navigation, search, filters, FAQ, animations,
   WhatsApp links) is unchanged from before.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIG — fill these in (see SETUP_INSTRUCTIONS.md). Every value
     here is a PUBLIC/publishable key by design — Supabase's "anon" key
     and EmailJS's "public" key are meant to be used in frontend code.
     No secret/service-role keys ever belong in this file.
     ------------------------------------------------------------------ */
  var CONFIG = {
    whatsappNumber: "918004376439", // country code + number, digits only

    supabase: {
      url: "https://fkkaggupxzovecwuaafm.supabase.co",        // e.g. https://abcdefgh.supabase.co
      anonKey: "sb_publishable_QaQN1Wm0gWAXiU20s_BBlA_9fxBloLs" // Project Settings → API → anon public
    },

    emailjs: {
      publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
      serviceId: "YOUR_EMAILJS_SERVICE_ID",
      businessTemplateId: "YOUR_EMAILJS_BUSINESS_TEMPLATE_ID",
      // Optional — leave "" to skip sending the customer confirmation email
      customerTemplateId: "YOUR_EMAILJS_CUSTOMER_TEMPLATE_ID",
      businessEmail: "mf6742952@gmail.com"
    }
  };

  /* ------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------ */
  function waLink(message) {
    return "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(message);
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function isConfigured(value) { return typeof value === "string" && value.indexOf("YOUR_") !== 0 && value.trim() !== ""; }
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return iso; }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------------------------
     Default WhatsApp links (header, hero, floating, contact section)
     — unchanged from before
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
     Sticky header shadow on scroll — unchanged
     ------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
     Mobile hamburger menu — unchanged
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
      if (nav.classList.contains("is-open")) { closeNav(); } else { openNav(); }
    });
    $all("a", nav).forEach(function (link) { link.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ------------------------------------------------------------------
     Anchor focus for accessibility — unchanged
     ------------------------------------------------------------------ */
  function initAnchorFocus() {
    $all('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
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
     Service search + category filter — unchanged
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
    clearBtn.addEventListener("click", function () { input.value = ""; applyFilters(); input.focus(); });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        activeCategory = tab.getAttribute("data-filter");
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ------------------------------------------------------------------
     Dynamic WhatsApp message per service card "Enquire" link — unchanged
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
     FAQ accordion — unchanged
     ------------------------------------------------------------------ */
  function initAccordion() {
    $all(".accordion__item").forEach(function (item) {
      var trigger = item.querySelector(".accordion__trigger");
      var panel = item.querySelector(".accordion__panel");
      if (!trigger || !panel) return;
      panel.style.maxHeight = "0px";

      trigger.addEventListener("click", function () {
        var isOpen = trigger.getAttribute("aria-expanded") === "true";
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
     Scroll reveal — unchanged
     ------------------------------------------------------------------ */
  function initScrollReveal() {
    var items = $all(".reveal");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------
     Back to top button — unchanged
     ------------------------------------------------------------------ */
  function initBackToTop() {
    var btn = document.getElementById("backToTop");
    if (!btn) return;
    function toggle() { btn.hidden = window.scrollY < 500; }
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ------------------------------------------------------------------
     Generic field validation — unchanged
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

  /* ==================================================================
     BACKEND (Supabase + EmailJS)
     ================================================================== */
  var supabaseClient = null;
  var backendReady = false;
  var backendLoadFailed = false;
  var emailjsReady = false;

  function initBackend() {
    var supabaseConfigured = isConfigured(CONFIG.supabase.url) && isConfigured(CONFIG.supabase.anonKey);
    var emailConfigured = isConfigured(CONFIG.emailjs.publicKey) && isConfigured(CONFIG.emailjs.serviceId) && isConfigured(CONFIG.emailjs.businessTemplateId);

    if (!supabaseConfigured) {
      backendLoadFailed = true;
      console.warn("Suvidha: Supabase is not configured yet — see SETUP_INSTRUCTIONS.md. Forms will show a friendly error until this is done.");
      return Promise.resolve();
    }

    var scripts = ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"];
    if (emailConfigured) scripts.push("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js");

    return Promise.all(scripts.map(loadScript))
      .then(function () {
        supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
        backendReady = true;

        if (emailConfigured && window.emailjs) {
          window.emailjs.init({ publicKey: CONFIG.emailjs.publicKey });
          emailjsReady = true;
        }
      })
      .catch(function (err) {
        backendLoadFailed = true;
        console.error("Suvidha: could not load backend services.", err);
      });
  }

  function sendNotificationEmails(templateParams, customerEmail) {
    if (!emailjsReady) return;
    window.emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.businessTemplateId, templateParams)
      .catch(function (err) { console.warn("Suvidha: business notification email failed (enquiry is still saved).", err); });

    if (customerEmail && isConfigured(CONFIG.emailjs.customerTemplateId)) {
      var customerParams = Object.assign({}, templateParams, { to_email: customerEmail });
      window.emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.customerTemplateId, customerParams)
        .catch(function (err) { console.warn("Suvidha: customer confirmation email failed (enquiry is still saved).", err); });
    }
  }

  function backendUnavailableMessage() {
    return backendLoadFailed
      ? "Unable to submit your enquiry right now. Please try again, or contact us on WhatsApp."
      : "Still connecting — please wait a moment and press submit again.";
  }

  /* ------------------------------------------------------------------
     Submit button loading state
     ------------------------------------------------------------------ */
  function setSubmitting(btn, isSubmitting, idleLabel) {
    btn.disabled = isSubmitting;
    btn.textContent = isSubmitting ? "Submitting..." : idleLabel;
  }

  /* ------------------------------------------------------------------
     Build the success panel: enquiry number, copy button, WhatsApp,
     and a link to the Check Status section. Reuses the existing
     .form-send box already present in the HTML/CSS — no markup added.
     ------------------------------------------------------------------ */
  function showSuccess(opts) {
    // opts: { msgEl, sendBox, waBtn, copyBtn, enquiryNumber, waMessage }
    opts.msgEl.innerHTML =
      "&#10003; Your enquiry has been submitted successfully!<br>" +
      "Your Enquiry Number: <strong>" + opts.enquiryNumber + "</strong><br>" +
      "Please save this number for checking your enquiry status. " +
      '<a href="#check-status" id="goCheckStatus-' + opts.enquiryNumber + '">Check Status</a>';
    opts.msgEl.className = "form-msg is-success";

    opts.waBtn.textContent = "Message us on WhatsApp";
    opts.waBtn.setAttribute("href", waLink(opts.waMessage));

    opts.copyBtn.textContent = "Copy Enquiry Number";
    opts.copyBtn.setAttribute("href", "#");
    opts.copyBtn.onclick = function (e) {
      e.preventDefault();
      var restore = "Copy Enquiry Number";
      function done(label) {
        opts.copyBtn.textContent = label;
        setTimeout(function () { opts.copyBtn.textContent = restore; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(opts.enquiryNumber).then(function () { done("Copied!"); }, function () { done("Copy failed"); });
      } else {
        done("Copy not supported");
      }
    };

    opts.sendBox.hidden = false;

    var goLink = document.getElementById("goCheckStatus-" + opts.enquiryNumber);
    if (goLink) {
      goLink.addEventListener("click", function () {
        setTimeout(function () { prefillAndCheckStatus(opts.enquiryNumber); }, 450);
      });
    }
  }

  /* ------------------------------------------------------------------
     Online enquiry form
     ------------------------------------------------------------------ */
  function initEnquiryForm() {
    var form = document.getElementById("enquiryForm");
    if (!form) return;

    var msg = document.getElementById("enquiryMsg");
    var sendBox = document.getElementById("enquirySend");
    var submitBtn = document.getElementById("enquirySubmitBtn");
    var waBtn = document.getElementById("enquirySendWhatsapp");
    var copyBtn = document.getElementById("enquirySendEmail");

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
      if (!ok) { msg.textContent = "Please fix the highlighted fields above."; msg.classList.add("is-error"); return; }

      if (!backendReady) { msg.textContent = backendUnavailableMessage(); msg.classList.add("is-error"); return; }

      var fileInput = document.getElementById("eFile");
      var fileName = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : null;

      setSubmitting(submitBtn, true, "Submit Enquiry");

      supabaseClient.rpc("submit_online_enquiry", {
        p_name: name.value.trim(),
        p_mobile: mobile.value.trim(),
        p_email: email.value.trim() || null,
        p_service: service.value,
        p_message: message.value.trim(),
        p_attachment_name: fileName
      }).then(function (res) {
        setSubmitting(submitBtn, false, "Submit Enquiry");

        if (res.error || !res.data) {
  console.error("Suvidha: submit_online_enquiry failed", res.error);

  msg.textContent = res.error
    ? "Supabase Error: " + res.error.message
    : "Supabase returned no enquiry number.";

  msg.className = "form-msg is-error";
  return;
        }

        var enquiryNumber = res.data;

        sendNotificationEmails({
          to_email: CONFIG.emailjs.businessEmail,
          enquiry_number: enquiryNumber,
          date: formatDate(new Date().toISOString()),
          name: name.value.trim(),
          mobile: mobile.value.trim(),
          email: email.value.trim() || "-",
          service: service.value,
          message: message.value.trim(),
          attachment: fileName || "-",
          type_label: "Online Enquiry"
        }, email.value.trim() || null);
 
        showSuccess({
          msgEl: msg, sendBox: sendBox, waBtn: waBtn, copyBtn: copyBtn,
          enquiryNumber: enquiryNumber,
          waMessage: "Hello, my Suvidha enquiry number is " + enquiryNumber + ". I'd like to follow up."
        });
 
        form.reset();
      }).catch(function (err) {
        setSubmitting(submitBtn, false, "Submit Enquiry");
        console.error("Suvidha: network error submitting enquiry", err);
        msg.textContent = "Unable to submit your enquiry right now. Please try again.";
        msg.className = "form-msg is-error";
      });
    });
  }
 
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
    var copyBtn = document.getElementById("repairSendEmail");
 
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
      if (!ok) { msg.textContent = "Please fix the highlighted fields above."; msg.classList.add("is-error"); return; }
 
      if (!backendReady) { msg.textContent = backendUnavailableMessage(); msg.classList.add("is-error"); return; }
 
      var brand = document.getElementById("rBrand").value.trim();
      var model = document.getElementById("rModel").value.trim();
      var contactMethod = document.getElementById("rContact").value;
 
      setSubmitting(submitBtn, true, "Send Repair Enquiry");
 
      supabaseClient.rpc("submit_repair_enquiry", {
        p_name: name.value.trim(),
        p_mobile: mobile.value.trim(),
        p_brand: brand || null,
        p_model: model || null,
        p_problem: problem.value,
        p_description: desc.value.trim(),
        p_preferred_contact: contactMethod
      }).then(function (res) {
        setSubmitting(submitBtn, false, "Send Repair Enquiry");
 
        if (res.error || !res.data) {
          console.error("Suvidha: submit_repair_enquiry failed", res.error);
          msg.textContent = "Unable to submit your enquiry right now. Please try again.";
          msg.className = "form-msg is-error";
          return;
        }
 
        var enquiryNumber = res.data;
 
        sendNotificationEmails({
          to_email: CONFIG.emailjs.businessEmail,
          enquiry_number: enquiryNumber,
          date: formatDate(new Date().toISOString()),
          name: name.value.trim(),
          mobile: mobile.value.trim(),
          email: "-",
          service: brand + " " + model,
          message: "Problem: " + problem.value + " | " + desc.value.trim() + " | Preferred contact: " + contactMethod,
          attachment: "-",
          type_label: "Mobile Repair Enquiry"
        }, null);
 
        showSuccess({
          msgEl: msg, sendBox: sendBox, waBtn: waBtn, copyBtn: copyBtn,
          enquiryNumber: enquiryNumber,
          waMessage: "Hello, my Suvidha Mobile Care enquiry number is " + enquiryNumber + ". I'd like to follow up."
        });
 
        form.reset();
      }).catch(function (err) {
        setSubmitting(submitBtn, false, "Send Repair Enquiry");
        console.error("Suvidha: network error submitting repair enquiry", err);
        msg.textContent = "Unable to submit your enquiry right now. Please try again.";
        msg.className = "form-msg is-error";
      });
    });
  }
 
  /* ==================================================================
     CHECK ENQUIRY STATUS — built entirely in JS so index.html and
     style.css stay untouched. Reuses existing classes only
     (.section, .container, .section-head, .form-card, .field,
     .btn, .form-send, .form-msg) so it visually matches the rest
     of the site automatically.
     ================================================================== */
  var statusElements = null;
 
  function buildStatusSection() {
    var anchor = document.getElementById("online-enquiry");
    if (!anchor) return null;
 
    var section = document.createElement("section");
    section.className = "section";
    section.id = "check-status";
 
    section.innerHTML =
      '<div class="container">' +
        '<div class="section-head reveal is-visible">' +
          '<p class="eyebrow"><span class="dot"></span>Track Your Request</p>' +
          '<h2>Check Enquiry Status</h2>' +
          '<p class="section-head__subtitle">Enter the enquiry number you received after submitting a form.</p>' +
        '</div>' +
        '<div class="form-card reveal is-visible">' +
          '<form id="statusForm" novalidate>' +
            '<div class="field">' +
              '<label for="statusNumber">Enter Enquiry Number <span class="req">*</span></label>' +
              '<input type="text" id="statusNumber" name="statusNumber" placeholder="SSK-20260817-0042" autocomplete="off">' +
              '<span class="field__error" id="statusNumber-error"></span>' +
            '</div>' +
            '<button type="submit" class="btn btn--primary btn--block" id="statusSubmitBtn">Check Status</button>' +
            '<p class="form-msg" id="statusMsg" role="status" aria-live="polite"></p>' +
            '<div class="form-send" id="statusResult" hidden></div>' +
          '</form>' +
        '</div>' +
      '</div>';

    anchor.insertAdjacentElement("afterend", section);
    return {
      form: document.getElementById("statusForm"),
      input: document.getElementById("statusNumber"),
      submitBtn: document.getElementById("statusSubmitBtn"),
      msg: document.getElementById("statusMsg"),
      result: document.getElementById("statusResult")
    };
  }
 
  function renderStatusResult(container, row) {
    var typeLabel = row.type === "mobile_repair" ? "Suvidha Mobile Care" : "Suvidha Online Seva Kendra";
    var serviceLabel = row.type === "mobile_repair" ? (row.problem || "-") : (row.service || "-");
    container.innerHTML =
      "<p><strong>Enquiry Number:</strong> " + row.enquiry_number + "</p>" +
      "<p><strong>Division:</strong> " + typeLabel + "</p>" +
      "<p><strong>Service / Issue:</strong> " + serviceLabel + "</p>" +
      "<p><strong>Submitted:</strong> " + formatDate(row.created_at) + "</p>" +
      "<p><strong>Current Status:</strong> " + row.status + "</p>" +
      "<p><strong>Last Updated:</strong> " + formatDate(row.updated_at) + "</p>" +
      "<p><strong>Update:</strong> " + (row.admin_message ? row.admin_message : "No additional update yet.") + "</p>";
    container.hidden = false;
  }
 
  function runStatusCheck(enquiryNumber) {
    if (!statusElements) return;
    var els = statusElements;
    els.result.hidden = true;
    els.msg.className = "form-msg";
 
    var value = (enquiryNumber || els.input.value).trim();
    if (value === "") {
      els.msg.textContent = "Please enter your enquiry number.";
      els.msg.classList.add("is-error");
      return;
    }
    if (!backendReady) {
      els.msg.textContent = backendUnavailableMessage();
      els.msg.classList.add("is-error");
      return;
    }
 
    els.submitBtn.disabled = true;
    els.submitBtn.textContent = "Checking...";
    els.msg.textContent = "";
 
    supabaseClient.rpc("get_enquiry_status", { p_enquiry_number: value })
      .then(function (res) {
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = "Check Status";
 
        if (res.error) {
  console.error("Suvidha: get_enquiry_status failed", res.error);
  els.msg.textContent = "Supabase Error: " + res.error.message;
  els.msg.classList.add("is-error");
  return;
        }
        if (!res.data || res.data.length === 0) {
          els.msg.textContent = "Enquiry not found. Please check your enquiry number.";
          els.msg.classList.add("is-error");
          return;
        }
 
        els.msg.textContent = "";
        renderStatusResult(els.result, res.data);
      })
      .catch(function (err) {
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = "Check Status";
        console.error("Suvidha: network error checking status", err);
        els.msg.textContent = "Unable to check status right now. Please try again.";
        els.msg.classList.add("is-error");
      });
  }
 
  function prefillAndCheckStatus(enquiryNumber) {
    if (!statusElements) return;
    statusElements.input.value = enquiryNumber;
    runStatusCheck(enquiryNumber);
  }
 
  function initStatusChecker() {
    statusElements = buildStatusSection();
    if (!statusElements) return;
    statusElements.form.addEventListener("submit", function (e) {
      e.preventDefault();
      runStatusCheck();
    });
  }
 
  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    // Existing UI behaviour — runs immediately, no backend dependency
    setDefaultWhatsappLinks();
    initHeaderScroll();
    initMobileNav();
    initAnchorFocus();
    initServiceSearch();
    initServiceCardLinks();
    initAccordion();
    initScrollReveal();
    initBackToTop();
 
    // New: build the status-check section right away so #check-status
    // exists and links to it work, even while the backend is loading.
    initStatusChecker();
 
    // New: wire the two forms up now (they will show a friendly message
    // if someone submits before the backend finishes loading).
    initEnquiryForm();
    initRepairForm();
 
    // Load Supabase / EmailJS in the background, then enable submission.
    initBackend();
  });
})();
     
