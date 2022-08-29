import { initState } from "./state";

// initMixin函数用于在vue原型添加init初始化方法
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options;

        // 对数据进行初始化 data el methods computed props
        initState(vm);
    }
}