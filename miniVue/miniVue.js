class Vue {
    constructor(options) {
        if (!(this instanceof Vue)) {
            throw new Error('Vue should use new.')
        }
        this._init(options)
    }
    _init(options) {
        const vm = this
        vm._watchers = []
        vm._watcher = null
        vm.$options = options
        initState(vm)
        new Watcher(vm, '_data.name', () => null, {before () {console.log('beforeUpdate')}}, true)
    }
}
function initState(vm) {
    if (vm.$options.props) initProps(vm)
    if (vm.$options.methods) initMethods(vm)
    if (vm.$options.data) initData(vm)
}
function initData(vm) {
    let data = vm.$options.data
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
        proxy(vm, '_data', key)
    }
    observe(data)
}
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
function observe(value) {
    if (!value) return
    let ob
    if (value.hasOwnProperty('__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__
    } else if (
        isPlainObject(value)
        && !value.__ob__
    ) {
        ob = new Observer(value)
    }
    return ob
}

class Observer {
    constructor(value) {
        def(value, '__ob__', this)
        this.walk(value)
    }
    walk(value) {
        Object.keys(value).forEach(item => {
            defineReactive(value, item)
        })
    }
}

function defineReactive(obj, key) {
    let dep = new Dep()
    let val
    if (arguments.length === 2) {
        val = obj[key]
    }
    Object.defineProperty(obj, key, {
        get: function reactiveGetter() {
            let value = val
            dep.depend()
            return value
        },
        set: function reactiveSetter(newValue) {
            if (val === newValue && (val !== val && newValue !== newValue)) {
                return
            }
            val = newValue
            dep.notify()
        }
    })
}

let uId = 0

class Dep {
    constructor() {
        this.id = uId++
        this.subs = []
    }
    depend() {
        if (Dep.target) {
            Dep.target.addDep(this)
        }
    }
    addSub (target) {
        console.log(target)
        this.subs.push(target)
    }
    notify () {
        console.log(this.subs.slice())
        this.subs.slice().forEach(item => {
            item.update()
        })
    }
}

Dep.target = null
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
        pushTarget(this)
        this.deps = []
        this.depIds = new Set()
        this.newDeps = []
        this.newDepIds = new Set()
    }
    addDep(dep) {
        const id = dep.id
        if (!this.depIds.has(id)) {
            this.depIds.add(id)
            this.deps.push(dep)
            if (!this.newDepIds.has(id)) {
                dep.addSub(this)
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
            queueWatcher(this)
        }
    }
}

function def(target, key, val) {
    Object.defineProperty(target, key, {
        value: val,
        enumerable: false,
        writable: false,
        configurable: false
    })
}

function toString(obj) {
    return Object.prototype.toString.call(obj)
}

function isPlainObject(obj) {
    return toString(obj) === '[object Object]'
}
