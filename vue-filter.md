### Vue过滤器



- 过滤器的编写方式 <全局过滤器 | 局部过滤器>

  ```js
  // 全局过滤器
  Vue.filter('captical', function (value) {
  	return value.toString().toUpperCase()
  })
  ```

  局部过滤器

  ```vue
  
  // 局部过滤器
  <script>
  	export default {
          filters: {
              captical: function (value) {
                  return value.toString().toUpperCase()
              }
          }
      }
  </script>
  ```

- 使用方式

  1. 使用在template的双花括号中

     ```html
     <template>
         <div>{{message | captical}}</div>
     </template>
     ```

     在v-bind中

     ```html
     <div v-bind:id="message | captical"></div>
     ```

     其中过滤器的第一个参数必须是表达式的值。

     Vue编译的结果是

     `_s(_f("captical")(message))`

  2. 串联使用

     ```js
     {{messgae | captical | toLower}}
     ```

     Vue编译之后的结果是

     `_s(_f("toLowe")(_f("captical")(message)))`, `_s`指的是`toString`方法, `_f`指的是`resolveFilter`方法,上面的编译代码理解为使用`resolveFilter`找到`captical`过滤器，然后调用它，并将`message`作为参数传入，返回的结果作为`toLower`过滤器的参数。

     > toString()方法
     >
     > ```js
     > function toString(val) {
     >     return val == null
     >     ? ""
     >     : typeof val === "object"
     >     ? JSON.stringify(val, null, 2)
     >     : String(val)
     > }
     > ```
     >
     > resolveFilter的内部原理
     >
     > ```js
     > export function resolveFilter (id: string): Function {
     >   return resolveAsset(this.$options, 'filters', id, true) || identity
     > }
     > 
     > // 我们看一下resolveAsset
     > export function resolveAsset (
     >   options: Object, // context.$options
     >   type: string, // 'components' | "filters"
     >   id: string, // '组件名称' | "过滤器名称"
     >   warnMissing?: boolean
     > ) {
     >     if (typeof id !== 'string') {
     >     return
     >   }
     >   const assets = options[type]
     >   // check local registration variations first
     >   if (hasOwn(assets, id)) return assets[id]
     >   const camelizedId = camelize(id)
     >   if (hasOwn(assets, camelizedId)) return assets[camelizedId]
     >   const PascalCaseId = capitalize(camelizedId)
     >   if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
     >   // fallback to prototype chain
     >   const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
     >   if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
     >     warn(
     >       'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
     >       options
     >     )
     >   }
     >   return res
     > }
     > ```
     >
     > 先查一下传进来的id在本地注册的变量中有没有，如果没有，就将id转换为驼峰命名，查找一下有没有，没有的话，再将驼峰命名的第一个字母转为大写，再查一下，如果还没有，放在原型上查找，最后不管有没有都返回res。
     >
     > 为什么要用this.$options查找，因为在注册全局过滤器和局部过滤器时，vue会将他们两者合并在一起。

  3.  支持在过滤器函数后面传参数

     ```js
     {{message | captical('mes', '123')}}
     ```

     `message`会作为`captical`过滤器的第一个参数，`mes` 和 `123`分别作为第二第三个参数传入，也就是`captical(message, 'mes', '123')`这样子的。

- 模板中的语法是如何解析编译成函数的

  >  {{message | captical}}  =>  _f("captical")(message)

  源码查看`src/compiler/parser/filter-parser.js`

  ```js
  function parseFilters (exp) { // "message | captical"
      let filters = ['captical']
      let expression = "message"
      let i = 0
      for (i < filters.length; i++) {
          expression = wrapFilter(expression, filters[i])
      }
  }
  function wrapFilter (exp, filter) {
      const i = filter.indexOf('(')
        if (i < 0) {
          // _f: resolveFilter
          return `_f("${filter}")(${exp})`
        } else {
          const name = filter.slice(0, i)
          const args = filter.slice(i + 1)
          return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
        }
  }
  ```

  `parseFilters`是简化之后的代码，vue源码中还做了很多检测字符操作，我们理解就好，实际就是找到 | 分割线，取分割线两边的东西，然后去掉空格。

  > 我们看看`wrapFilter`函数， 判断一下`filter`字符串中是否存在 `(` ,如果存在说明过滤器带了参数，我们需要截取"`(`"左边的就是过滤器的名字， 右边的就是过滤器的参数，我们判断参数`args`等不等于"`)`",如果等于直接返回， 如果不等于，那他必定最后一个字符是"`)`"所以我们不需要再拼接一个"`)`"。



#### 总结

- ​	过滤器总是将表达式作为第一个参数。
- ​    过滤器可以串联，第一个过滤器的结果会作为第二个过滤器的参数。