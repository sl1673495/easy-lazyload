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

  最简单的用法： var loader = new EasyLazyLoad() 会将body作为滚动容器并找body下所有有data-src属性的img作为懒加载对象。

  如果需要确定一个容器内部的img需要懒加载：var loader = new EasyLazyLoad('.img-wrap')

  详细api：
  var loader = new EasyLazyLoad('.img-wrap', {
      loading, // 加载图片url
      error, // 加载失败图片url
      preLoad: 默认为1.3, // 预加载时机 如1.3则提前30%的视口高度就加载， 演示设为1是为了更好的展示效果
      observer: 默认为true // 是否使用 IntersectionObserver api来监听图片是否进入视口 默认为true 性能更好 如果浏览器不兼容则降级为事件监听

      // 下面的选项启用observer时无效
      throttleWait: 100, // 监听事件触发频率
      listenEvents, // 需要监听的事件 默认为'scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'

      // 生命周期
      onPreload: function() // 在loading图片预加载完成后调用， 可以防止用户看到一片空白的图片占位， 一般用不着。
      beforeMount: function(img) // 在img替换真实url前调用，在这里可以做一些动画的初始化工作 如img.style.opacity = 0 img.style.transition = 'all .5s'
      mounted: function(img) // 在img替换真实url后调用， 在这里可以做一些动画的结束值替换 如img.style.opacity = 1
 })

 实例方法 
 loader.refresh()： 用于新增图片节点后对这些图片进行监听。
 loader.destory(): 移除一个实例的所有事件监听。
```

#### 作为瀑布流插件使用
```
.loading作为列表底部的加载提示，比如一行'正在加载'的文字，和懒加载的逻辑一样，在合适的时机触发回调即可完成无限加载的效果。

  var loadMore = new EasyLazyLoad('.loading', {
      // 只要传入onLoadMore参数就会作为瀑布流插件加载
      onLoadMore: function (done) {
        ... // 任何插入图片的逻辑，可以是同步也可以是异步, 异步的话注意done的调用时机

        loader.refresh() // 监听新加入的图片节点

        done() 调用done方法， 通知loader可以开始下一次的监听，如果不调用则下次拉到loading的可视范围不会触发回调。        
      }    
 })

 index.html中为了演示效果全部做了延迟处理，实际场景业务情况调整
```