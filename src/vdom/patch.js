export function patch(oldVnode, vnode) {
  if (!oldVnode) {
    // 组件
    return createElm(vnode);
  }
  if (oldVnode.nodeType == 1) {
    let parentElm = oldVnode.parentNode;
    let elm = createElm(vnode); // 根据虚拟节点创建真实DOM
    parentElm.insertBefore(elm, oldVnode.nextSibling);
    parentElm.removeChild(oldVnode);
    return elm;
    // 第一次渲染后 删除了vm.$el 所以最后要返回新的elm
  } else {
    // 如果标签名不一样  将标签名替换成新的
    if (oldVnode !== vnode) {
      return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
    }

    // 如果标签一样， 比较属性
    vnode.el = oldVnode.el; // 表示当前新节点复用老节点
    patchProps(vnode, oldVnode.data);
  }
}

// 属性的比较  初次渲染时，可以调用此方法，后续更新时也可以调用此方法
function patchProps(vnode, oldProps) {
  let newProps = vnode.data || {};
  let el = vnode.el;
  // 如果老的有属性而新的没有， 则直接删除老的
  for (let key in oldProps) {
    if (!newProps[key]) {
      el.removeAttribute(key);
    }
  }

  //直接用新的生成到元素上
  for (let key in newProps) {
    if (key == "style") {
      for (let stylename in newProps.style) {
        el.style[stylename] = newProps.style[stylename];
      }
    } else {
      el.setAttribute(key, newProps[key]);
    }
  }
}

function createComponent(vnode) {
  let i = vnode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vnode);
  }
  if (vnode.componentInstance) {
    // 有属性， 说明组件new完了， 并且组件对应的真是DOM挂载到了componentInstance上
    return true;
  }
}

// 核心方法 createElm方法  将虚拟DOM转换成真实DOM
export function createElm(vnode) {
  let { tag, data, children, text, vm } = vnode;
  if (typeof tag == "string") {
    // 组件
    if (createComponent(vnode)) {
      return vnode.componentInstance.$el;
    }
    // 元素
    vnode.el = document.createElement(tag); // 虚拟节点vnode有一个el属性对应真实节点
    // 给虚拟节点增加属性
    patchProps(vnode);
    children.forEach((child) => {
      vnode.el.appendChild(createElm(child));
    });
  } else {
    // 文本
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}
