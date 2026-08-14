const body = document.body;
const progressBar = document.getElementById("progress-bar");
const backToTop = document.getElementById("back-to-top");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle?.querySelector(".theme-icon");
const themeText = themeToggle?.querySelector(".theme-text");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const storedTheme = localStorage.getItem("theme");
const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

const setTheme = (theme) => {
  if (theme === "light") {
    body.setAttribute("data-theme", "light");
  } else {
    body.removeAttribute("data-theme");
  }
  localStorage.setItem("theme", theme);
  updateThemeToggle();
};

const updateThemeToggle = () => {
  const isLight = body.getAttribute("data-theme") === "light";
  if (themeIcon) {
    themeIcon.innerHTML = isLight
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
  if (themeText) {
    themeText.textContent = isLight ? "Terang" : "Gelap";
  }
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isLight));
  }
};

if (storedTheme) {
  setTheme(storedTheme);
} else if (prefersLight) {
  setTheme("light");
} else {
  updateThemeToggle();
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = body.getAttribute("data-theme") === "light";
    setTheme(isLight ? "dark" : "light");
  });
}

const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  if (backToTop) {
    backToTop.classList.toggle("visible", scrollTop > 500);
  }
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI);
updateScrollUI();

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const animatedElements = document.querySelectorAll(
  ".fade-in, .slide-in-left, .fade-in-left, .fade-in-right, .fade-in-up",
);
if (animatedElements.length) {
  if (prefersReducedMotion) {
    animatedElements.forEach((element) => element.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    animatedElements.forEach((element) => observer.observe(element));
  }
}

// ── Hamburger / off-canvas menu ──
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");
const navOverlay = document.getElementById("nav-overlay");

const closeMenu = () => {
  hamburger?.classList.remove("open");
  navLinks?.classList.remove("open");
  navOverlay?.classList.remove("active");
  hamburger?.setAttribute("aria-expanded", "false");
  body.style.overflow = "";
  // Close all mobile submenus
  document.querySelectorAll(".nav-item.submenu-open").forEach((el) => el.classList.remove("submenu-open"));
};

const openMenu = () => {
  hamburger?.classList.add("open");
  navLinks?.classList.add("open");
  navOverlay?.classList.add("active");
  hamburger?.setAttribute("aria-expanded", "true");
  body.style.overflow = "hidden";
};

hamburger?.addEventListener("click", () => {
  const isOpen = hamburger.classList.contains("open");
  isOpen ? closeMenu() : openMenu();
});

navOverlay?.addEventListener("click", closeMenu);

// Mobile: toggle submenu on parent nav-link click
document.querySelectorAll(".nav-item.has-submenu > .nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (window.innerWidth > 768) return; // desktop: default hover behavior
    e.preventDefault();
    const item = link.closest(".nav-item");
    const wasOpen = item.classList.contains("submenu-open");
    // Close all other open submenus
    document.querySelectorAll(".nav-item.submenu-open").forEach((el) => el.classList.remove("submenu-open"));
    if (!wasOpen) item.classList.add("submenu-open");
  });
});

// Close on nav sublink click (mobile) - allow navigation
document.querySelectorAll(".nav-sublink").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) closeMenu();
  });
});

// Close on nav link click (mobile) for non-submenu items
document.querySelectorAll(".nav-item:not(.has-submenu) .nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) closeMenu();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

const anchorNavLinks = Array.from(document.querySelectorAll(".nav-link")).filter(
  (link) => (link.getAttribute("href") || "").startsWith("#"),
);
const sections = Array.from(document.querySelectorAll("[data-section]"));
const linkMap = new Map(
  anchorNavLinks.map((link) => [link.getAttribute("href").slice(1), link]),
);

if (sections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const targetId = entry.target.getAttribute("id");
        if (!targetId) return;
        anchorNavLinks.forEach((link) => link.classList.remove("active"));
        const activeLink = linkMap.get(targetId);
        if (activeLink) {
          activeLink.classList.add("active");
        }
      });
    },
    { rootMargin: "-35% 0px -50% 0px" },
  );

  sections.forEach((section) => navObserver.observe(section));
}

anchorNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("href").slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;
    target.classList.add("section-highlight");
    window.setTimeout(() => target.classList.remove("section-highlight"), 1200);
  });
});

const modal = document.getElementById("media-modal");
const modalTitle = modal?.querySelector(".modal-title");
const modalContent = modal?.querySelector(".modal-content");
const modalExt = modal?.querySelector("#modal-ext");
const modalCloseButtons = modal?.querySelectorAll("[data-modal-close]") || [];

// Placeholder ids that were never filled in with a real Drive link.
const isPlaceholderSrc = (src) =>
  !src || /FILE_ID|YOUR_|XXXX|PLACEHOLDER/i.test(src);

// Derive an "open in a new tab" URL from an embedded /preview URL.
// drive.google.com/file links use /view; Slides & others open fine as-is.
const toExternalUrl = (src) => {
  if (!src) return src;
  if (/drive\.google\.com\/file\//.test(src)) {
    return src.replace(/\/preview(\?[^#]*)?(#.*)?$/, "/view$1$2");
  }
  return src;
};

const openModal = (options) => {
  if (!modal || !modalContent) return;
  const { type, src, title, alt } = options;
  modalContent.innerHTML = "";

  if (modalTitle) {
    modalTitle.textContent = title || "Preview";
  }

  if (type === "image") {
    if (modalExt) modalExt.hidden = true;
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt || title || "Preview";
    modalContent.appendChild(img);
  } else {
    // Document/iframe preview (Google Drive, Slides, etc.)
    if (modalExt) {
      modalExt.hidden = false;
      modalExt.href = toExternalUrl(src);
    }

    // Loading indicator shown until the iframe finishes loading.
    const loader = document.createElement("div");
    loader.className = "modal-loading";
    loader.innerHTML =
      '<div class="spinner" aria-hidden="true"></div><p>Memuat pratinjau dokumen…</p>';
    modalContent.appendChild(loader);

    const iframe = document.createElement("iframe");
    iframe.loading = "lazy";
    iframe.allow = "autoplay; fullscreen";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.title = title || "Preview";
    iframe.style.display = "none";

    const extUrl = toExternalUrl(src);

    const showFallback = () => {
      modalContent.innerHTML =
        '<div class="modal-loading modal-loading--error">' +
        '<i class="fa-solid fa-file-circle-exclamation modal-loading-icon" aria-hidden="true"></i>' +
        "<p>Pratinjau tidak dapat ditampilkan.</p>" +
        '<p class="modal-fallback-hint">File mungkin memerlukan izin akses atau browser memblokir pratinjau embed. Silakan buka langsung di Google Drive.</p>' +
        '<a class="modal-fallback-btn" href="' + extUrl + '" target="_blank" rel="noopener noreferrer">' +
        '<i class="fa-solid fa-arrow-up-right-from-square"></i> Buka di Google Drive</a>' +
        '</div>';
    };

    let iframeResolved = false;

    iframe.addEventListener("load", () => {
      if (iframeResolved) return;
      iframeResolved = true;
      if (loader.parentNode) loader.remove();

      // Detect whether the iframe actually loaded real content.
      // Google Drive is cross-origin so accessing contentDocument throws SecurityError = content loaded successfully.
      // If no error is thrown, the frame is same-origin or blank (browser blocked the embed).
      let hasContent = false;
      try {
        const doc = iframe.contentDocument;
        hasContent = !!(doc && doc.body && doc.body.innerHTML.trim().length > 20);
      } catch (e) {
        // SecurityError: cross-origin frame = real content from Google Drive
        hasContent = true;
      }

      if (hasContent) {
        iframe.style.display = "";
      } else {
        showFallback();
      }
    });

    const failTimer = window.setTimeout(() => {
      if (iframeResolved) return;
      iframeResolved = true;
      if (loader.parentNode) loader.remove();
      showFallback();
    }, 8000);

    iframe.src = src;
    modalContent.appendChild(iframe);
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
};

const closeModal = () => {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
  if (modalExt) modalExt.hidden = true;
  if (modalContent) {
    modalContent.innerHTML = "";
  }
};

const modalTriggers = document.querySelectorAll("[data-modal]");
modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const type = trigger.getAttribute("data-modal");
    const src = trigger.getAttribute("data-src");
    if (!type) return;
    // Anchor triggers point to "#..."  never let them jump the page.
    if (trigger.tagName === "A") event.preventDefault();
    if (type !== "image" && isPlaceholderSrc(src)) return;
    if (!src) return;
    openModal({
      type,
      src,
      title: trigger.getAttribute("data-title"),
      alt: trigger.getAttribute("data-alt"),
    });
  });
});

modalCloseButtons.forEach((button) => button.addEventListener("click", closeModal));

modal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches("[data-modal-close]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("is-open")) {
    closeModal();
  }
});

const initCarousel = () => {
  if (!window.jQuery || typeof jQuery.fn.owlCarousel !== "function") {
    return;
  }

  jQuery(".owl-carousel").owlCarousel({
    loop: true,
    margin: 18,
    nav: true,
    dots: true,
    autoplay: true,
    autoplayTimeout: 4500,
    autoplayHoverPause: true,
    smartSpeed: 800,
    navSpeed: 600,
    autoplaySpeed: 800,
    navText: [
      '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>',
      '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>',
    ],
    responsive: {
      0: { items: 1 },
      700: { items: 2 },
      1024: { items: 3 },
    },
  });
};

initCarousel();

// Specific Owl Carousel settings for the Kendari image gallery
; (function () {
  if (!window.jQuery || typeof jQuery.fn.owlCarousel !== "function") return;

  const owl = jQuery('.image-gallery');
  if (!owl.length) return;

  // If already initialized by the generic init, destroy and re-init with custom options
  if (owl.data('owl.carousel') !== undefined) {
    owl.trigger('destroy.owl.carousel');
    owl.removeClass('owl-loaded');
    const stageOuter = owl.find('.owl-stage-outer');
    if (stageOuter.length) {
      owl.children().unwrap();
    }
  }

  owl.owlCarousel({
    items: 4,
    loop: true,
    margin: 10,
    autoplay: true,
    autoplayTimeout: 1000,
    autoplayHoverPause: true,
    nav: false,
    dots: true,
    responsive: {
      0: { items: 1 },
      700: { items: 2 },
      1024: { items: 4 }
    }
  });

  jQuery('.play').on('click', function () {
    owl.trigger('play.owl.autoplay', [1000]);
  });

  jQuery('.stop').on('click', function () {
    owl.trigger('stop.owl.autoplay');
  });
})();
// ── Siklus Tab Switcher (Artefak) ──
(function () {
  const tabs = document.querySelectorAll('.siklus-tab');
  const panels = document.querySelectorAll('.siklus-panel');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.siklus;
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => { p.classList.remove('active'); p.hidden = true; });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('siklus-panel-' + target);
      if (panel) { panel.classList.add('active'); panel.hidden = false; }
    });
  });
})();

// ── Anime.js Animations ──
(function () {
  if (typeof anime === "undefined" && typeof window.anime === "undefined") return;
  const animeLib = typeof anime !== "undefined" ? anime : window.anime;
  const { animate, createTimeline, stagger, spring } = animeLib;

  // ── 1. Hero entrance: tag → name → title → (typing quote) → chips ──
  const heroTimeline = createTimeline({ defaults: { ease: "outExpo" } });

  // Typing animation for hero-quote
  const typingTarget = document.getElementById("typing-quote");
  const typingCursor = document.querySelector(".typing-cursor");
  const fullText = "\"Cara terbaik untuk belajar adalah dengan mengajarkan kepada orang lain.\"";

  const startTyping = () => {
    if (!typingTarget) return;
    let i = 0;
    typingTarget.textContent = "";
    const speed = 38; // ms per character
    const type = () => {
      if (i < fullText.length) {
        typingTarget.textContent += fullText[i];
        i++;
        setTimeout(type, speed);
      } else {
        // Cursor blink: fade out after done
        if (typingCursor) {
          animate(typingCursor, {
            opacity: [1, 0],
            duration: 600,
            ease: "inOutSine",
            loop: true,
            direction: "alternate",
          });
        }
      }
    };
    type();
  };

  // Cursor blink CSS animation while typing
  if (typingCursor) {
    typingCursor.style.animation = "none";
    animate(typingCursor, {
      opacity: [1, 0.2],
      duration: 500,
      ease: "inOutSine",
      loop: true,
      direction: "alternate",
    });
  }

  if (document.querySelector(".hero-tag")) {
    heroTimeline
      .add(".hero-tag", {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 700,
      })
      .add(".hero-name", {
        opacity: [0, 1],
        translateY: [40, 0],
        duration: 900,
      }, "-=400")
      .add(".hero-title", {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 700,
      }, "-=600")
      .add(".hero-quote", {
        opacity: [0, 1],
        duration: 300,
        onComplete: startTyping,
      }, "-=500")
      .add(".meta-chip", {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(120),
        duration: 600,
      }, `+=${fullText.length * 38 + 200}`);
  }

  // ── 2. Navbar entrance ──
  if (document.querySelector("nav")) {
    animate("nav", {
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 700,
      ease: "outExpo",
    });
  }

  // ── 3. Kompetensi cards: staggered pop-in on scroll ──
  const kompetensiCards = document.querySelectorAll(".kompetensi-card");
  if (kompetensiCards.length) {
    // Set initial state
    kompetensiCards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(40px) scale(0.95)";
    });

    const kompetensiObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".kompetensi-card");
            animate(cards, {
              opacity: [0, 1],
              translateY: [40, 0],
              scale: [0.95, 1],
              delay: stagger(100),
              duration: 700,
              ease: "outBack(1.2)",
            });
            kompetensiObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const kompetensiGrid = document.querySelector(".kompetensi-grid");
    if (kompetensiGrid) kompetensiObserver.observe(kompetensiGrid);
  }

  // ── 4. Highlight boxes: slide up from below ──
  const highlightBoxes = document.querySelectorAll(".highlight-box");
  highlightBoxes.forEach((box) => {
    box.style.opacity = "0";
    box.style.transform = "translateY(30px)";
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 800,
              ease: "outExpo",
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    obs.observe(box);
  });

  // ── 5. Section titles: word-by-word reveal ──
  const sectionTitles = document.querySelectorAll(".section-title");
  sectionTitles.forEach((title) => {
    // Wrap words in spans
    const html = title.innerHTML;
    // only plain text nodes, skip if already processed
    if (title.dataset.animeReady) return;
    title.dataset.animeReady = "1";
    title.style.opacity = "0";

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target, {
              opacity: [0, 1],
              translateX: [-20, 0],
              duration: 700,
              ease: "outExpo",
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    obs.observe(title);
  });

  // ── 6. Profile photo: reveal + border glow + float ──
  const profilePhoto = document.querySelector(".profile-photo");
  const profileImg = profilePhoto ? profilePhoto.querySelector("img") : null;
  if (profilePhoto && profileImg) {
    // Initial hidden state
    profilePhoto.style.opacity = "0";
    profilePhoto.style.transform = "scale(0.75) rotate(-6deg)";
    profileImg.style.filter = "blur(8px) grayscale(80%)";

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Phase 1: container entrance
            const tl = createTimeline();
            tl.add(profilePhoto, {
              opacity: [0, 1],
              scale: [0.75, 1.05],
              rotate: [-6, 2],
              duration: 700,
              ease: "outExpo",
            })
              .add(profilePhoto, {
                scale: [1.05, 1],
                rotate: [2, 0],
                duration: 400,
                ease: "outBack(2)",
              })
              // Phase 2: unblur + desaturate
              .add(profileImg, {
                filter: ["blur(8px) grayscale(80%)", "blur(0px) grayscale(0%)"],
                duration: 800,
                ease: "outExpo",
              }, "-=700");

            // Phase 3: gentle float loop after entrance
            setTimeout(() => {
              animate(profilePhoto, {
                translateY: [-6, 6],
                duration: 3000,
                ease: "inOutSine",
                loop: true,
                direction: "alternate",
              });
              // Subtle border glow pulse via box-shadow
              animate(profilePhoto, {
                boxShadow: [
                  "0 0 0px 0px rgba(var(--accent-rgb, 99,102,241), 0)",
                  "0 0 24px 8px rgba(var(--accent-rgb, 99,102,241), 0.35)",
                  "0 0 0px 0px rgba(var(--accent-rgb, 99,102,241), 0)",
                ],
                duration: 2800,
                ease: "inOutSine",
                loop: true,
              });
            }, 900);

            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    obs.observe(profilePhoto);
  }

  // ── 7. Filosifi blocks: alternate slide left/right ──
  const filosifiBlocks = document.querySelectorAll(".filosifi-block");
  filosifiBlocks.forEach((block, i) => {
    block.style.opacity = "0";
    block.style.transform = i % 2 === 0 ? "translateX(-30px)" : "translateX(30px)";
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target, {
              opacity: [0, 1],
              translateX: [i % 2 === 0 ? -30 : 30, 0],
              duration: 800,
              ease: "outExpo",
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    obs.observe(block);
  });

  // ── 8. Karakter list items: stagger pop ──
  const karakterItems = document.querySelectorAll(".karakter-list li");
  if (karakterItems.length) {
    karakterItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "scale(0.8)";
    });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(
              entry.target.closest(".karakter-list").querySelectorAll("li"),
              {
                opacity: [0, 1],
                scale: [0.8, 1],
                delay: stagger(80),
                duration: 500,
                ease: "outBack(1.3)",
              }
            );
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    const karList = document.querySelector(".karakter-list");
    if (karList) obs.observe(karList);
  }

  // ── 9. Media cards: staggered fade-up ──
  const mediaCards = document.querySelectorAll(".media-card");
  if (mediaCards.length) {
    mediaCards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
    });
    const gridObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate all cards in the parent section
            const parent = entry.target;
            const cards = parent.querySelectorAll(".media-card");
            if (cards.length) {
              animate(cards, {
                opacity: [0, 1],
                translateY: [30, 0],
                delay: stagger(120),
                duration: 700,
                ease: "outExpo",
              });
            }
            gridObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".card-grid, .media-grid").forEach((grid) => {
      gridObserver.observe(grid);
    });
  }

  // ── 10. Back-to-top button bounce on appear ──
  const origBackToTop = document.getElementById("back-to-top");
  if (origBackToTop) {
    const mutObs = new MutationObserver(() => {
      if (origBackToTop.classList.contains("visible")) {
        animate(origBackToTop, {
          scale: [0.5, 1.15, 1],
          opacity: [0, 1],
          duration: 500,
          ease: "outBack(1.5)",
        });
      }
    });
    mutObs.observe(origBackToTop, { attributes: true, attributeFilter: ["class"] });
  }

  // ── 11. Misi list items: stagger slide-in ──
  const misiItems = document.querySelectorAll(".misi-list li");
  if (misiItems.length) {
    misiItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateX(-20px)";
    });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(
              entry.target.closest(".misi-list").querySelectorAll("li"),
              {
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: stagger(90),
                duration: 600,
                ease: "outExpo",
              }
            );
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    const misiList = document.querySelector(".misi-list");
    if (misiList) obs.observe(misiList);
  }

  // ── 12. Section label: fade + letter spacing ──
  const sectionLabels = document.querySelectorAll(".section-label");
  sectionLabels.forEach((label) => {
    label.style.opacity = "0";
    label.style.letterSpacing = "0.3em";
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target, {
              opacity: [0, 1],
              letterSpacing: ["0.3em", ""],
              duration: 800,
              ease: "outExpo",
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(label);
  });

  // ── 13. Kompetensi icon: continuous subtle pulse ──
  const kompetensiIcons = document.querySelectorAll(".kompetensi-icon");
  if (kompetensiIcons.length) {
    animate(kompetensiIcons, {
      scale: [1, 1.08, 1],
      duration: 2400,
      ease: "inOutSine",
      loop: true,
      delay: stagger(300),
    });
  }

  // ── 14. Hero name span accent: color pulse ──
  const heroAccent = document.querySelector(".hero-name span");
  if (heroAccent) {
    animate(heroAccent, {
      opacity: [0.7, 1],
      duration: 1800,
      ease: "inOutSine",
      loop: true,
      direction: "alternate",
    });
  }
})();

// ── Lampiran Type Switcher (Lampiran 7 / 8) ──
(function () {
  const typeBtns = document.querySelectorAll('.lampiran-type-btn');
  const typeContents = document.querySelectorAll('.lampiran-type-content');
  if (!typeBtns.length) return;

  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.lampiranType;
      typeBtns.forEach(b => b.classList.remove('active'));
      typeContents.forEach(c => { c.classList.remove('active'); c.hidden = true; });
      btn.classList.add('active');
      const content = document.getElementById('lampiran-type-' + type);
      if (content) { content.classList.add('active'); content.hidden = false; }
    });
  });

  // Inner siklus tabs for each lampiran type
  document.querySelectorAll('.lampiran-siklus-tabs').forEach((tabGroup) => {
    const btns = tabGroup.querySelectorAll('.lampiran-siklus-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const panelId = btn.dataset.ltab;
        // Hide all sibling panels (within the same lampiran-type-content)
        const parentContent = btn.closest('.lampiran-type-content');
        if (!parentContent) return;
        parentContent.querySelectorAll('.lampiran-tab-panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
        const panel = document.getElementById(panelId);
        if (panel) { panel.classList.add('active'); panel.hidden = false; }
      });
    });
  });
})();