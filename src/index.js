class CgCarousel {
  /**
   * Constructor
   */
  constructor (selector, options = {}, hooks = []) {
    // Selectors
    this.container = document.querySelector(selector);
    this.slidesSelector = options.slidesSelector || '.js-carousel__slide';
    this.slides = [];
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


    // Functional
    this.autoplayInterval = undefined;
    this.isButtonRightDisabled = false;
    this.isButtonLeftDisabled = false;
    this.currentIndex = 0;
    this.maxIndex = 0;
    this.singleSlideMode = false;

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
   * Add Event Listeners.
   */
  addEventListeners () {
    window.addEventListener('orientationchange', () => this.onResize());
    window.addEventListener('resize', () => this.onResize());
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
    const containerStyles = ['gridAutoColumns', 'gridGap'];
    containerStyles.map(style => this.container.style.removeProperty(style));
    const slideStyles = ['gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'gridRowEnd', 'left'];
    this.slides.forEach(slide => {
      slideStyles.map(style => slide.style.removeProperty(style));
    });
  };

  /**
   * Set Single Mode Styles.
   */
  setSingleModeStyles () {
    this.slides.forEach((slide, index) => {
      slide.style.gridColumnStart = 1;
      slide.style.gridColumnEnd = 1;
      slide.style.gridRowStart = 1;
      slide.style.gridRowEnd = 1;
      slide.style.left = index === 0 ? 0 : '100%';
    });
  };

  /**
   * Set Multiple Mode Styles.
   */
  setMultipleModeStyles () {
    const slidesPerView = this.options.slidesPerView > this.slidesLength ? this.slidesLength : this.options.slidesPerView;
    const slideWidth = 100 / slidesPerView;
    const gap = (this.options.spacing * (slidesPerView - 1)) / slidesPerView;
    this.container.style.gridAutoColumns = `calc(${slideWidth}% - ${gap}px)`;
    this.container.style.gridGap = `${this.options.spacing}px`;
  };

  /**
   * Set Carousel Classes.
   */
  setCarouselStyles () {
    if (!this.slides) return;
    this.singleSlideMode ? this.setSingleModeStyles() : this.setMultipleModeStyles();
  };

  /**
   * Set Slides Transition.
   */
  setTransition () {
    this.container.style.transition = `left ${this.options.transitionSpeed}ms`;
  };

  /**
   * Build Carousel with current Options.
   */
  buildCarousel () {
    this.maxIndex = Math.ceil(this.slidesLength / this.options.slidesPerView);
    this.singleSlideMode = this.options.slidesPerView === 1;
    this.clearCarouselStyles();
    this.setCarouselStyles();
    this.setTransition();
    this.setButtonsVisibility();
    this.setUpAutoplay();
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
   * Remove animation styles
   */
  removeAnimationStyles () {
    this.slides.forEach(slide => {
      slide.style.removeProperty('animation');
      slide.style.left = '100%';
    });
  };

  /**
   * Move Single Slide.
   */
  moveSingleSlide (index, action) {
    this.removeAnimationStyles();
    const transition = action === 'next' ? 'slideOutLeft' : 'slideOutRight';
    this.slides[index].style.left = action === 'next' ? '100%' : '-100%';
    this.slides[this.currentIndex].style.left = 0;
    this.slides[index].style.animation = `slideIn ${this.options.transitionSpeed}ms forwards`;
    this.slides[this.currentIndex].style.animation = `${transition} ${this.options.transitionSpeed}ms forwards`;
  };

  /**
   * Move Multiple Slides.
   */
  moveMultipleSlides (index) {
    const trans = index * -100;
    const gap = this.options.spacing * index;
    this.container.style.left = `calc(${trans}% - ${gap}px)`;
  };

  /**
   * Move Slide.
   */
  moveSlide (index, action) {
    this.singleSlideMode ? this.moveSingleSlide(index, action) : this.moveMultipleSlides(index);
    this.currentIndex = index;
    this.setUpAutoplay();
    this.setButtonsVisibility();
    this.hook('moved');
  };

  /**
   * Next Slide.
   */
  next () {
    const nextIndex = this.currentIndex === this.maxIndex -1 ? 0 : this.currentIndex + 1;
    if (!this.options.loop &&  nextIndex < this.currentIndex) return;
    this.moveSlide(nextIndex, 'next');
  };

  /**
   * Prev Slide.
   */
  prev () {
    const nextIndex = this.currentIndex === 0 ? this.maxIndex - 1 : this.currentIndex - 1;
    if (!this.options.loop && nextIndex > this.currentIndex) return;
    this.moveSlide(nextIndex, 'prev');
  };

  /**
   * Move to Slide.
   */
  moveToSlide (index) {
    const action = index > this.currentIndex ? 'next' : 'prev';
    this.moveSlide(index, action);
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
  }
}

window.CgCarousel = CgCarousel;