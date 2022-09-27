const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名
const qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
// aa:xx 命令空间  用来获取标签名  match后索引为1的为匹配到的标签名   let r =  '<div></div>'.match(qnameCapture);
const startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配开始标签
const startTagClose = /^\s*(\/?)>/; //   />      <div/>
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{  }}
//  匹配属性  a=b  a="b"  a='b' 三种情况      aa  =  “  XXX ” | ‘  XXX  ’  |  XXX
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配闭合标签 </xxxx   >

// htmlparser2 第三方插件与parserHTML一样  把html转化成ast语法树
export function parserHTML(html) {
  //  前进删除以匹配的内容
  function advance(len) {
    html = html.substring(len);
  }
  function paserStartTag() {
    const start = html.match(startTagOpen);
    //console.log(start)==>  ['<div', 'div', index: 0, input: '<div id="app"> {{name}}</div>', groups: undefined]
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
      };
      advance(start[0].length); //  id="app"> {{name}}</div>

      // 匹配属性
      let end;
      let attr;
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        // 没到开始标签闭合 ">" 则说明有n个属性
        // attr ==>  [' id="app"', 'id', '=', 'app', undefined, undefined, index: 0, input: ' id="app" class="div1">{{name}}</div>', groups: undefined]
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5],
        });
        advance(attr[0].length);
      }
      if (end) {
        advance(end[0].length);
      }
      return match;
    }

    return false; // 不是开始标签
  }
  while (html) {
    let textend = html.indexOf("<"); // 当前解析的开头<div id="app">{{name}}</div>
    if (textend == 0) {
      const startTagMatch = paserStartTag();
      // 如果是开始标签
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs);
        continue;
      }
      // 如果是结束标签
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        end(endTagMatch[1]);
        advance(endTagMatch[0].length);
        continue;
      }
    }
    let text;
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

let root = null;
let stack = []; // 用于存放解析标签

function start(tagName, attributes) {
  let parent = stack[stack.length - 1];
  let element = createAstElement(tagName, attributes);
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
    let parent = stack[stack.length - 1];
    parent.children.push({
      type: 3,
      text,
    });
  }
}
function end(tagName) {
  let last = stack.pop();
  if (last.tag != tagName) {
    throw new Error("标签格式有误");
  }
}
// 将解析后的结果 组装成一个树结构 -----栈
function createAstElement(tagName, attrs) {
  return {
    tag: tagName,
    type: 1,
    children: [],
    parent: null,
    attrs,
  };
}
//  html标签解析成DOM树 <div id="app"> {{name}}</div>
