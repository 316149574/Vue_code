import { observe } from "./observer/index";
import { isfn } from "./utils";

// 数据状态初始化
export function initState(vm) {
    const opts = vm.$options;
    if (opts.data) {
        initData(vm);
    }
}
function initData(vm) {
    let data = vm.$options.data;

    // 此时data和vm没有任何关系  data = isfn(data) ? data.call(vm) : data;  解决：

    data =vm._data= isfn(data) ? data.call(vm) : data; // 判断data是函数还是json对象 
    //   vue2中会将所有的data数据进行数据劫持？什么是数据劫持？ Object.defineproperty 
    // vm.name ----> vm._data.name
    for(let key in data){
        proxy(vm, "_data", key);
    }
    observe(data);
}

function proxy(vm,source, key){
  Object.defineProperty(vm,key,{
    get(){
       return vm[source][key];
    },
    set(newValue){
       vm[source][key] = newValue;
    }
  } );
}

