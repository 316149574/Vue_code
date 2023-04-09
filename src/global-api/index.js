import { mergeOptions } from "../utils";

export function initGlobalApi(Vue) {
  Vue.options = {}; // 用来存放全局属性的  如 Vue.component()  Vue.filter() Vue.directive()
  // 每个组件初始化的时候，都会和options选项进行合并
  Vue.mixin = function (options) {
    this.options = mergeOptions(this.options, options);

    return this;
  };

  Vue.options.components = {};
  Vue.options._base = Vue;
  Vue.component = function (id, definition) {
    // 保证组件的隔离， 每个组件都要产生一个新的类， 去继承父类
    definition = this.options._base.extend(definition); 
    this.options.components[id] = definition;
  };

  // extend 给一个对象（definition）返回一个类（Sub）
  Vue.extend = function (opts) {
    const Super = this;
    const Sub = function VueComponent(options) {
      this._init(options);
    };
    // 原型继承
    Sub.prototype = Object.create(this.prototype);
    //  需要重写constructor 否则构造函数是指的父类的构造函数
    Sub.prototype.constructor = Sub;
    // Vue的options与Vue.component( '')中的options（definition）合并
    Sub.options = mergeOptions(Super.options, opts);

    return Sub;
  };
}
