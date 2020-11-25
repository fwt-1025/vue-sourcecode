## Vue中为什么可以直接使用this.name 取到data () {return {name: '123'}} ，data中的name?

- 标题中只举了一个例子，其实还有computed、methods、props等，接下来就解释一下为什么？Vue都帮我们做了哪些事情？

  ```js
  // 我们在项目中一般都时这样使用vue
  export default {
      data () {
          return {
              name: '12'
          }
      },
      mounted () {
          console.log(this.name) // 这里的this.name 可以直接拿到data中定义的name, 为什么呢？
      }
  }
  ```

  看Vue的源码，只简单看一个例子，其他的都差不多。这里拿`data（initData) ` 作解释,源码位置`src/instance/state.js`

  ```js
  function initData (vm: Component) {
    let data = vm.$options.data
    data = vm._data = typeof data === 'function'
      ? getData(data, vm)
      : data || {}
    ... // 省略部分代码
    // proxy data on instance
    const keys = Object.keys(data)
    const props = vm.$options.props
    const methods = vm.$options.methods
    let i = keys.length
    while (i--) {
      const key = keys[i]
      ... // 省略部分代码
      if (props && hasOwn(props, key)) {
        process.env.NODE_ENV !== 'production' && warn(
          `The data property "${key}" is already declared as a prop. ` +
          `Use prop default value instead.`,
          vm
        )
      } else if (!isReserved(key)) {
        proxy(vm, `_data`, key)  // 重点看这里 proxy
      }
    }
    // observe data
    observe(data, true /* asRootData */)
  }
  ```

  通过上面的代码我们看到Vue对我们的data传值给了proxy，（只针对问题不明确的地方看源码，不然乱七八糟不知道看的是啥），接下来我们看一下proxy做了什么，让我们使用这么方便。源码位置 `src/instance/state.js`

  ```js
  const sharedPropertyDefinition = { // 用来最后传给object.defineProperty的第三个参数
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
  }
  
  export function proxy (target: Object, sourceKey: string, key: string) {
    sharedPropertyDefinition.get = function proxyGetter () { // 定义get方法
      return this[sourceKey][key] // 当我们访问 this.name时 ，其实访问的就是 this['_data']['name']
    }
    sharedPropertyDefinition.set = function proxySetter (val) { // 定义set方法
      this[sourceKey][key] = val  // 当我们设置 this.name时 ，其实设置的就是 this['_data']['name']
    }
    Object.defineProperty(target, key, sharedPropertyDefinition) // 加拦截
  }
  
  ```

  Vue在这里帮我们做了这些工作， 就是一个Vue给开发者提供的福利，将this.name通过Object.defineProperty 代理到对应的`this[sourceKey][key]`上面。

