let oldArrayPrototype = Array.prototype;
export let arrayMethods = Object.create(oldArrayPrototype);

let methods = ['push', 'shift', 'pop', 'unshift', 'reverse', 'splice', 'sort'];
methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        // args参数列表  arr.push(1,2,3)  ...args = [1,2,3]
        // 方法劫持 搞事情....
        oldArrayPrototype[method].call(this, ...args)

        //  如果数组方法新添加的值是一个对象 则同样需要进行观测
        let inserted;  // 新添加的值  
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args;  // 类数组
                break;
            case 'splice':
                inserted = args.slice(2);
                break;

        }
        let ob = this.__ob__;
        if (inserted) ob.observeArray(inserted);
        //  todo 更新操作
    }
})

//  Object.create(); 方法第一个参数为某对象的原型 本质是新创建的对象继承传入参数对象的原型
