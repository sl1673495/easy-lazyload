(function () {
  var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
      var len = arrLike.length
      if (!len || utils.isArray(arrLike)) {
        return arrLike
      }
      var list = []
      for (var i = 0; i < len; i++) {
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
    getDataSet: function (el, attr) {
      if ('dataset' in el) {
        return el.dataset[attr]
      } else {
        return el.getAttribute('data-' + attr)
      }
    },
    setDataSet: function (el, attr, value) {
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
    isHTMLElement(el) {
      return el instanceof HTMLElement
    },
    isArray(v) {
      return v instanceof Array
    },
    scrollParent: function (el) {
      if (!(utils.isHTMLElement(el))) {
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
      onError = onError || utils.noop

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
    this._initOptions(options)
    this._initProperties(el, options)
    this._preLoad()
    this._initImageListeners()
    this._initEvents()
  }


  // 规范化配置  
  Load.prototype._initOptions = function (options) {
    options = options || {}
    this.options = {
      loading: options.loading || DEFAULT_URL,
      error: options.error || DEFAULT_URL,
      throttleWait: options.throttleWait || 100,
      listenEvents: options.listenEvents || DEFAULT_EVENTS,
      preLoad: options.preLoad || 1.3,
      delay: options.delay,
      observer: utils.isUndef(options.observer) ? true : options.observer,
      onPreLoad: options.onPreLoad || utils.noop,
      beforeMount: options.beforeMount,
      mounted: options.mounted,
      onLoadMore: options.onLoadMore,
    }
  }

  // 初始化属性
  Load.prototype._initProperties = function (el, options) {
    this.loadMoreMode = !utils.isUndef(this.options.onLoadMore)
    this.el = document.querySelector(el)

    if (!this.el) {
      if (this.loadMoreMode) {
        throw new Error('loadMore should bind a mounted dom')
      } else {
        this.el = document.body
      }
    }

    this.imageListeners = []
    this.imageListenersMap = {}
    this.lazyloadHandler = null
    this._eventBindEl = null
    this._eventBindElRect = null
  }


  // 预加载loading和error图
  Load.prototype._preLoad = function () {
    if (this.loadMoreMode) return

    var ctx = this
    var loading = ctx.options.loading
    var error = ctx.options.error

    utils.loadImageAsync(loading, function () {
      ctx._callHook('onPreLoad')
    })
    utils.loadImageAsync(error)
  }

  // 加载图片监听类
  Load.prototype._initImageListeners = function () {
    var ctx = this
    var targets = this.loadMoreMode
      ? [ctx.el]
      : ctx.el.querySelectorAll('img')

    if (!targets || !targets.length) return

    var targetArr = utils.arrayFrom(targets)
    utils.forEach(targetArr, function (target) {
      if (
        (utils.getDataSet(target, 'src') && !ctx.imageListenersMap[utils.getDataSet(target, 'id')]) ||
        ctx.loadMoreMode
      ) {
        var listener = new ImageListener(target, ctx.options, ctx)

        if (!ctx.loadMoreMode) {
          listener.render('loading')
        }

        var targetId = ++cid
        utils.setDataSet(target, 'id', targetId)

        ctx.imageListeners.push(listener)
        ctx.imageListenersMap[targetId] = listener
      }
    })
  }

  // 加载事件
  Load.prototype._initEvents = function () {
    // 优先采用IntersectionObserver
    if (hasIntersectionObserver && this.options.observer) {
      this._initIntersectionObserver()
    } else {
      this._initNormalEvents()
    }
  }

  Load.prototype._initIntersectionObserver = function () {
    var ctx = this
    ctx._observer = new IntersectionObserver(ctx._observerHandler.bind(ctx), {
      rootMargin: window.innerHeight * (ctx.options.preLoad - 1) + 'px' + ' ' + window.innerWidth * (ctx.options.preLoad - 1) + 'px'
    })

    utils.forEach(ctx.imageListeners, function (imageListener) {
      ctx._observer.observe(imageListener.el)
    })
  }

  Load.prototype._observerHandler = function (entries, observer) {
    var ctx = this
    utils.forEach(entries, function (entry) {
      // fixed: 低版本安卓浏览器没有isIntersecting属性
      var isEnter = utils.isUndef(entry.isIntersecting) ? entry.intersectionRatio : entry.isIntersecting
      if (isEnter) {
        var img = entry.target
        var imgId = utils.getDataSet(img, 'id')
        var listener = ctx.imageListenersMap[imgId]
        listener.load()
      }
    })
  }

  // 降级方案, 监听事件去判断图片是否进入视口
  Load.prototype._initNormalEvents = function () {
    var ctx = this
    ctx.lazyloadHandler = utils.throttle(this._lazyloadHandler.bind(this), this.options.throttleWait)

    var scrollEl = utils.scrollParent(ctx.el)
    utils.forEach(DEFAULT_EVENTS, function (eventName) {
      utils.addEvent(scrollEl, eventName, ctx.lazyloadHandler)
    })

    ctx._eventBindEl = scrollEl
    ctx._eventBindElRect = utils.isHTMLElement(scrollEl) ? scrollEl.getBoundingClientRect() : document.body.getBoundingClientRect()
    ctx.lazyloadHandler()
  }

  Load.prototype._lazyloadHandler = function () {
    var ctx = this
    utils.forEach(ctx.imageListeners, function (image) {
      if (image.checkInView()) {
        image.load()
      }
    })
  }

  Load.prototype._callHook = function (hook) {
    var hookCallback = this.options[hook]
    var argumentsArr = utils.arrayFrom(arguments)
    hookCallback.apply(null, argumentsArr.slice(1))
  }

  // api 用于dom移除后删除事件监听
  Load.prototype.destroy = function () {
    var ctx = this
    if (ctx._observer) {
      ctx._observer.disconnect()
    } else {
      utils.forEach(DEFAULT_EVENTS, function (eventName) {
        utils.removeEvent(ctx._eventBindEl, eventName, ctx.lazyloadHandler)
      })
    }
  }

  // api 用于添加新图片
  Load.prototype.refresh = function () {
    this._initImageListeners()
    this._initEvents()
  }

  var ImageListener = function (img, options, loadInstance) {
    this.el = img
    this.src = utils.getDataSet(img, 'src')
    this.options = options
    this.rect = null
    this.loading = false
    this.loaded = false
    this.loadInstance = loadInstance
  }

  ImageListener.prototype.render = function (state, src) {
    // loading, error, success
    this.el.setAttribute('src', src || this.options[state])
  }

  ImageListener.prototype.load = function () {
    var ctx = this

    if (ctx.loading || ctx.loaded) return
    ctx.loading = true

    if (ctx.loadInstance.loadMoreMode) {
      var done = function () {
        ctx.loading = false
      }
      ctx.loadInstance.options.onLoadMore(done)
    } else {
      utils.loadImageAsync(
        this.src,
        function onSuccess(result) {
          ctx.loadInstance.options.beforeMount && ctx.loadInstance._callHook('beforeMount', ctx.el)

          var src = result.src
          var delay = ctx.options.delay
          if (delay ||  ctx.loadInstance.options.mounted) {
            // 如果用户定义了mounted生命周期， 有可能要进行一些dom操作触发动画， 必须把render放在下一个事件周期里执行，防止被浏览器引擎优化多次dom修改成同一次。
            setTimeout(function () {
              ctx.render('success', src)
              ctx.loadInstance._callHook('mounted', ctx.el)          
            }, delay || 17);
          } else {
            ctx.render('success', src)
          }

          ctx.finishLoading()
        },
        function onError() {
          ctx.render('error')
          ctx.finishLoading()
        }
      )
    }
  }

  ImageListener.prototype.finishLoading = function () {
    var ctx = this
    ctx.loading = false
    ctx.loaded = true

    var sources = ctx.loadInstance.imageListeners
    var index = utils.findIndex(sources, function (listener) {
      return utils.getDataSet(listener.el, 'id') === utils.getDataSet(ctx.el, 'id')
    })
    sources.splice(index, 1)

    if (ctx.loadInstance._observer) {
      ctx.loadInstance._observer.unobserve(ctx.el)
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