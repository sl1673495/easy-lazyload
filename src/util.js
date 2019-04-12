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
})();

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
  isHTMLElement: function (el) {
    return el instanceof HTMLElement
  },
  isArray: function(v) {
    return v instanceof Array
  },
  scrollParent: function (el) {
    if (!(utils.isHTMLElement(el))) {
      return window
    }
    var parent = el
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
    var i, len
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

export default utils