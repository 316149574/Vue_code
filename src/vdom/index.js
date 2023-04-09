import { isObject, isReservedTag } from "../utils";

export function createElement(vm, tag, data = {}, ...children) {
  // 如果tag是一个组件，则需要渲染组件的vnode
  if(isReservedTag(tag)){
    return vnode(vm, tag, data, data.key, children, undefined);
  }else{
    // 组件虚拟DOM
    const Ctor = vm.$options.components[tag];
     return createComponent(vm, tag, data, data.key, children, Ctor);
  }
}

// 创建组件的虚拟节点
function createComponent(vm, tag, data, key, children,Ctor){
      
     if(isObject(Ctor)){
       Ctor =   vm.$options._base.extend(Ctor)
     }
     // 渲染组件时，需要调用此初始化方法
     data.hook = {
      init (vnode){
        let vm =  vnode.componentInstance= new Ctor({_iscomponent :true}); // new Sub
            vm.$mount();
      }
     }
    return  vnode(vm,`vue-component-${tag}`, data, key, undefined,undefined, {Ctor, children});
}

export function createTextElement(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text);
}

function vnode(vm, tag, data, key, children, text,componentOptions) {
  return {
    vm,
    tag,
    data,
    key,
    children,
    text,
    componentOptions
  };
}
