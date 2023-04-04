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
