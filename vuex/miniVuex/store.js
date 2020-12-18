let Vue
class Store {
  constructor (options) {
    this._mutations = Object.create(null)
    const store = this
    this.installModule(store, options)
    this.resetStoreVM(store, options.state)
  }
  get state () {
    return this._vm._data.$$state
  }
  commit (type, payload) {
    let mu = this._mutations[type]
    if (!mu) {
      throw new Error('vuex no mutation:' + type)
    }
    mu.call(this, payload)
  }
  installModule (store, options) {
    let mutation = options.mutations
    let arr = typeof mutation === 'object' ? Object.keys(mutation).map(item => ({key: item, val: mutation[item]})) : []
    arr.forEach(({key, val}) => {
      this.registerMutation(store, key, val, options.state)
    })
  }
  registerMutation (store, _type, _val, state) {
    store._mutations[_type] = function wrapperMutation (payload) {
        console.log(store)
      _val.call(store, state, payload)
    }
  }
  resetStoreVM (store, state) {
    store._vm = new Vue({
      data () {
        return {
          $$state: state
        }
      }
    })
  }
}
function vuexInit () {
    let options = this.$options
    if (options.store) {
        this.$store = options.store
    } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store
    }
}
function install (_Vue) {
  if (Vue) {
    return false
  }
  Vue = _Vue
  Vue.mixin({
      beforeCreate: vuexInit
  })
}


export default{
  Store,
  install
}
