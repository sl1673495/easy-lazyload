(function () {
  var DEFAULT_URL = ''
  var DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']
  var hasIntersectionObserver = Boolean(window['IntersectionObserver'])
  var supportsPassive = (function () {
    var support = false
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function () {
          support = true
        }
      })
      window.addEventListener('test', null, opts)
    } catch (e) { }
    return support
  })()

  var cid = 0

  var utils = {
    noop: function () { },
    arrayFrom: function (arrLike) {
      let len = arrLike.length
      const list = []
      for (let i = 0; i < len; i++) {
        list.push(arrLike[i])
      }
      return list
    },
    forEach: function (arr, fn) {
      var nativeEach = Array.prototype.forEach
      if (nativeEach) {
        return nativeEach.call(arr, fn)
      } else {
        for (var i = 0; i < arr.length; i++) {
          fn(arr[i], i)
        }
      }
    },
    getDataSrc: function (el, attr) {
      if ('dataset' in el) {
        return el.dataset[attr]
      } else {
        return el.getAttribute('data-' + attr)
      }
    },
    setDataSrc: function (el, attr, value) {
      if ('dataset' in el) {
        el.dataset[attr] = value
      } else {
        el.setAttribute('data-' + attr, value)
      }
    },
    style: function (el, prop) {
      return typeof getComputedStyle !== 'undefined'
        ? getComputedStyle(el, null).getPropertyValue(prop)
        : el.style[prop]
    },
    overflow: function (el) {
      return utils.style(el, 'overflow') + utils.style(el, 'overflow-y') + utils.style(el, 'overflow-x')
    },
    scrollParent: function (el) {
      if (!(el instanceof HTMLElement)) {
        return window
      }
      let parent = el
      while (parent) {
        if (parent === document.body || parent === document.documentElement) {
          break
        }
        if (!parent.parentNode) {
          break
        }
        if (/(scroll|auto)/.test(utils.overflow(parent))) {
          return parent
        }
        parent = parent.parentNode
      }
      return window
    },
    loadImageAsync: function (src, onSuccess, onError) {
      onSuccess = onSuccess || utils.noop
      onError = onError || utils.onError

      var image = new Image()
      image.src = src

      image.onload = function () {
        onSuccess({
          naturalHeight: image.naturalHeight,
          naturalWidth: image.naturalWidth,
          src: image.src
        })
      }

      image.onerror = function (e) {
        onError(e)
      }
    },
    throttle: function (action, delay) {
      var timeout = null
      var lastRun = 0
      return function () {
        if (timeout) {
          return
        }
        var elapsed = Date.now() - lastRun
        var args = arguments
        var runCallback = function () {
          lastRun = Date.now()
          timeout = false
          action.apply(null, args)
        }
        if (elapsed >= delay) {
          runCallback()
        } else {
          timeout = setTimeout(runCallback, delay)
        }
      }
    },
    findIndex: function (arr, fn) {
      var i
      for (i = 0, len = arr.length; i < len; i++) {
        if (fn(arr[i])) {
          break
        }
      }
      return i
    },
    addEvent: function (node, event, fn, capture) {
      capture == utils.isUndef(capture) ? false : capture

      if (typeof node.addEventListener == 'function') {
        if (supportsPassive) {
          node.addEventListener(event, fn, {
            capture: capture,
            passive: true
          })
        } else {
          node.addEventListener(event, fn, capture)
        }
      }
      else if (typeof node.attachEvent == 'function') {
        node.attachEvent('on' + event, fn);
      }
    },
    removeEvent: function (node, event, fn) {
      if (typeof node.removeEventListener == 'function') {
        node.removeEventListener(event, fn);
      }
      else if (typeof node.detatchEvent == 'function') {
        node.detatchEvent('on' + event, fn);
      }
    },
    isUndef: function (val) {
      return val === null || val === undefined
    }
  }

  var Load = function (el, options) {
    this.el = document.querySelector(el) || document.body
    this.imageListeners = []
    this.imageListenersMap = {}
    this.lazyloadHandler = null
    this._eventBindEl = null

    options = options || {}
    this.options = {
      throttleWait: options.throttleWait || 100,
      loading: options.loading || DEFAULT_URL,
      error: options.error || DEFAULT_URL,
      listenEvents: options.listenEvents || DEFAULT_EVENTS,
      preLoad: options.preLoad || 1.1,
      delay: options.delay,
      observer: utils.isUndef(options.observer) ? true : options.observer
    }

    this.init()
  }

  Load.prototype.init = function () {
    this._initImageListeners()
    this._initEvents()
  }

  Load.prototype.destroy = function () {
    var _this = this
    if (_this._observer) {
      _this._observer.disconnect()
    } else {
      utils.forEach(DEFAULT_EVENTS, function (eventName) {
        utils.removeEvent(_this._eventBindEl, eventName, _this.lazyloadHandler)
      })
    }
  }

  Load.prototype.refresh = function () {
    this.destroy()
    this.init()
  }

  Load.prototype._initImageListeners = function () {
    var _this = this
    var images = _this.el.querySelectorAll('img')
    if (!images || !images.length) return

    var imagesArr = utils.arrayFrom(images)
    utils.forEach(imagesArr, function (img) {
      if (
        !img.src &&
        utils.getDataSrc(img, 'src')
      ) {
        var listener = new ImageListener(img, _this.options)
        listener._sources = _this.imageListeners
        _this.imageListeners.push(listener)

        var imgId = ++cid
        utils.setDataSrc(img, 'id', imgId)
        _this.imageListenersMap[imgId] = listener
      }
    })
  }

  Load.prototype._initEvents = function () {
    // 优先采用IntersectionObserver
    if (hasIntersectionObserver && this.options.observer) {
      this._initIntersectionObserver()
    } else {
      this._initNormalEvents()
    }
  }

  Load.prototype._initIntersectionObserver = function () {
    var _this = this
    _this._observer = new IntersectionObserver(_this._observerHandler.bind(_this))

    utils.forEach(_this.imageListeners, function (imageListener) {
      _this._observer.observe(imageListener.el)
      imageListener._observer = _this._observer
    })
  }

  Load.prototype._observerHandler = function (entries, observer) {
    var _this = this
    utils.forEach(entries, function (entry) {
      // fixed: 低版本安卓浏览器没有isIntersecting属性
      var isEnter = utils.isUndef(entry.isIntersecting) ? entry.intersectionRatio : entry.isIntersecting
      if (isEnter) {
        var img = entry.target
        var imgId = utils.getDataSrc(img, 'id')
        var listener = _this.imageListenersMap[imgId]
        listener.load()
      }
    })
  }

  Load.prototype._initNormalEvents = function () {
    var _this = this
    _this.lazyloadHandler = utils.throttle(this._lazyloadHandler.bind(this), this.options.throttleWait)

    var scrollEl = utils.scrollParent(_this.el)
    utils.forEach(DEFAULT_EVENTS, function (eventName) {
      utils.addEvent(scrollEl, eventName, _this.lazyloadHandler)
    })

    _this._eventBindEl = scrollEl
    _this.lazyloadHandler()
  }

  Load.prototype._lazyloadHandler = function () {
    var _this = this
    utils.forEach(_this.imageListeners, function (image) {
      // 如果有_observer属性说明是observer触发的事件 直接load
      if (image.checkInView()) {
        image.load()
      }
    })
  }


  var ImageListener = function (img, options) {
    this.el = img
    this.src = utils.getDataSrc(img, 'src')
    this.options = options
    this.rect = null
    this._sources = null
    this._observer = null
    this.loading = false
    this.loaded = false
  }

  ImageListener.prototype.render = function (state, src) {
    // loading, error, success
    this.el.setAttribute('src', src || this.options[state])
  }

  ImageListener.prototype.load = function () {
    var _this = this
    if (_this.loading || _this.loaded) return

    _this.loading = true
    _this.render('loading')

    utils.loadImageAsync(
      this.src,
      function onSuccess(result) {
        var src = result.src

        var delay = _this.options.delay
        if (delay) {
          setTimeout(function () {
            _this.render('success', src)
          }, delay);
        } else {
          _this.render('success', src)
        }
        _this.finishLoading()
      },
      function onError() {
        _this.render('error')
        _this.finishLoading()
      }
    )
  }

  ImageListener.prototype.finishLoading = function () {
    var _this = this
    _this.loading = false
    _this.loaded = true
    var sources = _this._sources
    var index = utils.findIndex(sources, function (listener) {
      return utils.getDataSrc(listener.el, 'id') === utils.getDataSrc(_this.el, 'id')
    })
    sources.splice(index, 1)

    if (_this._observer) {
      _this._observer.unobserve(_this.el)
    }
  }


  ImageListener.prototype.getRect = function () {
    this.rect = this.el.getBoundingClientRect()
  }

  ImageListener.prototype.checkInView = function () {
    this.getRect()
    return (this.rect.top < window.innerHeight * this.options.preLoad) &&
      (this.rect.left < window.innerWidth * this.options.preLoad && this.rect.right > 0)
  }

  window.EasyLazyLoad = Load
})()