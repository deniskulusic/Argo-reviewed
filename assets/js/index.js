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

  if (!targets.length) return;

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
  // Your rAF already runs; but we can ping IOâ€™s internal checks during scroll:
  if (window.__lenis) {
    window.__lenis.on('scroll', () => { /* no-op; forces layout/paint cadence with Lenis */ });
  }


  const VH = () => window.innerHeight || document.documentElement.clientHeight;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const items = Array.from(document.querySelectorAll('.section-3-element-holder , .section-7-holder , .section-10-img-holder , .blog-element-holder ,.section-argo-1-right-holder , .section-argo-2-img'))
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

  // âœ… This is what the raf() will call
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





  // rAF loop â€” drives Lenis updates
  function raf(time) {
    lenis.raf(time);

    // âœ… add this new line
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
  let Section6 = document.querySelector('.section-6');
  let Section6Elements = document.querySelectorAll('.section-6-element');
  let Section6ImgsFromTop = Section6 ? window.pageYOffset + Section6.getBoundingClientRect().top : 0;
  const menu = document.querySelector('.menu-full');
  const growSection = document.querySelectorAll('.grow-section');
  let SectionArgo2 = document.querySelector(".section-argo-2-img");
  let SectionArgo2FromTop = SectionArgo2 ? window.pageYOffset + SectionArgo2.getBoundingClientRect().top : 0;
  /*
  let PreFooter = document.querySelector('.pre-footer');
  let PreFooterElements = document.querySelectorAll('.image-group div');
  let PreFooterFromTop = window.pageYOffset + PreFooter.getBoundingClientRect().top;
  */

  let translation = 0;
  // 2. Define the unique speed for each element (based on your snippet)
  const factors = [0.22, 0.15, 0.08, 0.15, 0.22];
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


  window.addEventListener("resize", function () {
    /*
  PreFooterFromTop = window.pageYOffset + PreFooter.getBoundingClientRect().top;
  */
    if (SectionArgo2) SectionArgo2FromTop = window.pageYOffset + SectionArgo2.getBoundingClientRect().top;
    if (Section6) Section6ImgsFromTop = window.pageYOffset + Section6.getBoundingClientRect().top;
  });



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


    // Top of the screen (0px offset)
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

    document.querySelectorAll('[data-lenis-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.lenisSpeed) || 0;
      if (scroll < 1.5 * WindowHeight)
        el.style.transform = `translate3d(0, ${scroll * speed * SCALE}px, 0)`;




    });
    /*
        if (Section6.getBoundingClientRect().top - 1.5*WindowHeight < 0 && Section6.getBoundingClientRect().top + Section6.clientHeight + 0.5*WindowHeight  > 0) {
            Section6Elements[0].animate({
              transform: "translateY(" + (0.08 * (Section6ImgsFromTop - scroll)) + "px )"
            }, { duration: 1500, fill: "forwards" });
            Section6Elements[1].animate({
              transform: "translateY(" + (0.15 * (Section6ImgsFromTop - scroll)) + "px )"
            }, { duration: 1500, fill: "forwards" });
            Section6Elements[2].animate({
              transform: "translateY(" + (0.22 * (Section6ImgsFromTop - scroll)) + "px )"
            }, { duration: 1500, fill: "forwards" });
            
        }
    */

    /*
      if (SectionArgo2.getBoundingClientRect().top - WindowHeight < 0 && SectionArgo2.getBoundingClientRect().top + SectionArgo2.clientHeight > 0) {
          SectionArgo2.animate({
            transform: "translateY(" + (-0.1 * (SectionArgo2FromTop - scroll)) + "px )"
          }, { duration: 1500, fill: "forwards" });
      }
          */

    if (SectionArgo2) {
      translation = -0.1 * responsiveScale * (SectionArgo2FromTop - scroll);
      SectionArgo2.style.transform = "translateY(" + translation + "px)";
    }

    /*
    
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
    */
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



  /* =======================================================
          // 1. SHARED CURSOR LOGIC (for the main slider)
          // ======================================================= */
  const cursor = document.createElement('div');
  cursor.className = 'drag-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  // MODIFICATION: Add plus icon and ring elements
  cursor.innerHTML = `
    <span class="label">scroll</span>
    <span class="plus-icon">+</span>
    <div class="ring" aria-hidden="true"></div>
`;
  document.body.appendChild(cursor);

  let cursorRAF = null;
  let cursorX = 0, cursorY = 0;
  let targetX = 0, targetY = 0;
  let cursorScale = 1, targetScale = 1;

  function showCursor() { cursor.classList.add('show'); if (cursorRAF == null) cursorLoop(); }
  function hideCursor() { cursor.classList.remove('show'); if (cursorRAF != null) { cancelAnimationFrame(cursorRAF); cursorRAF = null; } }

  function cursorLoop() {
    cursorX += (targetX - cursorX) * 0.18;
    cursorY += (targetY - cursorY) * 0.18;
    cursorScale += (targetScale - cursorScale) * 0.15;
    // Use style properties for smooth transformation
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursor.style.transform = `translate(-50%, -50%) scale(${cursorScale})`;
    cursorRAF = requestAnimationFrame(cursorLoop);
  }
  window.addEventListener('touchstart', () => hideCursor(), { passive: true });

  // Helper to set cursor mode
  function setCursorMode(mode) {
    cursor.classList.remove('cursor-mode-drag', 'cursor-mode-scroll', 'cursor-mode-plus');
    cursor.classList.add(`cursor-mode-${mode}`);
    // Update label text
    if (mode === 'drag' || mode === 'scroll') {
      cursor.querySelector('.label').textContent = mode;
    }
  }


  /* =======================================================
      // 2. PROGRESS BAR LOGIC (Independent)
      // ======================================================= 
  
  const currentSlideCountEl = document.getElementById('currentSlideCount');
  const totalSlideCountEl = document.getElementById('totalSlideCount');
  const progressBarIndicator = document.getElementById('progressBarIndicator');
  
  function updateProgressBarUI(currentIndex, totalSlides) {
      if (totalSlides === 0) return;
      
      const current = currentIndex + 1;
      // Calculate progress percentage: the bar should fully fill on the LAST slide
      const progress = (current / totalSlides) * 100;
  
      // Update text counts
      currentSlideCountEl.textContent = "0" + current;
      totalSlideCountEl.textContent = "0" + totalSlides;
  
      // Update progress indicator width
      progressBarIndicator.style.width = `${progress}%`;
  }
  */

  /* =======================================================
      // 3. MAIN SLIDER FUNCTIONALITY (Drag & Snap)
      // ======================================================= */

  function initSlider(root) {
    const viewport = root.querySelector('.slider-viewport');
    const track = root.querySelector('.slider-track');
    const btnPrev = root.querySelector('.slider-btn.prev');
    const btnNext = root.querySelector('.slider-btn.next');
    const cards = Array.from(root.querySelectorAll('.card'));

    if (!viewport || !track) return;

    const isButtonsOnly = root.classList.contains('buttons-only');
    const dragEnabled = !isButtonsOnly && root.dataset.drag !== 'false';

    let offset = 0;
    let baseOffset = 0;
    let maxScroll = 0;
    let stops = [];
    let momentumRAF = null;

    function measure() {
      const viewW = viewport.clientWidth;

      if (cards.length === 0) {
        baseOffset = 0;
        maxScroll = 0;
        stops = [0];
        return;
      }

      const first = cards[0];
      const last = cards[cards.length - 1];

      const csFirst = getComputedStyle(first);
      const csLast = getComputedStyle(last);

      // Calculate total track width and offsets
      const firstLeftOuter = first.offsetLeft - (parseFloat(csFirst.marginLeft) || 0);
      const lastRightOuter = last.offsetLeft + last.offsetWidth + (parseFloat(csLast.marginRight) || 0);
      const totalWidth = lastRightOuter - firstLeftOuter;

      baseOffset = -firstLeftOuter;
      maxScroll = Math.max(0, totalWidth - viewW);

      // Precompute snap positions (aligned to the left edge of each card)
      stops = cards.map(card => {
        const cs = getComputedStyle(card);
        const leftOuter = card.offsetLeft - (parseFloat(cs.marginLeft) || 0);
        return clamp(-leftOuter); // Ensure stops are clamped
      });

      // Keep offset within bounds
      offset = clamp(offset);
    }

    function clamp(x) {
      const min = baseOffset - maxScroll;
      const max = baseOffset;
      return Math.max(min, Math.min(max, x));
    }

    function render() {
      track.style.transform = `translateX(${offset}px)`;

      // Update buttons
      if (btnPrev) btnPrev.disabled = (offset >= baseOffset - 0.5);
      if (btnNext) btnNext.disabled = (offset <= (baseOffset - maxScroll) + 0.5);

      // Update Progress Bar
      let currentIndexForProgress = 0;
      // Find the index of the card whose stop position is closest to the current offset
      let minDiff = Infinity;
      let closestIndex = 0;

      stops.forEach((stop, index) => {
        const diff = Math.abs(stop - offset);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });

      /*  updateProgressBarUI(closestIndex, cards.length);*/
    }

    function update() {
      measure();
      // Initial run: align to base offset (first card)
      if (Math.abs(offset) < 0.001 && Math.abs(baseOffset) > 0.001) {
        offset = baseOffset;
      }
      render();
    }

    // Snap logic: Find the next/previous *full card* stop position
    function findNextStop(current) {
      const currentCardIndex = stops.findIndex(s => Math.abs(s - current) < 1);
      if (currentCardIndex !== -1 && currentCardIndex < stops.length - 1) {
        return stops[currentCardIndex + 1];
      }
      // Find the first card stop position *to the left* of the current position (if not currently snapped)
      let nextStop = current;
      for (let i = stops.length - 1; i >= 0; i--) {
        if (stops[i] < current - 1) { // Stop is further left than current view
          nextStop = stops[i];
          break;
        }
      }
      return clamp(nextStop);
    }

    function findPrevStop(current) {
      const currentCardIndex = stops.findIndex(s => Math.abs(s - current) < 1);
      if (currentCardIndex > 0) {
        return stops[currentCardIndex - 1];
      }
      // Find the first card stop position *to the right* of the current position (if not currently snapped)
      let prevStop = current;
      for (let i = 0; i < stops.length; i++) {
        if (stops[i] > current + 1) { // Stop is further right than current view
          prevStop = stops[i];
          break;
        }
      }
      return clamp(prevStop);
    }

    function next() {
      offset = findNextStop(offset);
      render();
    }
    function prev() {
      offset = findPrevStop(offset);
      render();
    }

    // Attach button listeners
    if (btnNext) btnNext.addEventListener('click', next);
    if (btnPrev) btnPrev.addEventListener('click', prev);

    // Resize & Load handling
    const roViewport = new ResizeObserver(update);
    const roTrack = new ResizeObserver(update);
    roViewport.observe(viewport);
    roTrack.observe(track);
    window.addEventListener('load', update);
    update();


    /* --- Cursor and Dragging Logic (From User Input) --- */

    if (isButtonsOnly) {
      viewport.addEventListener('pointerenter', () => {
        showCursor();
        setCursorMode('plus');
      });
      viewport.addEventListener('pointerleave', () => {
        hideCursor();
        targetScale = 1;
      });
      viewport.addEventListener('pointermove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      });
      return;
    }

    // ======= Dragging only if enabled =======
    if (!dragEnabled) return;

    let isDragging = false;
    let hasDragged = false;
    let startX = 0, startOffset = 0, lastX = 0, lastTs = 0, velocity = 0;
    const DRAG_THRESHOLD = 3;

    function stopMomentum() { if (momentumRAF != null) cancelAnimationFrame(momentumRAF); momentumRAF = null; }
    function startMomentum() {
      stopMomentum();

      // MODIFICATION: Increased decay from 0.95 to 0.975
      // This allows the slider to glide further after a swipe on mobile
      const decay = 0.975;

      const minVel = 0.05;
      const frame = () => {
        velocity *= decay;
        if (Math.abs(velocity) < minVel) { stopMomentum(); return; }

        // Apply momentum
        offset = clamp(offset + velocity * 16);
        render();

        if (offset === 0 || offset === (baseOffset - maxScroll)) {
          velocity = 0;
          stopMomentum();
          return;
        }
        momentumRAF = requestAnimationFrame(frame);
      };
      momentumRAF = requestAnimationFrame(frame);
    }

    // Cursor bubble (only for draggable sliders)
    viewport.addEventListener('pointerenter', () => {
      showCursor();
      setCursorMode('scroll');
    });
    viewport.addEventListener('pointerleave', () => { hideCursor(); targetScale = 1; });
    viewport.addEventListener('pointermove', (e) => { targetX = e.clientX; targetY = e.clientY; });

    let dragTarget = null;

    // Pointer events for drag
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      viewport.setPointerCapture(e.pointerId);
      stopMomentum();
      isDragging = true;
      hasDragged = false;
      dragTarget = e.target;
      startX = lastX = e.clientX;
      startOffset = offset;
      lastTs = performance.now();
      velocity = 0;
      setCursorMode('drag');
      targetScale = 0.9;
      viewport.classList.add('dragging');
      e.preventDefault();
    });

    // Capture click events to prevent them if dragged
    viewport.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { capture: true });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dxRaw = e.clientX - startX;

      if (Math.abs(dxRaw) > DRAG_THRESHOLD) {
        hasDragged = true;
      }

      // REMOVED THRESHOLD CHECK FOR SMOOTHER 1:1 FEEL
      // Old: const dxBase = Math.abs(dxRaw) < DRAG_THRESHOLD ? 0 : dxRaw;

      // CHANGE THIS NUMBER TO INCREASE SENSITIVITY
      // 1.0 = 1:1 (Physically accurate)
      // 2× drag distance on mobile (touch), normal on mouse
      const sensitivity = (e.pointerType === 'touch') ? 2.0 : 1.0;
      const dx = dxRaw * sensitivity;

      offset = clamp(startOffset + dx);
      render();

      const dt = now - lastTs || 16;
      velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTs = now;

      // Visual scale effect
      const speed = Math.min(Math.abs(velocity) * 30, 1);
      targetScale = 1 - speed * 0.35;
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('dragging');
      setCursorMode('scroll');
      targetScale = 1;

      // Start momentum only if it wasn't a static click and we are not at the edge
      if (Math.abs(velocity) > 0.01 && offset > (baseOffset - maxScroll) + 1 && offset < baseOffset - 1) {
        startMomentum();
      } else {
        // Snap back if momentum is negligible
        offset = clamp(offset); // Re-clamp just in case
        render();
      }

      if (!hasDragged && dragTarget && e && e.type === 'pointerup') {
        const anchor = dragTarget.closest('a');
        if (anchor) {
          anchor.click();
        }
      }

      velocity = 0; // Reset velocity after drag ends
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);

    track.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // Initialize all sliders
  document.querySelectorAll('.slider').forEach(initSlider);




  /*GROW SECTION*/

  const growSections = Array.from(document.querySelectorAll('.grow-section'));
  if (growSections.length) {
    const toPx = (val) => {
      if (typeof val !== 'string') return Number(val) || 0;
      if (val.endsWith('vh')) return (parseFloat(val) / 100) * window.innerHeight;
      if (val.endsWith('vw')) return (parseFloat(val) / 100) * window.innerWidth;
      if (val.endsWith('px')) return parseFloat(val);
      return parseFloat(val) || 0;
    };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    const state = growSections.map((section) => {
      const pin = section.querySelector('.pin');
      const frame = section.querySelector('.frame');
      const video = frame ? frame.querySelector('.section-2-left') : null;

      // Frame (container) scale range
      const startScale = parseFloat(section.dataset.growStart || 0.7);
      const endScale = parseFloat(section.dataset.growEnd || 1.0);

      // Video: its own range + a curve exponent to change the pace
      const vStart = parseFloat(section.dataset.videoStart ?? startScale);
      const vEnd = parseFloat(section.dataset.videoEnd ?? endScale);
      const vCurve = parseFloat(section.dataset.videoCurve || 1); // 1=linear, <1 ease-out, >1 ease-in

      const distStr = section.dataset.growDistance
        || getComputedStyle(section).getPropertyValue('--grow-distance')
        || '120vh';
      let growDistance = toPx(distStr);

      // Extra hold after reaching full scale (defaults to 10vh)
      const holdStr = section.dataset.growHold || '20vh';
      let holdPx = toPx(holdStr);

      // Sync section height (pin duration) â€” include hold
      section.style.setProperty('--grow-distance', `${growDistance}px`);
      section.style.setProperty('--grow-hold', `${holdPx}px`);
      section.style.height = `calc(100vh + ${growDistance}px + ${holdPx}px)`;

      // Initial transforms (in case CSS didnâ€™t set them)
      if (frame && !frame.style.transform) frame.style.transform = `scale(${startScale})`;
      if (video && !video.style.transform) video.style.transform = `scale(${vStart})`;

      return { section, pin, frame, video, startScale, endScale, vStart, vEnd, vCurve, growDistance, holdPx, holdStr };
    });

    function updateGrow() {
      state.forEach((s) => {
        if (!s.section || !s.frame) return;
        const rect = s.section.getBoundingClientRect();

        // Use growDistance + holdPx as the effective pinned distance so the section
        // remains pinned (and at scale 1) for an extra holdPx of scroll.
        const effectiveDistance = s.growDistance + s.holdPx;

        // Base progress for the animation (0..1)
        // This should complete over growDistance, before the hold.
        const p = clamp((-rect.top) / s.growDistance, 0, 1);

        // Frame: linear
        const frameScale = lerp(s.startScale, s.endScale, p);
        s.frame.style.transform = `scale(${frameScale})`;

        // When it reaches full scale (or beyond) we can toggle any UI hooks
        if (frameScale >= 1) {
          const S2RD = document.querySelector(".section-2-right-down");
          const S2RU = document.querySelector(".section-2-right-up");
          if (S2RD) S2RD.classList.add('overlay-text-active');
          if (S2RU) S2RU.classList.add('overlay-text-active-2');

        }

        // Video: apply curve to change pace
        const pv = Math.pow(p, s.vCurve); // <1 = faster at start, >1 = slower at start
        const videoScale = lerp(s.vStart, s.vEnd, clamp(pv, 0, 1));
        if (s.video) s.video.style.transform = `scale(${videoScale})`;
      });
    }

    function recomputeDistances() {
      state.forEach((s) => {
        const distStr = s.section.dataset.growDistance
          || getComputedStyle(s.section).getPropertyValue('--grow-distance')
          || '120vh';
        s.growDistance = toPx(distStr);

        // Recompute hold (in case CSS or dataset changed)
        const holdStr = s.section.dataset.growHold || s.holdStr || '10vh';
        s.holdPx = toPx(holdStr);

        s.section.style.setProperty('--grow-distance', `${s.growDistance}px`);
        s.section.style.setProperty('--grow-hold', `${s.holdPx}px`);
        s.section.style.height = `calc(100vh + ${s.growDistance}px + ${s.holdPx}px)`;
      });
      updateGrow();
    }

    // Hook into Lenis + resize
    if (window.__lenis) window.__lenis.on('scroll', updateGrow);
    window.addEventListener('resize', recomputeDistances);
    updateGrow();
  }

  /*END OF GROW SECTION*/


  const menuBtn = document.querySelector(".han-menu-full");
  const menuBg = document.querySelector(".menu-bg");
  const menuFULL = document.querySelector(".menu-full");

  // Define mobile breakpoint
  const isMobile = window.innerWidth < 768;

  if (menuBtn && menuFULL && menuBg) {
    // Variable to store scroll position for native fallback
    let nativeScrollPos = 0;

    menuBtn.addEventListener("click", () => {
      const isActive = menuFULL.classList.toggle("menu-active");
      menuBg.classList.toggle("menu-active-bg");

      // CHECK 1: Is Lenis active? (Use this for both Desktop AND Mobile if available)
      // We removed the "!isMobile" check because lenis.stop() is cleaner than CSS hacks on mobile
      if (typeof lenis !== "undefined" && lenis) {
        if (isActive) {
          lenis.stop();
        } else {
          lenis.start();
        }
        console.log("Lenis toggle active");
      }

      // CHECK 2: Fallback (If Lenis is disabled due to Reduced Motion or error)
      else {
        if (isActive) {
          // LOCK: Record position -> Fix body -> Offset top
          nativeScrollPos = window.scrollY || window.pageYOffset;
          document.body.style.position = 'fixed';
          document.body.style.top = `-${nativeScrollPos}px`;
          document.body.style.width = '100%';
          document.body.style.overflow = 'hidden';
        } else {
          // UNLOCK: Remove styles -> Restore scroll position
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, nativeScrollPos);
        }
        console.log("Native scroll toggle active");
      }
    });
  }


  function id(v) { return document.getElementById(v); }

  function loadbar() {
    // 1. Select Elements
    let ovrl = document.getElementById("overlay"),
      logo = document.getElementById("loader-logo"),
      circle = document.querySelector('.progress-ring-circle');

    // 2. Setup Circle Math
    // Radius is automatically read from HTML
    let radius = circle.r.baseVal.value;
    let circumference = radius * 2 * Math.PI;

    // Initialize the circle to be "empty" (hidden stroke)
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    // 3. Execution Start
    if (typeof lenis !== 'undefined') lenis.stop();
    document.body.classList.add("preloader-active");

    // Step A: Fade In Logo
    // Short delay ensures the browser renders the opacity: 0 first
    setTimeout(() => {
      logo.style.opacity = 1;
    }, 50);

    // Step B: Start Circle Animation
    setTimeout(() => {
      // 1. Make sure it's visible (as per your code)
      circle.style.display = "block";

      // 2. Force a reflow (Important!)
      // This trick ensures the browser registers the "start" position 
      // before we switch to the "end" position, enabling the transition.
      void circle.clientWidth;

      // 3. Trigger the CSS transition
      circle.style.strokeDashoffset = 0;
    }, 400);

    // Step C: Finish Sequence
    // Wait for Delay (300ms) + Animation Duration (1200ms) = 1500ms
    setTimeout(doneLoading, 1500);

    // 4. Completion Function
    function doneLoading() {
      document.body.classList.remove("preloader-active");

      if (typeof lenis !== 'undefined') lenis.start();

      const header = document.querySelector('header');
      const nav = document.querySelector('nav');
      if (header) header.classList.add('header-loaded');
      document.querySelector('.menu-full').classList.add('nav-loaded');

      // Fade out overlay
      ovrl.style.opacity = 0;
      setTimeout(function () {
        ovrl.style.display = "none";
      }, 1000);
    }
  }

  document.addEventListener('DOMContentLoaded', loadbar, false);

  /* ============================
     1. MAIN SLIDER (SECTION 1)
     ============================ */
  (function () {
    const viewport = document.querySelector('.slider-viewport');
    const track = document.querySelector('.slider-track');

    if (!viewport || !track) return;

    const cards = Array.from(track.querySelectorAll('.card'));
    const btnPrev = document.querySelector('.slider-btn.prev');
    const btnNext = document.querySelector('.slider-btn.next');

    const GAP = 32;     // px between cards
    const CARD_W = 640; // px per card
    const STEP = CARD_W + GAP;

    let offset = 0;

    function clampOffset(x) {
      const totalWidth = cards.length * CARD_W + (cards.length - 1) * GAP;
      const viewW = viewport.clientWidth;
      const maxScroll = Math.max(0, totalWidth - viewW);
      return Math.max(-maxScroll, Math.min(0, x));
    }

    function update() {
      track.style.transform = `translateX(${offset}px)`;
      if (btnPrev) btnPrev.disabled = (offset >= 0);

      const totalWidth = cards.length * CARD_W + (cards.length - 1) * GAP;
      const viewW = viewport.clientWidth;
      const maxScroll = Math.max(0, totalWidth - viewW);
      const maxAbs = Math.abs(offset);
      if (btnNext) btnNext.disabled = (maxAbs >= maxScroll - 0.5);
    }

    function next() {
      offset = clampOffset(offset - STEP);
      update();
    }

    function prev() {
      offset = clampOffset(offset + STEP);
      update();
    }

    if (btnNext) btnNext.addEventListener('click', next);
    if (btnPrev) btnPrev.addEventListener('click', prev);
    window.addEventListener('resize', update);
    update();
  })();


  /* ============================
     2. SHARED HELPERS
     ============================ */

  function splitIntoLines(blockEl) {
    const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue.replace(/\s/g, '').length
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const seg = (typeof Intl !== 'undefined' && Intl.Segmenter)
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;

    textNodes.forEach((tn) => {
      const src = tn.nodeValue;
      let pieces = src.split(/(\s+)/).filter(s => s.length > 0);

      if (pieces.length === 1) {
        pieces = seg
          ? Array.from(seg.segment(src), s => s.segment)
          : Array.from(src);
      }

      const frag = document.createDocumentFragment();
      pieces.forEach((part) => {
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'word-token';
          span.style.display = 'inline-block';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });

    const tokens = Array.from(blockEl.querySelectorAll('.word-token'));
    if (!tokens.length) return;

    const lines = [];
    let currentTop = null;
    let group = [];

    tokens.forEach((tok) => {
      const top = Math.round(tok.getBoundingClientRect().top);
      if (currentTop === null || Math.abs(top - currentTop) <= 1) {
        currentTop = (currentTop === null) ? top : currentTop;
        group.push(tok);
      } else {
        lines.push(group);
        group = [tok];
        currentTop = top;
      }
    });
    if (group.length) lines.push(group);

    const wrapper = document.createElement('div');
    wrapper.className = 'line-block';
    lines.forEach((arr) => {
      const line = document.createElement('span');
      line.className = 'line-a';
      const inner = document.createElement('span');
      inner.className = 'line-inner';
      arr.forEach((tok) => inner.appendChild(tok));
      line.appendChild(inner);
      wrapper.appendChild(line);
    });

    blockEl.innerHTML = '';
    blockEl.appendChild(wrapper);
  }

  function buildLeftPerLineFromSlide(slideEl) {
    const wrap = document.createElement('div');
    const src = slideEl.querySelector('.slide-text');
    wrap.innerHTML = src ? src.innerHTML : '';
    wrap.querySelectorAll('h4, h3, p').forEach(splitIntoLines);
    return wrap;
  }

  function swapLeftTextPerLine(container, slideEl) {
    if (!container) return;
    const current = container.lastElementChild;
    const nextEl = buildLeftPerLineFromSlide(slideEl);

    // Set height to prevent layout jump
    const h = container.offsetHeight;
    if (h > 0) container.style.minHeight = h + 'px';

    nextEl.querySelectorAll('.line-a').forEach((line) => line.classList.add('line-enter'));
    container.appendChild(nextEl);
    nextEl.offsetHeight; // force reflow

    if (current) {
      current.querySelectorAll('.line-a').forEach((line) => line.classList.add('line-exit'));
      current.offsetHeight;
      current.classList.add('line-exit-active');
      current.querySelectorAll('.line-a').forEach((line) => line.classList.add('line-exit-active'));
    }

    nextEl.querySelectorAll('.line-a').forEach((line) => {
      line.classList.add('line-enter-active');
    });

    const lastIncoming = nextEl.querySelector('.line-a:last-child .line-inner') || nextEl;
    lastIncoming.addEventListener('transitionend', () => {
      if (current) current.remove();
      nextEl.querySelectorAll('.line-a').forEach((line) => {
        line.classList.remove('line-enter', 'line-enter-active');
      });
      container.style.minHeight = '';
    }, { once: true });
  }

  function swapLeftImageWipe(slideEl, leftHold) {
    if (!leftHold) return;

    // LOOK FOR .slide-left-picture FIRST (The new logic)
    let pic = slideEl.querySelector('.slide-left-picture');

    // Fallback to .slide-picture if left specific one doesn't exist
    if (!pic) pic = slideEl.querySelector('.slide-picture');

    const nextHTML = pic ? pic.innerHTML : '';
    if (!nextHTML) return;

    const overlay = document.createElement('div');
    overlay.className = 'wipe-layer wipe-enter';
    overlay.innerHTML = nextHTML;

    leftHold.appendChild(overlay);
    overlay.offsetHeight;
    overlay.classList.add('wipe-enter-active');

    overlay.addEventListener('transitionend', () => {
      leftHold.innerHTML = '';
      const stable = document.createElement('div');
      stable.className = 'fit';
      stable.innerHTML = nextHTML;
      leftHold.appendChild(stable);
    }, { once: true });
  }

  function swapNumber(numWrap, newStr) {
    if (!numWrap) return;
    const current = numWrap.querySelector('.num-swap');
    const nextNum = document.createElement('span');
    nextNum.className = 'section-2-numbers-current num-swap num-enter from-top';
    nextNum.textContent = newStr;
    numWrap.appendChild(nextNum);
    nextNum.offsetHeight;
    nextNum.classList.add('num-enter-active');
    if (current) {
      current.classList.add('num-exit', 'to-bottom', 'num-exit-active');
      current.addEventListener('transitionend', () => current.remove(), { once: true });
    }
    nextNum.addEventListener('transitionend', () => {
      nextNum.classList.remove('from-top', 'num-enter', 'num-enter-active');
    }, { once: true });
  }

  function setProgressBar(progressEl, index, total) {
    if (!progressEl || !total) return;
    const progress = ((index + 1) / total) * 100;
    progressEl.style.setProperty('--progress', `${progress}%`);
  }


  /* ============================
     3. PER-SECTION LOGIC
     ============================ */
  function initSection(root) {
    if (!root) return;

    // Selectors
    const prevBtn = root.querySelector('.slider-btn.prev');
    const nextBtn = root.querySelector('.slider-btn.next');
    const leftBox = root.querySelector('.section-2-right-down-left');
    const rightDown = root.querySelector('.section-2-right-down-right');

    const leftHold = root.querySelector('.section-2-left-holder');
    const leftWrapper = root.querySelector('.section-2-left');
    const rightWrapper = root.querySelector('.section-2-right');

    const numWrap = root.querySelector('.num-swap-wrap');
    const numAllEl = root.querySelector('.section-2-numbers-all');
    const progressEl = root.querySelector('.progress-bar-p');

    // Slides
    const slideEls = Array.from(root.querySelectorAll('.section-2-slides .slide'));
    if (!slideEls.length) return; // Exit if no slides found

    // Set Total Count
    if (numAllEl) numAllEl.textContent = String(slideEls.length).padStart(2, '0');

    let currentIndex = 0;
    let isAnimating = false;
    const COOLDOWN_MS = 800;

    function startCooldown() {
      isAnimating = true;
      setTimeout(() => { isAnimating = false; }, COOLDOWN_MS);
    }

    // --- 1. PREPARE GALLERY DATA ---
    const sectionImageUrls = slideEls.map(slide => {
      const pic = slide.querySelector('.slide-picture img');
      return pic ? pic.src : '';
    }).filter(url => url !== '');

    const getVisualIndex = () => {
      const total = slideEls.length;
      return (currentIndex - 1 + total) % total;
    };

    const triggerGallery = () => {
      if (typeof window.openGlobalGallery === 'function') {
        window.openGlobalGallery(sectionImageUrls, getVisualIndex());
      }
    };

    // --- 2. LEFT SIDE CLICK ---
    if (leftWrapper) {
      leftWrapper.style.cursor = 'zoom-in';
      leftWrapper.addEventListener('click', triggerGallery);
    }

    // --- 3. RIGHT SIDE CLICK (With Exclusion) ---
    if (rightWrapper) {
      rightWrapper.style.cursor = 'zoom-in';
      const rightUp = rightWrapper.querySelector('.section-2-right-up');
      if (rightUp) rightUp.style.cursor = 'default';

      rightWrapper.addEventListener('click', (e) => {
        if (e.target.closest('.section-2-right-up')) return;
        if (e.target.closest('a')) return;
        triggerGallery();
      });
    }

    // Generate Thumbnails
    const thumbViewport = rightDown ? rightDown.querySelector('.thumb-viewport') : null;
    const thumbTrack = rightDown ? rightDown.querySelector('.thumb-track') : null;
    const thumbCards = [];

    if (thumbViewport && thumbTrack) {
      thumbTrack.innerHTML = '';
      slideEls.forEach((slideEl, idx) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'thumb-card';
        const pic = slideEl.querySelector('.slide-picture picture, .slide-picture img');
        if (pic) card.appendChild(pic.cloneNode(true));
        const rotatedIndex = (idx + 1) % slideEls.length;
        const labelP = slideEls[rotatedIndex].querySelector('.slide-text p');
        const label = document.createElement('div');
        label.className = 'thumb-label';
        label.textContent = labelP ? labelP.textContent.trim() : "";
        card.appendChild(label);
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isAnimating) return;
          startCooldown();
          goTo(idx + 1);
        });
        thumbTrack.appendChild(card);
        thumbCards.push(card);
      });
    }

    function updateThumbPosition(index) {
      if (!thumbViewport || !thumbTrack || !thumbCards.length) return;
      thumbCards.forEach((c, i) => c.classList.toggle('is-active', i === index));
      const trackWidth = thumbTrack.scrollWidth;
      const viewportWidth = thumbViewport.clientWidth;
      const activeCard = thumbCards[index];
      let targetX = -activeCard.offsetLeft;
      const maxScroll = Math.max(0, trackWidth - viewportWidth);
      if (targetX < -maxScroll) targetX = -maxScroll;
      if (targetX > 0) targetX = 0;
      thumbTrack.style.transform = `translateX(${targetX}px)`;
    }

    function goTo(idx) {
      if (idx < 0) idx = slideEls.length - 1;
      if (idx >= slideEls.length) idx = 0;
      currentIndex = idx;
      const slideElCurrent = slideEls[currentIndex];
      const numStr = slideElCurrent.dataset.number || String(currentIndex + 1).padStart(2, '0');
      swapLeftTextPerLine(leftBox, slideElCurrent);
      swapLeftImageWipe(slideElCurrent, leftHold);
      swapNumber(numWrap, numStr);
      setProgressBar(progressEl, currentIndex, slideEls.length);
      updateThumbPosition(currentIndex);
    }

    // Initial Load
    goTo(0);

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isAnimating) return;
        startCooldown();
        goTo(currentIndex + 1);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (isAnimating) return;
        startCooldown();
        goTo(currentIndex - 1);
      });
    }

    if (thumbViewport) {
      window.addEventListener('resize', () => updateThumbPosition(currentIndex));
    }

    // ============================================
    //   NEW: SWIPE LOGIC FOR SECTION 2
    // ============================================
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50;

    root.addEventListener('touchstart', (e) => {
      // Record where touch started
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    root.addEventListener('touchend', (e) => {
      // Record where touch ended
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      // Swipe LEFT (Go Next)
      if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
        if (isAnimating) return;
        startCooldown();
        goTo(currentIndex + 1);
      }
      // Swipe RIGHT (Go Prev)
      if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
        if (isAnimating) return;
        startCooldown();
        goTo(currentIndex - 1);
      }
    }
  }

  /* ============================
     4. INITIALIZATION (DOM READY)
     ============================ */

  document.addEventListener('DOMContentLoaded', () => {

    function initSectionOnce(section) {
      if (!section || section.dataset.initialized === 'true') return;
      initSection(section);
      section.dataset.initialized = 'true';
    }

    // 1. Tabs & Galleries
    const tabs = Array.from(document.querySelectorAll('.pre-section-2 .gallery-tab'));
    const galleries = Array.from(document.querySelectorAll('.section-2'));

    // Logic to show specific gallery
    function showGalleryById(id) {
      galleries.forEach(sec => {
        if (sec.id === id) {
          sec.classList.add('is-active');
          initSectionOnce(sec);
        } else {
          sec.classList.remove('is-active');
        }
      });
    }

    if (tabs.length > 0) {
      // -- Scenario A: Tabs exist --
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetId = tab.dataset.gallery;
          tabs.forEach(t => t.classList.remove('tab-active'));
          tab.classList.add('tab-active');
          showGalleryById(targetId);
        });
      });
      // Init first tab
      const firstId = tabs[0].dataset.gallery;
      tabs[0].classList.add('tab-active');
      showGalleryById(firstId);
    } else {
      // -- Scenario B: No tabs (Single Gallery) --
      // Just init every section-2 found in the DOM
      galleries.forEach(sec => {
        sec.classList.add('is-active');
        initSectionOnce(sec);
      });
    }

    // 2. Init Section 6 (if exists)
    document.querySelectorAll('.section-6').forEach(initSectionOnce);

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
      // Ensure Lenis exists before calling
      if (typeof lenis !== 'undefined' && lenis) lenis.start();
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
    window.openGlobalGallery = function (imageUrls, startIndex) {
      if (!imageUrls || !imageUrls.length) return;

      // 1. Build the track with the specific images from the section
      buildGallerySlides(imageUrls);

      // 2. Set index
      currentIndex = startIndex;

      // 3. Open UI
      gallery.classList.add('is-open');
      gallery.setAttribute('aria-hidden', 'false');

      // Ensure Lenis exists before calling
      if (typeof lenis !== 'undefined' && lenis) lenis.stop();

      // 4. Position immediately
      updateGallery(true);
    };
  })();









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

  // Select all wrappers that have sub-menus
  const navWrappers = document.querySelectorAll('.nav-item-wrapper');

  // Define mobile breakpoint (e.g., 1024px for tablets/mobile)
  const mobileBreakpoint = 1024;

  navWrappers.forEach(wrapper => {
    // Get the main link (the Title) inside the wrapper
    const mainLink = wrapper.querySelector('a');

    mainLink.addEventListener('click', function (e) {
      // Only run this logic on mobile screens
      if (window.innerWidth <= mobileBreakpoint) {

        // Check if this specific menu is NOT currently open
        if (!wrapper.classList.contains('active')) {

          // 1. Prevent the link from going to the new page
          e.preventDefault();

          // 2. Close all OTHER open menus (Accordion effect) - Optional but recommended
          navWrappers.forEach(w => {
            if (w !== wrapper) {
              w.classList.remove('active');
            }
          });

          // 3. Open THIS menu
          wrapper.classList.add('active');

        } else {
          // If it IS already open, do nothing (let the link work naturally)
          // The user is clicking a second time to go to the parent page.
        }
      }
    });
  });

})();
