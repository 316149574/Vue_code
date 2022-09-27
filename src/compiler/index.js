import { generator } from "./generator";
import { parserHTML } from "./parser";
export function compileToFunction(template) {
  let root = parserHTML(template);
  // html===>ast====>render函数
  let code = generator(root);
}
