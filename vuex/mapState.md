### 为什么要用mapState？ mapState的实现原理？

我们在vue中使用vuex 的状态，通常在computed计算属性中获取，举个例子

```js
new Vue ({
    computed: {
        name () {
            return this.$store.state.name
        }
    }
})
```

上面的例子中我们获取了vuex中的name，但是现在有一个问题是，如果我们想获取多个状态，那是不是就要写多个函数。显然着很麻烦，给开发带来不便，vuex官方给我们提供了便捷的方式mapState。先看如何使用

```js
import { mapState } from 'vuex'
new Vue({
    computed: mapState({
        name: state => state.name,
        age: state => state.age,
        alias: 'friends' // 传字符串'friends' 等同于 state => state.friends
    })
})
```

或者是

```js
import { mapState } from 'vuex'
new Vue({
    computed: mapState(['name', 'age'])
})
```

我们有时候还想跟vue中的computed一些属性一起使用

```js
import { mapState } from 'vuex'
new Vue({
    data () {
        return {
            other: 'other'
        }
    },
    computed: {
        ...mapState({
            name: state => state.name
        }),
        other () {
            return this.other
        }
    }
})
```

使用方法了解之后就要看看实现原理了，源码写在src/helper.js

```js
export const mapState = normalizeNameSpace((namespace, states) => {
    ...
})
```

我们看到执行了normalizeNameSpace方法，他干了什么呢？源码也在当前文件中

```js
function normalizeNameSpace (fn) {
    return function (namespace, map) {
        if (typeof namespace !== 'string') { // 查看有没有命名空间，如果没有，把namespace赋值给map，namespace赋值为空字符串
          map = namespace
          namespace = ''
        } else if (namespace.charAt(namespace.length - 1) !== '/') {
          namespace += '/'
        }
        // 如果namespace是一个字符串， 判断namespace最后一位是不是'/',如果不是要在namespace后面加一个'/',然后调用回调函数， 这里是为了后面根据namespace查找对应的模块
        return fn(namespace, map)
    }
}
```

这个函数就是对`namespace`的处理，然后回过头再看`mapState`函数

```js
export const mapState = normalizeNamespace((namespace, states) => { // namespace => '' states => {name: state => state.name}
  const res = {}
  if (__DEV__ && !isValidMap(states)) {
    console.error('[vuex] mapState: mapper parameter must be either an Array or an Object')
  }
  // [key: 'name', val: state => state.name]
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function mappedState () {
      ...
    }
    // mark vuex getter for devtools
    res[key].vuex = true
  })
  return res
})
```

先调用`normalizeNamespace` 对`namespace`做处理 ,然后调用(namespace, states) => {...｝, `normalizeMap`是对参数进行处理，处理成[key:'name', val: xxx]的形式，循环遍历,在`res`对象中添加对应的键值对，最后`return res`, 此时`res`的值应该是这样的

```js
{
    name: function mappedState() {},
    age: function mappedState() {}
    ...
}
```

当我们在vue中使用mapState时，其实就是调用了这些对应的函数，比如

```js
export default {
    computed: mapState({
        name: state => state.name
    })
}
```

其实是这样调用的,直接调用`mappedState`函数, 然后我们看一下这个函数

```js
res[key] = function mappedState () {
    let state = this.$store.state // 获取state
    let getters = this.$store.getters // 获取getters
    if (namespace) { // 如果有vuex模块 那就获取对应的命名空间下的state getters
        const module = getModuleByNamespace(this.$store, 'mapState', namespace)
        if (!module) {
            return
        }
        state = module.context.state
        getters = module.context.getters
    }
    return typeof val === 'function'
        ? val.call(this, state, getters)
    : state[val] // 判断val如果是函数直接调用，如果不是直接取值
}
```

上面的mappedState函数中，先获取state、getters，如果存在模块命名空间，就取出对应的命名空间中的state、getters。然后就是对我们在computed中使用mapState传入的值做判断，如果这个值是函数就直接调用函数，指定this，且将state、getters传入，如果不是函数，那就只能是字符串了，就直接从state中去对应这个字符串的值就行了，简化上述的代码其实就是这样子的。

```js
var state = {name: '123'} // 获取的vuex中的state的值
var val = state => state.name // computed中传来的函数 ，用函数别名val， 将函数赋值给val变量。
typeof val === 'function' ? val.call(this, state, getters) : state[val]

val(state, getters) // state.name => 123
```

