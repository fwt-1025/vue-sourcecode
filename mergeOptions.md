## mergeOptions 核心实用程序

用vue的注释叫做

Merge two option objects into a new one. // 合并两个options对象到一个新的对象中

Core utility used in both instantiation and inheritance. // 用于实例化和继承的核心实用程序

通过注释我们可以知道mergeOptions就是用来合并对象的，那他具体是怎么合并的呢？

源码位于src/utils/options.js

```js
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child) // 首先是校验组件名称
  }

  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm) // 规范化props
  normalizeInject(child, vm) // 规范化inject
  normalizeDirectives(child) // 规范化directives 指令

  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  if (!child._base) { // 如果有extends mixins 递归调用mergeOptions
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

