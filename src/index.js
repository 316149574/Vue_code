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
initGlobalApi(Vue) 
export default Vue;
