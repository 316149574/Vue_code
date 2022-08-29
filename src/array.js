let oldArrayPrototype = Array.prototype;
export let arrayMethods = Object.create(oldArrayPrototype);

let methods= ['push', 'shift', 'pop','unshift','reverse','splice','sort'];
methods.forEach(method=>{
    arrayMethods[method] = function(...args){ // args参数列表  arr.push(1,2,3)  ...args = [1,2,3]
      //  console.log("方法被调用了"); 
        oldArrayPrototype[method].call(this, ...args)
    }
})