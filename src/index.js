import { initGlobalApi } from "./global-api/index.js";
import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
import { stateMixin } from "./state";
// 定义Vue构造函数
function Vue(options) {
  this._init(options); // options vue实例的配置项{ el data methods等}
}
initMixin(Vue); // 此函数将_init方法添加到Vue原型上
renderMixin(Vue); // _render
lifecycleMixin(Vue); // _update
stateMixin(Vue);

// 在类上扩展
initGlobalApi(Vue);
// diff 核心
import { compileToFunction } from "./compiler/index.js";
import { createElm, patch } from "./vdom/patch.js";

let oldTemplate = `<div style="color:red;" a="1">www{{name}}</div>`;

let vm1 = new Vue({ data: { name: "duanli" } });
const render1 = compileToFunction(oldTemplate);

const oldVnode = render1.call(vm1);

document.body.appendChild(createElm(oldVnode));

let newTemplate = `<p style="color:blue;" b="2">{{name}}</p>`;
let vm2 = new Vue({ data: { name: "chenchen" } });
const render2 = compileToFunction(newTemplate);
const newVnode = render2.call(vm2);

// 根据新的虚拟节点 更新老的虚拟节点 老的能复用尽量复用

setTimeout(() => {
  patch(oldVnode, newVnode);
}, 1000);

export default Vue;
