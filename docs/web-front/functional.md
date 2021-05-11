---
title: 函数柯里化与函数组合
---

## 前言

之前我们组来了一个工作5年的小伙伴来面试，因为组长临时有事情，就由我去负责面试者的笔试，笔试题里有这么一道题:`实现一个add函数，让add(2)(2)(3)返回7`，我看了下这个面试者的答案是这么写的：

```js
function add(a) {
    return function (b) {
      return function (c) {
        return a+b+c
      }
   }
}
add(2)(2)(3) // 7
```
（我只负责打印和收笔试题，不负责改，嘤嘤嘤），首先我们说他的答案，肯定是没错，运行出来结果确实是7，但是总觉得不够优美，有10个参数的话那估计写return都要写疯，如果我更换传参方式我希望你写一个函数`add(2,2)(3)返回7`，是不是又会写成下面这样呢？

```js
function add(a, b) {
    return function (c) {
      return a+b+c
   }
}
```
如果把这题目换了一下传参方式就一定需要写出两个不同的add函数吗？当然如果我是面试官，肯定更希望你可以写出一个更具有通用性的`add函数`，更希望面试者去实现一个`curry函数`,然后封装一下`add函数`。

## 实现curry（柯里化）函数

其实我们看这位面试的同学写的代码其实已经大致给了我们一个写`curry`函数的方向🧭，既然是多个参数，那只要我们的参数数量是否达到我们函数需要的参数数量，若未达到我们就递归取获取后面传进来的参数，直到达到我们所需的参数个数即可。

不卖关子了，那就直接写一个柯里化函数吧。

```js
function curry(func, args) {
  // 表示所需要参数的个数
  let funcLen = func.length;
  let argsTemp = args || [];
 
  return function() {
    // 由于参数是一个类数组不是真正的数组，这里需要转换一下
    let _args = [].slice.call(arguments);
    _args = [...argsTemp, ..._args]

    // 如果参数的数量还不足，则还需要递归收集参数
    if (_args.length < funcLen) {
      return curry.call(this, func, _args);
    }
    // 收集完毕则执行func函数
    return func.apply(this, _args);
  }
}
```
调用`curry`函数：

```js
var add = curry(function(a,b,c){
    return a+b+c
})
add(2)(2)(3) // 7
add(2,2)(3) // 7
```
至此我们就完成了这个具有通用性的`add函数`。

如果上面的题目你实现了一个`curry函数`，我觉得会更让面试官眼前一亮，有时候面试官问的大部分题目大家肯定在各种网站都会有答案，比起把答案背下来，面试官肯定更希望你可以`深挖或者扩展`来谈谈，回答任何题目都是一千个读者一千个哈姆雷特，永远不会有一个唯一的答案。

其实写到这里我自己也灌输了一个错误的定义,下面才是正确的理解:
- `add(2)(2)(3)`才是一个真正意义上的`柯里化`
- `add(2,2)(3)`实际上是一个`部分函数应用（Partial Function Application）`

### 柯里化和部分函数应用的区别
那么两者的区别是什么呢？

`柯里化`是一种将使用多个参数的一个函数转换成一系列使用**一个参数**的函数的技术，简单来说就是传参分成一个一个的参数。

`部分函数应用`是指**固定一个函数的一些参数**，然后产生另一个更小元的函数。

## 柯里化的作用

关于柯里化的作用，我们可以看一个例子：

```js
// 一个进行请求的函数
function ajax(type, url, params){
    ...
}
// 1.方式一
ajax('GET', 'www.a.com', 123)
ajax('GET', 'www.a.com', 789)
ajax('GET', 'www.b.com', 456)

// 2.方式二
var get = ajax('GET')
var getAUrl = get('www.a.com')
var getBUrl = get('www.b.com')
getAUrl(123)
getAUrl(789)
getBUrl(456)
```
1.方式一这样的调用`ajax函数`，利用了ajax函数`通用性`，但是传参还是显得冗余。

2.方式二未利用ajax的函数的通用性，而是拆成一块一块，让参数得以复用，虽降低了通用性但`提高了`函数的`适用性`。

## 函数结合compose

都谈到了柯里化了，那能不谈`函数结合`吗？毕竟`函数结合是函数式编程两员大将中的另一位大将`。

函数组合顾名思义就是把`多个函数组合到一起`，比如

```js
var compose = function(f,g) {
  return function(x) {
    return f(g(x));
  };
};
```
其实这个函数的执行顺序是`g(x)`->`f(x)`，也就是从右向左。

```js
// 满足结合律
compose(f, compose(g, h)) == compose(compose(f, g), h);
```

## 实现一个compose

```js
function compose(...func) {
  return function(...args) {
    return func.reduceRight((acc, cur) => {
      return typeof acc === 'function' ? cur(acc(...args)) : cur(acc)
    })
  }
}

// 用ES6写法
const compose = (...func) => (...args) => func.reduceRight((acc, cur) => { typeof acc === 'function' ? cur(acc(...args)) : cur(acc)})
```
测试：

```js
const x = x => x+1;
const y = x => x*2;
const z = x => x-2;

const c = compose(x, y, z);
c(2) // 1
```
执行顺序为`z->y->x`

## 函数组合的好处
那我们用一个函数组合有什么好处呢？

我们现在要把一个字符串数组进行**逆序处理**，然后全部进行**大写处理**，最终**输出一个字符串**。

常规的命令式的编程的写法：

```js
log(toString(toUpperCase(reverse(arr))))
```
确实满足了我们的要求，但是这种无限嵌套的写法可读性真的不高，而且很不美观。

函数组合的写法：

```js
compose(log, toString, toUpperCase, reverse)
```
我们利用函数组合的写法，我们什么调用顺序一目了然，而且我们能进行各种各样的组合。

只要我们将一些比较复杂的函数抽象成一个一个的`纯函数`，然后在不同场景将他们`任意组合`，就像是俄罗斯方块，虽然只有那么几种形状，但是拼起来可以搭建出各种不一样的形状。

## 结语
我们今天其实就是通过一道笔试题引出了一个函数式编程里面两个重要的理论（函数结合与柯里化），由于函数式编程的理论比较多，我推荐这篇文章（[简明 JavaScript 函数式编程——入门篇](https://juejin.cn/post/6844903936378273799#heading-6)）去理解理解函数式编程的概念。

参考：

[简明 JavaScript 函数式编程——入门篇](https://juejin.cn/post/6844903936378273799#heading-33)
[函数编程指北](https://llh911001.gitbooks.io/mostly-adequate-guide-chinese/content/ch4.html#%E4%B8%8D%E4%BB%85%E4%BB%85%E6%98%AF%E5%8F%8C%E5%85%B3%E8%AF%AD%E5%92%96%E5%96%B1)
[JavaScript专题之函数柯里化](https://github.com/mqyqingfeng/Blog/issues/42)
