## Vue.use(Vuex) 都干了什么？

1.  根据官方文档中的介绍，我们在使用vuex时，首先

   ```js
   // npm i vuex -S
   import Vue from 'vue';
   import Vuex from 'vuex';
   Vue.use(Vuex)
   ```

   `import Vuex from 'vuex'`, 会干啥？ 有目的的看， 看他最后给我们什么东西用。打开vuex源码

   ```js
   // src/index.js  （Vuex 源码）
   import { Store, install } from './store'
   import { mapState, mapMutations, mapGetters, mapActions, createNamespacedHelpers } from './helpers'
   import createLogger from './plugins/logger'
   export default {
     Store, // 有 class Store {}
     install, // 有 install 方法
     version: '__VERSION__',
     ...
   }
   ```

   `Vue.use` 看一下Vue源码中的use方法。

   ```js
   // src/core/global-api/use.js （Vue源码）
   
   Vue.use = function (plugin: Function | Object) {
       const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
       if (installedPlugins.indexOf(plugin) > -1) {
         return this
       }
   
       // additional parameters
       const args = toArray(arguments, 1)
       args.unshift(this) // 将Vue添加到args数组的第一个
       if (typeof plugin.install === 'function') {
         plugin.install.apply(plugin, args) // 在这里就是执行了Vuex中Store的install方法，并将Vue作为参数传值
       } else if (typeof plugin === 'function') {
         plugin.apply(null, args)
       }
       installedPlugins.push(plugin)
       return this
     }
   ```

   然后看install 方法干了啥？

   ```js
   // src/store.js（Vuex 源码）
   export function install (_Vue) {
     if (Vue && _Vue === Vue) { // 判断避免重复注册插件
       if (__DEV__) {
         console.error(
           '[vuex] already installed. Vue.use(Vuex) should be called only once.'
         )
       }
       return
     }
     Vue = _Vue
     applyMixin(Vue)
   }
   ```

   install 方法做了一下去重操作，同时调用了applyMixin(Vue),那么有用的逻辑应该就在applyMixin中了，看一下applyMixin（Vue）

   ```js
   // src/mixin.js （Vuex 源码）
   export default function (Vue) {
     const version = Number(Vue.version.split('.')[0]) // 拿到Vue的版本的第一个数
   
     if (version >= 2) {
       Vue.mixin({ beforeCreate: vuexInit }) // 在Vue的breforeCreate生命周期中注入，vuexInit干了啥？
     } else {
       // override init and inject vuex init procedure
       // for 1.x backwards compatibility.
       const _init = Vue.prototype._init
       Vue.prototype._init = function (options = {}) {
         options.init = options.init
           ? [vuexInit].concat(options.init)
           : vuexInit
         _init.call(this, options)
       }
     }
   
     /**
      * Vuex init hook, injected into each instances init hooks list.
      */
   	// 初始化vuex， 将vuex注入到Vue根实例以及各个组件实例中
     function vuexInit () {
       const options = this.$options // 获取vue的options new Vue({options})
       // store injection
       if (options.store) { // 如果你要用vuex，options中属性名只能起名叫store， 不然就没法用this.$store； 同时这里也将options.store赋值给了this.$store, 所以我们可以在组件中使用this.$store取值， 提交，等操作。
         this.$store = typeof options.store === 'function'
           ? options.store()
           : options.store
       } else if (options.parent && options.parent.$store) {
         this.$store = options.parent.$store
       }
     }
   }
   
   ```

   

   ### 总结

   1. 对插件进行去重校验，如果注册过了就直接返回；

   2. mixin 混入到Vue中；

   3. 要在new Vue({ store }) ;里面一定要写store , 否则this.$state不会执行；

      ```js
      import vuexstore from './store'
      new Vue({
          store: vuexstore // 这里一定要是store哦, 这里这样写就是为了让大家知道属性值必须是store
      }).$mount('#app')
      ```

      

