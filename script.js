"use strict";

(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  root.classList.add("js");

  /* CURRENT YEAR */
  document.querySelectorAll("[data-current-year]").forEach((item) => {
    item.textContent = new Date().getFullYear();
  });

  /* MOBILE NAVIGATION */
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#primary-navigation");
  const mobileBreakpoint = window.matchMedia("(max-width: 960px)");

  if (menuButton && navigation) {
    menuButton.hidden = false;

    const closeMenu = (restoreFocus = false) => {
      navigation.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");

      if (restoreFocus) menuButton.focus();
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMenu();
        return;
      }

      navigation.classList.add("is-open");
      document.body.classList.add("menu-open");
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "Close navigation");
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("click", (event) => {
      if (
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!navigation.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = [
        menuButton,
        ...navigation.querySelectorAll("a[href], button:not([disabled])")
      ].filter((item) => item.getClientRects().length);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    mobileBreakpoint.addEventListener("change", () => closeMenu());
  }

  /* HEADER SHADOW & BACK TO TOP */
  const header = document.querySelector(".site-header");
  const backToTop = document.querySelector(".back-to-top");
  let scrollScheduled = false;

  const updateScrollState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 20);

    if (backToTop) {
      backToTop.hidden = window.scrollY < 600;
    }

    scrollScheduled = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(updateScrollState);
    },
    { passive: true }
  );

  updateScrollState();

  /* SCROLL REVEALS */
  const revealElements = document.querySelectorAll("[data-reveal]");
  let revealObserver;

  const showAllContent = () => {
    revealObserver?.disconnect();

    revealElements.forEach((element) => {
      element.classList.remove("reveal-ready");
      element.classList.add("is-visible");
    });
  };

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -24px 0px"
      }
    );

    revealElements.forEach((element) => {
      /* Don't conceal content within deliberately hidden sections. */
      if (element.closest("[hidden]")) return;

      const bounds = element.getBoundingClientRect();

      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        element.classList.add("is-visible");
      } else {
        element.classList.add("reveal-ready");
        revealObserver.observe(element);
      }
    });
  } else {
    showAllContent();
  }

  /* SUBTLE 3D CARD TILT */
  const tiltElements = document.querySelectorAll("[data-tilt]");
  const resetTilt = () => {
    tiltElements.forEach((element) => {
      element.style.transform = "";
    });
  };

  tiltElements.forEach((element) => {
    let frame = 0;

    element.addEventListener("pointermove", (event) => {
      if (
        !finePointer.matches ||
        reducedMotion.matches ||
        event.pointerType !== "mouse"
      ) {
        return;
      }

      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        element.style.transform =
          `perspective(1100px) rotateX(${-y * 5}deg) ` +
          `rotateY(${x * 5}deg) translateY(-2px)`;
      });
    });

    element.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      element.style.transform = "";
    });

    element.addEventListener("focusin", () => {
      cancelAnimationFrame(frame);
      element.style.transform = "";
    });
  });

  /* CUSTOM CURSOR ACCENT */
  const cursor = document.querySelector(".custom-cursor");

  const updateCursorAvailability = () => {
    if (!cursor) return;

    cursor.hidden = !finePointer.matches || reducedMotion.matches;

    if (cursor.hidden) {
      cursor.classList.remove("is-visible", "is-link");
    }
  };

  if (cursor) {
    updateCursorAvailability();

    let cursorFrame = 0;

    document.addEventListener(
      "pointermove",
      (event) => {
        if (cursor.hidden || event.pointerType !== "mouse") return;

        cancelAnimationFrame(cursorFrame);

        cursorFrame = requestAnimationFrame(() => {
          cursor.style.transform =
            `translate3d(${event.clientX - 20}px, ` +
            `${event.clientY - 20}px, 0)`;

          cursor.classList.add("is-visible");

          const target =
            event.target instanceof Element ? event.target : null;

          cursor.classList.toggle(
            "is-link",
            Boolean(target?.closest("a, button, summary"))
          );

          /* Keep the accent away from typing controls. */
          if (target?.closest("input, select, textarea")) {
            cursor.classList.remove("is-visible");
          }
        });
      },
      { passive: true }
    );

    document.documentElement.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-visible");
    });

    window.addEventListener("blur", () => {
      cursor.classList.remove("is-visible");
    });
  }

  /* CINEMATIC HERO VIDEO */
  const video = document.querySelector("#hero-video");
  const videoButton = document.querySelector(".video-control");

  if (video) {
    let userPaused = false;
    let heroInView = true;
    let playPending = false;

    video.muted = true;
    video.defaultMuted = true;

    const syncVideoButton = () => {
      if (!videoButton) return;

      videoButton.hidden = reducedMotion.matches || Boolean(video.error);

      const paused = video.paused;
      const label = videoButton.querySelector(".video-control__label");
      const icon = videoButton.querySelector(".video-control__icon");

      videoButton.setAttribute(
        "aria-label",
        paused ? "Play background video" : "Pause background video"
      );

      if (label) {
        label.textContent = paused ? "Play motion" : "Pause motion";
      }

      if (icon) {
        icon.textContent = paused ? "▶" : "Ⅱ";
      }
    };

    const playVideo = async () => {
      if (
        playPending ||
        userPaused ||
        reducedMotion.matches ||
        document.hidden ||
        !heroInView ||
        video.error
      ) {
        return;
      }

      playPending = true;

      try {
        await video.play();

        if (
          userPaused ||
          reducedMotion.matches ||
          document.hidden ||
          !heroInView
        ) {
          video.pause();
        }
      } catch {
        /* Browser autoplay restrictions leave the poster visible. */
      } finally {
        playPending = false;
        syncVideoButton();
      }
    };

    video.addEventListener("playing", () => {
      video.classList.add("is-playing");
      syncVideoButton();
    });

    video.addEventListener("pause", syncVideoButton);

    video.addEventListener("error", () => {
      video.classList.remove("is-playing");
      syncVideoButton();
    });

    videoButton?.addEventListener("click", () => {
      if (video.paused) {
        userPaused = false;
        playVideo();
      } else {
        userPaused = true;
        video.pause();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        video.pause();
      } else {
        playVideo();
      }
    });

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          heroInView = entries[0].isIntersecting;

          if (heroInView) {
            playVideo();
          } else {
            video.pause();
          }
        },
        { threshold: 0.1 }
      );

      heroObserver.observe(video.closest(".hero") || video);
    }

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        video.pause();
        video.classList.remove("is-playing");
      } else {
        playVideo();
      }

      syncVideoButton();
    });

    syncVideoButton();
    playVideo();
  }

  /* PREFERENCE CHANGES */
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      showAllContent();
      resetTilt();
    }

    updateCursorAvailability();
  });

  finePointer.addEventListener("change", () => {
    resetTilt();
    updateCursorAvailability();
  });

  /* APPOINTMENT REQUEST FORM */
  const form = document.querySelector("#appointment-form");

  if (form) {
    const method = form.querySelector("#contact-method");
    const email = form.querySelector("#email-address");
    const phone = form.querySelector("#phone-number");
    const status = form.querySelector("#form-status");
    const submitButton = form.querySelector('[type="submit"]');
    const submitLabel = submitButton?.querySelector("span");

    const updateContactRequirements = () => {
      if (!method || !email || !phone) return;

      email.required = method.value === "email";
      phone.required = method.value === "phone";

      email.setCustomValidity("");
      phone.setCustomValidity("");

      const emailLabel = form.querySelector('label[for="email-address"]');
      const phoneLabel = form.querySelector('label[for="phone-number"]');

      if (emailLabel) {
        emailLabel.textContent =
          email.required ? "Email address *" : "Email address";
      }

      if (phoneLabel) {
        phoneLabel.textContent =
          phone.required ? "Phone number *" : "Phone number";
      }
    };

    const showStatus = (message, type = "") => {
      if (!status) return;

      status.textContent = message;
      status.classList.remove("is-success", "is-error");

      if (type) status.classList.add(`is-${type}`);
    };

    method?.addEventListener("change", updateContactRequirements);
    updateContactRequirements();

    form.addEventListener("input", (event) => {
      const field = event.target;

      if (field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement) {
        field.setCustomValidity("");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      updateContactRequirements();
      showStatus("");

      /* Reject whitespace-only required text. */
      form.querySelectorAll("input[required], textarea[required]")
        .forEach((field) => {
          if (field.value && !field.value.trim()) {
            field.setCustomValidity("Please complete this field.");
          }
        });

      if (phone?.required && phone.value.trim()) {
        const digits = phone.value.replace(/\D/g, "");

        if (digits.length < 7 || digits.length > 15) {
          phone.setCustomValidity(
            "Please enter a phone number with 7 to 15 digits."
          );
        }
      }

      if (!form.reportValidity()) return;

      if (window.location.protocol === "file:") {
        showStatus(
          "Online requests become available after the website is " +
          "hosted. Please call +1 (416) 666-3486 or email " +
          "canadianhealthproviders@gmail.com.",
          "error"
        );
        return;
      }

      /*
        Explicitly enable this only after Netlify form detection
        is configured and a real submission has been verified.
        This prevents an unrelated server's generic 200 response
        from being mistaken for a delivered enquiry.
      */
      if (form.dataset.formReady !== "true") {
        showStatus(
          "Online requests are not available yet. Please call " +
          "+1 (416) 666-3486 or email " +
          "canadianhealthproviders@gmail.com.",
          "error"
        );
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Sending request…";

      form.setAttribute("aria-busy", "true");

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);

      try {
        const formData = new FormData(form);
        const body = new URLSearchParams();

        formData.forEach((value, key) => {
          if (typeof value === "string") {
            body.append(key, value.trim());
          }
        });

        const response = await fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body.toString(),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Submission was not accepted.");
        }

        form.reset();
        updateContactRequirements();

        showStatus(
          "Your appointment request has been received. Our team " +
          "will contact you to confirm availability.",
          "success"
        );
      } catch (error) {
        const message = error.name === "AbortError"
          ? "We couldn’t confirm whether your request was received. " +
            "Please contact the clinic before sending it again."
          : "We couldn’t confirm delivery of your request. Please " +
            "call +1 (416) 666-3486 or email " +
            "canadianhealthproviders@gmail.com.";

        showStatus(message, "error");
      } finally {
        window.clearTimeout(timeout);
        form.removeAttribute("aria-busy");

        if (submitButton) submitButton.disabled = false;
        if (submitLabel) {
          submitLabel.textContent = "Send appointment request";
        }
      }
    });
  }
})();
/* CINEMATIC OPENING SCREEN */
(() => {
  const opening = document.querySelector("#opening-screen");
  if (!opening) return;

  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (motionPreference.matches) return;

  let fallbackTimer;

  const finishOpening = () => {
    opening.hidden = true;
    document.body.classList.remove("intro-running");
    window.clearTimeout(fallbackTimer);
  };

  opening.hidden = false;
  document.body.classList.add("intro-running");

  opening.addEventListener("animationend", (event) => {
    if (
      event.target === opening &&
      event.animationName === "openingScreenExit"
    ) {
      finishOpening();
    }
  });

  /* Always reveal the page even if an animation is interrupted. */
  fallbackTimer = window.setTimeout(finishOpening, 3200);

  document.addEventListener("keydown", finishOpening, { once: true });
  document.addEventListener("pointerdown", finishOpening, { once: true });

  motionPreference.addEventListener("change", (event) => {
    if (event.matches) finishOpening();
  });
})();