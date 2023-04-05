import { mergeOptions } from "../utils";

export  function initGlobalApi(Vue){
  Vue.options = { }   // 用来存放全局属性的  如 Vue.component()  Vue.filter() Vue.directive()
  // 每个组件初始化的时候，都会和options选项进行合并
  Vue.mixin = function(options){
     this.options =mergeOptions(this.options, options);
     
     return this;
  }
}
