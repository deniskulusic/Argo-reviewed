(function () {
  // Shared cursor for draggable slider (existing site pattern)
  const cursor = document.createElement('div');
  cursor.className = 'drag-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <span class="label">scroll</span>
    <span class="plus-icon">+</span>
    <div class="ring" aria-hidden="true"></div>
  `;
  document.body.appendChild(cursor);

  let cursorRAF = null;
  let cursorX = 0;
  let cursorY = 0;
  let targetX = 0;
  let targetY = 0;
  let cursorScale = 1;
  let targetScale = 1;

  function showCursor() {
    cursor.classList.add('show');
    if (cursorRAF == null) cursorLoop();
  }

  function hideCursor() {
    cursor.classList.remove('show');
    if (cursorRAF != null) {
      cancelAnimationFrame(cursorRAF);
      cursorRAF = null;
    }
  }

  function cursorLoop() {
    cursorX += (targetX - cursorX) * 0.18;
    cursorY += (targetY - cursorY) * 0.18;
    cursorScale += (targetScale - cursorScale) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursor.style.transform = `translate(-50%, -50%) scale(${cursorScale})`;
    cursorRAF = requestAnimationFrame(cursorLoop);
  }

  function setCursorMode(mode) {
    cursor.classList.remove('cursor-mode-drag', 'cursor-mode-scroll', 'cursor-mode-plus');
    cursor.classList.add(`cursor-mode-${mode}`);
    if (mode === 'drag' || mode === 'scroll') {
      const label = cursor.querySelector('.label');
      if (label) label.textContent = mode;
    }
  }

  window.addEventListener('touchstart', () => hideCursor(), { passive: true });

  // FAQ accordion (same behavior pattern as existing pages)
  const faqItems = document.getElementsByClassName('faq');
  for (let i = 0; i < faqItems.length; i++) {
    faqItems[i].addEventListener('click', function () {
      const wasActive = this.classList.contains('active');
      const activeItems = document.querySelectorAll('.faq.active');
      [].forEach.call(activeItems, function (el) { el.classList.remove('active'); });
      if (!wasActive) this.classList.add('active');
      if (window.__lenis && typeof window.__lenis.resize === 'function') {
        setTimeout(() => window.__lenis.resize(), 300);
      }
    });
  }

  // Social slider drag/snap interaction (from existing index behavior)
  function initSlider(root) {
    const viewport = root.querySelector('.slider-viewport');
    const track = root.querySelector('.slider-track');
    const cards = Array.from(root.querySelectorAll('.card'));
    if (!viewport || !track || !cards.length) return;

    let offset = 0;
    let baseOffset = 0;
    let maxScroll = 0;
    let stops = [];
    let momentumRAF = null;
    let isDragging = false;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let lastTs = 0;
    let velocity = 0;

    const clamp = (x) => {
      const min = baseOffset - maxScroll;
      const max = baseOffset;
      return Math.max(min, Math.min(max, x));
    };

    function measure() {
      const first = cards[0];
      const last = cards[cards.length - 1];
      const csFirst = getComputedStyle(first);
      const csLast = getComputedStyle(last);

      const firstLeftOuter = first.offsetLeft - (parseFloat(csFirst.marginLeft) || 0);
      const lastRightOuter = last.offsetLeft + last.offsetWidth + (parseFloat(csLast.marginRight) || 0);
      const totalWidth = lastRightOuter - firstLeftOuter;

      baseOffset = -firstLeftOuter;
      maxScroll = Math.max(0, totalWidth - viewport.clientWidth);
      stops = cards.map((card) => {
        const cs = getComputedStyle(card);
        const leftOuter = card.offsetLeft - (parseFloat(cs.marginLeft) || 0);
        return clamp(-leftOuter);
      });
      offset = clamp(offset);
    }

    function render() {
      track.style.transform = `translateX(${offset}px)`;
    }

    function stopMomentum() {
      if (momentumRAF != null) cancelAnimationFrame(momentumRAF);
      momentumRAF = null;
    }

    function startMomentum() {
      stopMomentum();
      const decay = 0.975;
      const minVel = 0.05;
      const frame = () => {
        velocity *= decay;
        if (Math.abs(velocity) < minVel) return;
        offset = clamp(offset + velocity * 16);
        render();
        momentumRAF = requestAnimationFrame(frame);
      };
      momentumRAF = requestAnimationFrame(frame);
    }

    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      viewport.setPointerCapture(e.pointerId);
      stopMomentum();
      isDragging = true;
      startX = lastX = e.clientX;
      startOffset = offset;
      lastTs = performance.now();
      velocity = 0;
      viewport.classList.add('dragging');
      setCursorMode('drag');
      targetScale = 0.9;
      e.preventDefault();
    });

    viewport.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isDragging) return;
      const now = performance.now();
      const sensitivity = e.pointerType === 'touch' ? 2.0 : 1.0;
      const dx = (e.clientX - startX) * sensitivity;
      offset = clamp(startOffset + dx);
      render();
      const dt = now - lastTs || 16;
      velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTs = now;
    });

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('dragging');
      setCursorMode('scroll');
      targetScale = 1;
      if (Math.abs(velocity) > 0.01) startMomentum();
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    const roViewport = new ResizeObserver(() => {
      measure();
      render();
    });
    const roTrack = new ResizeObserver(() => {
      measure();
      render();
    });
    roViewport.observe(viewport);
    roTrack.observe(track);

    viewport.addEventListener('pointerenter', () => {
      showCursor();
      setCursorMode('scroll');
    });
    viewport.addEventListener('pointerleave', () => {
      hideCursor();
      targetScale = 1;
    });
    viewport.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    measure();
    offset = stops[0] ?? baseOffset;
    render();
  }

  document.querySelectorAll('.slider').forEach(initSlider);
})();
