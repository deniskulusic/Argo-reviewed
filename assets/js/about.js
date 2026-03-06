(function () {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If user prefers reduced motion, skip Lenis entirely (accessibility first)
    if (prefersReduced) {
        console.info('[Lenis] Disabled due to prefers-reduced-motion.');
        document.documentElement.style.scrollBehavior = 'smooth';
        return;
    }

    if (typeof window.Lenis !== 'function') {
        console.warn('[Lenis] CDN failed or unavailable. Falling back to native scrolling.');
        return;
    }

    // Initialize Lenis
    const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lerp: 0.1,
        smoothWheel: true,
        smoothTouch: false,
        // allow native scroll in nested scroll areas
        autoRaf: true,
    });

    document.querySelector('.menu-div').setAttribute('data-lenis-prevent', '')
    // Collect targets
    const textEls = Array.from(document.querySelectorAll('.reveal-text'));
    const imageEls = Array.from(document.querySelectorAll('.reveal-image'));
    const targets = [...textEls, ...imageEls];


    // Optional: lightweight stagger for siblings
    const applyStagger = (els, base = 70) => {
        els.forEach((el, i) => {
            if (!el.matches('.reveal-text')) return;
            el.dataset.stagger = "1";
            el.style.setProperty('--stagger', `${i * base}ms`);
        });
    };

    // Group consecutive reveal-text siblings for nicer stagger
    let group = [];
    const flushGroup = () => { if (group.length) { applyStagger(group); group = []; } };
    textEls.forEach((el, i) => {
        const prev = textEls[i - 1];
        if (prev && prev.parentElement === el.parentElement) {
            group.push(el);
            if (!group.includes(prev)) group.unshift(prev);
        } else {
            flushGroup();
            group = [el];
        }
    });
    flushGroup();

    // If reduced motion, just mark them visible and bail
    if (prefersReduced) {
        targets.forEach(el => el.classList.add('is-inview'));
        return;
    }

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
                // Unobserve once revealed (one-time animation)
                obs.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        // Reveal a bit before fully on screen for a snappier feel
        rootMargin: '0px 0px -15% 0px',
        threshold: 0.12
    });

    targets.forEach(t => io.observe(t));

    // Optional: if you use Lenis, ensure IO gets regular rAF ticks (helps on some mobile browsers)
    // Your rAF already runs; but we can ping IO’s internal checks during scroll:
    if (window.__lenis) {
        window.__lenis.on('scroll', () => { /* no-op; forces layout/paint cadence with Lenis */ });
    }


    const VH = () => window.innerHeight || document.documentElement.clientHeight;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const items = Array.from(document.querySelectorAll('.s-a-a-7-holder , .s-a-a-6-bottom-left'))
        .map(el => {
            const picture = el.querySelector('picture');
            const img = picture && picture.querySelector('img');
            if (!picture || !img) return null;

            const scale = parseFloat(img.dataset.scale || el.dataset.scale || 1.2);
            return {
                el, img, scale,
                height: 0,
                top: 0,
                extra: 0
            };
        })
        .filter(Boolean);

    const measure = () => {
        items.forEach(it => {
            const rect = it.el.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            it.height = rect.height;
            it.top = rect.top + scrollY;
            it.extra = (it.scale - 1) * it.height;
        });
    };

    measure();
    window.addEventListener('resize', () => requestAnimationFrame(measure), { passive: true });

    // ✅ This is what the raf() will call
    window.updateParallax = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const vh = VH();

        items.forEach(it => {
            const start = it.top - vh;
            const end = it.top + it.height;
            const t = clamp((scrollY - start) / (end - start), 0, 1);
            const y = (0.5 - t) * it.extra;

            it.img.style.setProperty('--s', it.scale);
            it.img.style.setProperty('--y', `${y}px`);
        });
    };

    // rAF loop — drives Lenis updates
    function raf(time) {
        lenis.raf(time);

        // ✅ add this new line
        if (window.updateParallax) window.updateParallax();

        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Optional: scroll to hash on load if URL contains one (with header offset)
    const stickyOffset = 64; // header height in px
    if (window.location.hash) {
        const el = document.querySelector(window.location.hash);
        if (el) {
            setTimeout(() => lenis.scrollTo(el, { offset: -stickyOffset }), 50);
        }
    }

    // Enhance all in-page anchor links to use Lenis
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const el = document.querySelector(targetId);
            if (!el) return;
            e.preventDefault();
            lenis.scrollTo(el, { offset: -stickyOffset });
            history.pushState(null, '', targetId); // optional
        });
    });

    // Expose for debugging in the console
    window.__lenis = lenis;









    /* ===== BASIC ===== */
    let WindowHeight = window.innerHeight;
    const header = document.querySelector('header');
    const nav = document.querySelector('.menu-full');

    if (header) header.classList.add('header-loaded');
    if (nav) nav.classList.add('nav-loaded');
    console.log("yo")

    /* ===== ANY ANIMATION LOGIC ===== */

    let PreFooter = document.querySelector('.s-a-a-1');
    let PreFooterElements = document.querySelectorAll('.s-a-a-1-right , .s-a-a-1-left-wrapper');
    let PreFooterFromTop = window.pageYOffset + PreFooter.getBoundingClientRect().top;
    window.addEventListener("resize", function () {
        PreFooterFromTop = window.pageYOffset + PreFooter.getBoundingClientRect().top;
    });


    const factors = [0.15, 0.35];
    // 1. Define your boundaries
    const maxW = 1920;
    const minW = 850;
    let responsiveScale = 1; // Default to 1x

    // 2. Calculate the scale based on current width
    if (window.innerWidth >= maxW) {
        responsiveScale = 1;
    } else if (window.innerWidth <= minW) {
        responsiveScale = 0.5;
    } else {
        // Calculate percentage of width between 850 and 1920
        const percentage = (window.innerWidth - minW) / (maxW - minW);
        // Map that percentage to the 0.5 - 1.0 range
        responsiveScale = 0.5 + (percentage * 0.5);
    }



    // Parallax via [data-lenis-speed]
    const SCALE = 0.1;
    lenis.on('scroll', ({ scroll }) => {

        if (scroll > WindowHeight - 100) {
            document.querySelector(".menu-full").classList.add("menu-filled")
            document.querySelector(".menu-full").classList.add("inverted")
        }
        else {
            document.querySelector(".menu-full").classList.remove("menu-filled")
            document.querySelector(".menu-full").classList.remove("inverted")
        }


        /*
        const viewportTop = scroll;
        let insideGrow = false;
    
        growSection.forEach(section => {
            const rectTop = section.offsetTop;
            const rectBottom = rectTop + section.offsetHeight;
    
            // Check if viewport top is inside the section boundaries
            if (viewportTop >= rectTop && viewportTop < rectBottom) {
            insideGrow = true;
            }
        });
        
    
        // Toggle the class
        if (insideGrow) {
            menu.classList.add('menu-hidden');
        } else {
            menu.classList.remove('menu-hidden');
        }
        */

        document.querySelectorAll('[data-lenis-speed]').forEach((el) => {
            const speed = parseFloat(el.dataset.lenisSpeed) || 0;
            if (scroll < 1.5 * WindowHeight)
                el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;
        });


        // 3. Check Visibility
        if (PreFooter.getBoundingClientRect().top - 1.5 * WindowHeight < 0 &&
            PreFooter.getBoundingClientRect().top + PreFooter.clientHeight + 0.5 * WindowHeight > 0) {

            // Loop through the elements
            // Assuming PreFooterElements is a NodeList or Array
            for (let i = 0; i < PreFooterElements.length; i++) {
                if (factors[i] !== undefined) {
                    // Calculate distance
                    let val = factors[i] * responsiveScale * (PreFooterFromTop - scroll);

                    // Apply style directly (more performant than .animate)
                    PreFooterElements[i].style.transform = "translateY(" + val + "px)";
                }
            }
        }

    });





    const acordation = document.getElementsByClassName('faq');

    for (i = 0; i < acordation.length; i++) {

        acordation[i].addEventListener('click', function () {
            var faqa = this.classList.contains("active");
            var elems = document.querySelectorAll(".faq.active");
            setTimeout(() => lenis.resize(), 550);


            [].forEach.call(elems, function (el) {
                el.classList.remove("active");
            });

            if (faqa) {
                this.classList.remove("active");
            }
            else {
                this.classList.add("active");
            }
        })
    }

    
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationContainer = document.getElementById('pagination');
    const touchArea = document.getElementById('touchArea');

    let currentIndex = 0;
    let isAnimating = false;
    let touchStartX = 0;
    let touchEndX = 0;

    // 1. Initialization
    slides.forEach((slide, index) => {
        if (index === 0) {
            slide.style.transform = 'translateX(0%)';
        } else {
            slide.style.transform = 'translateX(100%)';
        }
    });

    // TEXT PAGINATION
const textPagination = document.querySelectorAll('#textPagination h4');

// Initialize first as active
textPagination[0].classList.add('active');

// Replace dot update with text update:
function updateTextPagination(newIndex) {
    textPagination.forEach(item => item.classList.remove('active'));
    textPagination[newIndex].classList.add('active');
}

// Add click listeners
textPagination.forEach((item) => {
    item.addEventListener('click', () => {
        const index = Number(item.dataset.index);
        if (index !== currentIndex && !isAnimating) {
            const direction = index > currentIndex ? 'next' : 'prev';
            handleSlideChange(direction, index);
        }
    });
});

    // 3. Main Slide Logic
    function handleSlideChange(direction, specificIndex = null) {
        if (isAnimating) return;
        isAnimating = true;

        const outgoing = slides[currentIndex];
        let incomingIndex;

        if (specificIndex !== null) {
            incomingIndex = specificIndex;
        } else {
            if (direction === 'next') {
                incomingIndex = (currentIndex + 1) % slides.length;
            } else {
                incomingIndex = (currentIndex - 1 + slides.length) % slides.length;
            }
        }

        const incoming = slides[incomingIndex];

        // --- A. Setup Incoming Slide ---
        incoming.style.transition = 'none'; // Disable transition for instant placement

        if (direction === 'next') {
            incoming.style.transform = 'translateX(100%)';
        } else {
            incoming.style.transform = 'translateX(-100%)';
        }

        // Force reflow
        void incoming.offsetWidth;

        // --- B. Execute Animation ---
        incoming.style.transition = 'transform 800ms cubic-bezier(.215, .61, .355, 1)';
        outgoing.style.transition = 'transform 800ms cubic-bezier(.215, .61, .355, 1)';

        incoming.style.transform = 'translateX(0%)';

        if (direction === 'next') {
            outgoing.style.transform = 'translateX(-100%)';
        } else {
            outgoing.style.transform = 'translateX(100%)';
        }

        // Update Dots
        updateTextPagination(incomingIndex);

        // --- C. Cleanup ---
        setTimeout(() => {
            currentIndex = incomingIndex;
            isAnimating = false;
        }, 600);
    }

    // Event Listeners
    nextBtn.addEventListener('click', () => handleSlideChange('next'));
    prevBtn.addEventListener('click', () => handleSlideChange('prev'));

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') handleSlideChange('next');
        if (e.key === 'ArrowLeft') handleSlideChange('prev');
    });

    // Touch
    touchArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    touchArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            handleSlideChange('next');
        }
        if (touchEndX > touchStartX + threshold) {
            handleSlideChange('prev');
        }
    }

    const menuBtn = document.querySelector(".han-menu-full");
const menuBg = document.querySelector(".menu-bg");
const menuFULL = document.querySelector(".menu-full");

// Define mobile breakpoint
const isMobile = window.innerWidth < 768;

if (menuBtn && menuFULL && menuBg) {
  menuBtn.addEventListener("click", () => {
    const isActive = menuFULL.classList.toggle("menu-active");
    menuBg.classList.toggle("menu-active-bg");

    if (!isMobile && typeof lenis !== "undefined") {
      // Desktop → control Lenis
      isActive ? lenis.stop() : lenis.start();
      consoloe.log("lenis active")
    } else {
      // Mobile → fallback scroll lock
      document.body.style.overflow = isActive ? "hidden" : "";
      document.documentElement.style.overflow = isActive ? "hidden" : "";
      console.log("lenis not active")
    }
  });
}


    const accordionTop = document.querySelector('.s-a-a-4-acordation-top');
    const accordionBottom = document.querySelector('.s-a-a-4-acordation-bottom');
    const tabHeaders = document.querySelectorAll('.s-a-a-4-acordation-bottom-top-element');
    const tabContents = document.querySelectorAll('.s-a-a-4-acordation-bottom-bottom');

    // Helper function to update height
    function updateAccordionHeight() {
        // Only update if the accordion is currently open (has a max-height set)
        if (accordionBottom.style.maxHeight) {
            accordionBottom.style.maxHeight = accordionBottom.scrollHeight + "px";
        }
    }

    // --- PART 1: Accordion Toggle ---
    accordionTop.addEventListener('click', function () {
        this.classList.toggle('active');

        if (accordionBottom.style.maxHeight) {
            accordionBottom.style.maxHeight = null; // Close
        } else {
            accordionBottom.style.maxHeight = accordionBottom.scrollHeight + "px"; // Open
        }
    });

    // --- PART 2: Inner Tabs Switching ---
    tabHeaders.forEach((header, index) => {
    header.addEventListener('click', () => {
        // 1. Get the current visual height before changing anything
        const startHeight = accordionBottom.scrollHeight;
        
        // 2. Lock the height explicitly to prevent the "snap"
        accordionBottom.style.height = startHeight + "px";

        // 3. Perform the Tab Switch
        tabHeaders.forEach(h => h.classList.remove('s-a-a-4-acordation-bottom-top-element-active'));
        tabContents.forEach(c => c.classList.remove('s-a-a-4-acordation-bottom-bottom-active'));
        
        header.classList.add('s-a-a-4-acordation-bottom-top-element-active');
        if (tabContents[index]) {
            tabContents[index].classList.add('s-a-a-4-acordation-bottom-bottom-active');
        }

        // 4. Calculate the new height required
        // We temporarily set height to auto to measure the new content, then immediately set it back
        accordionBottom.style.height = 'auto';
        const newHeight = accordionBottom.scrollHeight;
        accordionBottom.style.height = startHeight + "px"; // Reset to start height instantly

        // 5. Trigger the animation in the next frame
        requestAnimationFrame(() => {
            // Force a browser reflow so it acknowledges the start height
            accordionBottom.offsetHeight; 
            
            // Set both height and max-height to the new value to trigger transition
            accordionBottom.style.height = newHeight + "px";
            accordionBottom.style.maxHeight = newHeight + "px";
        });

        // 6. Cleanup after transition (approx 400ms matches CSS transition)
        // This sets height back to 'auto' so the accordion stays responsive to window resizing
        setTimeout(() => {
            accordionBottom.style.height = null; 
        }, 400); 
    });
});

    // --- PART 3: Window Resize Handler (The New Fix) ---
    window.addEventListener('resize', function () {
        // If the accordion is open, recalculate the height as the window changes size
        updateAccordionHeight();
    });

    // Select all tab buttons and content areas
    const tabs = document.querySelectorAll('.s-a-a-6-top-element');
    const contents = document.querySelectorAll('.s-a-a-6-bottom');

    // Loop through each tab to add a click event listener
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {

            // 1. Deactivate all tabs
            tabs.forEach(t => t.classList.remove('s-a-a-6-top-element-active'));

            // 2. Activate the clicked tab
            tab.classList.add('s-a-a-6-top-element-active');

            // 3. Hide all content areas
            contents.forEach(c => c.classList.remove('s-a-a-6-bottom-active'));

            // 4. Show the content area that matches the index of the clicked tab
            if (contents[index]) {
                contents[index].classList.add('s-a-a-6-bottom-active');
            }
            lenis.resize();
        });
    });


    // Select all videos: The header ones AND the section one
    // We select .hero-video (header) and .video-on-scroll (your previous section)
    const videos = document.querySelectorAll("video");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // "target" is the specific video element being watched
            const video = entry.target;

            if (entry.isIntersecting) {
                // Video is in view: Play it
                // We add a safety check to ensure we don't play hidden (display:none) videos
                if (video.offsetWidth > 0 && video.offsetHeight > 0) {
                    video.play().catch(e => console.log("Auto-play prevented"));
                }
            } else {
                // Video went off screen: Pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.1 // Trigger as soon as 10% of the video is visible/hidden
    });

    // Attach the observer to every video found
    videos.forEach((video) => {
        observer.observe(video);
    });

    /* ================= GALLERY LOGIC (DYNAMIC REUSABLE) ================= */
    (function () {
        // DOM elements
        const gallery = document.querySelector('.fullscreen-gallery');
        // Safety check if gallery HTML exists
        if (!gallery) return;

        const galleryTrack = gallery.querySelector('.gallery-track');
        const closeBtn = gallery.querySelector('.gallery-close-btn');
        const prevBtn = gallery.querySelector('.gallery-prev');
        const nextBtn = gallery.querySelector('.gallery-next');
        const galleryCounter = gallery.querySelector('.gallery-counter');

        // State
        let currentIndex = -1;
        let totalSlides = 0;
        const TRANSITION_DURATION = 700;

        // 1. Build slides based on passed Array of URLs
        function buildGallerySlides(imgUrls) {
            galleryTrack.innerHTML = ''; // Clear existing content
            totalSlides = imgUrls.length;

            imgUrls.forEach(url => {
                const slide = document.createElement('div');
                slide.classList.add('gallery-slide');
                // Create image
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Gallery image';
                // Append
                slide.appendChild(img);
                galleryTrack.appendChild(slide);
            });
        }

        // 2. Update the gallery view
        function updateGallery(immediate = false) {
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex >= totalSlides) currentIndex = totalSlides - 1;

            const offset = currentIndex * -100; // vw unit
            galleryTrack.style.transitionDuration = immediate ? '0ms' : `${TRANSITION_DURATION}ms`;
            galleryTrack.style.transform = `translateX(${offset}vw)`;

            // Update buttons and counter
            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex === totalSlides - 1;
            if (galleryCounter) galleryCounter.textContent = `${currentIndex + 1}/${totalSlides}`;
        }

        // 3. Close Function
        function closeGallery() {
            gallery.classList.remove('is-open');
            gallery.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        // 4. Navigation
        function navigate(direction) {
            let newIndex = currentIndex + direction;
            if (newIndex >= 0 && newIndex < totalSlides) {
                currentIndex = newIndex;
                updateGallery(false);
            }
        }

        // --- Event Listeners ---
        if (closeBtn) closeBtn.addEventListener('click', closeGallery);
        if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

        document.addEventListener('keydown', (e) => {
            if (!gallery.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeGallery();
            else if (e.key === 'ArrowLeft') navigate(-1);
            else if (e.key === 'ArrowRight') navigate(1);
        });
// ============================================
  //   NEW: SWIPE LOGIC FOR GALLERY
  // ============================================
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 50;

  // Attach touch listeners to the main gallery container
  gallery.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  gallery.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    
    // Swipe LEFT -> Go Next
    if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
      navigate(1); 
    }
    
    // Swipe RIGHT -> Go Prev
    if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
      navigate(-1);
    }
  }, { passive: true });
        // --- EXPOSE TO WINDOW ---
        // This allows Section 2 to call this function
        window.openGlobalGallery = function (imageUrls, startIndex) {
            if (!imageUrls || !imageUrls.length) return;

            // 1. Build the track with the specific images from the section
            buildGallerySlides(imageUrls);

            // 2. Set index
            currentIndex = startIndex;

            // 3. Open UI
            gallery.classList.add('is-open');
            gallery.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // 4. Position immediately
            updateGallery(true);
        };
        // 1. Target the specific section and its image containers
        const sectionElements = document.querySelectorAll('.s-a-a-5 .s-a-a-5-element');

        // Safety check
        if (sectionElements.length === 0) return;

        // 2. Build the array of Image URLs from this specific section
        // We look inside each element to find the <img> tag
        const imageUrls = Array.from(sectionElements).map(element => {
            const img = element.querySelector('img');
            return img ? img.currentSrc || img.src : '';
        });

        // 3. Attach Click Event Listeners
        sectionElements.forEach((element, index) => {
            element.addEventListener('click', function () {
                // Call the global function you defined previously
                // Passing the array of URLs and the index of the clicked image
                if (window.openGlobalGallery) {
                    window.openGlobalGallery(imageUrls, index);
                } else {
                    console.error("Gallery function not found");
                }
            });
        });
    })();
})();
