let depId = 0
class Dep {
    constructor () {
        this.id = depId++
        this.subs = [] // 用来存储watcher 依赖
    }
    depend () {
        if (Dep.target) {
            Dep.target.addDep(this)
        }
    }
    addSub (watcher) {
        this.subs.push(watcher)
    }
    notify () {
        let subs = this.subs.slice()
        subs.forEach(item => {
            item.update()
        })
    }
}

Dep.target = null
let targetStack = []
function pushTarget(target) {
    targetStack.push(target)
    Dep.target = target
}

class Watcher {
    constructor (
        vm,
        expOrFn, // 'a.b.c' || function
        cb,
        options,
        isRenderWatcher
    ) {
        this.vm = vm
        this.cb = cb
        if (isRenderWatcher) {
            vm._watcher = this
        }
        vm._watchers.push(this)
        this.deps = []
        this.depsId = new Set()
        this.newDeps = []
        this.newDepsId = new Set()
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {
            this.getter = parsePath(expOrFn)
        }
        this.value = this.get()
    }
    get () {
        pushTarget(this)
        const vm = this.vm
        let value = this.getter.call(vm, vm)
        return value
    }
    addDep(dep) {
        const id = dep.id
        if (!this.newDepsId.has(id)) {
            this.newDepsId.add(id)
            this.newDeps.push(dep)
            if (!this.depsId.has(id)) {
                dep.addSub(this)
            }
        }
    }
    update () {
        const oldValue = this.value
        const vm = this.vm
        this.value = this.get()
        this.cb.call(vm, this.value, oldValue)
    }
}

class Vue {
    constructor (options) {
        this._watchers = []
        this.$options = options
        this._init(options)
    }
    _init (options) {
        this._data = options.data
        Object.keys(this._data).forEach(key => {
            proxy(this, '_data', key) // 代理， 使开发者能够直接使用this.xxx代替this._data.xxx
        })
        observe(this._data)
    }
    $mount (el) {
        // debugger
        this.$el = el
        new Watcher(this, renderFunction, () => {}, {}, true /**renderWatcher */)
    }
    $watch (expOrFn, cb) {
        const vm = this
        let data = new Watcher(vm, expOrFn, cb)
        return data
    }
}

// function Vue () {
//     if (new.target !== Vue) {
//         throw new Error('Vue is a constructor, you should use new to instantiate it')
//     }
// }

function observe(data) {
    for (var item in data) {
        if (typeof item === 'object') {
            observe(item)
        }
        defineReactive(data, item, data[item])
    }
}

function defineReactive(data, key, val) {
    let dep = new Dep()
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter () {
            // debugger
            if (Dep.target) {
                dep.depend() // 收集依赖
            }
            return val
        },
        set: function reactiveSetter (newVal) {
            if (val === newVal) {
                return
            }
            val = newVal
            dep.notify() // 通知依赖
        }
    })
}

function parsePath (expOrFn) {
    const regExp = /[^\w.$]/ // ^用在[]中表示不接受[]中的表达式中的字符集合。
    if (regExp.test(expOrFn)) {
        return
    }
    const path = expOrFn.split('.')
    return function (obj) {
        for (var i = 0; i < path.length; i++) {
            if (!obj) {
                return
            }
            obj = obj[path[i]]
        }
        return obj
    }
}

function proxy(data, sourceKey, key) { // 代理使开发者能够直接使用this.xxx代替this._data.xxx
    Object.defineProperty(data, key, {
        get: function ProxyGetter () {
            return data[sourceKey][key]
        },
        set: function ProxySetter (newVal) {
            data[sourceKey][key] = newVal
        }
    })
}


function renderFunction (vm) {
    document.querySelector(vm.$el).innerHTML = `
        <div>姓名： ${vm.name}</div>
        <div>年龄： ${vm.age}</div>
    `
}