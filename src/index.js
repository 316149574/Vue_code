import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
// 定义Vue构造函数
function Vue(options) {
  this._init(options); // options vue实例的配置项{ el data methods等}
}
initMixin(Vue); // 此函数将_init方法添加到Vue原型上
renderMixin(Vue); // _render
lifecycleMixin(Vue); // _update
export default Vue;
