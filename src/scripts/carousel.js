import Swiper from "swiper";
import "swiper/css";

const prev_btn = document.querySelector(".js-fc-btn-prev");
const next_btn = document.querySelector(".js-fc-btn-next");

const swiper = new Swiper(".js-fc-swiper", {
  slidesPerView: 1.1,
  spaceBetween: 8,
  speed: 500,
  loop: false,
  centeredSlides: true,
  breakpoints: {
    640: {
      slidesPerView: 1.2,
      spaceBetween: 32,
    },
    1600: {
      slidesPerView: 1.4,
      spaceBetween: 64,
    },
    1900: {
      slidesPerView: 1.6,
      spaceBetween: 64,
    },
  },
});

// Add event listeners to buttons
prev_btn.addEventListener("click", () => swiper.slidePrev());
next_btn.addEventListener("click", () => swiper.slideNext());

// Trigger swiper
swiper.init?.();
