function MiniVue (options){
    this.$options = options
    observe(this, options) // 为每一个options.data属性添加getter, setter
    return this
}

function observe(vm, options) {
    new Observer(vm, options.data)
}

function Observer(vm, data) {
    this.data = data
    this.dep = new Dep()
    this.walk(vm, data)
}
Observer.prototype = {
    walk: function (vm, data) {
        var self = this
        Object.keys(data).forEach(key => {
            self.defineReactive(vm, data, key, data[key])
        })
    },
    defineReactive (vm, obj, key ,value) {
        const dep = new Dep()
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: true,
            get: function reactiveGetter () {
                let data = value
                if (Dep.target) {
                    dep.depend()
                }
                return data
            },
            set: function reactiveSetter (newValue) {
                let oldValue = value
                console.log(key + '数据更改', newValue)
                if (oldValue === newValue) {
                    return
                }
                let val = newValue
                dep.notify(val)
                // updateView(vm, val)
            }
        })
    }
}
let $depId = 0
function Dep () {
    this.subs = [] // 存储所有的watcher
    this.id = $depId++
}
Dep.target = null
let stackTarget = []
Dep.prototype = {
    addSubs (watcher) {
        this.subs.push(watcher)
        console.log(this.subs)
    },
    depend () {
        if (Dep.target) {
            Dep.target.addDep(this)
        }
    },
    notify (val) {
        console.log(this.subs)
        console.log()
        document.querySelector(vm.$options.el).innerHTML = val
    }
}

function Watcher () {
    this.deps = []
    this.depsId = new Set()
    this.newDepIds = new Set()
    this.newDeps = new Set()
    this.get()
}
Watcher.prototype = {
    addDep (dep) {
        if (!this.newDeps.has(dep.id)) {
            this.newDepIds.add(dep.id)
            this.newDeps.add(dep)
            if (!this.depsId.has(dep.id)) {
                dep.addSubs(this)
            }
        }
    },
    get () {
        pushTarget(this)
        popTarget()
    }
}

function pushTarget(watcher) {
    stackTarget.push(watcher)
    console.log(stackTarget)
    Dep.target = watcher
}

function popTarget() {
    stackTarget.pop()
    Dep.target = stackTarget[stackTarget.length - 1]
}

// function updateView (vm, val) {
//     console.log(val)
//     document.querySelector(vm.$options.el).innerHTML = val
// }