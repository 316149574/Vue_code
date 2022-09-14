import { arrayMethods } from "../array";
import { isObject } from "../utils";
//数据观察者模式
export function observe(data) {
   // vue2中会将所有的data数据进行数据劫持？什么是数据劫持？ Object.defineproperty 
   // 如果是对象才进行观测
   if (!isObject(data)) {
      return;
   }
   if (data.__ob__) {  // 如果数据有__ob__则说明数据已经被观测了，则无需观测
      return;
   }
   // 进行观测  默认最外层的data必须是一个对象
   return new Observer(data);
}
// 检测数据的变化 
class Observer {
   constructor(data) {  // 对对象中的所有属性进行劫持
      // data.__ob__ = this;  将观测者实例挂载到观测的data数据上, 不能直接添加，会递归observe 
      Object.defineProperty(data, "__ob__", {
         value: this,
         enumerable: false
      });
      if (Array.isArray(data)) {
         // 数据劫持的逻辑  劫持数组的变异方法（变异方法:指操作方法可能会改变原数组如： push shift pop 而contact不是变异方法，因其不会改变原数组）
         // 对数组原来的方法进行改写（重写？）----> 切片编程 高阶函数
         data.__proto__ = arrayMethods;
         // 如果数组中的数据是对象，则需要对对象进行劫持 [{key:value}, {key:value}]
         this.observeArray(data);

      } else {
         this.walk(data); // 对象劫持的逻辑
      }
   }
   observeArray(data) {
      data.forEach(item => {
         observe(item);
      });
   }
   // 劫持对象
   walk(data) { // data数据对象
      Object.keys(data).forEach(key => {
         defineReactive(data, key, data[key])
      })
   }
}
// vue2会对对象进行遍历(递归)， 将每个对象用 Object.defineProperty重新定义， 性能差!!!
function defineReactive(data, key, value) {
   observe(value);  // 如果对象属性的值为对象，则递归劫持对象属性 ，所以在使用Vue2的时候，尽量将数据扁平化不要过多嵌套  
   Object.defineProperty(data, key, {
      get() {
         return value;
      },
      set(newValue) {

         // todo 用户更改了数据.....
         observe(newValue); // 如果对象的某个属性重新赋的值也是一个对象，则也需要被劫持。
         value = newValue;
      }
   });
}

/**
 * 问题： 给data添加属性会被劫持到吗？
 * 
 *总结 ： 如果是对象，会对对象进行递归劫持
         如果是数组 会劫持数组的方法，并对数组中不是基本数据类型的数据进行检测 
 * 
 * 
 * 
 * */

