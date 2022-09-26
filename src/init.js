import { compileToFunction } from "./compiler/index";
import { initState } from "./state";
// initMixin函数用于在vue原型添加init初始化方法
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = options;
        // 对数据进行初始化 data el methods computed props
        initState(vm);

        // 模板编译
        if(vm.$options.el){   
            vm.$mount(vm.$options.el);
        }
    }
    //  将数据挂载到模板上
    Vue.prototype.$mount=function(el){
        const vm = this;
        const options = vm.$options;
        el = document.querySelector(el);
        //  1 把模板转化成对应的渲染函数===> 虚拟DOM概念 vnode====> diff算法更新虚拟DOM====>产生真实节点 更新
        if(!options.render){
            let template =  options.template;
            if(!template && el ){
                 template = el.outerHTML;
                 let render = compileToFunction(template);
                 options.render = render;  // options.render函数就是渲染函数
            }
        }
    }
}
