## Vue的模板编译过程

#### Vue的运行时js与带编译器的js的区别？

- entry-runtime.js 与 entry-runtime-with-compiler.js 区别?

  运行时的vue代码中除去了编译器的代码，其他的没有什么区别，具体区别就在于编译器的区别；

  开发中用webpack以及vue-loader将.vue的文件编译成了render函数，因此我们可以直接使用只包含运行时的vue，因为编译过程很耗费性能。

### Vue的模板编译过程是怎么样的？如何将template编译成render函数？

- 画了一张图总结了一下编译的过程，实际上最终调用的就是baseCompile这个函数具体的慢慢分析，这里运用了函数柯里化的技巧。因为Vue是分平台的，作者又不想在同一个平台多次传入相同的配置，所以就做了一个根据平台的不同来判断传入的参数的基本配置（baseOptions）。接下来慢慢分析，不急。

![Vue模板编译流程](C:\Users\10600\Desktop\Vue模板编译流程.png)

- 说编译就要看带编译器的Vue代码了entry-runtime-with-compiler.js，分析一下这个js代码

  1. 先选择挂载的选择器，不能是html、body这样的根节点，

     ```js
     /* istanbul ignore if */
       if (el === document.body || el === document.documentElement) { // 这是为什么
         // vue的el 不能绑定在 body html上的原因
         process.env.NODE_ENV !== 'production' && warn(
           `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
         )
         return this
       }
     ```

  2. 处理template模板

     ```js
     // resolve template/el and convert to render function 
     // 将template/el转换为render function
       if (!options.render) { // 看options 中是否有render函数，
         // 如果没有就把他转换成render函数，因为vue只认render函数
         let template = options.template
         if (template) {
           if (typeof template === 'string') {
               // 针对template是字符串模板 或者是选择敷匹配模板
             if (template.charAt(0) === '#') {
                 // 选择符匹配模板 且‘#’开头的选择器
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
             // 针对dom元素匹配 document.getElementById document.querySelecotr...  
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
     ```

  3.  得到最终的template，将template转换为render函数，进行编译阶段

     ```js
     // 这段代码在 platforms/web/entry-runtime-with-compiler.js
     import { compileToFunctions } from './compiler/index'
     const {render, staticRenderFns} = compileToFuntions(template, {
         outputSourceRange: process.env.NODE_ENV !== 'production', // true
         shouldDecodeNewlines, // false
         shouldDecodeNewlinesForHref, // false
         delimiters: options.delimiters, // undefined
         comments: options.comments // undefined 是否保留template中的注释内容
     }, this)
     ```

     `compileToFunctions`查看这个函数，来源于./compiler/index, 打开这个文件

     ```js
     import { baseOptions } from './options'
     import { createCompiler } from 'compiler/index'
     
     const { compile, compileToFunctions } = createCompiler(baseOptions) // 注意这里就已经把baseOptions传入了，之后在后面的函数中可以直接使用这个baseOptions
     
     export { compile, compileToFunctions }
     ```

     我们看到`createCompiler`这个函数的返回值有我们用的`comlipeToFunctions`,然后我们去看一下`createCompiler`这个函数的定义。打开src/compiler/index

     ```js
     import { createCompilerCreator } from './create-compiler'
     
     // `createCompilerCreator` allows creating compilers that use alternative
     // parser/optimizer/codegen, e.g the SSR optimizing compiler.
     // Here we just export a default compiler using the default parts.
     export const createCompiler = createCompilerCreator(function baseCompile (
       template: string,
       options: CompilerOptions
     ): CompiledResult {
       const ast = parse(template.trim(), options)
       if (options.optimize !== false) {
         optimize(ast, options)
       }
       const code = generate(ast, options)
       return {
         ast,
         render: code.render,
         staticRenderFns: code.staticRenderFns
       }
     })
     ```

     `createCompiler`函数是`createCompilerCreator`函数的返回值，`createCompilerCreator`传入`baseCompile`这个函数，先不看这个函数，我们先找到`createComplierCreator`的函数定义,打开src/compiler/create-compiler.js

     ```js
     import { createCompileToFunctionFn } from './to-function'
     
     export function createCompilerCreator (baseCompile: Function): Function {
       return function createCompiler (baseOptions: CompilerOptions) {
         function compile (
           template: string,
           options?: CompilerOptions
         ): CompiledResult {
           const finalOptions = Object.create(baseOptions)
           ...
           finalOptions.modules = (baseOptions.modules || []).concat(options.modules) // 合并baseOptions与options的modules、directives以及options其他的属性到finalOptions
            const complied = baseCompile(template.trim(), finalOptions)
            return compiled
          }
          return {
              compile,
              compileToFunctions: createCompileToFunctionFn(compile)
          } // 定义compileToFunctions的位置找到了。
      }
     
     ```

     我们在这个函数中找到了`compileToFunctions`这个函数的定义,然后看一下这个`crateCompileToFunctionFn`这个函数，将`compile`这个函数当成参数传入了，打开'./to-function.js'

     ```js
     export function createCompileToFunctionFn (compile: Function): Function {
       const cache = Object.create(null)
       // 终于找到了compileToFunctions
       return function compileToFunctions (
         template: string,
         options?: CompilerOptions,
         vm?: Component
       ): CompiledFunctionResult {
         options = extend({}, options)
         const warn = options.warn || baseWarn
         delete options.warn
         ...
         // compile
         const compiled = compile(template, options)
         // {ast, render, staticRenderFns}
         ...
         // turn code into functions
         const res = {}
         const fnGenErrors = []
         res.render = createFunction(compiled.render, fnGenErrors)
         res.staticRenderFns = compiled.staticRenderFns.map(code => {
           return createFunction(code, fnGenErrors)
         })
         ...
         return (cache[key] = res)
     ```

     我们找到了`compileToFunctions`的真正定义，调用这个函数其实执行的重要操作就是 compile编译，返回{ast, render, statciRendersFn}，然后调用`createFunction(compiled.render)`将render转为函数。

     ```js
     function createFunction (code, errors) {
       try {
         return new Function(code)
       } catch (err) {
         errors.push({ err, code })
         return noop
       }
     }
     ```

     

## 总结

编译的过程分解一下

1. 获取挂载的dom元素。

2. 处理template模板或者是el。

3. 调用compileToFunctions(template, options, this), 将template转为render函数。

4. 现在再来看这张编译的图就清晰了。

   ![](C:\Users\10600\Desktop\Vue模板编译流程.png)