## Vue $mount都干了什么？
- 1. 先找到$mount函数，$mount有两处定义 platforms/web/runtime/index.js 运行时$mount, 配合vue-loader使用，第二处在 platforms/web/entry-runtime-with-compiler.js 含有编译代码。

    ```js
        const mount = Vue.prototype.$mount // 缓存 原型对象上的 $mount
        // platforms/web/runtime/index.js
        Vue.prototype.$mount = function (
            el?: string | Element,
            hydrating?: boolean
        ): Component {
            el = el && inBrowser ? query(el) : undefined
            return mountComponent(this, el, hydrating) // 去查看mountCompoent干了什么， 传了三个值
            // this=>Vue  el => string element 或者空  hydrating 是否服务端渲染
        }
    ```

    ```js
        // platforms/web/entry-runtime-with-compiler.js
        const mount = Vue.prototype.$mount // 缓存 原型对象上的 $mount
        Vue.prototype.$mount = function ( // 覆盖 原型对象上的 $mount ，对之前的$mount 做补充
            el?: string | Element,
            hydrating?: boolean
        ): Component { // $mount 接受两个参数 el 可以是字符串 "#app" 也可是 dom对象
            // doucment.getElementById('app'), hydrating 用来标识是不是服务端渲染
            el = el && query(el)

            /* istanbul ignore if */
            if (el === document.body || el === document.documentElement) { 
                process.env.NODE_ENV !== 'production' && warn(
                `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
                )
                return this
            }

            const options = this.$options
            // resolve template/el and convert to render function 将template/el转换成render函数
            if (!options.render) { // 看options 中是否有render函数，
                // 如果没有就把他转换成render函数，因为vue只认render函数
                let template = options.template
                if (template) {
                    if (typeof template === 'string') {
                        if (template.charAt(0) === '#') {
                            template = idToTemplate(template)
                            /* istanbul ignore if */
                            if (process.env.NODE_ENV !== 'production' && !template) {
                                warn(
                                `Template element not found or is empty: ${options.template}`,
                                this
                                )
                            }
                        }
                    } else if (template.nodeType) {
                        template = template.innerHTML
                    } else {
                        if (process.env.NODE_ENV !== 'production') {
                            warn('invalid template option:' + template, this)
                        }
                        return this
                    }
                } else if (el) {
                    template = getOuterHTML(el)
                }
                if (template) {
                    /* istanbul ignore if */
                    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
                        mark('compile')
                    }

                    const { render, staticRenderFns } = compileToFunctions(template, { // 涵盖compiler编译部分， 后面在做解释， 最会返回 {ast, render, staticRenderFns}
                        outputSourceRange: process.env.NODE_ENV !== 'production', // true
                        shouldDecodeNewlines, // false
                        shouldDecodeNewlinesForHref, // false
                        delimiters: options.delimiters, // undefined
                        comments: options.comments // undefined
                    }, this)
                    options.render = render
                    options.staticRenderFns = staticRenderFns

                    /* istanbul ignore if */
                    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
                        mark('compile end')
                        measure(`vue ${this._name} compile`, 'compile', 'compile end')
                    }
                }
            }
            return mount.call(this, el, hydrating) // 调用之前的Vue.prototype.$mount
            //  runtime/index.js中定义
        }
    ```

-   entry-runtime-with-compiler.js 文件中的$mount 是对runtime/index.js中的$mount的功能补充，比如，el不能是body、html，将template、el转换为render函数，然后调用之前缓存的mount,最后return mountComponent(this, el, hydrating)，mountComponent会在后面探讨。