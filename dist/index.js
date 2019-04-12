!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.EasyLazyLoad=e()}(this,function(){"use strict";var i=function(){var t=!1;try{var e=Object.defineProperty({},"passive",{get:function(){t=!0}});window.addEventListener("test",null,e)}catch(t){}return t}(),r={noop:function(){},arrayFrom:function(t){var e=t.length;if(!e||r.isArray(t))return t;for(var n=[],o=0;o<e;o++)n.push(t[o]);return n},forEach:function(t,e){var n=Array.prototype.forEach;if(n)return n.call(t,e);for(var o=0;o<t.length;o++)e(t[o],o)},getDataSet:function(t,e){return"dataset"in t?t.dataset[e]:t.getAttribute("data-"+e)},setDataSet:function(t,e,n){"dataset"in t?t.dataset[e]=n:t.setAttribute("data-"+e,n)},style:function(t,e){return"undefined"!=typeof getComputedStyle?getComputedStyle(t,null).getPropertyValue(e):t.style[e]},overflow:function(t){return r.style(t,"overflow")+r.style(t,"overflow-y")+r.style(t,"overflow-x")},isHTMLElement:function(t){return t instanceof HTMLElement},isArray:function(t){return t instanceof Array},scrollParent:function(t){if(!r.isHTMLElement(t))return window;for(var e=t;e&&e!==document.body&&e!==document.documentElement&&e.parentNode;){if(/(scroll|auto)/.test(r.overflow(e)))return e;e=e.parentNode}return window},loadImageAsync:function(t,e,n){e=e||r.noop,n=n||r.noop;var o=new Image;o.src=t,o.onload=function(){e({naturalHeight:o.naturalHeight,naturalWidth:o.naturalWidth,src:o.src})},o.onerror=function(t){n(t)}},throttle:function(o,i){var r=null,a=0;return function(){if(!r){var t=Date.now()-a,e=arguments,n=function(){a=Date.now(),r=!1,o.apply(null,e)};t<i?r=setTimeout(n,i):n()}}},findIndex:function(t,e){var n,o;for(n=0,o=t.length;n<o&&!e(t[n]);n++);return n},addEvent:function(t,e,n,o){"function"==typeof t.addEventListener?t.addEventListener(e,n,i?{capture:o,passive:!0}:o):"function"==typeof t.attachEvent&&t.attachEvent("on"+e,n)},removeEvent:function(t,e,n){"function"==typeof t.removeEventListener?t.removeEventListener(e,n):"function"==typeof t.detatchEvent&&t.detatchEvent("on"+e,n)},isUndef:function(t){return null==t}},a=function(t,e,n){this.el=t,this.src=r.getDataSet(t,"src"),this.options=e,this.rect=null,this.loading=!1,this.loaded=!1,this.loadInstance=n};a.prototype.render=function(t,e){this.el.setAttribute("src",e||this.options[t])},a.prototype.load=function(){var e=this;if(!e.loading&&!e.loaded)if(e.loading=!0,e.loadInstance.loadMoreMode){e.loadInstance.options.onLoadMore(function(){e.loading=!1})}else r.loadImageAsync(this.src,function(t){e.loadInstance.options.beforeMount&&e.loadInstance._callHook("beforeMount",e.el),e.render("success",t.src),e.loadInstance.options.mounted&&e.loadInstance._callHook("mounted",e.el),e.finishLoading()},function(){e.render("error"),e.finishLoading()})},a.prototype.finishLoading=function(){var e=this;e.loading=!1,e.loaded=!0;var t=e.loadInstance.imageListeners,n=r.findIndex(t,function(t){return r.getDataSet(t.el,"id")===r.getDataSet(e.el,"id")});t.splice(n,1),e.loadInstance._observer&&e.loadInstance._observer.unobserve(e.el)},a.prototype.getRect=function(){this.rect=this.el.getBoundingClientRect()},a.prototype.checkInView=function(){return this.getRect(),this.rect.top<window.innerHeight*this.options.preLoad&&this.rect.left<window.innerWidth*this.options.preLoad&&0<this.rect.right};var e="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",o=["scroll","wheel","mousewheel","resize","animationend","transitionend","touchmove"],t=!!window.IntersectionObserver,n=function(t,e){this._initOptions(e),this._initProperties(t,e),this._preLoad(),this._initImageListeners(),this._initEvents()};n.prototype._initOptions=function(t){this.options={loading:(t=t||{}).loading||e,error:t.error||e,throttleWait:t.throttleWait||100,listenEvents:t.listenEvents||o,preLoad:t.preLoad||1.3,observer:!!r.isUndef(t.observer)||t.observer,onPreLoad:t.onPreLoad||r.noop,beforeMount:t.beforeMount,mounted:t.mounted,onLoadMore:t.onLoadMore}},n.prototype._initProperties=function(t,e){if(this.loadMoreMode=!r.isUndef(this.options.onLoadMore),this.el=r.isHTMLElement(t)?t:document.querySelector(t),!this.el){if(this.loadMoreMode)throw Error("loadMore should bind a mounted dom");this.el=document.body}this.imageListeners=[],this.imageListenersMap={},this.lazyloadHandler=null,this._eventBindEl=null,this._eventBindElRect=null},n.prototype._preLoad=function(){if(!this.loadMoreMode){var t=this,e=t.options.error;r.loadImageAsync(t.options.loading,function(){t._callHook("onPreLoad")}),r.loadImageAsync(e)}};var s=0;return n.prototype._initImageListeners=function(){var o=this,t=this.loadMoreMode?[o.el]:o.el.querySelectorAll("img");if(t&&t.length){var e=r.arrayFrom(t);r.forEach(e,function(t){if(r.getDataSet(t,"src")&&!o.imageListenersMap[r.getDataSet(t,"id")]||o.loadMoreMode){var e=new a(t,o.options,o);o.loadMoreMode||e.render("loading");var n=++s;r.setDataSet(t,"id",n),o.imageListeners.push(e),o.imageListenersMap[n]=e}})}},n.prototype._initEvents=function(){t&&this.options.observer?this._initIntersectionObserver():this._initNormalEvents()},n.prototype._initIntersectionObserver=function(){var e=this;e._observer=new IntersectionObserver(e._observerHandler.bind(e),{rootMargin:window.innerHeight*(e.options.preLoad-1)+"px "+window.innerWidth*(e.options.preLoad-1)+"px"}),r.forEach(e.imageListeners,function(t){e._observer.observe(t.el)})},n.prototype._observerHandler=function(t,e){var n=this;r.forEach(t,function(t){if(r.isUndef(t.isIntersecting)?t.intersectionRatio:t.isIntersecting){var e=r.getDataSet(t.target,"id");n.imageListenersMap[e].load()}})},n.prototype._initNormalEvents=function(){var e=this;e.lazyloadHandler=r.throttle(this._lazyloadHandler.bind(this),this.options.throttleWait);var n=r.scrollParent(e.el);r.forEach(o,function(t){r.addEvent(n,t,e.lazyloadHandler)}),e._eventBindEl=n,e._eventBindElRect=r.isHTMLElement(n)?n.getBoundingClientRect():document.body.getBoundingClientRect(),e.lazyloadHandler()},n.prototype._lazyloadHandler=function(){r.forEach(this.imageListeners,function(t){t.checkInView()&&t.load()})},n.prototype._callHook=function(t){var e=this.options[t],n=r.arrayFrom(arguments);e.apply(null,n.slice(1))},n.prototype.destroy=function(){var e=this;e._observer?e._observer.disconnect():r.forEach(o,function(t){r.removeEvent(e._eventBindEl,t,e.lazyloadHandler)})},n.prototype.refresh=function(){this._initImageListeners(),this._initEvents()},n});
