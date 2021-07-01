---
title: babelrc项目配置实践
collapsable: true
---

## 前言
我觉得前端开发者的愿望就是用户永远用最新的设备，用最新标准的浏览器，这样前端项目会少很多的疑难杂症，我也是遇到一次`bug`后对这个想法愈发强烈。这个`bug`是一个测试用一台安卓4.x的手机打不开我们的H5页面了，后来通过看监控上报的数据是他的手机不支持一个`ES6`的数组方法，我想了半天也没想明白为啥，后来上谷歌一查，可能是没有引入`polyfill`垫片，导致有些低版本的浏览器不能解析一些`ES6`方法。挺突然的，居然是因为一个`bug`我才认识`babel`这么一个好东西。

## 抛出问题
`Babel`是干什么的么？和我前言说的`polyfill`又有什么关系呢？在项目里面又该怎么配置呢？接下来一步一步来分析。

## 初识Babel
简单来说，`Babel`就是一个编译器，主要用于将采用 `ECMAScript 2015+` 语法编写的代码转换为向后兼容的 `JavaScript` 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。

我们到babel的官网去写一个例子，这是一个ES2020的新特性（与链判断运算符），右边是经过babel编译处理后的代码。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/638dff761a9141978db530a39d72b3fe~tplv-k3u1fbpfcp-watermark.image)
我们可以看到左边有一系列的配置参数，那我们的项目中又该怎么配置呢？

## 配置Babel
首先我们看到上图中，最上面有个presets可进行勾选，他们对应着以下4个包，那预设包里面包含了什么呢？
- @babel/preset-env
- @babel/preset-flow
- @babel/preset-react
- @babel/preset-typescript

这边我们简单聊聊@babel/preset-env。

### @babel/preset-env
```js
import('./a').then(() => {
  console.log(123)
})
```
如果我们希望上面这个代码块能够成功编译，肯定需要一个插件将import()的语法转换一下，而且后面的箭头函数也可能存在低版本浏览器不兼容的情况，也需要一个插件转换，为此你可能需要分别安装`@babel/plugin-syntax-dynamic-import`和`@babel/plugin-transform-arrow-functions`，并且在`babelrc`中配置。

```js
{
    "plugins": ["@babel/plugin-syntax-dynamic-import", "@babel/plugin-transform-arrow-functions"]
}
```
如果我们项目中还有其他的ES6+语法的代码，也就意味着我们的插件不断的增多。还好babel考虑到了这个问题，出了一个预设包`@babel/preset-env`。

`@babel/preset-env`主要作用是对我们所使用的并且目标浏览器中缺失的功能进行代码转换和加载 polyfill，在不进行任何配置的情况下，`@babel/preset-env` 所包含的插件将支持所有最新的JS特性(`ES6+，不包含 stage 阶段`)，将其转换成ES5代码。

在babel官网里，建议我们的`@babel/preset-env`和`browserslist`一起使用，`browserslist`表示我们项目需要兼容的浏览器情况，如果我们项目不需要兼容所有的浏览器版本，最好是指明所要兼容的最低版本是多少，这样能保证我们代码编译的尽可能小。

[browserslist配置](https://github.com/browserslist/browserslist)

### 项目配置
那babel和babel-polyfill又有什么关系呢？通常来说babel是解决语法层面问题，把ES6+语法转换为ES5语法，而babel-polyfill就是负责API层面转译，比如数组的include,map方法。

**babel-polyfill**

`babel-polyfill`这个包的话是包括了(`core-js和regenerator-runtime/runtime`)的一个库，使用方式很简单，安装之后可直接引入在我们项目的入口文件，当然这样的话打包整个的`babel-polyfill`，也就出现那种我可能只需要一个方法，但是却打包了所有的文件的情况。

**编译前：**
```js
import 'babel-polyfill';

new Promise((resolve)=> {
  console.log(123123)
  resolve()
})
```

**编译后：**

```js
"use strict";

require("babel-polyfill");

new Promise(function (resolve) {
  console.log(123123);
  resolve();
});
```

那么能实现方法的按需加载吗？

由于现在babel的版本已经是v7了，所以我们在项目中仅可能使用官网推荐的core-js@3，而放弃core-js@2(此版本不再更新)，并且core-js@3。为此我们安装以下依赖：

```js
npm i @babel/cli @babel/core @babel/preset-env -D
```

```js
npm install core-js@3 -S
```

**.babelrc配置：**

```js
{
  "presets": [
    [
      "@babel/preset-env",
      {   
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ]
}
```
`useBuiltIns`设为`usage`表示babel会根据浏览器环境所缺失的功能来引入所需要polyfill。

**修改配置后的编译结果：**
```js
"use strict";

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/es.promise.js");

// import 'babel-polyfill';

new Promise(function (resolve) {
  console.log(123123);
  resolve();
});
```

我们现在解决了按需加载的问题。

但是实际上`babel-polyfill`还有一个问题，会污染全局变量，给很多类的原型链上都作了修改，平常开发业务影响也许不大，但是如果我们开发的也是一个类库供其他开发者使用时，可能情况会变的不可控。

除了`babel-polyfill`,另一个`babel`的`plugins`插件`@babel/plugin-transform-runtime`也可以帮我们完成api层的工作。

### @babel/plugin-transform-runtime
插件`@babel/plugin-transform-runtime`实际上是依赖于`babel-runtime`的，那么`babel-runtime`包含什么呢：
- 当我们使用ES6+的内置类`(Promise,Symbols)`或者静态方法时，自动引入`babel-runtime/core-js`。
- 当我们使用`async/await`时，可以引入`babel-runtime/regenerator`。
- 在代码中有内置的 `helpers` 使用时，移除定义，并插入引用。

而我们的插件`@babel/plugin-transform-runtime`可以自动帮我们引入babel-runtime的polyfill。

**.babelrc配置**

```js
{
  "presets": [
    [
      "@babel/env"
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime", {
        "corejs": 3
      }
    ]
  ]
}
```
**编译前：**

```js
async function a() {
  await console.log(123123)
}
```
**编译后：**

```js
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

function a() {
  return _a.apply(this, arguments);
} 

function _a() {
  _a = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return console.log(123123);

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _a.apply(this, arguments);
}
```
其实编译后的代码我们可以看到`_asyncToGenerator2`方法实际上是对`asyncToGenerator`的一个引用，而在之前我们都是直接引入一个相关的包，如果当文件很多的时候，这样的引入增多后会直接导致我们的代码编译后过大，而`@babel/plugin-transform-runtime`通过这种引用的方式，意味着其他的文件也可以使用引用的方式来编译，而不是重复声明。

`@babel/plugin-transform-runtime`相比于`babel-polyfill`的优势：
- 可结合配置`core-js3`实现按需加载，减少打包的大小
- 不会污染全局变量
- 对辅助函数的复用，解决转译语法层时出现的代码冗余


## 参考链接
[一口(很长的)气了解 babel](https://juejin.cn/post/6844903743121522701#heading-0)
[用了babel还需要polyfill吗？？？](https://juejin.cn/post/6845166891015602190#heading-0)
[babel polyfill 到底怎么用？](https://juejin.cn/post/6844904063402770439)

