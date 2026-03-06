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