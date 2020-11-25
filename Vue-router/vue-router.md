## Vue.use(VueRouter) 这个过程都干了啥？

```js
import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)
```

先看Vue.use方法

```js
Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) { // 防止重复注册
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this) // [Vue, VueRouter]
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
```

Vue.use 首先判断`installedPlugins`中是否存在将要注册的plugin，如果存在就直接返回this;防止重复注册。然后将Vue实例存进args，判断plugin.install是否是函数，是就直接执行，VueRouter中存在install方法，所以直接执行。

打开`vue-router`的源码，vue-router/src/install.js

```js
export let _Vue
export function install (Vue) {
  if (install.installed && _Vue === Vue) return // 防止重复install
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  Vue.mixin({ // 在每个组件的beforeCreate 和 destoryed的钩子中都会调用下面的代码
    beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this // 根Vue实例
        this._router = this.$options.router // new Vue({router}) Vue.$options.router
        this._router.init(this) // 初始化vue-router,在beforeCreate生命周期中调用new Router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current) // 将_route 转为响应式
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })
// 这里也就说明了$router 与 $route 的区别
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router } // 根实例上的VueRouter实例 new VueRouter()
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route } // 组件级的route对象
  })

  Vue.component('RouterView', View) // 注册router-view组件
  Vue.component('RouterLink', Link) // 注册router-link组件

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
```

从源码中我们总结为以下几点：

1. 防止重复install；
2. 混入Vue组件的生命周期中，在每个组件的beforeCreate中初始化VueRouter，将_route 设置为响应式对象；
3. $router与$route的区别；
4. 注册routerView、routerLink的组件，如果没有执行install，就不能使用routerView、routerLink；