(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{  }}

  function genProps(attrs) {
    // attrs  [{ name :id , value: app}, { name:XXX,value:XXX}]
    var str = "";

    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];

      if (attr.name == "style") {
        (function () {
          // 'width:100px; height:100px;'  ===> { width:"100px", height:"100px"}
          var styleObj = {};
          attr.value.replace(/([^;:]+):([^;:]+)/g, function () {
            styleObj[arguments[1]] = arguments[2];
          });
          attr.value = styleObj;
        })();
      }

      str += "".concat(attr.name, " : ").concat(JSON.stringify(attr.value), ",");
    }

    return "{ ".concat(str.slice(0, -1), "}"); // {id:app, title:'123'}  slice() 把字符串json中最后一个 ,去掉
  }

  function gen(el) {
    if (el.type == 1) {
      return generate(el);
    } else {
      var text = el.text;

      if (!defaultTagRE.test(text)) {
        // '_v(hello)'
        return "_v(\"".concat(text, "\")");
      } else {
        //有大括号情况 hello{{data}}world =====>  '_v("hello"+ data+ "world")'
        var match;
        var tokens = [];
        var lastIndex = defaultTagRE.lastIndex = 0;

        while (match = defaultTagRE.exec(text)) {
          //hello{{data}}world
          var index = match.index;

          if (index > lastIndex) {
            // 说明捕获到了
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push("_s(".concat(match[1].trim(), ")"));
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return "_v(".concat(tokens.join('+'), ")");
      }
    }
  }

  function genChildren(el) {
    var children = el.children;

    if (children) {
      return children.map(function (c) {
        return gen(c);
      }).join(",");
    }

    return false;
  }

  function generate(el) {
    var children = genChildren(el);
    var code = "_c(  \"".concat(el.tag, "\", ").concat(el.attrs.length ? genProps(el.attrs) : "undefined", " ").concat(children ? ",".concat(children) : " ", "  )");
    return code;
  }

  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*"; // 标签名

  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")"); // aa:xx 命令空间  用来获取标签名  match后索引为1的为匹配到的标签名   let r =  '<div></div>'.match(qnameCapture);

  var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配开始标签

  var startTagClose = /^\s*(\/?)>/; //   />      <div/>
  //  匹配属性  a=b  a="b"  a='b' 三种情况      aa  =  “  XXX ” | ‘  XXX  ’  |  XXX

  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配闭合标签 </xxxx   >
  // htmlparser2 第三方插件与parserHTML一样  把html转化成ast语法树

  function parserHTML(html) {
    //  前进删除以匹配的内容
    function advance(len) {
      html = html.substring(len);
    }

    function paserStartTag() {
      var start = html.match(startTagOpen); //console.log(start)==>  ['<div', 'div', index: 0, input: '<div id="app"> {{name}}</div>', groups: undefined]

      if (start) {
        var match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length); //  id="app"> {{name}}</div>
        // 匹配属性

        var _end;

        var attr;

        while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          // 没到开始标签闭合 ">" 则说明有n个属性
          // attr ==>  [' id="app"', 'id', '=', 'app', undefined, undefined, index: 0, input: ' id="app" class="div1">{{name}}</div>', groups: undefined]
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
          advance(attr[0].length);
        }

        if (_end) {
          advance(_end[0].length);
        }

        return match;
      }

      return false; // 不是开始标签
    }

    while (html) {
      var textend = html.indexOf("<"); // 当前解析的开头<div id="app">{{name}}</div>

      if (textend == 0) {
        var startTagMatch = paserStartTag(); // 如果是开始标签

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        } // 如果是结束标签


        var endTagMatch = html.match(endTag);

        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }
      }

      var text = void 0;

      if (textend > 0) {
        //  {{name}}</div>
        text = html.substring(0, textend);
      }

      if (text) {
        chars(text);
        advance(text.length); // </div>
      }
    }

    return root;
  }
  var root = null;
  var stack = []; // 用于存放解析标签   >>>>栈 先进后出
  //  匹配到一个节点： 标记节点的父亲是谁 ，父亲的儿子是当次匹配的节点 （双向标记）

  function start(tagName, attributes) {
    var parent = stack[stack.length - 1];
    var element = createAstElement(tagName, attributes);

    if (!root) {
      root = element;
    }

    if (parent) {
      element.parent = parent; // 记录节点的父亲

      parent.children.push(element); // 记录父亲的儿子
    }

    stack.push(element);
  }

  function chars(text) {
    text = text.replace(/\s+/g, "");

    if (text) {
      var parent = stack[stack.length - 1];
      parent.children.push({
        type: 3,
        text: text
      });
    }
  }

  function end(tagName) {
    var last = stack.pop();

    if (last.tag != tagName) {
      throw new Error("标签格式有误");
    }
  } // 将解析后的结果 组装成一个树结构 -----栈


  function createAstElement(tagName, attrs) {
    return {
      tag: tagName,
      type: 1,
      children: [],
      parent: null,
      attrs: attrs
    };
  } //  html标签解析成DOM树 <div id="app"> {{name}}</div>

  function compileToFunction(template) {
    var root = parserHTML(template); // html===>ast（只能描述语法，语法不存在的无法描述）====>render函数======> 虚拟DOM=======>生成真实DOM

    var code = generate(root);
    console.log(root);
    console.log(code);
  }
  /*
  console.log(root);
  {tag: 'div', type: 1, children: Array(3), parent: null, attrs: Array(3)}

  console.log(code);
  _c(
    "div",
    { id: "app", class: "div1", style: { width: "100px", " height": "100px" } },
    _c("h3", { class: "title" }, _v("title")),
    _v("{{name}}"),
    _c("p", { class: "p1111" }, _v("aaa"))
  );
  */

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
          inserted = args; // 类数组

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
  } // 数据代理  当调用vm.name 则在 vm._data.name获取


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
        vm.$mount(vm.$options.el);
      }
    }; //  将数据挂载到模板上


    Vue.prototype.$mount = function (el) {
      var vm = this;
      var options = vm.$options;
      el = document.querySelector(el); //  1 把模板转化成对应的渲染函数===> 虚拟DOM概念 vnode====> diff算法更新虚拟DOM====>产生真实节点 更新

      if (!options.render) {
        var template = options.template;

        if (!template && el) {
          template = el.outerHTML;
          var render = compileToFunction(template);
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
