function genProps(attrs){
   // attrs  [{ name :id , value: app}, { name:XXX,value:XXX}]
   var str="";
   for(var i =0; i<attrs.length; i++){
      let attr = attrs[i];
      if(attr.name == "style"){  // 'width:100px; height:100px;'  ===> { width:"100px", height:"100px"}
         let  styleObj = {};
          attr.value.replace(/([^;:]+):([^;:]+)/g ,function(){
            styleObj[arguments[1]] = arguments[2]
          }) ;
          attr.value = styleObj;
      }
      str+= `${attr.name} : ${JSON.stringify(attr.value)},`        
   }
   return  `{ ${str.slice(0,-1)}}`;  // {id:app, title:'123'}  slice() 把字符串json中最后一个 ,去掉
}
function gen(el){
  if(el.type ==1){
     return  generate(el);
  }else{
    let text = el.text;
    return `_v("${text}")`;
  }
}
function genChildren(el){
  let children = el.children;
  if(children){
     return  children.map(c=>gen(c)).join(',');
  }
  return false;
}



export function generate(el) {
  let children = genChildren(el);
  let code =  `_c(  "${el.tag}", ${el.attrs.length ? genProps(el.attrs) : "undefined"} ${children? `,${children}`:" "}  )`;

  return code;
}
