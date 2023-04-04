import { nextick } from "../utils";
// 调度
let queue = []; // 存放更新视图的watcher 去重
let has = {};
function flushSchedulerQueue() {
  for (var i = 0; i < queue.length; i++) {
    queue[i].run();
  }
  queue = [];
  has = {};
  pending = false;
}
let pending = false;
export function queueWatcher(watcher) {
  let id = watcher.id;
  if (has[id] == null) {
    queue.push(watcher);
    has[id] = true;
    // 开启一次更新操作， 批处理 （防抖）
    if (!pending) {
      nextick(flushSchedulerQueue); // 等待所有同步执行完，再执行更新操作
      pending = true;
    }
  }
}
// 同步代码执行完后。执行栈中先执行微任务（），在执行宏任务，当同步数据更改后，我们希望尽快更新视图 所以使用微任务
// 定时器是宏任务，所以考虑使用promise微任务 vue内部封装了一个nextick方法使用promise
