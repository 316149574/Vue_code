import { createElement, createTextElement } from "./vdom/index";

export function renderMixin(Vue) {
  Vue.prototype._c = function () {
    // createElement
    return createElement(this, ...arguments);
  };

  Vue.prototype._v = function (text) {
    // createTextElement
    return createTextElement(this, text);
  };
  Vue.prototype._s = function (val) {
    if (typeof val == "object") return JSON.stringify(val);
    return val;
  };

  Vue.prototype._render = function () {
    let vm = this;
    let render = vm.$options.render;
    let vnode = render.call(vm);
    return vnode;
  };
}

//  render.js 创建虚拟DOM
