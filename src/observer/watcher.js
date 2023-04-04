import { popTarget, pushTarget } from "./dep";
import { queueWatcher } from "./scheduler";
let id = 0;
export class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.cb = cb;
    this.options = options;
    this.user = !!options.user; // 是否是用户watcher  watch
    this.deps = []; // 存放dep
    this.depsId = new Set();
    // 不论是渲染还是watch监听的watcher， this.getter方法的作用都是取值操作，触发属性的get进行依赖收集
    if (typeof exprOrFn === "string") {
      this.getter = function () {
        // 当取值时，就会进行依赖📱
        let path = exprOrFn.split("."); // 'person.name' ==> [person, name]
        let obj = vm;
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]];
        }
        return obj;
      };
    } else {
      // 默认让 exprOrFn执行  调用了render方法去vm上取值
      this.getter = exprOrFn;
    }

    this.value = this.get();
    this.id = id++; // 每个实例watcher唯一标识
  }
  // 数据更新时， 调用get
  get() {
    // 当调用get会去vm上取值 会触发definedProperty.get
    // 每个属性都可以收集自己的watcher---收集依赖dep
    //一个属性对应多个watcher   一个watcher可以对应多个属性
    pushTarget(this); // Dep.target = watcher
    const value = this.getter();
    popTarget(); // Dep.target = null , 如果Dep.target有值 则说明这个变量在模板中被使用
    return value;
  }
  update() {
    // vue中的更新是异步的   多次调用update，先将watcher存放起来，等会一起更新
    // this.get();
    queueWatcher(this);
    // 异步更新队列 https://v2.cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97
  }
  run() {
    let newValue = this.get();
    let oldValue = this.value;
    this.value = newValue;
    if (this.user) {
      // 必须是用户watcher才调用
      this.cb.call(this.vm, oldValue, newValue);
    }
  }
  addDep(dep) {
    if (!this.depsId.has(dep.id)) {
      this.depsId.add(dep.id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
}

/**
 * 思路：watcher和dep
 * 1、我们将更新的功能封装成了一个watcher
 * 2、渲染页面时，会将当前watcher放到 Dep.target上
 * 3、在vue中页面渲染使用的属性，需要进行依赖收集，收集对象的渲染watcher
 * 4、取值时，给每个属性都加上dep属性， 用于存放这个渲染watcher （同一个watcher会对应多个dep）
 * 5、每个属性可能对应多个视图（多个视图可能是多个watcher），一个属性要对应多个watcher
 * 6、dep.depend(); 通知dep存放watcher    Dep.target.addDep() 通知watcher存放dep
 * 双向存储
 *
 *
 *
 * 每个属性分配一个watcher(使用pushTarget方法 将wather放到Dep的target属性上 )用于收集哪些组件依赖于此属性，
 * 当数据发生改变时，让属性Dep中所收集的watcher更新对应的组件视图
 *
 * */
