import { generate } from "./generate";
import { parserHTML } from "./parser";
export function compileToFunction(template) {
  let root = parserHTML(template);
  // html===>ast（只能描述语法，语法不存在的无法描述）====>render函数======> 虚拟DOM=======>生成真实DOM
  let code = generate(root);

  //    render函数: new Function +with
  let render = new Function(`with(this){return ${code}}`);
  return render;
}
