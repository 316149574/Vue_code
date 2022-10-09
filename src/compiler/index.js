import { generate } from "./generate";
import { parserHTML } from "./parser";
export function compileToFunction(template) {
  let root = parserHTML(template);
  // html===>ast（只能描述语法，语法不存在的无法描述）====>render函数======> 虚拟DOM=======>生成真实DOM
  let code = generate(root);
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