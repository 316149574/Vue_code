import { observe } from "./observer/index";
import { Watcher } from "./observer/watcher";
import { isfn } from "./utils";
import { Dep } from "./observer/dep";

export function stateMixin(Vue) {
  Vue.prototype.$watch = function (key, handler, options = {}) {
    options.user = true; // 表示这是用户自己写的watcher  非渲染watcher
    new Watcher(this, key, handler, options);
  };
}
// 数据状态初始化
export function initState(vm) {
  const opts = vm.$options;
  if (opts.data) {
    initData(vm);
  }
  if (opts.watch) {
    initWatch(vm, opts.watch);
  }
  if (opts.computed) {
    initComputed(vm, opts.computed);
  }
}
function initData(vm) {
  let data = vm.$options.data;
  // 此时data和vm没有任何关系  data = isfn(data) ? data.call(vm) : data;  解决：
  data = vm._data = isfn(data) ? data.call(vm) : data; // 判断data是函数还是json对象
  // vm.name ----> vm._data.name
  for (let key in data) {
    proxy(vm, "_data", key);
  }
  observe(data);
}
function initWatch(vm, watch) {
  for (let key in watch) {
    let handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, key, handler) {
  return vm.$watch(key, handler);
}

function initComputed(vm, computed) {
  const watchers = (vm._computedWatchers = {});
  for (let key in computed) {
    const userDef = computed[key]; // 可能是对象，也可能是函数
    let getter = typeof userDef == "function" ? userDef : userDef.get;
    // 有多少个getter就创建多少个watcher ， 每个计算属性的本质就是watcher
    // 将创建的watcher存放到vm上
    watchers[key] = new Watcher(vm, getter, () => {}, { lazy: true }); // lazy:true 让其不马上执行， 只有当计算属性被调用后才执行

    // 将key定义在vm的_data上   vm_data.fullname  计算属性的本质也是使用 Object.defineProperty
    defineComputed(vm, key, userDef);
  }
}

function defineComputed(vm, key, userDef) {
  let sharedProperty = {};
  if (typeof userDef == "function") {
    sharedProperty.get = createComputedGetter(key);
  } else {
    sharedProperty.get = createComputedGetter(key);
    // 每次取值 不要直接走get，判断其watcher中dirty是否是脏的  是脏的才更新
    sharedProperty.set = userDef.set;
  }
  Object.defineProperty(vm, key, sharedProperty);
}

function createComputedGetter(key) {
  // 取计算属性的值，走此函数
  return function computedGetter() {
    let watcher = this._computedWatchers[key];
    if (watcher.dirty) {
      watcher.evaluate(); // 求值函数  其实就是调getter  fullname() {return this.firstname + this.lastname;}  调get会取fristname 和 lasename 此时会讲wacther存放到依赖属性的dep种
    }
    // 如果当前Dep上还有值， 则应继续向上收集（渲染watcher）
    if (Dep.target) {
      watcher.depend(); // watcher里面有多个dep
    }
    return watcher.value; // 计算属性的缓存  其实是把值缓存到watcher.value上
  };
}

// 数据代理  当调用vm.name 则在 vm._data.name获取
function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newValue) {
      vm[source][key] = newValue;
    },
  });
}
