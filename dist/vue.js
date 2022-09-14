(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    //  匹配属性  a=b  a="b"  a='b' 三种情况      aa  =  “  XXX ” | ‘  XXX  ’  |  XXX
    "[a-zA-Z_][\\-\\.0-9_a-zA-Z".concat(unicodeRegExp.source, "]*"); // 标签名 
    //  html标签解析成ast树  

    function compileToFunction(template) {
    } // htmlparser2 第三方插件与parserHTML一样  把html转化成ast语法树

    function _typeof(obj) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      }, _typeof(obj);
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", {
        writable: false
      });
      return Constructor;
    }

    var oldArrayPrototype = Array.prototype;
    var arrayMethods = Object.create(oldArrayPrototype);
    var methods = ['push', 'shift', 'pop', 'unshift', 'reverse', 'splice', 'sort'];
    methods.forEach(function (method) {
      arrayMethods[method] = function () {
        var _oldArrayPrototype$me;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        // args参数列表  arr.push(1,2,3)  ...args = [1,2,3]
        // 方法劫持 搞事情....
        (_oldArrayPrototype$me = oldArrayPrototype[method]).call.apply(_oldArrayPrototype$me, [this].concat(args)); //  如果数组方法新添加的值是一个对象 则同样需要进行观测


        var inserted; // 新添加的值

        switch (method) {
          case 'push':
          case 'unshift':
            inserted = args;
            break;

          case 'splice':
            inserted = args.slice(2);
            break;
        }

        var ob = this.__ob__;
        if (inserted) ob.observeArray(inserted); //  todo 更新操作
      };
    }); //  Object.create(); 方法第一个参数为某对象的原型 本质是新创建的对象继承传入参数对象的原型

    function isfn(fn) {
      return typeof fn === "function";
    }
    function isObject(obj) {
      return _typeof(obj) == 'object' && obj != null;
    }

    function observe(data) {
      // vue2中会将所有的data数据进行数据劫持？什么是数据劫持？ Object.defineproperty 
      // 如果是对象才进行观测
      if (!isObject(data)) {
        return;
      }

      if (data.__ob__) {
        // 如果数据有__ob__则说明数据已经被观测了，则无需观测
        return;
      } // 进行观测  默认最外层的data必须是一个对象


      return new Observer(data);
    } // 检测数据的变化 

    var Observer = /*#__PURE__*/function () {
      function Observer(data) {
        _classCallCheck(this, Observer);

        // 对对象中的所有属性进行劫持
        // data.__ob__ = this;  将观测者实例挂载到观测的data数据上, 不能直接添加，会递归observe 
        Object.defineProperty(data, "__ob__", {
          value: this,
          enumerable: false
        });

        if (Array.isArray(data)) {
          // 数据劫持的逻辑  劫持数组的变异方法（变异方法:指操作方法可能会改变原数组如： push shift pop 而contact不是变异方法，因其不会改变原数组）
          // 对数组原来的方法进行改写（重写？）----> 切片编程 高阶函数
          data.__proto__ = arrayMethods; // 如果数组中的数据是对象，则需要对对象进行劫持 [{key:value}, {key:value}]

          this.observeArray(data);
        } else {
          this.walk(data); // 对象劫持的逻辑
        }
      }

      _createClass(Observer, [{
        key: "observeArray",
        value: function observeArray(data) {
          data.forEach(function (item) {
            observe(item);
          });
        } // 劫持对象

      }, {
        key: "walk",
        value: function walk(data) {
          // data数据对象
          Object.keys(data).forEach(function (key) {
            defineReactive(data, key, data[key]);
          });
        }
      }]);

      return Observer;
    }(); // vue2会对对象进行遍历(递归)， 将每个对象用 Object.defineProperty重新定义， 性能差!!!


    function defineReactive(data, key, value) {
      observe(value); // 如果对象属性的值为对象，则递归劫持对象属性 ，所以在使用Vue2的时候，尽量将数据扁平化不要过多嵌套  

      Object.defineProperty(data, key, {
        get: function get() {
          return value;
        },
        set: function set(newValue) {
          // todo 用户更改了数据.....
          observe(newValue); // 如果对象的某个属性重新赋的值也是一个对象，则也需要被劫持。

          value = newValue;
        }
      });
    }
    /**
     * 问题： 给data添加属性会被劫持到吗？
     * 
     *总结 ： 如果是对象，会对对象进行递归劫持
             如果是数组 会劫持数组的方法，并对数组中不是基本数据类型的数据进行检测 
     * 
     * 
     * 
     * */

    function initState(vm) {
      var opts = vm.$options;

      if (opts.data) {
        initData(vm);
      }
    }

    function initData(vm) {
      var data = vm.$options.data; // 此时data和vm没有任何关系  data = isfn(data) ? data.call(vm) : data;  解决：

      data = vm._data = isfn(data) ? data.call(vm) : data; // 判断data是函数还是json对象 
      // vm.name ----> vm._data.name

      for (var key in data) {
        proxy(vm, "_data", key);
      }

      observe(data);
    } // 属性代理  当调用vm.name 则在 vm._data.name获取


    function proxy(vm, source, key) {
      Object.defineProperty(vm, key, {
        get: function get() {
          return vm[source][key];
        },
        set: function set(newValue) {
          vm[source][key] = newValue;
        }
      });
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        var vm = this;
        vm.$options = options; // 对数据进行初始化 data el methods computed props

        initState(vm); // 模板编译

        if (vm.$options.el) {
          //  将数据挂载到模板上
          vm.$mount(vm.$options.el);
        }
      };

      Vue.prototype.$mount = function (el) {
        var vm = this;
        var options = vm.$options;
        el = document.querySelector(el); //  1 把模板转化成对应的渲染函数===> 虚拟DOM概念 vnode====> diff算法更新虚拟DOM====>产生真实节点 更新

        if (!options.render) {
          var template = options.template;

          if (!template && el) {
            template = el.outerHTML;
            var render = compileToFunction();
            options.render = render; // options.render函数就是渲染函数
          }
        }
      };
    }

    function Vue(options) {
      this._init(options); // options vue实例的配置项{ el data methods等}

    }

    initMixin(Vue); // 此函数将_init方法添加到Vue原型上

    return Vue;

}));
//# sourceMappingURL=vue.js.map