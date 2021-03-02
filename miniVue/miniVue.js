class Vue {
    constructor(options) {
        if (!(this instanceof Vue)) {
            throw new Error('Vue should use new.')
        }
        // new Vue() 会立马执行._init函数。
        this._init(options)
    }
    _init(options) {
        const vm = this
        vm._watchers = []
        vm._watcher = null
        vm.$options = options
        initState(vm) // 初始化data ， props， computed ， methods， watch
        new Watcher(vm, '_data.name', () => null, {before () {console.log('beforeUpdate')}}, true)
    }
}
function initState(vm) {
    if (vm.$options.props) initProps(vm)
    if (vm.$options.methods) initMethods(vm)
    if (vm.$options.data) initData(vm)
}

// 初始化data，
/*
  1. 先判断methods、props中是否有重名的属性，有就提示
  2. 将vm._data.xxx 通过 proxy函数代理成 vm.xxx访问
  3. 将vm._data中的属性全部加上getter、setter
*/
function initData(vm) {
    let data = vm.$options.data // 先获取传入的data
    data = vm._data = typeof data === 'function' ? getData(data) : data || {}
    const keys = Object.keys(data)
    const methods = vm.$options.methods
    const props = vm.$options.props
    let i = keys.length
    while (i--) {
        let key = keys[i]
        if (methods && methods.hasOwnProperty(key)) {
            throw new Error('methods has already declared,the name is ' + item + ', please use other name to replace')
        } else if (props && props.hasOwnProperty(key)) {
            throw new Error('props has already declared,the name is ' + item + ', please use other name to replace')
        }
        proxy(vm, '_data', key) // vm._data.xxx => vm.xxx
    }
    observe(data) // 用这个方法 来为data中的属性添加getter、setter
}
// 将vm._data.xxx vm._props.xxx 等 改写成 vm.xxx, 代理
function proxy(target, sourceKey, key) {
    Object.defineProperty(target, key, {
        get: function proxyGetter() {
            return this[sourceKey][key]
        },
        set: function proxySetter(val) {
            this[sourceKey][key] = val
        }
    })
}

// 避免多次执行Observer，所以我们在这里做一步判断，这就告诉我们需要加一个标识符，我们就用'__ob__'表示吧
function observe(value) {
    if (!value) return
    let ob
    // 查看value中是否存在__ob__属性，如果有就直接返回
    if (value.hasOwnProperty('__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__
    } else if (
        isPlainObject(value)
        && !value.__ob__
    ) {
      // 如果value没有__ob__属性，并且value是一个对象，那么我们就对value做Observer的操作
      /*
        1. 我们需要给value加一个__ob__的属性，把它的值就设置成Observer的实例。
        2. 我们需要根据value的类型[数组]|{对象}，做不同的Observer。
      */
        ob = new Observer(value)
    }
    return ob
}

class Observer {
    constructor(value) {
        def(value, '__ob__', this) // 为value添加__ob__属性
        this.walk(value) // 这里只做了针对object的情况， Vue对object 和 Array的侦听是不一样的。
    }
    walk(value) {
        Object.keys(value).forEach(item => {
            defineReactive(value, item) // 遍历value，对value的每个key做object.defineProperty,为key添加getter、setter。
        })
    }
}
// 把target元素的key值设置成val
function def(target, key, val) {
    Object.defineProperty(target, key, {
        value: val,
        enumerable: false,
        writable: false,
        configurable: false
    })
}

function defineReactive(obj, key) {
    let dep = new Dep() // 依赖收集器
    let val
    if (arguments.length === 2) {
        val = obj[key]
    }
    Object.defineProperty(obj, key, {
        get: function reactiveGetter() {
            let value = val
            dep.depend() // 触发依赖收集
            return value
        },
        set: function reactiveSetter(newValue) {
            if (val === newValue && (val !== val && newValue !== newValue)) {
                return
            }
            val = newValue
            dep.notify() // 触发视图更新
        }
    })
}
/*
这里有几点疑问
1. 依赖是如何收集的？
2. 依赖收集在哪里？
3. 触发视图更新都做了哪些事情？
*/
let uId = 0

class Dep {
    constructor() {
        this.id = uId++
        this.subs = []
    }
    depend() {
      /*
        当实例化Vue之后，我们用到响应式属性时，就会触发这个属性的getter方法，然后就会执行dep.depend,就到了这个方法。
        问：这里会有一个疑问Dep.target是啥？是哪里来的？他是干嘛的？
        答：其实Dep.target就是watcher，既然是watcher，那肯定就是new Watcher里面设置的，他是用来跟Dep配合存储依赖的。
      */
        if (Dep.target) {
            Dep.target.addDep(this)
        }
    }
    addSub (target) {
        this.subs.push(target)
    }
    notify () {
        this.subs.slice().forEach(item => {
            item.update()
        })
    }
}

Dep.target = null // 全局变量， 用来存watcher
const targetStack = []
function pushTarget (target) {
    if (target) {
        targetStack.push(target)
        Dep.target = target
    }
}
let watchId = 0
class Watcher {
    constructor(
        vm,
        expOrFn,
        cb,
        options,
        isRenderWatcher
    ) {
        this.id = ++watchId
        if (isRenderWatcher) {
            vm._watcher = this
        }
        vm._watchers.push(this)
        pushTarget(this) // 给Dep.target 赋值。
        this.deps = []
        this.depIds = new Set()
        this.newDeps = []
        this.newDepIds = new Set()
    }
    addDep(dep) { // 依赖收集部分
        const id = dep.id
        if (!this.depIds.has(id)) {
            this.depIds.add(id)
            this.deps.push(dep)
            if (!this.newDepIds.has(id)) {
                dep.addSub(this) // 把watcher实例传到dep中，然后保存起来
            }
        }
    }
    update () {
        console.log(this.id, this)
        if (this.lazy) {
            this.dirty = true
        } else if (this.sync) {
            this.run()
        } else {
            queueWatcher(this) // 做一个nextTick， 将所有的更新操作集合起来， 最后一起更新，这就是Vue的nextTick的骚操作，性能优化。
        }
    }
}



function toString(obj) {
    return Object.prototype.toString.call(obj)
}

function isPlainObject(obj) {
    return toString(obj) === '[object Object]'
}
