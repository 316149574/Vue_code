### vue架构
分析手动封装vue框架
#### 项目初始化
安装rollup用于将js代码进行打包，rollup适合将js文件进行打包，如果只是打包js文件而不打包其它文件如css 图片等就只需使用rollup而不需要使用webpack，当然我们开发中还会使用到es6，打包时需要将es6转换成es5，所以还需要安装@babel/core  @babel/preset-env  ,  rollup与babel关联需要使用rollup-babel-plugin
```
npm install rollup @babel/core  @babel/preset-env  rollup-plugin-babel -D
```
### 数据data劫持
- 
