
//  匹配属性  a=b  a="b"  a='b' 三种情况      aa  =  “  XXX ” | ‘  XXX  ’  |  XXX
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;

const ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z".concat(unicodeRegExp.source, "]*");  // 标签名 

const qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");

const startTagOpen = new RegExp("^<".concat(qnameCapture));  // 匹配开始标签

const startTagClose = /^\s*(\/?)>/;   //   />  <div/> 

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{  }}

const endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配闭合标签

//  html标签解析成ast树  
export function compileToFunction(template) {
    parserHTML(template);
}
 // htmlparser2 第三方插件与parserHTML一样  把html转化成ast语法树
function parserHTML(html) {
    
}
function start(tagName, attributes) {}
function end(tagName) {}
function chars(text) {}