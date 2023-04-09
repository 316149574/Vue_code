export function patch(oldVnode, vnode) {

  if(!oldVnode){
    // 组件
    return  createElm(vnode);
  }
  if (oldVnode.nodeType == 1) {
    let parentElm = oldVnode.parentNode;
    let elm = createElm(vnode); // 根据虚拟节点创建真实DOM
    parentElm.insertBefore(elm, oldVnode.nextSibling);
    parentElm.removeChild(oldVnode);
    return elm;
    // 第一次渲染后 删除了vm.$el 所以最后要返回新的elm
  }
}
function createComponent(vnode){
  let i = vnode.data;
  if((i= i.hook) && (i = i.init) ){
     i(vnode);
  }
  if(vnode.componentInstance){ // 有属性， 说明组件new完了， 并且组件对应的真是DOM挂载到了componentInstance上
    return true;
  }
}

// 核心方法 createElm方法  将虚拟DOM转换成真实DOM
function createElm(vnode) {
  let { tag, data, children, text, vm } = vnode;
  if (typeof tag == "string") {
     // 组件
     if(createComponent(vnode)){
         return vnode.componentInstance.$el;      
     }
    
    
    // 元素
    vnode.el = document.createElement(tag); // 虚拟节点vnode有一个el属性对应真实节点
    children.forEach((child) => {
      vnode.el.appendChild(createElm(child));
    });


  } else {
    // 文本
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}
