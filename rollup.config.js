import babel from 'rollup-plugin-babel'
export default {
    input:"./src/index.js",
    output:{
        format:'umd', // 支持amd commonjs规范   window.vue
        name:'Vue',
        file:'dist/vue.js',
        sourcemap:true // 打包的es5代码与源码映射
    },
    plugins:[
        babel({
            exclude:"node_modules/**"  // 两个** 表示任意目录下的任意文件 glob语法
        })
    ]
}