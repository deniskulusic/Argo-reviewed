(function () {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If user prefers reduced motion, skip Lenis entirely (accessibility first)
    if (prefersReduced) {
        console.info('[Lenis] Disabled due to prefers-reduced-motion.');
        document.documentElement.style.scrollBehavior = 'smooth';
        // Mark reveal elements as visible immediately
        document.querySelectorAll('.reveal-text, .reveal-image').forEach(el => el.classList.add('is-inview'));
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

    const menuDiv = document.querySelector('.menu-div');
    if (menuDiv) menuDiv.setAttribute('data-lenis-prevent', '');


    // ============================================
    //   ANIMATION / REVEAL LOGIC
    // ============================================

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
    if (window.__lenis) {
        window.__lenis.on('scroll', () => { /* no-op; forces layout/paint cadence with Lenis */ });
    }

    // ============================================
    //   HEADER PARALLAX & MENU STYLING
    // ============================================
    const SCALE = 0.1;
    const WindowHeight = window.innerHeight;

    lenis.on('scroll', ({ scroll }) => {

        // Toggle menu background/style on scroll
        const menuFull = document.querySelector(".menu-full");
        if (menuFull) {
            if (scroll > WindowHeight - 100) {
                menuFull.classList.add("menu-filled")
                menuFull.classList.add("inverted")
            } else {
                menuFull.classList.remove("menu-filled")
                menuFull.classList.remove("inverted")
            }
        }

        // Apply Parallax to [data-lenis-speed] elements (like header text)
        document.querySelectorAll('[data-lenis-speed]').forEach((el) => {
            const speed = parseFloat(el.dataset.lenisSpeed) || 0;
            // Only apply if near the top
            if (scroll < 1.5 * WindowHeight)
                el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;
        });

    });

    // ============================================
    //   MENU TOGGLE LOGIC
    // ============================================
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
            } else {
                // Mobile → fallback scroll lock
                document.body.style.overflow = isActive ? "hidden" : "";
                document.documentElement.style.overflow = isActive ? "hidden" : "";
            }
        });
    }


    // ============================================
    //   VIDEO AUTO-PLAY
    // ============================================
    const videos = document.querySelectorAll("video");
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (video.offsetWidth > 0 && video.offsetHeight > 0) {
                    video.play().catch(e => console.log("Auto-play prevented"));
                }
            } else {
                video.pause();
            }
        });
    }, {
        threshold: 0.1
    });
    videos.forEach((video) => {
        videoObserver.observe(video);
    });


    // ============================================
    //   LENIS RAF LOOP
    // ============================================
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Expose for debugging
    window.__lenis = lenis;

    // Header loaded class
    const header = document.querySelector('header');
    const nav = document.querySelector('.menu-full');
    if (header) header.classList.add('header-loaded');
    if (nav) nav.classList.add('nav-loaded');

})();

