class CgCarousel {
  /**
   * Constructor
   */
  constructor (selector, options = {}, hooks = []) {
    this.container = document.querySelector(selector);
    if (!this.container) return;

    // Selectors
    this.slidesSelector = options.slidesSelector || '.js-carousel__slide';
    this.trackSelector = options.trackSelector || '.js-carousel__track';
    this.slides = [];
    this.track = this.container.querySelector(this.trackSelector);
    this.slidesLength = 0;

    // Breakpoints
    this.currentBreakpoint = undefined;
    this.breakpoints = options.breakpoints || {};

    // Hooks
    this.hooks = hooks;

    // Options
    this.initialOptions = {
      loop: options.loop || false,
      autoplay: options.autoplay || false,
      autoplaySpeed: options.autoplaySpeed || 3000,
      transitionSpeed: options.transitionSpeed || 650,
      slidesPerView: options.slidesPerView || 1,
      spacing: options.spacing || 0,
    };
    this.options = this.initialOptions;

    // Transitions
    this.animationStart = undefined;
    this.animation = undefined;
    this.animationCurrentTrans = 0;
    this.animationIndex = 0;

    // Animations
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;


    // Functional
    this.autoplayInterval = undefined;
    this.isButtonRightDisabled = false;
    this.isButtonLeftDisabled = false;
    this.currentIndex = 0;
    this.maxIndex = 0;
    this.isInfinite = false;
    this.isPrevInfinite = false;

    // Swipe Event
    this.swipeStartX = undefined;
    this.swipeStartY = undefined;
    this.swipeThreshold = 100; // Required min distance traveled to be considered swipe.
    this.swipeRestraint = 100; // Maximum distance allowed at the same time in perpendicular direction.
    this.swipeDir = undefined;

    if (!this.track) return;

    this.addEventListeners();
    this.initCarousel();
  };

  /**
   * Fire hook.
   */
  hook (name) {
    this.hooks[name] && this.hooks[name](this);
  };

  /**
   * Is touchable device?
   */
  isTouchableDevice () {
    return window.matchMedia("(pointer: coarse)").matches;
  };

  /**
   * Handle Swipe.
   */
  handleSwipe () {
    switch (this.swipeDir) {
      case 'top':
      case 'bottom':
        break;
      case 'left':
        this.next();
        break;
      case 'right':
        this.prev();
        break;
      default:
        break;
    }
  };

  /**
   * On swipe start.
   */
  onSwipeStart (e) {
    if (!this.isTouchableDevice() || !e.changedTouches) return;
    const touch = e.changedTouches[0];
    this.swipeStartX = touch.pageX;
    this.swipeStartY = touch.pageY;
  };

  /**
   * Set swipe direction.
   */
  setSwipeDirection (e) {
    const touch = e.changedTouches[0];
    const distX = touch.pageX - this.swipeStartX;
    const distY = touch.pageY - this.swipeStartY;

    if (Math.abs(distX) >= this.swipeThreshold && Math.abs(distY) <= this.swipeRestraint) {
      this.swipeDir = (distX < 0) ? 'left' : 'right';
    } else if (Math.abs(distY) >= this.swipeThreshold && Math.abs(distX) <= this.swipeRestraint) {
      this.swipeDir = (distY < 0) ? 'up' : 'down';
    }
  };

  /**
   * On swipe move.
   */
  onSwipeMove (e) {
    if (!this.isTouchableDevice() || !e.changedTouches) return;
    this.setSwipeDirection(e);
    if (['left', 'right'].includes(this.swipeDir) && e.cancelable) e.preventDefault();
  };

  /**
   * On swipe end.
   */
  onSwipeEnd (e) {
    if (!this.isTouchableDevice() || !e.changedTouches) return;
    this.setSwipeDirection(e);
    this.handleSwipe();
  };

  /**
   * Add Event Listeners.
   */
  addEventListeners () {
    // Resize Events
    window.addEventListener('orientationchange', () => this.onResize());
    window.addEventListener('resize', () => this.onResize());

    // Swipe Events
    this.container.addEventListener('touchstart', (e) => this.onSwipeStart(e), {
      passive: true
    });
    this.container.addEventListener('touchmove', (e) => this.onSwipeMove(e), false);
    this.container.addEventListener('touchend', (e) => this.onSwipeEnd(e), {
      passive: true
    });
  };

  /**
   * On Resize Event.
   */
  onResize () {
    const breakpoint = this.checkBreakpoint();
    breakpoint && this.buildCarousel();
    this.hook('resized');
  };

  /**
   * Configure Autoplay.
   */
  setUpAutoplay () {
    if (!this.options.autoplay) return;
    clearInterval(this.autoplayInterval);
    this.autoplayInterval = setInterval(() => this.next(), this.options.autoplaySpeed);
  };

  /**
   * Check current breakpoint.
   */
  checkBreakpoint() {
    if (!this.breakpoints) return;

    const currentBreakpoint = Object.keys(this.breakpoints).reverse().find(breakpoint => {
      const media = `(min-width: ${breakpoint}px)`;
      return window.matchMedia(media).matches;
    });

    if (this.currentBreakpoint === currentBreakpoint) return;

    this.currentBreakpoint = currentBreakpoint;
    const options = currentBreakpoint ? this.breakpoints[currentBreakpoint] : this.initialOptions;
    this.options = {
      ...this.initialOptions,
      ...options
    };
    return true;
  };

  /**
   * Set buttons visibility.
   */
  setButtonsVisibility () {
    this.isButtonLeftDisabled = !this.options.loop && this.currentIndex === 0;
    this.isButtonRightDisabled = !this.options.loop && this.currentIndex === (this.maxIndex - 1);
  };

  /**
   * Clear Carousel Styles.
   */
  clearCarouselStyles () {
    const trackStyles = ['grid-auto-columns', 'gap', 'transition', 'left'];
    trackStyles.map(style => this.track.style.removeProperty(style));
    const slideStyles = ['grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end', 'left'];
    this.slides.forEach(slide => {
      slideStyles.map(style => slide.style.removeProperty(style));
    });
  };

  /**
   * Set Carousel Classes.
   */
  setCarouselStyles () {
    if (!this.slides) return;
    const slidesPerView = this.options.slidesPerView;
    const slideWidth = 100 / slidesPerView;
    const gap = (this.options.spacing * (slidesPerView - 1)) / slidesPerView;
    this.track.style.gridAutoColumns = `calc(${slideWidth}% - ${gap}px)`;
    this.track.style.gridGap = `${this.options.spacing}px`;
    this.track.style.left = 0;
  };

  /**
   * Build Carousel with current Options.
   */
  buildCarousel () {
    this.maxIndex = Math.ceil(this.slidesLength / this.options.slidesPerView);
    this.clearCarouselStyles();
    this.setCarouselStyles();
    this.setButtonsVisibility();
    this.setUpAutoplay();
    this.currentIndex = 0;
    this.hook('built');
  };

  /**
   * Initialize carousel and fire created event.
   */
  initCarousel () {
    this.slides = this.container.querySelectorAll(this.slidesSelector);
    this.slidesLength = this.slides?.length;
    this.checkBreakpoint();
    this.buildCarousel();
    this.hook('created');
  };

  /**
   * On Animation End.
   */
  onAnimationEnd () {
    const gap = this.options.spacing * this.animationIndex;
    const trans = this.animationIndex * -100;
    this.track.style.left = `calc(${trans}% - ${gap}px)`;
    this.animationCurrentTrans = trans;
    this.animation = null;
    this.isInfinite && this.clearInfinite();
    this.isPrevInfinite && this.clearPrevInfinite();
  }

  /**
   * Cancel Animation frame.
   */
  moveAnimateAbort () {
    if (!this.animation) return;

    window.cancelAnimationFrame(this.animation);
    this.onAnimationEnd();
  };

  /**
   * Animate Left.
   * @param timestamp
   * @param trans
   * @param gap
   * @param duration
   */
  animateLeft (timestamp, trans, gap, duration) {
    const runtime = timestamp - this.animationStart;
    const easing = t => 1 - Math.pow(1 - t, 5);
    const progress = easing(runtime / duration);
    const dist = ((trans * progress) + (this.animationCurrentTrans * (1 - progress))).toFixed(2);
    this.track.style.left = `calc(${dist}% - ${gap}px)`;

    if (runtime >= duration) {
      this.onAnimationEnd();
      return;
    }

    this.animation = window.requestAnimationFrame(timestamp => {
      this.animateLeft(timestamp, trans, gap, duration)
    })
  };

  /**
   * Move Slide.
   */
  moveSlide (index, cIndex) {
    this.moveAnimateAbort();
    const gap = this.options.spacing * index;
    const trans = index * -100;

    this.animation = window.requestAnimationFrame((timestamp) => {
      index === this.maxIndex && this.setInfinite();
      index === -1 && this.setPrevInfinite();
      this.animationStart = timestamp;
      this.animationIndex = this.currentIndex;
      this.animateLeft(timestamp, trans, gap, this.options.transitionSpeed);
    });

    this.currentIndex = cIndex;

    this.setUpAutoplay();
    this.setButtonsVisibility();
    this.hook('moved');
  };

  /**
   * Set Infinity.
   */
  setInfinite () {
    this.isInfinite = true;
    const count = this.options.slidesPerView * this.maxIndex;

    for (let idx = 0; idx < this.options.slidesPerView; idx++) {
      const slide = this.slides[idx];
      slide.style.left = `calc((100% * ${count}) + (${this.options.spacing}px * ${count}))`;
    }
  };

  /**
   * Clear Infinity.
   */
  clearInfinite () {
    this.isInfinite = false;
    this.track.style.left = `calc(${this.currentIndex * -100}% - ${this.options.spacing * this.currentIndex}px)`;

    this.slides.forEach((slide, idx) => {
      if (idx >= this.options.slidesPerView) return;
      slide.style.removeProperty('left');
    })
  };

  /**
   * Next Slide.
   */
  next () {
    const nextIndex = this.currentIndex === this.maxIndex -1 ? 0 : this.currentIndex + 1;
    if (!this.options.loop && nextIndex < this.currentIndex) return;

    if (nextIndex < this.currentIndex) {
      this.moveSlide(this.currentIndex + 1, nextIndex);
      return;
    }

    this.moveSlide(nextIndex, nextIndex);
  };

  /**
   * Set Prev Infinity.
   */
  setPrevInfinite () {
    this.isPrevInfinite = true;
    const count = this.options.slidesPerView * this.maxIndex;
    const maxIdx = count - this.options.slidesPerView;

    for (let idx = this.slides.length - 1; idx >= 0; idx--) {
      if (idx < maxIdx) return;
      const slide = this.slides[idx];
      slide.style.left = `calc((-100% * ${count}) - (${this.options.spacing}px * ${count}))`;
    }
  };

  /**
   * Clear Prev Infinity.
   */
  clearPrevInfinite () {
    this.isPrevInfinite = false;
    this.track.style.left = `calc(${this.currentIndex * -100}% - ${this.options.spacing * this.currentIndex}px)`;
    this.slides.forEach((slide, idx) => {
      slide.style.removeProperty('left');
    });
  };

  /**
   * Prev Slide.
   */
  prev () {
    const nextIndex = this.currentIndex === 0 ? this.maxIndex - 1 : this.currentIndex - 1;
    if (!this.options.loop && nextIndex > this.currentIndex) return;

    if (nextIndex > this.currentIndex) {
      this.moveSlide(this.currentIndex - 1, nextIndex);
      return;
    }

    this.moveSlide(nextIndex, nextIndex);
  };

  /**
   * Move to Slide.
   */
  moveToSlide (index) {
    if (index === this.currentIndex) return;
    this.moveSlide(index, index);
  };

  /**
   * Get Slides
   */
  getSlides () {
    return this.slides;
  };

  /**
   * Get Current Index.
   */
  getCurrentIndex () {
    return this.currentIndex;
  };

  /**
   * Get Options.
   */
  getOptions () {
    return this.options;
  };

  /**
   * Get Page Size.
   */
  getPageSize () {
    return this.maxIndex;
  };
}

window.CgCarousel = CgCarousel;
