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

    const items = Array.from(document.querySelectorAll('.blog-header-img'))
        .map(el => {
            const picture = el.querySelector('picture');
            const img = picture && picture.querySelector('img');
            if (!picture || !img) return null;

            const scale = parseFloat(img.dataset.scale || el.dataset.scale || 1.2);

            img.style.willChange = 'transform';

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

    const update = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const vh = VH();

        items.forEach(it => {
            const distanceFromTop = it.top - scrollY;
            const totalDistance = vh + it.height;
            const distanceCovered = vh - distanceFromTop;

            const percent = clamp(distanceCovered / totalDistance, 0, 1);

            // Scale Logic: Still goes from 1.2 -> 1.0
            const currentScale = it.scale - ((it.scale - 1) * percent);

            // UPDATED Translate Logic: Goes from Negative -> Positive
            // Start: - (extra / 2)
            // End:   + (extra / 2)
            const translateRange = it.extra;
            const translateY = -(translateRange / 2) + (translateRange * percent);

            it.img.style.transform = `translate3d(0, ${translateY}px, 0) scale(${currentScale})`;
        });

        requestAnimationFrame(update);
    };

    window.addEventListener('resize', measure);
    window.addEventListener('load', () => {
        measure();
        update();
    });
    measure();
    update();

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

    let WindowHeight = window.innerHeight;
    const SCALE = 0.1;
    lenis.on('scroll', ({ scroll }) => {
    const isMobile = window.innerWidth <= 768; // you can adjust the breakpoint
  const threshold = isMobile ? 0.8 * WindowHeight : 0.7 * WindowHeight - 80;

  // Toggle inverted class
  if (scroll > threshold) {
    document.querySelector(".menu-full").classList.add("inverted");
  } else {
    document.querySelector(".menu-full").classList.remove("inverted");
  }
    document.querySelectorAll('[data-lenis-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.lenisSpeed) || 0;
      if (scroll < 1.5 * WindowHeight)
        el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;




    });
  });


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
    const header = document.querySelector('header');
    const nav = document.querySelector('.menu-full');
    const revealFirst2 = document.querySelectorAll('.reveal-first-2');

    if (header) header.classList.add('header-loaded');
    if (nav) nav.classList.add('nav-loaded');
    revealFirst2.forEach((e) => {
        e.classList.add('reveal-first-2-loaded');
    })


})();

