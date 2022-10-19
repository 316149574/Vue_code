import { arrayMethods } from "./array";
import { isObject } from "../utils";
import { Dep } from "./dep";
//数据观察者模式
export function observe(data) {
  // vue2中会将所有的data数据进行数据劫持？什么是数据劫持？ Object.defineproperty
  // 如果是对象才进行观测
  if (!isObject(data)) {
    return;
  }
  if (data.__ob__) {
    return data.__ob__; // 如果数据有__ob__则说明数据已经被观测了，则无需观测
  }
  return new Observer(data); // 进行观测  默认最外层的data必须是一个对象
}

// 如果给对象新增一个属性，不会触发视图更新（给对象本身也增加一个dep（dep中存watcher）， 增加一个属性后，手动触发watcher更新）
class Observer {
  // 检测数据的变化
  constructor(data) {
    // 对对象中的所有属性进行劫持
    // data.__ob__ = this;  将观测者实例挂载到观测的data数据上, 不能直接添加，会递归observe
    this.dep = new Dep(); // arr._ob_.dep    数据可能是对象 也可能是数组
    Object.defineProperty(data, "__ob__", {
      value: this,
      enumerable: false,
    });
    if (Array.isArray(data)) {
      // 数据劫持的逻辑  劫持数组的变异方法（变异方法:指操作方法可能会改变原数组如： push shift pop 而contact不是变异方法，因其不会改变原数组）
      // 对数组原来的方法进行改写（重写）----> 切片编程 高阶函数
      data.__proto__ = arrayMethods;
      this.observeArray(data); // 如果数组中的数据是对象，则需要对对象进行劫持 [{key:value}, {key:value}]
    } else {
      this.walk(data); // 对象劫持的逻辑
    }
  }
  observeArray(data) {
    data.forEach((item) => {
      observe(item);
    });
  }
  // 劫持对象
  walk(data) {
    // data数据对象
    Object.keys(data).forEach((key) => {
      defineReactive(data, key, data[key]);
    });
  }
}
function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    let current = value[i]; // current 是数组中的数组
    current.__ob__ && current.__ob__.dep.depend();
    if (Array.isArray(current)) dependArray(current);
  }
}
// vue2会对对象进行遍历(递归)， 将每个对象用 Object.defineProperty重新定义， 性能差!!!
function defineReactive(data, key, value) {
  let childOb = observe(value); // 如果对象属性的值为对象，则递归劫持对象属性 ，所以在使用Vue2的时候，尽量将数据扁平化不要过多嵌套
  let dep = new Dep(); // 每个属性都有一个dep

  Object.defineProperty(data, key, {
    get() {
      // 当调用属性时，希望将dep和watcher关联上
      // 如果Dep.target有值 则此值是在模板中取值的
      if (Dep.target) {
        dep.depend(); // 将dep存放到watcher中
        if (childOb) childOb.dep.depend();
        if (Array.isArray(value)) {
          dependArray(value);
        }
      }
      return value;
    },
    set(newValue) {
      // todo 用户更改了数据.....
      if (newValue !== value) {
        observe(newValue); // 如果对象的某个属性重新赋的值也是一个对象，则也需要被劫持。
        value = newValue;
        dep.notify(); // 告诉当前属性下存放的watcher执行更新
      }
    },
  });
}

/**
 * 问题： 给data添加属性会被劫持到吗？
 *总结 ： 如果是对象，会对对象进行递归劫持
         如果是数组 会劫持数组的方法，并对数组中不是基本数据类型的数据进行检测 
 * */
