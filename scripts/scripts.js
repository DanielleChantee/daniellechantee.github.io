/**
 * Portfolio Site JavaScript
 * Handles carousels, mobile menu, form validation, and interactive features
 * Uses modern ES6+ syntax throughout
 */

document.addEventListener("DOMContentLoaded", function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const parseColorChannels = (colorValue) => {
    if (!colorValue || colorValue === "transparent") {
      return null;
    }
    const matches = colorValue.match(/[\d.]+/g);
    if (!matches || matches.length < 3) {
      return null;
    }
    return {
      r: Number(matches[0]),
      g: Number(matches[1]),
      b: Number(matches[2]),
      a: matches.length > 3 ? Number(matches[3]) : 1,
    };
  };

  const isDarkBackground = (element) => {
    let currentElement = element;
    while (currentElement) {
      const channels = parseColorChannels(window.getComputedStyle(currentElement).backgroundColor);
      if (channels && channels.a > 0.05) {
        const luminance = (0.299 * channels.r + 0.587 * channels.g + 0.114 * channels.b) / 255;
        return luminance < 0.42;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  };

  /**
   * Sitewide section reveal choreography and section style variation
   */
  try {
    const revealTargets = document.querySelectorAll(
      ".image-banner-content, .content-section, .project-block, .project-detail",
    );
    const revealChildSelector =
      "h1, h2, h3, p, ul, ol, .btn, .service-item, .process-step, .project-block-info, .project-block-media";

    let contentSectionIndex = 0;
    revealTargets.forEach((section) => {
      section.classList.add("reveal-section");
      if (section.classList.contains("content-section")) {
        const isDarkSection = isDarkBackground(section);

        section.classList.remove("has-dark-gradient", "section-tone-1", "section-tone-2", "section-tone-3");
        if (isDarkSection) {
          contentSectionIndex += 1;
          const tone = ((contentSectionIndex - 1) % 3) + 1;
          section.classList.add("has-dark-gradient", `section-tone-${tone}`);
        }
      }

      const revealItems = section.querySelectorAll(revealChildSelector);
      revealItems.forEach((item, idx) => {
        item.classList.add("reveal-item");
        item.style.setProperty("--reveal-delay", `${Math.min(idx * 55, 320)}ms`);
      });
    });

    if (prefersReducedMotion) {
      revealTargets.forEach((section) => section.classList.add("is-visible"));
    } else {
      const isInInitialViewport = (element) => {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        const elementHeight = Math.max(rect.height, 1);
        return visibleHeight / elementHeight >= 0.16;
      };

      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
      );

      let initialVisibleIndex = 0;
      revealTargets.forEach((section) => {
        if (isInInitialViewport(section)) {
          // Defer visibility long enough for first paint so above-the-fold
          // sections animate instead of snapping to final state.
          const delay = 90 + initialVisibleIndex * 55;
          initialVisibleIndex += 1;
          requestAnimationFrame(() => {
            setTimeout(() => {
              section.classList.add("is-visible");
            }, delay);
          });
          return;
        }
        revealObserver.observe(section);
      });
    }
  } catch (error) {
    console.error("Error initializing reveal choreography:", error);
  }

  /**
   * On localhost: unregister any service worker to avoid stale cache during development
   */
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
  }

  /**
   * Register Service Worker for PWA Support
   * Enables offline functionality and caching
   */
  const registerServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      try {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("service-worker.js")
            .then((registration) => {
              console.log("Service Worker registered:", registration.scope);
            })
            .catch((error) => {
              console.warn("Service Worker registration failed:", error);
            });
        });
      } catch (error) {
        console.error("Error registering service worker:", error);
      }
    }
  };

  // Register service worker
  // Temporarily disable service worker registration to avoid cached content
  // during local development and preview. Re-enable when done testing.
  // registerServiceWorker();
  /**
   * Homepage clients marquee interaction polish
   * Pause on focus/hover/touch for better readability and accessibility
   */
  try {
    const clientsMarquee = document.querySelector(".clients-marquee");
    if (clientsMarquee) {
      let resumeTimer;
      const setPaused = (paused) => {
        clientsMarquee.classList.toggle("is-paused", paused);
      };

      clientsMarquee.addEventListener("focusin", () => setPaused(true));
      clientsMarquee.addEventListener("focusout", () => setPaused(false));
      clientsMarquee.addEventListener("pointerenter", () => setPaused(true));
      clientsMarquee.addEventListener("pointerleave", () => setPaused(false));
      clientsMarquee.addEventListener(
        "touchstart",
        () => {
          clearTimeout(resumeTimer);
          setPaused(true);
        },
        { passive: true },
      );
      clientsMarquee.addEventListener(
        "touchend",
        () => {
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(() => setPaused(false), 1600);
        },
        { passive: true },
      );
    }
  } catch (error) {
    console.error("Error initializing clients marquee interactions:", error);
  }

  /**
   * FAQ accordion UX: keep one item open at a time for clearer scanning
   */
  try {
    const faqItems = document.querySelectorAll(".faq-accordion .faq-item");
    faqItems.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) {
          return;
        }
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.open = false;
          }
        });
      });
    });
  } catch (error) {
    console.error("Error initializing FAQ accordion:", error);
  }

  /**
   * Initialise Splide Carousel for Featured Clients
   * Shows loading state while carousel initialises
   * Scoped to avoid conflicts with other carousels
   */
  const featuredClientsElement = document.querySelector("#featured-clients");
  if (featuredClientsElement) {
    try {
      // Show loading state
      featuredClientsElement.classList.add("loading");

      const featuredClients = new Splide(featuredClientsElement, {
        perPage: 2,
        rewind: true,
        autoplay: true,
        interval: 4000,
        pauseOnHover: false,
        pauseOnFocus: false,
        arrows: true,
        pagination: false,
        breakpoints: {
          768: {
            perPage: 1,
          },
        },
      });

      // Remove loading state when carousel is ready
      featuredClients.on("mounted", () => {
        featuredClientsElement.classList.remove("loading");
        featuredClientsElement.classList.add("is-initialized");
      });

      featuredClients.mount();
    } catch (error) {
      console.error("Error initializing featured clients carousel:", error);
      featuredClientsElement.classList.remove("loading");
      featuredClientsElement.classList.add("error");
    }
  }

  /**
   * Handle Image Loading States
   * Adds 'loaded' class to images when they finish loading
   * Excludes lazy-loaded images which handle their own loading
   */
  try {
    const images = document.querySelectorAll("img:not([loading='lazy'])");
    images.forEach((img) => {
      if (img.complete) {
        // Image already loaded
        img.classList.add("loaded");
      } else {
        // Wait for image to load
        img.addEventListener("load", () => {
          img.classList.add("loaded");
        });
        img.addEventListener("error", () => {
          // Show broken image icon even on error
          img.classList.add("loaded");
        });
      }
    });
  } catch (error) {
    console.error("Error handling image loading states:", error);
  }

  /**
   * Add Loading States to Navigation Links
   * Shows loading spinner on internal navigation links when clicked
   */
  try {
    const navigationLinks = document.querySelectorAll(
      "a.btn, .desktop-menu a, .mobile-menu a",
    );
    navigationLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        // Only add loading for internal links
        if (this.hostname === window.location.hostname || !this.hostname) {
          if (!this.classList.contains("loading")) {
            this.classList.add("loading");
            // Remove loading state after navigation (in case navigation is prevented)
            setTimeout(() => {
              this.classList.remove("loading");
            }, 1000);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error adding loading states to navigation:", error);
  }

  /**
   * Services Marquee Animation
   * Duplicates marquee content to create seamless infinite scroll
   */
  const marqueeElement = document.querySelector("#services-marquee .marquee");
  if (marqueeElement) {
    try {
      const textContent = marqueeElement.innerHTML;

      // Duplicate text content to fill the viewport twice for seamless loop
      while (marqueeElement.offsetWidth < window.innerWidth * 2) {
        marqueeElement.innerHTML += textContent;
      }

      marqueeElement.style.animation = "scroll-right 40s linear infinite";
    } catch (error) {
      console.error("Error initializing marquee:", error);
    }
  }

  /**
   * Mobile Menu Functionality
   * Handles opening/closing mobile menu with keyboard and mouse interactions
   */
  const hamburger = document.querySelector(".hamburger");
  const closeButton = document.querySelector(".mobile-menu-wrapper .close");
  const mobileMenuWrapper = document.querySelector(".mobile-menu-wrapper");
  const mobileMenuBackdrop = document.querySelector(".mobile-menu-backdrop");
  const mobileSubmenuToggles = document.querySelectorAll(".mobile-submenu-toggle");
  const body = document.body;
  const megaMenuItems = document.querySelectorAll(".has-mega-menu > a");

  if (hamburger && closeButton && mobileMenuWrapper) {
    /**
     * Open Mobile Menu
     * Shows menu, backdrop, prevents body scroll, updates ARIA attributes
     */
    const openMenu = () => {
      try {
        mobileMenuWrapper.classList.add("open");
        if (mobileMenuBackdrop) {
          mobileMenuBackdrop.classList.add("active");
          mobileMenuBackdrop.setAttribute("aria-hidden", "false");
        }
        body.style.overflow = "hidden";
        hamburger.setAttribute("aria-expanded", "true");
        hamburger.setAttribute("aria-label", "Close mobile menu");
        // Focus first menu item for keyboard users
        const firstMenuItem = mobileMenuWrapper.querySelector(".mobile-menu a");
        if (firstMenuItem) {
          firstMenuItem.focus();
        }
      } catch (error) {
        console.error("Error opening mobile menu:", error);
      }
    };

    /**
     * Close Mobile Menu
     * Hides menu, backdrop, restores body scroll, updates ARIA attributes
     */
    const closeMenu = () => {
      try {
        mobileMenuWrapper.classList.remove("open");
        if (mobileMenuBackdrop) {
          mobileMenuBackdrop.classList.remove("active");
          mobileMenuBackdrop.setAttribute("aria-hidden", "true");
        }
        body.style.overflow = "";
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open mobile menu");
        mobileSubmenuToggles.forEach((toggle) => {
          const submenuId = toggle.getAttribute("aria-controls");
          const submenu = submenuId ? document.getElementById(submenuId) : null;
          toggle.setAttribute("aria-expanded", "false");
          toggle.classList.remove("open");
          const icon = toggle.querySelector("span");
          if (icon) {
            icon.textContent = "+";
          }
          if (submenu) {
            submenu.classList.remove("open");
            submenu.setAttribute("aria-hidden", "true");
          }
        });
      } catch (error) {
        console.error("Error closing mobile menu:", error);
      }
    };

    // Open/close menu with hamburger button
    hamburger.addEventListener("click", () => {
      if (mobileMenuWrapper.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu with close button
    closeButton.addEventListener("click", closeMenu);

    // Close menu when clicking backdrop
    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.addEventListener("click", closeMenu);
    }

    // Close menu when clicking a link inside it
    const mobileMenuLinks =
      mobileMenuWrapper.querySelectorAll(".mobile-menu a");
    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Toggle nested mobile submenus
    mobileSubmenuToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const submenuId = toggle.getAttribute("aria-controls");
        const submenu = submenuId ? document.getElementById(submenuId) : null;
        if (!submenu) {
          return;
        }

        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
        toggle.classList.toggle("open", !isOpen);
        submenu.classList.toggle("open", !isOpen);
        submenu.setAttribute("aria-hidden", isOpen ? "true" : "false");

        const icon = toggle.querySelector("span");
        if (icon) {
          icon.textContent = isOpen ? "+" : "−";
        }
      });
    });

    // Close menu on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenuWrapper.classList.contains("open")) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  /**
   * Mega Menu ARIA State Management
   * Updates aria-expanded attribute based on hover/focus state
   */
  if (megaMenuItems.length > 0) {
    try {
      megaMenuItems.forEach((menuItem) => {
        const menuContainer = menuItem.closest(".has-mega-menu");
        const megaMenu = menuContainer
          ? menuContainer.querySelector(".mega-menu")
          : null;

        menuItem.addEventListener("mouseenter", () => {
          menuItem.setAttribute("aria-expanded", "true");
        });

        menuItem.addEventListener("mouseleave", () => {
          menuItem.setAttribute("aria-expanded", "false");
        });

        menuItem.addEventListener("focus", () => {
          menuItem.setAttribute("aria-expanded", "true");
        });

        menuItem.addEventListener("blur", (e) => {
          // Only collapse if focus moved outside this mega menu
          if (!megaMenu || !megaMenu.contains(e.relatedTarget)) {
            menuItem.setAttribute("aria-expanded", "false");
          }
        });
      });
    } catch (error) {
      console.error("Error managing mega menu ARIA attributes:", error);
    }
  }

  /**
   * Contact Form Validation and Submission
   * Handles client-side validation, form submission, and user feedback
   */
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    try {
      const emailInput = document.getElementById("email");
      const messageInput = document.getElementById("message");
      const emailError = document.getElementById("email-error");
      const messageError = document.getElementById("message-error");
      const formMessages = document.getElementById("form-messages");
      const submitBtn = document.getElementById("submit-btn");
      const buttonText = submitBtn.querySelector(".button-text");
      const buttonLoader = submitBtn.querySelector(".button-loader");

      /**
       * Validate Email Address
       * Uses regex to check email format
       * @param {string} email - Email address to validate
       * @returns {boolean} - True if valid email format
       */
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      /**
       * Validate Message Length
       * Ensures message is at least 10 characters
       * @param {string} message - Message to validate
       * @returns {boolean} - True if message meets minimum length
       */
      const validateMessage = (message) => {
        return message.trim().length >= 10;
      };

      /**
       * Show Error State on Input
       * Updates ARIA attributes and displays error message
       * @param {HTMLElement} input - Input element with error
       * @param {HTMLElement} errorElement - Element to display error message
       * @param {string} message - Error message to display
       */
      const showError = (input, errorElement, message) => {
        input.setAttribute("aria-invalid", "true");
        errorElement.textContent = message;
        input.classList.add("error");
      };

      /**
       * Clear Error State on Input
       * Removes error styling and ARIA attributes
       * @param {HTMLElement} input - Input element to clear
       * @param {HTMLElement} errorElement - Error message element to clear
       */
      const clearError = (input, errorElement) => {
        input.setAttribute("aria-invalid", "false");
        errorElement.textContent = "";
        input.classList.remove("error");
      };

      // Email validation on blur and input
      emailInput.addEventListener("blur", () => {
        emailInput.classList.add("touched");
        const email = emailInput.value.trim();
        if (email && !validateEmail(email)) {
          showError(
            emailInput,
            emailError,
            "Please enter a valid email address",
          );
        } else {
          clearError(emailInput, emailError);
        }
      });

      emailInput.addEventListener("input", () => {
        if (emailInput.classList.contains("touched")) {
          const email = emailInput.value.trim();
          if (email && !validateEmail(email)) {
            showError(
              emailInput,
              emailError,
              "Please enter a valid email address",
            );
          } else {
            clearError(emailInput, emailError);
          }
        }
      });

      // Message validation on blur and input
      messageInput.addEventListener("blur", () => {
        messageInput.classList.add("touched");
        const message = messageInput.value.trim();
        if (message && !validateMessage(message)) {
          showError(
            messageInput,
            messageError,
            "Message must be at least 10 characters long",
          );
        } else {
          clearError(messageInput, messageError);
        }
      });

      messageInput.addEventListener("input", () => {
        if (messageInput.classList.contains("touched")) {
          const message = messageInput.value.trim();
          if (message && !validateMessage(message)) {
            showError(
              messageInput,
              messageError,
              "Message must be at least 10 characters long",
            );
          } else {
            clearError(messageInput, messageError);
          }
        }
      });

      /**
       * Handle Form Submission
       * Validates form, submits via Formspree API, handles success/error states
       */
      contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Clear previous messages
        formMessages.className = "";
        formMessages.textContent = "";

        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        // Validate before submission
        let isValid = true;

        if (!email || !validateEmail(email)) {
          emailInput.classList.add("touched");
          showError(
            emailInput,
            emailError,
            "Please enter a valid email address",
          );
          isValid = false;
        } else {
          clearError(emailInput, emailError);
        }

        if (!message || !validateMessage(message)) {
          messageInput.classList.add("touched");
          showError(
            messageInput,
            messageError,
            "Message must be at least 10 characters long",
          );
          isValid = false;
        } else {
          clearError(messageInput, messageError);
        }

        if (!isValid) {
          formMessages.className = "error";
          formMessages.textContent = "Please fix the errors before submitting.";
          formMessages.focus();
          return;
        }

        // Show loading state
        submitBtn.disabled = true;
        buttonText.style.display = "none";
        buttonLoader.style.display = "inline-block";
        submitBtn.setAttribute("aria-busy", "true");

        try {
          const formData = new FormData(contactForm);
          const response = await fetch(contactForm.action, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
            },
          });

          if (response.ok) {
            // Success - reset form and show success message
            formMessages.className = "success";
            formMessages.textContent =
              "Thank you! Your message has been sent successfully. I'll get back to you soon.";
            contactForm.reset();
            clearError(emailInput, emailError);
            clearError(messageInput, messageError);
            emailInput.classList.remove("touched");
            messageInput.classList.remove("touched");
            emailInput.focus();
          } else {
            // Handle API error response
            const data = await response.json().catch(() => ({}));
            throw new Error(
              data.error || "Something went wrong. Please try again.",
            );
          }
        } catch (error) {
          // Handle network errors or API failures
          formMessages.className = "error";
          formMessages.textContent =
            error.message ||
            "There was an error sending your message. Please try again or contact me directly via email.";
        } finally {
          // Always reset loading state
          submitBtn.disabled = false;
          buttonText.style.display = "inline-block";
          buttonLoader.style.display = "none";
          submitBtn.setAttribute("aria-busy", "false");

          // Focus on message area for accessibility
          if (formMessages.textContent) {
            formMessages.focus();
          }
        }
      });
    } catch (error) {
      console.error("Error initializing contact form:", error);
    }
  }
});
