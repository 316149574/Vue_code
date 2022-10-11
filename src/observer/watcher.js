import { popTarget, pushTarget } from "./dep";
let id = 0;
export class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.cb = cb;
    this.options = options;
    this.deps = [];
    this.depsId = new Set();
    // 默认让 exprOrFn执行  调用了render方法去vm上取值
    this.getter = exprOrFn;
    this.get();
    this.id = id++; // 每个实例watcher唯一标识
  }
  // 数据更新时， 调用get
  get() {
    // 当调用get会去vm上取值 会触发definedProperty.get
    // 每个属性都可以收集自己的watcher---收集依赖dep
    //一个属性对应多个watcher   一个watcher可以对应多个属性
    pushTarget(this); // Dep.target = watcher
    this.getter();
    popTarget(); // Dep.target = null , 如果Dep.target有值 则说明这个变量在模板中被使用
  }
  update() {
    this.get();
  }
  addDep(dep) {
    if (!this.depsId.has(dep.id)) {
      this.depsId.add(dep.id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
}
