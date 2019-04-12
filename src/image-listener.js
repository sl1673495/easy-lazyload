
import utils from './util'

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
        var beforeMount = ctx.loadInstance.options.beforeMount
        if (beforeMount) {
          ctx.loadInstance._callHook('beforeMount', ctx.el)
          // beforeMount可以设置动画的一些初始值，需要手动触发一次重绘
          console.log(ctx.el.offsetTop)
        }
        var src = result.src
        ctx.render('success', src)
        if (ctx.loadInstance.options.mounted) {
          ctx.loadInstance._callHook('mounted', ctx.el)
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

export default ImageListener