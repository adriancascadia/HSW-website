import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
// import Swiper and modules styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// init Swiper:
const swiper = new Swiper(".js-fc-swiper", {
  modules: [Navigation, Pagination],
  navigation: {
    nextEl: ".js-fc-btn-next",
    prevEl: ".js-fc-btn-prev",
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  slidesPerView: 1,
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

// Trigger swiper
swiper.init?.();
