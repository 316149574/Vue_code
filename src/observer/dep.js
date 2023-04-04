// 依赖收集  每个属性都分配一个Dep  Dep可以用来存放watcher 反过来 watcher中也要存放dep
let id = 0;
export class Dep {
  constructor() {
    this.id = id++;
    this.subs = []; // 用来存放watcher
  }
  // 将dep存放到watcher中
  // dep中要存放watcher  watcher中也要存放dep 多对多
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
  // 将watcher存放到dep中
  addSub(watcher) {
    this.subs.push(watcher);
  }
  //  通知所有watcher更新视图
  notify() {
    this.subs.forEach((watcher) => {
      watcher.update();
    });
  }
}
Dep.target = null;
export function pushTarget(watcher) {
  Dep.target = watcher;
}
export function popTarget() {
  Dep.target = null;
}
