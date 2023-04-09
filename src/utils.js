export function isfn(fn) {
  return typeof fn === "function";
}

export function isObject(obj) {
  return typeof obj == "object" && obj != null;
}

let callbacks = [];
function flushCallback() {
  callbacks.forEach((cb) => {
    cb();
  });
  callbacks = [];
  waiting = false;
}
function timer(flushCallback) {
  let timerFn = () => {};
  if (Promise) {
    // 微任务
    timerFn = () => {
      Promise.resolve().then(flushCallback);
    };
  } else if (MutationObserver) {
    // 微任务
    let textNode = document.createTextNode(1);
    let observe = new MutationObserver(flushCallback);
    observe.observe(textNode, { characterData: true });
    timerFn = () => {
      textNode.textContent = 3;
    };
  } else if (setImmediate) {
    timerFn = () => {
      setImmediate(flushCallback);
    };
  } else {
    timerFn = () => {
      setTimeout(flushCallback, 0);
    };
  }
  timerFn();
}

// 内部先调用nextick ：flushSchedulerQueue
//用户后调nextick vm.$nextick(function(){console.log( vm.$el)});

// 内部和用户各一共调用2次nextTick，其实更新视图逻辑只需执行一次  防抖处理
let waiting = false;
export function nextick(cb) {
  callbacks.push(cb);
  if (!waiting) {
    timer(flushCallback);
    waiting = true;
  }
}

let lifecycleHooks = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
];
/*
  第一种情况：  parentVal = {  }    childVal = { beforeCreate:Fn1}
             需要合并成: options=  {  beforeCreate: [ Fn1]   }

  第二种情况： parentValu= { beforeCreate: Fn1 }  childVal = { beforeCreate: Fn2}
            需要合并成： options = { beforeCreate: [ Fn1, Fn2]}

  第三种情况： parentValu= { beforeCreate: Fn1 }  childVal = { }
            需要合并成： options = { beforeCreate: Fn1 }
*/
function mergeHook(parentVal, childVal) {
  if (childVal) {
    if (parentVal) {
      return parentVal.concat(childVal);
    } else {
      // 有childVal 没parentVal
      return [childVal];
    }
  } else {
    return parentVal;
  }
}
let strats = {}; // 存放的各种策略

lifecycleHooks.forEach(function (hook) {
  strats[hook] = mergeHook;
});
strats.components = function (parentVal, childVal) {
  
  let options = Object.create(parentVal);

  if (childVal) {
    for (let key in childVal) {
      options[key] = childVal[key];
    }
  }
  return options;
};
export function mergeOptions(parent, child) {
  //  parent = { a:1, data:{} }  child = { data: {} }
  const options = {}; // 合并后的选项
  for (let key in parent) {
    mergeField(key);
  }
  for (let key in child) {
    // 如果parent中有，则不用合并因为上面循环已经合并了
    if (parent.hasOwnProperty(key)) {
      continue;
    }
    mergeField(key);
  }
  function mergeField(key) {
    let parentVal = parent[key];
    let childVal = child[key];
    // 如果是对象  进行合并
    // 策略模式
    if (strats[key]) {
      options[key] = strats[key](parentVal, childVal);
    } else {
      if (isObject(parentVal) && isObject(child)) {
        options[key] = { ...parentVal, ...childVal };
      }
      // 非对象 以child为准
      else {
        // 父亲中有，儿子中没有

        options[key] = child[key] || parent[key];
      }
    }
  }
  return options;
}
// test   mergeOptions({ beforCreate:fn1 }, { beforCreate:fn2}  )

export function isReservedTag(tag){

    let reservedTag = "html,body,base,head,link,meta,style,title," +
  "address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section," +
  "div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul," +
  "a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby," +
  "s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video," +
  "embed,object,param,source,canvas,script,noscript,del,ins," +
  "caption,col,colgroup,table,thead,tbody,td,th,tr," +
  "button,datalist,fieldset,form,input,label,legend,meter,optgroup,option," +
  "output,progress,select,textarea," +
  "details,dialog,menu,menuitem,summary," +
  "content,element,shadow,template,blockquote,iframe,tfoot"

  return   reservedTag.includes(tag);
  
}