function defineReactive (data, key, val) {
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter () {
            console.log('获取了' + key + ': ' + val)
            return val
        },
        set: function reactiveSetter (newVal) {
            if (val === newVal) {
                return
            }
            val = newVal
            console.log('设置了' + key + ': ' + val)
        }
    })
}

let lper = {
    name: 'leapmotor',
    age: 5
}

// defineReactive(lper, 'name', lper['name'])

for (var item in lper) {
    defineReactive(lper, item, lper[item])
}