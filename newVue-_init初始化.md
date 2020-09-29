## <b>new Vue() 都做了什么？</b>

- 1. 先找到Vue的构造函数。
    在core/instance/index.js中
    ```js
    function Vue (options) {
        if (process.env.NODE_ENV !== 'production' &&
            !(this instanceof Vue)
        ) {
            warn('Vue is a constructor and should be called with the `new` keyword')
        }
        this._init(options)
    }
    ```
    可以看到，new Vue就执行了_init函数，传了一个options参数。

- 2. _init函数 做了什么? 先找到_init函数，在core/instance/init.js中
    ```js
    Vue.prototype._init = function (options?: Object) {
        const vm: Component = this
        // a uid
        vm._uid = uid++

        let startTag, endTag
        /* istanbul ignore if */
            if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
            startTag = `vue-perf-start:${vm._uid}`
            endTag = `vue-perf-end:${vm._uid}`
            mark(startTag)
        }

        // a flag to avoid this being observed 一个避免被观察的标识
        vm._isVue = true
        // merge options 合并options
        if (options && options._isComponent) {
            // optimize internal component instantiation
            // since dynamic options merging is pretty slow, and none of the
            // internal component options needs special treatment. 优化内部组件实例化，因为动态options合并非常慢，并且没有任何内部组件选项需要特殊处理。
            initInternalComponent(vm, options)
        } else {
            vm.$options = mergeOptions(
                resolveConstructorOptions(vm.constructor),
                options || {},
                vm
            )
        }
        /* istanbul ignore else */
        if (process.env.NODE_ENV !== 'production') {
            initProxy(vm)
        } else {
            vm._renderProxy = vm
        }
        // expose real self
        vm._self = vm
        initLifecycle(vm) // 初始化生命周期
        initEvents(vm) // 初始化事件处理器
        initRender(vm) // 初始化render
        callHook(vm, 'beforeCreate')
        initInjections(vm) // resolve injections before data/props
        initState(vm) // 初始化data， props， methods， computed， watchers
        initProvide(vm) // resolve provide after data/props
        callHook(vm, 'created')

        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
            vm._name = formatComponentName(vm, false)
            mark(endTag)
            measure(`vue ${vm._name} init`, startTag, endTag)
        }

        if (vm.$options.el) {
            vm.$mount(vm.$options.el) // 调用$mount
        }
    }
    ```

- 通过代码分析，我们得出，_init主要做了，合并options，初始化生命周期、事件处理器、render、data、props、methods、computed、watchers等，然后调用$mount函数