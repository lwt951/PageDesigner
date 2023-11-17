class Router {
  constructor(config = {}) {
    this.hash = '';
    this.hashChange = config.hashChange;

    this.init();
  }

  init() {
    window.addEventListener('load', this.refresh.bind(this), false);
    window.addEventListener('hashchange', this.refresh.bind(this), false);
  }

  refresh() {
    this.hash =
      location.hash.slice(
        1,
        location.hash.indexOf('?') > -1 ? location.hash.indexOf('?') : Infinity
      ) || '';

    if (typeof this.hashChange === 'function') {
      this.hashChange(this.hash);
    }
  }
}
