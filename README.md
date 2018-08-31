# easy-lazyload
原生js实现的图片懒加载库。
预览地址： https://sl1673495.github.io/easy-lazyload/

#### 使用说明
```
  <div class="img-wrap">
    <img data-src="./assets/images/timg1.jpeg" />
    <img data-src="./assets/images/timg2.jpeg" />
    <img data-src="./assets/images/timg3.jpeg" />
  </div>

  var loader = new EasyLazyLoad('.img-wrap', {
      loading, // 加载图片url
      error, // 加载失败图片url
      preLoad: 1.3, // 预加载时机 如1.3则提前30%的视口高度就加载， 演示设为1是为了更好的展示效果
      observer: true // 是否使用 IntersectionObserver api来监听图片是否进入视口 默认为true 性能更好 如果浏览器不兼容则降级为事件监听
      delay: 1000, // 延迟加载 演示专用
      // 下面的事件启用observer时无效
      throttleWait: 100, // 监听事件触发频率
      listenEvents, // 需要监听的事件 默认为'scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'
 })

 此外也可以作为瀑布流插件使用。
 .loading作为列表底部的加载提示，比如一行'正在加载'的文字，和懒加载的逻辑一样，在合适的时机触发回调即可完成无限加载的效果。

  var loadMore = new EasyLazyLoad('.loading', {
      // 只要传入onLoadMore参数就会作为瀑布流插件加载
      onLoadMore: function (done) {
        ... 任何插入图片的逻辑，可以是同步也可以是异步, 异步的话注意done的调用时机
        
        done() 调用done方法， 通知loader可以开始下一次的监听，如果不调用则下次拉到loading的可视范围不会触发回调。        
      }    
 })

 index.html中为了演示效果全部做了延迟处理，实际场景业务情况调整
```