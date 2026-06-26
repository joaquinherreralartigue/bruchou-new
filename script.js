(() => {
  const PRACTICE_TRANSITION_KEY = "practice-page-transition";
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function getGsapRuntime() {
    if (!window.gsap || !window.Flip) {
      return null;
    }

    const globals = typeof window.gsap.core?.globals === "function" ? window.gsap.core.globals() : {};

    if (!globals.Flip) {
      window.gsap.registerPlugin(window.Flip);
    }

    return { gsap: window.gsap, Flip: window.Flip };
  }

  function shouldBypassNavigation(event, link) {
    return (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank"
    );
  }

  function getPracticeHeroHeight() {
    if (window.matchMedia("(max-width: 720px)").matches) {
      return 640;
    }

    if (window.matchMedia("(max-width: 1024px)").matches) {
      return 700;
    }

    return 780;
  }

  function writePracticeTransition(payload) {
    try {
      window.sessionStorage.setItem(PRACTICE_TRANSITION_KEY, JSON.stringify(payload));
    } catch (_error) {
      // Ignore storage errors and fall back to a plain navigation.
    }
  }

  function readPracticeTransition(expectedPathname) {
    try {
      const raw = window.sessionStorage.getItem(PRACTICE_TRANSITION_KEY);

      if (!raw) {
        return null;
      }

      const payload = JSON.parse(raw);

      if (
        !payload ||
        typeof payload !== "object" ||
        payload.destination !== expectedPathname ||
        typeof payload.timestamp !== "number" ||
        Date.now() - payload.timestamp > 5000
      ) {
        window.sessionStorage.removeItem(PRACTICE_TRANSITION_KEY);
        return null;
      }

      return payload;
    } catch (_error) {
      return null;
    }
  }

  function clearPracticeTransition() {
    try {
      window.sessionStorage.removeItem(PRACTICE_TRANSITION_KEY);
    } catch (_error) {
      // Ignore storage errors.
    }
  }

  function setFixedRect(node, rect) {
    node.style.top = `${rect.top}px`;
    node.style.left = `${rect.left}px`;
    node.style.width = `${rect.width}px`;
    node.style.height = `${rect.height}px`;
  }

  function stripRevealState(node) {
    [...node.classList].forEach((className) => {
      if (className === "reveal" || className === "is-visible" || className.startsWith("reveal--")) {
        node.classList.remove(className);
      }
    });

    node.style.removeProperty("--reveal-delay");
  }

  function createPracticeTransitionGhost(sourceNode, variantClass) {
    const ghost = sourceNode.cloneNode(true);

    ghost.classList.add("practice-transition-ghost");

    if (variantClass) {
      ghost.classList.add(variantClass);
    }

    ghost.querySelectorAll(".reveal").forEach((node) => {
      stripRevealState(node);
    });

    return ghost;
  }

  function animatePracticeContentIntro({ gsap, header, items, delay = 0 }) {
    if (header) {
      gsap.set(header, { autoAlpha: 0, y: -24 });
    }

    if (items.length > 0) {
      gsap.set(items, { autoAlpha: 0, y: 28 });
    }

    const timeline = gsap.timeline({ delay });

    if (header) {
      timeline.to(header, {
        autoAlpha: 1,
        y: 0,
        duration: 0.48,
        ease: "power2.out",
      });
    }

    if (items.length > 0) {
      timeline.to(
        items,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.08,
          ease: "power3.out",
        },
        header ? "-=0.16" : 0,
      );
    }
  }

  function hoistGlobalChrome() {
    const page = document.querySelector(".page");
    const hero = document.querySelector(".hero");
    const header = document.querySelector("[data-site-header]");
    const menuLayer = document.querySelector("[data-mega-menu-layer]");

    if (!page || !hero) {
      return;
    }

    if (header && header.parentElement === hero) {
      page.insertBefore(header, hero);
    }

    if (menuLayer && menuLayer.parentElement === hero) {
      page.insertBefore(menuLayer, hero);
    }
  }

  function setupRevealAnimations() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const revealGroups = [
      { selector: ".hero__copy", variant: "reveal--hero" },
      { selector: ".hero__caption", variant: "reveal--sweep" },
      { selector: ".newsfeed", variant: "reveal--ticker" },
      { selector: ".home-cta .eyebrow", variant: "reveal--sweep" },
      { selector: ".home-cta__copy", variant: "reveal--hero" },
      { selector: ".search-card", variant: "reveal--panel" },
      { selector: ".timeline__content", variant: "reveal--hero" },
      { selector: ".editorial-point", variant: "reveal--card" },
      { selector: ".directory__content", variant: "reveal--hero" },
      { selector: ".sector-card", variant: "reveal--card" },
      { selector: ".work-model__intro", variant: "reveal--hero" },
      { selector: ".work-model__point", variant: "reveal--card" },
      { selector: ".case-study__shell > .section-label", variant: "reveal--sweep" },
      { selector: ".case-study__intro", variant: "reveal--hero" },
      { selector: ".matter-grid", variant: "reveal--panel" },
      { selector: ".insights__intro", variant: "reveal--hero" },
      { selector: ".insight", variant: "reveal--card" },
      { selector: ".awards__copy", variant: "reveal--hero" },
      { selector: ".award", variant: "reveal--card" },
      { selector: ".footer__topline", variant: "reveal--sweep" },
      { selector: ".footer__column", variant: "reveal--column" },
      { selector: ".footer__newsletter", variant: "reveal--panel" },
      { selector: ".footer__bottom-shell", variant: "reveal--sweep" },
    ];
    const seen = new Set();
    const revealNodes = [];
    const revealNode = (node) => {
      node.classList.add("is-visible");
    };

    revealGroups.forEach(({ selector, variant }) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (seen.has(node)) {
          return;
        }

        seen.add(node);
        revealNodes.push({ node, variant });
      });
    });

    revealNodes.forEach(({ node, variant }, index) => {
      const delay = `${Math.min((index % 5) * 95, 380)}ms`;

      node.classList.add("reveal");
      if (variant) {
        node.classList.add(variant);
      }
      node.style.setProperty("--reveal-delay", delay);
    });

    if (revealNodes.length === 0) {
      return;
    }

    if (reduceMotion) {
      revealNodes.forEach(({ node }) => revealNode(node));
      return;
    }

    root.classList.add("has-reveal-motion");
    let observer = null;
    let fallbackBound = false;

    function cleanupFallbackListeners() {
      if (!fallbackBound) {
        return;
      }

      window.removeEventListener("scroll", revealInViewNodes);
      window.removeEventListener("resize", revealInViewNodes);
      fallbackBound = false;
    }

    function revealInViewNodes() {
      revealNodes.forEach(({ node }) => {
        if (node.classList.contains("is-visible")) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const nearPageEnd =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
        const inView = rect.top <= window.innerHeight * 0.92 || nearPageEnd;

        if (inView) {
          revealNode(node);
          observer?.unobserve(node);
        }
      });

      if (revealNodes.every(({ node }) => node.classList.contains("is-visible"))) {
        cleanupFallbackListeners();
      }
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            revealNode(entry.target);
            observer?.unobserve(entry.target);
          });
        },
        {
          rootMargin: "0px 0px -12% 0px",
          threshold: 0.16,
        },
      );

      revealNodes.forEach(({ node }) => observer.observe(node));
    }

    window.addEventListener("scroll", revealInViewNodes, { passive: true });
    window.addEventListener("resize", revealInViewNodes);
    fallbackBound = true;

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(revealInViewNodes);
    } else {
      window.setTimeout(revealInViewNodes, 0);
    }
    window.addEventListener("load", revealInViewNodes, { once: true });
    window.setTimeout(revealInViewNodes, 240);
  }

  function setupNewsTicker() {
    const tickers = document.querySelectorAll("[data-news-ticker]");

    tickers.forEach((ticker) => {
      const track = ticker.querySelector(".newsfeed__track");
      const items = ticker.querySelector(".newsfeed__items");

      if (!track || !items || track.querySelector("[data-ticker-clone]")) {
        return;
      }

      const clone = items.cloneNode(true);

      clone.dataset.tickerClone = "true";
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  }

  function setupMegaMenus() {
    const layer = document.querySelector("[data-mega-menu-layer]");
    const triggers = Array.from(document.querySelectorAll("[data-menu-trigger]"));
    const panels = new Map(
      Array.from(document.querySelectorAll("[data-menu-panel]")).map((panel) => [
        panel.dataset.menuPanel,
        panel,
      ]),
    );

    if (!layer || triggers.length === 0 || panels.size === 0) {
      return;
    }

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let activeKey = null;
    let closeTimer = null;

    function syncHeaderTheme() {
      window.dispatchEvent(new Event("header-theme-sync"));
    }

    function syncTriggers() {
      triggers.forEach((trigger) => {
        const isOpen = trigger.dataset.menuTrigger === activeKey;

        trigger.classList.toggle("is-menu-open", isOpen);
        trigger.setAttribute("aria-expanded", String(isOpen));
      });
    }

    function finalizeClose() {
      if (activeKey) {
        return;
      }

      panels.forEach((panel) => {
        panel.hidden = true;
        panel.classList.remove("is-open");
      });
      layer.hidden = true;
    }

    function closeMenus({ restoreFocus = false } = {}) {
      if (!activeKey) {
        return;
      }

      const previousKey = activeKey;
      const previousTrigger = triggers.find((trigger) => trigger.dataset.menuTrigger === previousKey);

      activeKey = null;
      document.body.classList.remove("has-open-menu");
      syncTriggers();
      syncHeaderTheme();

      panels.forEach((panel) => {
        panel.classList.remove("is-open");
      });

      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(finalizeClose, 320);

      if (restoreFocus) {
        previousTrigger?.focus();
      }
    }

    function openMenu(key, { focusPanel = false } = {}) {
      const nextPanel = panels.get(key);

      if (!nextPanel) {
        return;
      }

      if (activeKey === key) {
        closeMenus({ restoreFocus: true });
        return;
      }

      window.clearTimeout(closeTimer);
      layer.hidden = false;
      document.body.classList.add("has-open-menu");

      panels.forEach((panel, panelKey) => {
        if (panelKey !== key) {
          panel.classList.remove("is-open");
          panel.hidden = true;
        }
      });

      activeKey = key;
      syncTriggers();
      syncHeaderTheme();

      nextPanel.hidden = false;

      requestAnimationFrame(() => {
        nextPanel.classList.add("is-open");
      });

      if (focusPanel) {
        window.setTimeout(() => {
          nextPanel.querySelector(focusableSelector)?.focus();
        }, 180);
      }
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        openMenu(trigger.dataset.menuTrigger);
      });
    });

    layer.addEventListener("click", (event) => {
      const closeTarget = event.target.closest("[data-menu-close]");

      if (closeTarget) {
        event.preventDefault();
        closeMenus();
        return;
      }

      const link = event.target.closest("a[href]");

      if (link) {
        closeMenus();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenus({ restoreFocus: true });
      }
    });
  }

  function setupStickyHeaders() {
    const headers = document.querySelectorAll("[data-site-header]");
    const themedSections = Array.from(document.querySelectorAll("[data-header-theme]"));

    if (headers.length === 0) {
      return;
    }

    headers.forEach((header) => {
      const brandLogo = header.querySelector("[data-header-logo]");
      const navArrows = header.querySelectorAll("[data-header-arrow]");
      const assistantIcon = header.querySelector("[data-header-assistant-icon]");

      function setTheme(theme) {
        const nextTheme = theme === "light" ? "light" : "dark";

        if (header.dataset.currentTheme === nextTheme) {
          return;
        }

        header.dataset.currentTheme = nextTheme;
        header.classList.toggle("site-header--light", nextTheme === "light");
        header.classList.toggle("site-header--dark", nextTheme === "dark");

        if (brandLogo) {
          brandLogo.src =
            nextTheme === "light" ? "./assets/logo-dark.svg" : "./assets/logo-white.svg";
        }

        navArrows.forEach((arrow) => {
          arrow.src =
            nextTheme === "light" ? "./assets/nav-arrow-dark.svg" : "./assets/nav-arrow.svg";
        });

        if (assistantIcon) {
          assistantIcon.src =
            nextTheme === "light" ? "./assets/ai-icon-dark.svg" : "./assets/ai-icon-light.svg";
        }
      }

      function getActiveTheme() {
        if (document.body.classList.contains("has-open-menu")) {
          return "light";
        }

        if (themedSections.length === 0) {
          return header.classList.contains("site-header--light") ? "light" : "dark";
        }

        const probeY = Math.min(header.offsetHeight * 0.72, 72);
        const activeSection =
          themedSections.find((section) => {
            const rect = section.getBoundingClientRect();
            return rect.top <= probeY && rect.bottom > probeY;
          }) ||
          [...themedSections].reverse().find((section) => section.getBoundingClientRect().top <= probeY) ||
          themedSections[0];

        return activeSection?.dataset.headerTheme || "dark";
      }

      function updateTheme() {
        setTheme(getActiveTheme());
      }

      updateTheme();
      window.addEventListener("scroll", updateTheme, { passive: true });
      window.addEventListener("resize", updateTheme);
      window.addEventListener("header-theme-sync", updateTheme);
    });
  }

  function setupSectionScenes() {
    if (reduceMotionQuery.matches) {
      return;
    }

    const sceneDefinitions = [
      { section: ".hero", content: [".hero__canvas", ".newsfeed"] },
      { section: ".home-cta", content: [".eyebrow", ".home-cta__layout"] },
      { section: ".timeline--work", content: [".timeline__content"] },
      { section: ".directory", content: [".directory__shell"] },
      { section: ".work-model", content: [".work-model__shell"] },
      { section: ".case-study", content: [".case-study__shell"] },
      { section: ".practice-explorer", content: [".practice-stage--teaser"] },
      { section: ".insights", content: [".insights__shell"] },
      { section: ".awards", content: [".awards__shell"] },
      { section: ".practice-page-hero", content: [".practice-page__canvas-shell"] },
      { section: ".practice-directory", content: [".practice-directory__layout"] },
      { section: ".footer", content: [".footer__shell", ".footer__bottom-shell"] },
    ];

    const scenes = sceneDefinitions
      .map(({ section: sectionSelector, content }) => {
        const section = document.querySelector(sectionSelector);

        if (!section) {
          return null;
        }

        section.classList.add("section-scene");

        content
          .flatMap((selector) => Array.from(section.querySelectorAll(selector)))
          .forEach((node) => node.classList.add("scene-content"));

        return section;
      })
      .filter(Boolean);

    if (scenes.length === 0) {
      return;
    }

    let frameId = null;

    function renderScenes() {
      frameId = null;

      const viewportHeight = window.innerHeight || 1;
      const focusLine = viewportHeight * 0.56;

      scenes.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distanceFromFocus = Math.abs(rect.top + rect.height * 0.5 - focusLine);
        const distanceProgress = 1 - distanceFromFocus / (viewportHeight * 0.94);
        const enterProgress = (viewportHeight - rect.top) / (viewportHeight * 0.82);
        const exitProgress = rect.bottom / (viewportHeight * 0.82);
        const sceneProgress = clamp(
          Math.max(distanceProgress, Math.min(enterProgress, exitProgress) * 0.94),
          0,
          1,
        );

        section.style.setProperty("--scene-progress", sceneProgress.toFixed(3));
        section.classList.toggle("is-scene-active", sceneProgress >= 0.76);
      });
    }

    function queueRender() {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(renderScenes);
    }

    renderScenes();
    window.addEventListener("scroll", queueRender, { passive: true });
    window.addEventListener("resize", queueRender);
    window.addEventListener("load", queueRender, { once: true });
  }

  function setupPracticePageNavigation() {
    const runtime = getGsapRuntime();
    const teaser = document.querySelector(".practice-explorer .practice-stage--teaser");
    const trigger = document.querySelector('.practice-explorer .practice-stage__trigger[href="./areas-de-practica.html"]');

    if (!teaser || !trigger || !runtime || reduceMotionQuery.matches) {
      return;
    }

    const { gsap, Flip } = runtime;

    trigger.addEventListener("click", (event) => {
      if (shouldBypassNavigation(event, trigger)) {
        return;
      }

      const destination = new URL(trigger.href, window.location.href);
      const sourceRect = teaser.getBoundingClientRect();
      const ghost = createPracticeTransitionGhost(teaser, "practice-transition-ghost--outgoing");
      const secondarySections = Array.from(document.querySelectorAll(".page > *:not(.practice-explorer), .footer"));

      writePracticeTransition({
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
        destination: destination.pathname,
        timestamp: Date.now(),
      });

      event.preventDefault();
      document.body.classList.add("is-practice-transitioning");
      teaser.classList.add("is-transition-source-hidden");
      document.body.appendChild(ghost);
      setFixedRect(ghost, sourceRect);

      gsap.to(secondarySections, {
        opacity: 0,
        y: 42,
        filter: "blur(14px)",
        duration: 0.42,
        ease: "power2.inOut",
        overwrite: true,
      });

      const state = Flip.getState(ghost, {
        props: "borderRadius,boxShadow,filter,opacity",
      });

      setFixedRect(ghost, {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: getPracticeHeroHeight(),
      });

      Flip.from(state, {
        absolute: true,
        duration: 0.88,
        ease: "power3.inOut",
        simple: true,
        onStart: () => {
          gsap.to(ghost, {
            boxShadow: "0 0 0 rgba(16, 22, 34, 0)",
            duration: 0.88,
            ease: "power3.inOut",
          });
        },
        onComplete: () => {
          window.location.assign(destination.href);
        },
      });
    });
  }

  function setupPracticePageIntro() {
    const hero = document.querySelector(".practice-page-hero");

    if (!hero) {
      clearPracticeTransition();
      return;
    }

    const runtime = getGsapRuntime();

    if (!runtime || reduceMotionQuery.matches) {
      clearPracticeTransition();
      return;
    }

    const { gsap, Flip } = runtime;
    const header = hero.querySelector(".practice-page__header");
    const introItems = [
      hero.querySelector(".section-label"),
      hero.querySelector("h1"),
      hero.querySelector(".timeline__lede"),
      hero.querySelector(".practice-stage__trigger"),
    ].filter(Boolean);
    const transition = readPracticeTransition(window.location.pathname);

    if (!transition) {
      animatePracticeContentIntro({ gsap, header, items: introItems, delay: 0.08 });
      return;
    }

    const ghost = createPracticeTransitionGhost(hero, "practice-transition-ghost--incoming");
    const finalRect = hero.getBoundingClientRect();

    hero.classList.add("is-transition-target-hidden");
    document.body.appendChild(ghost);
    setFixedRect(ghost, transition);

    const state = Flip.getState(ghost, {
      props: "borderRadius,boxShadow,filter,opacity",
    });

    setFixedRect(ghost, {
      top: finalRect.top,
      left: finalRect.left,
      width: finalRect.width,
      height: finalRect.height,
    });

    Flip.from(state, {
      absolute: true,
      duration: 0.98,
      ease: "power3.inOut",
      simple: true,
      onStart: () => {
        gsap.to(ghost, {
          boxShadow: "0 0 0 rgba(16, 22, 34, 0)",
          duration: 0.98,
          ease: "power3.inOut",
        });
      },
      onComplete: () => {
        hero.classList.remove("is-transition-target-hidden");
        animatePracticeContentIntro({ gsap, header, items: introItems, delay: 0.02 });
        gsap.to(ghost, {
          autoAlpha: 0,
          duration: 0.18,
          onComplete: () => ghost.remove(),
        });
        clearPracticeTransition();
      },
    });
  }

  function setupDragScroll() {
    const dragScrollAreas = document.querySelectorAll("[data-drag-scroll]");

    dragScrollAreas.forEach((area) => {
      const infinite = area.hasAttribute("data-infinite-drag-scroll");
      const track = infinite ? area.firstElementChild : null;
      let pointerId = null;
      let startX = 0;
      let startScrollLeft = 0;
      let isDragging = false;
      let hasDragged = false;
      let loopWidth = 0;
      let isNormalizing = false;

      if (infinite && track) {
        const originals = Array.from(track.children);
        const beforeFragment = document.createDocumentFragment();
        const afterFragment = document.createDocumentFragment();

        originals.forEach((item) => {
          const beforeClone = item.cloneNode(true);
          const afterClone = item.cloneNode(true);

          [beforeClone, afterClone].forEach((clone) => {
            clone.dataset.clone = "true";
            clone.setAttribute("aria-hidden", "true");
            stripRevealState(clone);
          });

          beforeFragment.appendChild(beforeClone);
          afterFragment.appendChild(afterClone);
        });

        track.prepend(beforeFragment);
        track.append(afterFragment);
      }

      function getOriginalItems() {
        if (!track) {
          return [];
        }

        return Array.from(track.children).filter((item) => !item.dataset.clone);
      }

      function measureLoopWidth() {
        const fullTrackWidth = track?.scrollWidth || area.scrollWidth || 0;

        if (fullTrackWidth) {
          loopWidth = fullTrackWidth / 3;
          return;
        }

        const originals = getOriginalItems();
        const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "0");

        loopWidth =
          originals.reduce((total, item) => total + item.getBoundingClientRect().width, 0) +
          gap * Math.max(0, originals.length - 1);
      }

      function normalizeInfiniteScroll(force = false) {
        if (!infinite || !loopWidth) {
          return;
        }

        const minEdge = loopWidth * 0.5;
        const maxEdge = loopWidth * 1.5;

        if (!force && area.scrollLeft >= minEdge && area.scrollLeft <= maxEdge) {
          return;
        }

        isNormalizing = true;

        while (area.scrollLeft < minEdge) {
          area.scrollLeft += loopWidth;
        }

        while (area.scrollLeft > maxEdge) {
          area.scrollLeft -= loopWidth;
        }

        isNormalizing = false;
      }

      function syncInfiniteTrack(preserveOffset = false) {
        if (!infinite || !track) {
          return;
        }

        const previousLoopWidth = loopWidth;
        const relativeOffset = previousLoopWidth
          ? ((area.scrollLeft - previousLoopWidth) % previousLoopWidth + previousLoopWidth) % previousLoopWidth
          : 0;

        measureLoopWidth();

        if (!loopWidth) {
          return;
        }

        area.scrollLeft = loopWidth + (preserveOffset ? relativeOffset : 0);
        normalizeInfiniteScroll(true);
      }

      if (infinite && track) {
        requestAnimationFrame(() => {
          syncInfiniteTrack();
        });

        window.addEventListener("load", () => {
          if (!hasDragged) {
            syncInfiniteTrack();
          }
        });

        area.addEventListener("scroll", () => {
          if (isNormalizing) {
            return;
          }

          normalizeInfiniteScroll();
        });
      }

      area.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || area.scrollWidth <= area.clientWidth) {
          return;
        }

        pointerId = event.pointerId;
        startX = event.clientX;
        startScrollLeft = area.scrollLeft;
        isDragging = true;
        hasDragged = true;

        area.classList.add("is-dragging");
        area.setPointerCapture(event.pointerId);
      });

      area.addEventListener("pointermove", (event) => {
        if (!isDragging || event.pointerId !== pointerId) {
          return;
        }

        area.scrollLeft = startScrollLeft - (event.clientX - startX);
        normalizeInfiniteScroll();
      });

      function stopDrag(event) {
        if (!isDragging || event.pointerId !== pointerId) {
          return;
        }

        if (area.hasPointerCapture(pointerId)) {
          area.releasePointerCapture(pointerId);
        }

        pointerId = null;
        isDragging = false;
        area.classList.remove("is-dragging");

        requestAnimationFrame(() => {
          normalizeInfiniteScroll(true);
        });
      }

      area.addEventListener("pointerup", stopDrag);
      area.addEventListener("pointercancel", stopDrag);

      window.addEventListener("resize", () => {
        syncInfiniteTrack(hasDragged);
      });
    });
  }

  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carousel) => {
    carousel
      .querySelectorAll(
        ".case-carousel__controls, .case-carousel__nav, .case-carousel__button, .case-carousel__dots, [data-carousel-prev], [data-carousel-next], [data-carousel-current], [data-carousel-total]",
      )
      .forEach((node) => node.remove());

    const track = carousel.querySelector("[data-carousel-track]");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const viewport = carousel.querySelector(".case-carousel__viewport");

    if (!track || slides.length === 0 || !viewport) {
      return;
    }

    slides.forEach((slide, index) => {
      slide.dataset.carouselIndex = String(index);
      slide.dataset.carouselClone = "false";
    });

    if (slides.length > 1) {
      const firstClone = slides[0].cloneNode(true);
      const lastClone = slides[slides.length - 1].cloneNode(true);

      firstClone.dataset.carouselIndex = "0";
      firstClone.dataset.carouselClone = "true";
      firstClone.setAttribute("aria-hidden", "true");
      firstClone.tabIndex = -1;

      lastClone.dataset.carouselIndex = String(slides.length - 1);
      lastClone.dataset.carouselClone = "true";
      lastClone.setAttribute("aria-hidden", "true");
      lastClone.tabIndex = -1;

      track.prepend(lastClone);
      track.append(firstClone);
    }

    const renderedSlides = Array.from(track.querySelectorAll("[data-carousel-slide]"));

    let currentIndex = 0;
    let pointerId = null;
    let pointerStartX = 0;
    let dragOffset = 0;
    let isDragging = false;
    let suppressClick = false;

    slides.forEach((slide, index) => {
      const serial = slide.querySelector(".case-card__topline span:last-child");

      if (serial) {
        serial.innerHTML = `N&ordm; ${String(index + 1).padStart(2, "0")}`;
      }
    });

    const clampIndex = (nextIndex) => Math.max(0, Math.min(nextIndex, slides.length - 1));

    function getActiveOffset() {
      return slides[currentIndex]?.offsetLeft ?? 0;
    }

    function syncSlides() {
      renderedSlides.forEach((slide) => {
        const index = Number(slide.dataset.carouselIndex ?? "-1");
        const isClone = slide.dataset.carouselClone === "true";
        const isActive = !isClone && index === currentIndex;

        slide.setAttribute("aria-hidden", String(isClone || !isActive));
        slide.tabIndex = isActive ? 0 : -1;
        slide.classList.toggle("is-active", isActive);
        slide.classList.toggle("is-clone", isClone);
      });
    }

    function render() {
      track.style.transform = `translate3d(${-(getActiveOffset()) + dragOffset}px, 0, 0)`;
    }

    function setIndex(nextIndex) {
      currentIndex = clampIndex(nextIndex);
      dragOffset = 0;
      syncSlides();
      render();
    }

    function getResistance(deltaX) {
      const draggingPastFirst = currentIndex === 0 && deltaX > 0;
      const draggingPastLast = currentIndex === slides.length - 1 && deltaX < 0;

      return draggingPastFirst || draggingPastLast ? 0.35 : 1;
    }

    function stopDragging(pointerEvent) {
      if (!isDragging) {
        return;
      }

      if (pointerEvent && pointerId !== null && viewport.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
      }

      pointerId = null;
      isDragging = false;
      dragOffset = 0;
      carousel.classList.remove("is-dragging");
    }

    function completeDrag(clientX) {
      const deltaX = clientX - pointerStartX;
      const threshold = Math.min(140, viewport.clientWidth * 0.12);

      if (Math.abs(deltaX) >= threshold) {
        currentIndex = clampIndex(currentIndex + (deltaX < 0 ? 1 : -1));
      }

      stopDragging();
      syncSlides();
      render();
    }

    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex(currentIndex + 1);
      }
    });

    viewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      dragOffset = 0;
      isDragging = true;
      suppressClick = false;

      carousel.classList.add("is-dragging");
      viewport.setPointerCapture(event.pointerId);
      render();
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      const deltaX = event.clientX - pointerStartX;

      if (Math.abs(deltaX) > 6) {
        suppressClick = true;
      }

      dragOffset = deltaX * getResistance(deltaX);
      render();
    });

    viewport.addEventListener("pointerup", (event) => {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      completeDrag(event.clientX);
    });

    viewport.addEventListener("pointercancel", (event) => {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }

      stopDragging(event);
      syncSlides();
      render();
    });

    viewport.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });

    viewport.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
        return;
      }

      const clickedSlide = event.target.closest("[data-carousel-slide]");

      if (!clickedSlide) {
        return;
      }

      const clickedIndex = Number(clickedSlide.dataset.carouselIndex ?? "-1");

      if (!Number.isNaN(clickedIndex) && clickedIndex >= 0 && clickedIndex !== currentIndex) {
        event.preventDefault();
        setIndex(clickedIndex);
      }
    });

    window.addEventListener("resize", () => {
      if (isDragging) {
        stopDragging();
      }

      syncSlides();
      render();
    });

    syncSlides();
    render();
  });

  hoistGlobalChrome();
  setupRevealAnimations();
  setupNewsTicker();
  setupMegaMenus();
  setupStickyHeaders();
  setupSectionScenes();
  setupPracticePageNavigation();
  setupPracticePageIntro();
  setupDragScroll();
})();
