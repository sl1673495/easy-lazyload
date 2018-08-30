(function () {
  var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  var DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']
  var hasIntersectionObserver = Boolean(window['IntersectionObserver'])
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
    }
  }

  var Load = function (el, options) {
    this.el = document.querySelector(el) || document.body
    this.imageListeners = []
    this.imageListenersMap = {}
    this.lazyloadHandler = null

    options = options || {}
    this.options = {
      throttleWait: options.throttleWait || 100,
      loading: options.loading || DEFAULT_URL,
      error: options.error || DEFAULT_URL,
      listenEvents: options.listenEvents || DEFAULT_EVENTS,
      preLoad: options.preLoad || 1.3,
    }
  }

  Load.prototype.init = function () {
    this._initImageListeners()
    this._initEvents()

    this.lazyloadHandler()
  }

  Load.prototype.destroy = function() {
    var _this = this
    if (_this._observer) {
      _this._observer.disconnect()
    }else {
      utils.forEach(DEFAULT_EVENTS, function(eventName) {
        _this._eventBindEl.removeEventListener(eventName, _this.lazyloadHandler)
      })
    }
  }

  Load.prototype.refresh = function() {
    this._destory()
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
    this.lazyloadHandler = utils.throttle(this._lazyloadHandler.bind(this), this.options.throttleWait)

    // 优先采用IntersectionObserver
    if (hasIntersectionObserver) {
      this._initNormalEvents()
    } else {
      this._initIntersectionObserver()
    }
  }

  Load.prototype._lazyloadHandler = function () {
    var _this = this
    utils.forEach(_this.imageListeners, function (image) {
      if (image.checkInView()) {
        image.load()
      }
    })
  }

  Load.prototype._initIntersectionObserver = function () {
    var _this = this
    _this._observer = new IntersectionObserver(_this._observerHandler.bind(_this), {
      root: _this.el,
      rootMargin: _this.el.clientHeight * (_this.options.preLoad - 1) + 'px ' + _this.el.clientWidth * (_this.options.preLoad - 1) + 'px'
    })

    utils.forEach(_this.imageListeners, function (imageListener) {
      _this._observer.observe(imageListener.el)
      imageListener._observer = _this._observer
    })
  }

  Load.prototype._initNormalEvents = function () {
    var _this = this
    var scrollEl = utils.scrollParent(_this.el)
    utils.forEach(DEFAULT_EVENTS, function(eventName) {
      scrollEl.addEventListener(eventName, _this.lazyloadHandler)
    })

    _this._eventBindEl = scrollEl
  }

  Load.prototype._observerHandler = function (entries, observer) {
    var _this = this
    utils.forEach(entries, function (entry) {
      if (entry.isIntersecting) {
        var img = entry.target
        var imgId = utils.getDataSrc(img, 'id')
        var listener = _this.imageListenersMap[imgId]
        listener.load()
      }
    })
  }

  var ImageListener = function (img, options) {
    this.el = img
    this.src = utils.getDataSrc(img, 'src')
    this.rect = null
    this.loading = false
    this.loaded = false
    this.options = options
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
        _this.render('success', src)
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
    var sources = this._sources
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