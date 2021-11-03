# CG Carousel

Vanilla JavaScript plugin used to build carousels.


## Usage

```javascript
const selector = '#js-carousel';
const carousel = new window.CgCarousel(selector, options, hooks);
```


Where:

* `selector`: Carousel CSS selector.
* `options`: Carousel Options.
* `hooks`: Carousel hooks listeners.


### Options


| Options           | Description | Default Value |
| -----------       | ----------- | ------------- |
| `loop`            | Infinite loop of slides. | `false` |
| `autoplay`        | Manages auto-changing of slides after a defined time interval. | `false` |
| `autoplaySpeed`   | Autoplay interval in ms. | `3000` |
| `transitionSpeed` | Transition speed in ms. | `1000` |
| `slidesPerView`   |  Number of slides per page. | `1` |
| `spacing`         |  Spacing between slides in pixel | `0` |
| `breakpoints`     |  Change the options for a given breakpoint. | `{}` |


Breakpoints example:

```javascript
const options = {
    slidesPerView: 1,
    breakpoints: {
        768: {
          slidesPerView: 2
        },
        1024: {
          slidesPerView: 4
        }
    }
}
```

### Hooks

The following event hooks are available and can be set during initialization, just like the options. Every event hook comes with the instance of the slider.

Example:

```javascript
const hooks = {
    created: function (instance) {
        console.log(instance.getSlides());
    },
    moved: function (instance) {
        console.log(instance.getCurrentIndex());
    }
};

```

| Event       | Description |
| ----------- | ----------- |
| `resized`   | Is fired when the breakpoint changes. |
| `built`     | Is fired after the slider is mounted with the current breakpoint options. |
| `created`   | Is fired after the slider has been initialized for the first time. |
| `moved`     | Is fired every time the slider changes the position. |
