
import ImageListener from './image-listener'
import utils from './util'

var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
var DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']
var hasIntersectionObserver = Boolean(window['IntersectionObserver'])

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
  this.el = utils.isHTMLElement(el) ? el : document.querySelector(el)

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

var cid = 0
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

export default Load