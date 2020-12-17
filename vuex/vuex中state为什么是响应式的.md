### Vuex中state为什么是响应式的？

> 实际上在vuex内部定义了一个vue实例，然后在vue实例中的data属性中绑定了state。看一下源码

```js
// src/store.js

class Store {
    constructor () {
        ...
        const store = this
        const state = this._modules.root.state
        resetStoreVM(store, state)
    }
    get state () {
        return this._vm._data.$$state
    }
}

function resetStoreVM (store, state, hot) {
    ...
    store._vm = new Vue({
        data: {
          $$state: state
        },
        computed
    })
    ...
}
```

在`store`上新增了一个`_vm`属性，赋值一个`vue`实例，vue实例的`data`属性中的键值对，都会被observe转为响应式，这是vue源码中的内容。

当我们使用this.$store.state时 就会调用 Store.get方法就会调用`this._vm._data.$$state`,这里的this指向的是store实例。

## 总结

Vuex中的state是因为 store._vm 复制了一个vue实例，vue实例中的data属性中又绑定了vuex 的state，所以是vue将state转为了响应式。