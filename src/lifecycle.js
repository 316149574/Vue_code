import { Watcher } from "./observer/watcher";
import { nextick } from "./utils";
import { patch } from "./vdom/patch";

// 生命周期文件
export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 既有初始化又有更新
    const vm = this;
    vm.$el = patch(vm.$el, vnode);
  };
  Vue.prototype.$nextick = nextick;
}

// 后续每个组件渲染的时候，都会有一个watcher
export function mountComponent(vm, el) {
  // 更新函数 数据变化后会再次调用该方法
  let updateComponent = () => {
    // 两个任务： 1 通过_render方法生成虚拟DOM  2 把虚拟DOM转成真实DOM
    vm._update(vm._render());
  };
  // 观察者模式，属性是被观察者  观察者：刷新页面
  // updateComponent();
  new Watcher(
    vm,
    updateComponent,
    () => {
      console.log("数据更新了");
    },
    true // 标识  它是一个渲染watcher，后续还有其它的watcher
  );
}
