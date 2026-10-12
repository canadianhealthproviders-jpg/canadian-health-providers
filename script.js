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
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });

    mobileBreakpoint.addEventListener("change", () => closeMenu());
  }

  /* HEADER & BACK TO TOP */
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
  const tiltFrames = new Map();

  const resetTilt = () => {
    tiltElements.forEach((element) => {
      cancelAnimationFrame(tiltFrames.get(element) || 0);
      element.style.transform = "";
    });
  };

  tiltElements.forEach((element) => {
    const clearTilt = () => {
      cancelAnimationFrame(tiltFrames.get(element) || 0);
      element.style.transform = "";
    };

    element.addEventListener("pointermove", (event) => {
      if (
        !finePointer.matches ||
        reducedMotion.matches ||
        event.pointerType !== "mouse"
      ) {
        return;
      }

      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      cancelAnimationFrame(tiltFrames.get(element) || 0);

      tiltFrames.set(
        element,
        requestAnimationFrame(() => {
          element.style.transform =
            `perspective(1100px) rotateX(${-y * 5}deg) ` +
            `rotateY(${x * 5}deg) translateY(-2px)`;
        })
      );
    });

    element.addEventListener("pointerleave", clearTilt);
    element.addEventListener("focusin", clearTilt);
  });

  /* STYLED CURSOR */
  const cursor = document.querySelector(".custom-cursor");
  let cursorEnabled = false;
  let cursorFrame = 0;
  let cursorVisible = false;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let cursorScale = 1;
  let desiredScale = 1;

  const hideCursor = () => {
    cursorVisible = false;
    cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
    cursor?.classList.remove("is-visible", "is-link");
  };

  const updateCursorAvailability = () => {
    if (!cursor) return;

    cursorEnabled = finePointer.matches && !reducedMotion.matches;
    cursor.hidden = !cursorEnabled;

    if (!cursorEnabled) hideCursor();
  };

  if (cursor) {
    /* Keep the normal arrow available alongside the accent. */
    Object.assign(cursor.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "40px",
      height: "40px",
      pointerEvents: "none",
      zIndex: "9999",
      willChange: "transform",
      transition: "opacity 180ms ease"
    });

    const ring = cursor.querySelector(".custom-cursor__ring");
    const dot = cursor.querySelector(".custom-cursor__dot");
    const arrow = cursor.querySelector("svg");

    if (ring) {
      Object.assign(ring.style, {
        borderColor: "rgba(0, 157, 234, 0.65)",
        boxShadow:
          "0 0 18px rgba(0, 157, 234, 0.25), " +
          "inset 0 0 12px rgba(0, 157, 234, 0.08)",
        background: "rgba(0, 157, 234, 0.04)"
      });
    }

    if (dot) {
      dot.style.background = "#009DEA";
      dot.style.boxShadow = "0 0 10px rgba(0,157,234,0.6)";
    }

    if (arrow) arrow.style.color = "#009DEA";

    const renderCursor = () => {
      if (!cursorEnabled || !cursorVisible) {
        cursorFrame = 0;
        return;
      }

      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      cursorScale += (desiredScale - cursorScale) * 0.18;

      cursor.style.transform =
        `translate3d(${currentX - 20}px, ${currentY - 20}px, 0) ` +
        `scale(${cursorScale})`;

      const settled =
        Math.abs(targetX - currentX) < 0.1 &&
        Math.abs(targetY - currentY) < 0.1 &&
        Math.abs(desiredScale - cursorScale) < 0.005;

      cursorFrame = settled ? 0 : requestAnimationFrame(renderCursor);
    };

    const queueCursor = () => {
      if (!cursorFrame) {
        cursorFrame = requestAnimationFrame(renderCursor);
      }
    };

    updateCursorAvailability();

    document.addEventListener(
      "pointermove",
      (event) => {
        if (!cursorEnabled || event.pointerType !== "mouse") return;

        const target =
          event.target instanceof Element ? event.target : null;

        if (target?.closest("input, select, textarea")) {
          hideCursor();
          return;
        }

        targetX = event.clientX;
        targetY = event.clientY;

        if (!cursorVisible) {
          currentX = targetX;
          currentY = targetY;
        }

        cursorVisible = true;
        cursor.classList.add("is-visible");

        const isLink = Boolean(target?.closest("a, button, summary"));
        cursor.classList.toggle("is-link", isLink);
        desiredScale = isLink ? 1.25 : 1;

        if (ring) {
          ring.style.borderColor = isLink
            ? "rgba(216, 11, 36, 0.7)"
            : "rgba(0, 157, 234, 0.65)";
        }

        if (arrow) {
          arrow.style.color = isLink ? "#D80B24" : "#009DEA";
        }

        queueCursor();
      },
      { passive: true }
    );

    /* Expanding click ripple */
    document.addEventListener("pointerdown", (event) => {
      if (
        !cursorEnabled ||
        event.pointerType !== "mouse" ||
        event.button !== 0
      ) {
        return;
      }

      const target =
        event.target instanceof Element ? event.target : null;

      if (target?.closest("input, select, textarea")) return;

      const ripple = document.createElement("span");
      ripple.setAttribute("aria-hidden", "true");

      Object.assign(ripple.style, {
        position: "fixed",
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        width: "24px",
        height: "24px",
        border: "1px solid rgba(0,157,234,0.8)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: "9998",
        boxShadow: "0 0 16px rgba(0,157,234,0.2)"
      });

      document.body.appendChild(ripple);

      if (typeof ripple.animate === "function") {
        const animation = ripple.animate(
          [
            {
              transform: "translate(-50%, -50%) scale(0.4)",
              opacity: 0.9
            },
            {
              transform: "translate(-50%, -50%) scale(3)",
              opacity: 0
            }
          ],
          {
            duration: 650,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)"
          }
        );

        animation.finished.then(
          () => ripple.remove(),
          () => ripple.remove()
        );
      }

      window.setTimeout(() => ripple.remove(), 750);
    });

    document.documentElement.addEventListener(
      "pointerleave",
      hideCursor
    );

    window.addEventListener("blur", hideCursor);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hideCursor();
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
        /* Keep the poster visible if autoplay is blocked. */
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

  /* MOTION PREFERENCES */
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
    let submitting = false;

    const updateContactRequirements = () => {
      if (!method || !email || !phone) return;

      email.required = method.value === "email";
      phone.required = method.value === "phone";

      email.setCustomValidity("");
      phone.setCustomValidity("");

      const emailLabel = form.querySelector(
        'label[for="email-address"]'
      );
      const phoneLabel = form.querySelector(
        'label[for="phone-number"]'
      );

      if (emailLabel) {
        emailLabel.textContent = email.required
          ? "Email address *"
          : "Email address";
      }

      if (phoneLabel) {
        phoneLabel.textContent = phone.required
          ? "Phone number *"
          : "Phone number";
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

      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      ) {
        field.setCustomValidity("");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (submitting) return;

      updateContactRequirements();
      showStatus("");

      form
        .querySelectorAll("input[required], textarea[required]")
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
          "Please use the live website to send your request. " +
          "You can also call +1 (416) 752-7434 or email " +
          "canadianhealthproviders@gmail.com.",
          "error"
        );
        return;
      }

      if (form.dataset.formReady !== "true") {
        showStatus(
          "Online requests are not available yet. Please call " +
          "+1 (416) 752-7434 or email " +
          "canadianhealthproviders@gmail.com.",
          "error"
        );
        return;
      }

      submitting = true;

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Sending request…";

      form.setAttribute("aria-busy", "true");

      const controller = new AbortController();
      const timeout = window.setTimeout(
        () => controller.abort(),
        20000
      );

      try {
        const formData = new FormData(form);
        const body = new URLSearchParams();

        formData.forEach((value, key) => {
          if (typeof value === "string") {
            body.append(key, value.trim());
          }
        });

        const response = await fetch(form.action, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
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
        const message = error?.name === "AbortError"
          ? "We couldn’t confirm whether your request was received. " +
            "Please call +1 (416) 752-7434 before sending it again."
          : "We couldn’t confirm delivery of your request. Please " +
            "call +1 (416) 752-7434 or email " +
            "canadianhealthproviders@gmail.com.";

        showStatus(message, "error");
      } finally {
        window.clearTimeout(timeout);
        form.removeAttribute("aria-busy");
        submitting = false;

        if (submitButton) submitButton.disabled = false;

        if (submitLabel) {
          submitLabel.textContent = "Send appointment request";
        }
      }
    });
  }

  /* CINEMATIC LOGO OPENING */
  const opening = document.querySelector("#opening-screen");

  if (opening) {
    const logo = opening.querySelector(".opening-screen__logo");
    const name = opening.querySelector(".opening-screen__name");
    const line = opening.querySelector(".opening-screen__line");
    const animations = [];
    let finished = false;
    let fallbackTimer;

    const finishOpening = () => {
      if (finished) return;
      finished = true;

      opening.hidden = true;
      document.body.classList.remove("intro-running");
      window.clearTimeout(fallbackTimer);

      animations.forEach((animation) => animation.cancel());

      document.removeEventListener("keydown", skipOpening);
      document.removeEventListener("pointerdown", skipOpening);
    };

    const skipOpening = () => finishOpening();

    if (reducedMotion.matches) {
      opening.hidden = true;
    } else {
      opening.hidden = false;
      document.body.classList.add("intro-running");

      /*
       * JavaScript controls this sequence, avoiding overlap
       * with the previous CSS opening animations.
       */
      opening.style.animation = "none";
      opening.style.perspective = "1000px";

      [logo, name, line].forEach((element) => {
        if (element) element.style.animation = "none";
      });

      const animateElement = (element, frames, options) => {
        if (!element || typeof element.animate !== "function") return;

        const animation = element.animate(frames, options);
        animations.push(animation);
        return animation;
      };

      try {
        /* Logo emerges with depth, then settles. */
        animateElement(
          logo,
          [
            {
              opacity: 0,
              transform:
                "translateY(24px) rotateX(18deg) scale(0.82)",
              filter: "blur(10px)"
            },
            {
              opacity: 1,
              transform:
                "translateY(-4px) rotateX(-3deg) scale(1.03)",
              filter: "blur(0px)",
              offset: 0.75
            },
            {
              opacity: 1,
              transform: "translateY(0) rotateX(0) scale(1)",
              filter: "blur(0px)"
            }
          ],
          {
            duration: 1000,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both"
          }
        );

        /* Brand name rises beneath the logo. */
        animateElement(
          name,
          [
            {
              opacity: 0,
              transform: "translateY(16px)",
              filter: "blur(4px)"
            },
            {
              opacity: 1,
              transform: "translateY(0)",
              filter: "blur(0px)"
            }
          ],
          {
            duration: 700,
            delay: 350,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both"
          }
        );

        if (line) line.style.transformOrigin = "center";

        animateElement(
          line,
          [
            { opacity: 0, transform: "scaleX(0)" },
            { opacity: 1, transform: "scaleX(1)" }
          ],
          {
            duration: 900,
            delay: 600,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both"
          }
        );

        /* Opening gently lifts away to reveal the hero. */
        const exitAnimation = animateElement(
          opening,
          [
            {
              opacity: 1,
              transform: "translateY(0) scale(1)"
            },
            {
              opacity: 0,
              transform: "translateY(-28px) scale(1.025)"
            }
          ],
          {
            duration: 700,
            delay: 2000,
            easing: "cubic-bezier(0.76, 0, 0.24, 1)",
            fill: "forwards"
          }
        );

        exitAnimation?.finished.then(
          finishOpening,
          finishOpening
        );
      } catch {
        finishOpening();
      }

      if (!finished) {
        fallbackTimer = window.setTimeout(finishOpening, 3200);

        document.addEventListener("keydown", skipOpening);
        document.addEventListener("pointerdown", skipOpening);
      }

      reducedMotion.addEventListener("change", (event) => {
        if (event.matches) finishOpening();
      });
    }
  }
})();