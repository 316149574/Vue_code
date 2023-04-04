(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  /**
   * generate 将ast生成render函数
   *
   */
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

        return "_v(".concat(tokens.join("+"), ")");
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
  /*

  _c(  "div", { id : "app",class : "div1",style : {"width":"100px"," height":"100px"}} ,_v("hello"+_s(name)+"world"),_c(  "p", { class : "p1"} ,_v(_s(message))  ),_v(_s(bookList))  )

  */

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

    var code = generate(root); //    render函数: new Function +with

    var render = new Function("with(this){return ".concat(code, "}"));
    return render;
  }

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

  // 依赖收集  每个属性都分配一个Dep  Dep可以用来存放watcher 反过来 watcher中也要存放dep
  var id$1 = 0;
  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);

      this.id = id$1++;
      this.subs = []; // 用来存放watcher
    } // 将dep存放到watcher中
    // dep中要存放watcher  watcher中也要存放dep 多对多


    _createClass(Dep, [{
      key: "depend",
      value: function depend() {
        if (Dep.target) {
          Dep.target.addDep(this);
        }
      } // 将watcher存放到dep中

    }, {
      key: "addSub",
      value: function addSub(watcher) {
        this.subs.push(watcher);
      } //  通知所有watcher更新视图

    }, {
      key: "notify",
      value: function notify() {
        this.subs.forEach(function (watcher) {
          watcher.update();
        });
      }
    }]);

    return Dep;
  }();
  Dep.target = null;
  function pushTarget(watcher) {
    Dep.target = watcher;
  }
  function popTarget() {
    Dep.target = null;
  }

  function isfn(fn) {
    return typeof fn === "function";
  }
  function isObject(obj) {
    return _typeof(obj) == "object" && obj != null;
  }
  var callbacks = [];

  function flushCallback() {
    callbacks.forEach(function (cb) {
      cb();
    });
    callbacks = [];
    waiting = false;
  }

  function timer(flushCallback) {
    var timerFn = function timerFn() {};

    if (Promise) {
      // 微任务
      timerFn = function timerFn() {
        Promise.resolve().then(flushCallback);
      };
    } else if (MutationObserver) {
      // 微任务
      var textNode = document.createTextNode(1);
      var observe = new MutationObserver(flushCallback);
      observe.observe(textNode, {
        characterData: true
      });

      timerFn = function timerFn() {
        textNode.textContent = 3;
      };
    } else if (setImmediate) {
      timerFn = function timerFn() {
        setImmediate(flushCallback);
      };
    } else {
      timerFn = function timerFn() {
        setTimeout(flushCallback, 0);
      };
    }

    timerFn();
  } // 内部先调用nextick ：flushSchedulerQueue
  //用户后调nextick vm.$nextick(function(){console.log( vm.$el)});
  // 内部和用户各一共调用2次nextTick，其实更新视图逻辑只需执行一次  防抖处理


  var waiting = false;
  function nextick(cb) {
    callbacks.push(cb);

    if (!waiting) {
      timer(flushCallback);
      waiting = true;
    }
  }

  var queue = []; // 存放更新视图的watcher 去重

  var has = {};

  function flushSchedulerQueue() {
    for (var i = 0; i < queue.length; i++) {
      queue[i].run();
    }

    queue = [];
    has = {};
    pending = false;
  }

  var pending = false;
  function queueWatcher(watcher) {
    var id = watcher.id;

    if (has[id] == null) {
      queue.push(watcher);
      has[id] = true; // 开启一次更新操作， 批处理 （防抖）

      if (!pending) {
        nextick(flushSchedulerQueue); // 等待所有同步执行完，再执行更新操作

        pending = true;
      }
    }
  } // 同步代码执行完后。执行栈中先执行微任务（），在执行宏任务，当同步数据更改后，我们希望尽快更新视图 所以使用微任务
  // 定时器是宏任务，所以考虑使用promise微任务 vue内部封装了一个nextick方法使用promise

  var id = 0;
  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, exprOrFn, cb, options) {
      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.exprOrFn = exprOrFn;
      this.cb = cb;
      this.options = options;
      this.user = !!options.user; // 是否是用户watcher  watch

      this.deps = []; // 存放dep

      this.depsId = new Set(); // 不论是渲染还是watch监听的watcher， this.getter方法的作用都是取值操作，触发属性的get进行依赖收集

      if (typeof exprOrFn === "string") {
        this.getter = function () {
          // 当取值时，就会进行依赖📱
          var path = exprOrFn.split("."); // 'person.name' ==> [person, name]

          var obj = vm;

          for (var i = 0; i < path.length; i++) {
            obj = obj[path[i]];
          }

          return obj;
        };
      } else {
        // 默认让 exprOrFn执行  调用了render方法去vm上取值
        this.getter = exprOrFn;
      }

      this.value = this.get();
      this.id = id++; // 每个实例watcher唯一标识
    } // 数据更新时， 调用get


    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        // 当调用get会去vm上取值 会触发definedProperty.get
        // 每个属性都可以收集自己的watcher---收集依赖dep
        //一个属性对应多个watcher   一个watcher可以对应多个属性
        pushTarget(this); // Dep.target = watcher

        var value = this.getter();
        popTarget(); // Dep.target = null , 如果Dep.target有值 则说明这个变量在模板中被使用

        return value;
      }
    }, {
      key: "update",
      value: function update() {
        // vue中的更新是异步的   多次调用update，先将watcher存放起来，等会一起更新
        // this.get();
        queueWatcher(this); // 异步更新队列 https://v2.cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97
      }
    }, {
      key: "run",
      value: function run() {
        var newValue = this.get();
        var oldValue = this.value;
        this.value = newValue;

        if (this.user) {
          // 必须是用户watcher才调用
          this.cb.call(this.vm, oldValue, newValue);
        }
      }
    }, {
      key: "addDep",
      value: function addDep(dep) {
        if (!this.depsId.has(dep.id)) {
          this.depsId.add(dep.id);
          this.deps.push(dep);
          dep.addSub(this);
        }
      }
    }]);

    return Watcher;
  }();
  /**
   * 思路：watcher和dep
   * 1、我们将更新的功能封装成了一个watcher
   * 2、渲染页面时，会将当前watcher放到 Dep.target上
   * 3、在vue中页面渲染使用的属性，需要进行依赖收集，收集对象的渲染watcher
   * 4、取值时，给每个属性都加上dep属性， 用于存放这个渲染watcher （同一个watcher会对应多个dep）
   * 5、每个属性可能对应多个视图（多个视图可能是多个watcher），一个属性要对应多个watcher
   * 6、dep.depend(); 通知dep存放watcher    Dep.target.addDep() 通知watcher存放dep
   * 双向存储
   *
   *
   *
   * 每个属性分配一个watcher(使用pushTarget方法 将wather放到Dep的target属性上 )用于收集哪些组件依赖于此属性，
   * 当数据发生改变时，让属性Dep中所收集的watcher更新对应的组件视图
   *
   * */

  function patch(oldVnode, vnode) {
    if (oldVnode.nodeType == 1) {
      var parentElm = oldVnode.parentNode;
      var elm = createElm(vnode); // 根据虚拟节点创建真实DOM

      parentElm.insertBefore(elm, oldVnode.nextSibling);
      parentElm.removeChild(oldVnode);
      return elm; // 第一次渲染后 删除了vm.$el 所以最后要返回新的elm
    }
  } // 核心方法 createElm方法  将虚拟DOM转换成真实DOM

  function createElm(vnode) {
    var tag = vnode.tag;
        vnode.data;
        var children = vnode.children,
        text = vnode.text;
        vnode.vm;

    if (typeof tag == "string") {
      // 元素
      vnode.el = document.createElement(tag); // 虚拟节点vnode有一个el属性对应真实节点

      children.forEach(function (child) {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      // 文本
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      // 既有初始化又有更新
      var vm = this;
      vm.$el = patch(vm.$el, vnode);
    };

    Vue.prototype.$nextick = nextick;
  } // 后续每个组件渲染的时候，都会有一个watcher

  function mountComponent(vm, el) {
    // 更新函数 数据变化后会再次调用该方法
    var updateComponent = function updateComponent() {
      // 两个任务： 1 通过_render方法生成虚拟DOM  2 把虚拟DOM转成真实DOM
      vm._update(vm._render());
    }; // 观察者模式，属性是被观察者  观察者：刷新页面
    // updateComponent();


    new Watcher(vm, updateComponent, function () {
      console.log("数据更新了");
    }, true // 标识  它是一个渲染watcher，后续还有其它的watcher
    );
  }

  var oldArrayPrototype = Array.prototype;
  var arrayMethods = Object.create(oldArrayPrototype);
  var methods = ["push", "shift", "pop", "unshift", "reverse", "splice", "sort"];
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
        case "push":
        case "unshift":
          inserted = args; // 类数组

          break;

        case "splice":
          inserted = args.slice(2);
          break;
      }

      var ob = this.__ob__;
      if (inserted) ob.observeArray(inserted);
      ob.dep.notify(); //  todo 更新操作
    };
  }); //  Object.create(); 方法第一个参数为某对象的原型 本质是新创建的对象继承传入参数对象的原型

  function observe(data) {
    // vue2中会将所有的data数据进行数据劫持？什么是数据劫持？ Object.defineproperty
    // 如果是对象才进行观测
    if (!isObject(data)) {
      return;
    }

    if (data.__ob__) {
      return data.__ob__; // 如果数据有__ob__则说明数据已经被观测了，则无需观测
    }

    return new Observer(data); // 进行观测  默认最外层的data必须是一个对象
  } // 如果给对象新增一个属性，不会触发视图更新（给对象本身也增加一个dep（dep中存watcher）， 增加一个属性后，手动触发watcher更新）

  var Observer = /*#__PURE__*/function () {
    // 检测数据的变化
    function Observer(data) {
      _classCallCheck(this, Observer);

      // 对对象中的所有属性进行劫持
      // data.__ob__ = this;  将观测者实例挂载到观测的data数据上, 不能直接添加，会递归observe
      this.dep = new Dep(); // arr._ob_.dep    数据可能是对象 也可能是数组  数组怎么收集依赖？  在页面 {{ arr}} 会触发 obj={ arr:[1,2,3]} obj的get

      Object.defineProperty(data, "__ob__", {
        value: this,
        enumerable: false
      });

      if (Array.isArray(data)) {
        // 数据劫持的逻辑  劫持数组的变异方法（变异方法:指操作方法可能会改变原数组如： push shift pop 而contact不是变异方法，因其不会改变原数组）
        // 对数组原来的方法进行改写（重写）----> 切片编程 高阶函数
        data.__proto__ = arrayMethods;
        this.observeArray(data); // 如果数组中的数据是对象，则需要对对象进行劫持 [{key:value}, {key:value}]
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
  }();

  function dependArray(value) {
    for (var i = 0; i < value.length; i++) {
      var current = value[i]; // current 是数组中的数组

      current.__ob__ && current.__ob__.dep.depend();
      if (Array.isArray(current)) dependArray(current);
    }
  } // vue2会对对象进行遍历(递归)， 将每个对象用 Object.defineProperty重新定义， 性能差!!!


  function defineReactive(data, key, value) {
    var childOb = observe(value); // 如果对象属性的值为对象，则递归劫持对象属性 ，所以在使用Vue2的时候，尽量将数据扁平化不要过多嵌套

    var dep = new Dep(); // 每个属性都有一个dep

    Object.defineProperty(data, key, {
      get: function get() {
        // 当调用属性时，希望将dep和watcher关联上
        // 如果Dep.target有值 则此值是在模板中取值的
        if (Dep.target) {
          dep.depend();
          if (childOb) childOb.dep.depend(); // childOb可能是数组 也可能是对象  是对象后续开发$set时 会也会让对象更新视图

          if (Array.isArray(value)) {
            dependArray(value);
          }
        }

        return value;
      },
      set: function set(newValue) {
        // todo 用户更改了数据.....
        if (newValue !== value) {
          observe(newValue); // 如果对象的某个属性重新赋的值也是一个对象，则也需要被劫持。

          value = newValue;
          dep.notify(); // 告诉当前属性的Dep存放的watcher执行更新
        }
      }
    });
  }
  /**
   * 问题： 给data添加属性会被劫持到吗？
   *总结 ： 如果是对象，会对对象进行递归劫持
           如果是数组 会劫持数组的方法，并对数组中不是基本数据类型的数据进行检测 
   * */

  function stateMixin(Vue) {
    Vue.prototype.$watch = function (key, handler) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      options.user = true; // 表示这是用户自己写的watcher  非渲染watcher

      new Watcher(this, key, handler, options);
    };
  } // 数据状态初始化

  function initState(vm) {
    var opts = vm.$options;

    if (opts.data) {
      initData(vm);
    }

    if (opts.watch) {
      initWatch(vm, opts.watch);
    }

    if (opts.computed) {
      initComputed(vm, opts.computed);
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
  }

  function initWatch(vm, watch) {
    for (var key in watch) {
      var handler = watch[key];

      if (Array.isArray(handler)) {
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  function createWatcher(vm, key, handler) {
    return vm.$watch(key, handler);
  }

  function initComputed(vm, computed) {
    for (var key in computed) {
      var userDef = computed[key]; // 可能是对象，也可能是函数

      var getter = typeof userDef == "function" ? userDef : userDef.get; // 有多少个getter就创建多少个watcher ， 每个计算属性的本质就是watcher

      new Watcher(vm, getter, function () {}, {
        lazy: true
      }); // lazy:true 让其不马上执行， 只有当计算属性被调用后才执行
      // 将key定义在vm的_data上   vm_data.fullname  计算属性的本质也是使用 Object.defineProperty

      defineComputed(vm, key, userDef);
    }
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
      el = document.querySelector(el);
      vm.$el = el; //  1 把模板转化成对应的渲染函数===> 虚拟DOM概念 vnode====> diff算法更新虚拟DOM====>产生真实节点 更新

      if (!options.render) {
        var template = options.template;

        if (!template && el) {
          template = el.outerHTML;
          var render = compileToFunction(template);
          options.render = render; // options.render函数就是渲染函数,接下来 调用render方法，渲染成真实DOM，替换掉页面内容
          // 将组件vm实例挂载到el上---组件的挂载流程

          mountComponent(vm);
        }
      }
    };
  }

  function createElement(vm, tag) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }

    return vnode(vm, tag, data, data.name, children, undefined);
  }
  function createTextElement(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  function vnode(vm, tag, data, key, children, text) {
    return {
      vm: vm,
      tag: tag,
      data: data,
      key: key,
      children: children,
      text: text
    };
  }

  function renderMixin(Vue) {
    Vue.prototype._c = function () {
      // createElement
      return createElement.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    };

    Vue.prototype._v = function (text) {
      // createTextElement
      return createTextElement(this, text);
    };

    Vue.prototype._s = function (val) {
      if (_typeof(val) == "object") return JSON.stringify(val);
      return val;
    };

    Vue.prototype._render = function () {
      var vm = this;
      var render = vm.$options.render;
      var vnode = render.call(vm);
      return vnode;
    };
  } //  render.js 创建虚拟DOM

  function Vue(options) {
    this._init(options); // options vue实例的配置项{ el data methods等}

  }

  initMixin(Vue); // 此函数将_init方法添加到Vue原型上

  renderMixin(Vue); // _render

  lifecycleMixin(Vue); // _update

  stateMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
