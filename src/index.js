class CgCarousel {
  /**
   * Constructor
   */
  constructor (selector, options = {}, hooks = []) {
    // Selectors
    this.container = document.querySelector(selector);
    this.slidesSelector = options.slidesSelector || '.js-carousel__slide';
    this.trackSelector = options.trackSelector || '.js-carousel__track';
    this.slides = [];
    this.track = undefined;
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
      transitionSpeed: options.transitionSpeed || 1000,
      slidesPerView: options.slidesPerView || 1,
      spacing: options.spacing || 0,
    };
    this.options = this.initialOptions;

    // Transitions
    this.animationStart = undefined;
    this.animation = undefined;
    this.animationCurrentTrans = 0;

    // Functional
    this.autoplayInterval = undefined;
    this.isButtonRightDisabled = false;
    this.isButtonLeftDisabled = false;
    this.currentIndex = 0;
    this.maxIndex = 0;

    // Swipe Event
    this.swipeStartX = undefined;
    this.swipeStartY = undefined;
    this.swipeThreshold = 150; // Required min distance traveled to be considered swipe.
    this.swipeRestraint = 100; // Maximum distance allowed at the same time in perpendicular direction.
    this.swipeDir = undefined;

    if (!this.container) return;

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
   * On swipe end.
   */
  onSwipeEnd (e) {
    if (!this.isTouchableDevice() || !e.changedTouches) return;
    const touch = e.changedTouches[0];
    const distX = touch.pageX - this.swipeStartX;
    const distY = touch.pageY - this.swipeStartY;
    if (Math.abs(distX) >= this.swipeThreshold && Math.abs(distY) <= this.swipeRestraint) {
      this.swipeDir = (distX < 0) ? 'left' : 'right';
    } else if (Math.abs(distY) >= this.swipeThreshold && Math.abs(distX) <= this.swipeRestraint) {
      this.swipeDir = (distY < 0) ? 'up' : 'down';
    }

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
    this.container.addEventListener('touchmove', (e) => e.preventDefault(), false);
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
    const containerStyles = ['grid-auto-columns', 'gap', 'transition', 'left'];
    containerStyles.map(style => this.container.style.removeProperty(style));
    const slideStyles = ['animation', 'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end', 'left'];
    this.slides.forEach(slide => {
      slideStyles.map(style => slide.style.removeProperty(style));
    });
  };

  /**
   * Set Carousel Classes.
   */
  setCarouselStyles () {
    if (!this.slides) return;
    const slidesPerView = this.options.slidesPerView > this.slidesLength ? this.slidesLength : this.options.slidesPerView;
    const slideWidth = 100 / slidesPerView;
    const gap = (this.options.spacing * (slidesPerView - 1)) / slidesPerView;
    this.track.style.gridAutoColumns = `calc(${slideWidth}% - ${gap}px)`;
    this.track.style.gridGap = `${this.options.spacing}px`;
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
    this.track = this.container.querySelector(this.trackSelector);
    this.slidesLength = this.slides?.length;
    this.checkBreakpoint();
    this.buildCarousel();
    this.hook('created');
  };

  /**
   * Remove animation styles
   */
  removeAnimationStyles () {
    this.slides.forEach(slide => {
      slide.style.removeProperty('animation');
      slide.style.left = '100%';
    });
  };

  /**
   * Cancel Animation frame.
   */
  moveAnimateAbort () {
    if (this.animation) {
      cancelAnimationFrame(this.animation);
      this.animationCurrentTrans = this.currentIndex * -100;
      this.animation = null;
    }

    this.animationStart = null;
  }

  /**
   * Animate Left.
   * @param timestamp
   * @param trans
   * @param gap
   * @param duration
   */
  animateLeft (timestamp, trans, gap, duration) {
    const runtime = timestamp - this.animationStart;
    const progress = Math.min(runtime / duration, 1);
    const dist = parseInt((trans * progress) + (this.animationCurrentTrans * (1 - progress))).toFixed(2);
    this.track.style.left = `calc(${dist}% - ${gap}px)`;

    if (runtime >= duration) {
      this.animationCurrentTrans = trans;
      return;
    }

    requestAnimationFrame(timestamp => {
      this.animateLeft(timestamp, trans, gap, duration)
    })
  };

  /**
   * Move Slide.
   */
  moveSlide (index) {
    this.moveAnimateAbort();
    const gap = this.options.spacing * index;
    const trans = index * -100;

    this.animation = requestAnimationFrame(timestamp => {
      this.animationStart = timestamp;
      this.animateLeft(timestamp, trans, gap, this.options.transitionSpeed);
    });

    this.currentIndex = index;
    this.setUpAutoplay();
    this.setButtonsVisibility();
  };

  /**
   * Set Infinity.
   */
  setInfinite () {
    const count = this.options.slidesPerView * this.maxIndex;
    console.log('SET INFINITE', count);
    this.slides.forEach((slide, idx) => {
      if (idx >= this.options.slidesPerView) return;
      slide.style.left = `calc((100% * ${count}) + (${this.options.spacing}px * ${count}))`;
    })
  };

  /**
   * Clear Infinity.
   */
  clearInfinite () {
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
    if (!this.options.loop &&  nextIndex < this.currentIndex) return;
    this.moveSlide(nextIndex);
  };

  /**
   * Prev Slide.
   */
  prev () {
    const nextIndex = this.currentIndex === 0 ? this.maxIndex - 1 : this.currentIndex - 1;
    if (!this.options.loop && nextIndex > this.currentIndex) return;
    this.moveSlide(nextIndex);
  };

  /**
   * Move to Slide.
   */
  moveToSlide (index) {
    if (index === this.currentIndex) return;
    this.moveSlide(index);
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
