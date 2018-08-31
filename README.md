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
      throttleWait: 100, // 监听事件触发频率
      loading, // 加载图片url
      error, // 加载失败图片url
      listenEvents, // 需要监听的事件 默认为'scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'
      preLoad: 1.1, // 预加载时机 如1.1则提前10%的视口高度就加载
      delay: 1000, // 延迟加载 演示专用
      observer: true // 是否使用 IntersectionObserver api来监听图片是否进入视口 默认为true 性能更好 如果浏览器不兼容则降级为事件监听
 })
```