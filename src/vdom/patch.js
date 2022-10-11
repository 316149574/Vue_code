export function patch(oldVnode, vnode) {
  if (oldVnode.nodeType == 1) {
    let parentElm = oldVnode.parentNode;
    let elm = createElm(vnode); // 根据虚拟节点创建真实DOM
    parentElm.insertBefore(elm, oldVnode.nextSibling);
    parentElm.removeChild(oldVnode);
    return elm;
    // 第一次渲染后 删除了vm.$el 所以最后要返回新的elm
  }
}
// 核心方法 createElm方法  将虚拟DOM转换成真实DOM
function createElm(vnode) {
  let { tag, data, children, text, vm } = vnode;
  if (typeof tag == "string") {
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
