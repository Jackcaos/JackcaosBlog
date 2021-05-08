---
title: redux的原理解析
collapsable: true
---

# Redux结构

![redux的架构图](https://img-blog.csdnimg.cn/img_convert/f26cfee8d5ec298034b914d2c343e73e.png)有想过自己去实现一个`Redux`吗？其实并不难，`Redux`主要就是由`store`，`reducer`，`action`组成的，接下来我们一步一步来尝试的搭建`Redux`。

# Redux的分步实现

## reducer
根据上面图里面的介绍我们知道`reducer`就是根据传来的`type`，对相关`state`进行处理，之后返回一个新的`state`。由此我们得到以下代码：
```javascript
// reducer.js
const init = {
    num: 0
}

export const reducer = (state = init, action) => {
    switch(action.type) {
        case 'add': 
            return {
                ...state,
                num: state.num + 1
            }
        case 'low':
            return {
                ...state,
                num: state.num - 1
            }
        default:
            return init
    }

}
```

## store
我们实现上面图里的第一步，就是`store.js`文件。我们首先需要明确`store`文件主要有三个重要的函数，分别是`subscribe`,`dispatch`,`getState`。接下来直接贴上代码来分析吧。

```javascript
// store.js
import { reducer } from './reducer.js'

export const createStore = () => {
    let currentState = { }
    let collect = []
    dispatch({})

    function getState() {
        return currentState
    }

    function dispatch(action) {
        currentState =  reducer(currentState, action)
        collect.forEach(tempFunc => tempFunc())
    }

    function subscribe(tempFunc) {
    	if (fn instanceof Function) {
			collect.push(tempFunc)
		}
        return
    }
  
    return { getState, dispatch, subscribe }
}

```
我们可以看到`createStore`函数中除了三个基本函数之外有一行`dispatch({})` 这个其实就是为了初始化`redux`，如果不触发`reducer`里面的初始化的话，如果对相关值进行 **加** 、**减** 操作就会得到一个`NaN`的值。

然后`subscribe`函数主要就是根据观察者模式实现的，当用户在页面订阅`subscribe`函数，接着在进行`dispatch`操作之后就会触发当前页面所有订阅`subscribe`的函数。这么讲很麻烦，上代码吧。

```javascript
// index.js
import React from 'react'
import { createStore } from '../../store/store'
import { reducer } from '../../store/reducer'

const store = createStore(reducer)  
export class Roll extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            num:0
        }
    }

    componentWillMount() {
        store.subscribe(()=>this.setState({
            num: store.getState().num
        }))
    }
    lowNum() {
        store.dispatch({ type: 'low' })
        console.log('store里面的值为' + store.getState().num)
    }
    addNum() {
        store.dispatch({ type: 'add' })
        console.log('store里面的值为' + store.getState().num)
    }
    render() {
        return (
            <div style={{ textAlign:'center', paddingTop:'100px'}}>
                <button onClick={ ()=> this.lowNum() }>low</button>
                <div style={{ display: 'inline', padding:'0 10px'}}>{this.state.num}</div>
                <button onClick={ ()=> this.addNum() }>add</button>
            </div>
        )
    }
}
```
加上了`subscribe`函数的效果图：

![效果](https://img-blog.csdnimg.cn/img_convert/ec916eadcfc55220a13dacf4daef52b0.png)
没加`subscribe`函数的效果图：
![效果](https://img-blog.csdnimg.cn/img_convert/ec916eadcfc55220a13dacf4daef52b0.png)
没加的话实际就是更新了`store`里面的状态，但是`store`的状态未同步到页面来，从而无法触发页面的更新。

# react-redux的实现
我们一般是在react项目里并不会直接去使用redux，而是利用`react-redux`作为沟通两者的桥梁。

## 例子
首先我们看看`react-redux`的简单使用方式。

```javascript
// Provider伪代码
ReactDOM.render(
	<Provider store={store}>
		<ChildComponent />
	</Provider>
)

//connent伪代码
ChildComponent = connect(mapStateToProps, mapDispatchToProps)(ChildComponent)
```

## Provider
`Provider`等同于一个容器组件，容器内部可以嵌套多层组件，实际上`Provider`不会对里面组件做任何处理，只需要让组件正常显示，它接受一个`store`参数，它会把这个外界传来的`store`参数传入到`context`中，然后让这个组件成为组件树的根节点，那么它的子组件都可以获取到 `context` 了。
![provider](https://img-blog.csdnimg.cn/img_convert/20b910c7fe10a1a4c510e145ac2e2d95.png)

```javascript
// provider.js
import React from 'react'
import PropTypes from 'prop-types'

export class Provider extends React.Component {
    // 声明Context对象属性
    static childContextTypes = {
        store: PropTypes.object,
        children: PropTypes.object
    }
    // 返回Context对象中的属性
    getChildContext = () => {
        return {
            store: this.props.store
        }
    }

    render () {
        return (
            <div>{this.props.children}</div>
        )
    }
}
```

## Connect
`connect`函数实际上接收了一个组件作为参数，最后返回一个新的组件，也就是我们常说的`HOC`（高阶组件），它除了接收到一个组件外还接收两个参数，一个是`mapStateToProps`，还有一个是`mapDispatchToProps`，这些是传入该组件的`props`,需要由`connect`这个高阶组件原样传回原组件 。我们大概了解流程了可以简单实现一下：

```javascript
import React from 'react'
import PropTypes from 'prop-types'

export function connect(mapStateToProps, mapDispatchToProps) {
    // 1.传入state和dispatch对象
  return function(WrappedCompment)  {
      // 2.接收传入的组件
    class Connect extends React.Component {
        constructor() {
            super()
            this.state = {
                // 3.将所有的props整合在一个对象上，方便书写
                mapStateAndDispatchProps:{}
            }
        }
        static contextTypes = {
            // 4.获取context里的store
            store: PropTypes.object
        }

        componentDidMount() {
            const { store } = this.context
            // 5.用于更新和合并几个传入对象
            this.mergeAndUpdateProps()
            store.subscribe(()=> {
                this.mergeAndUpdateProps()
            })
        }

        mergeAndUpdateProps() {
            const { store } = this.context
            let tempState = mapStateToProps ? mapStateToProps(store.getState(), this.props) : {}
            let tempDispatch = mapDispatchToProps ? mapDispatchToProps(store.dispatch, this.props) : {}
            this.setState({ 
                mapStateAndDispatchProps : {
                    ...tempState,
                    ...tempDispatch,
                    ...this.props
                }
            })
        }

        render() {
            //将所有传入的props放入之前的组件中
            return <WrappedCompment {...this.state.mapStateAndDispatchProps}/>
        }
    }
    //返回新组件
    return Connect
}
}
```

## 实现效果
**接入到Roll组件测试一下：**
```javascript
// Roll.js
import React from 'react'
import { connect } from '../../store/connect'

const mapStateToProps = state => {  
    return {      
        num: state.num  
    }
}

const mapDispatchToProps = dispatch => {  
    return {      
        addNum: () => {          
            dispatch({type: 'add'})      
        },
        lowNum: () => {
            dispatch({type: 'low'})      
        }  
    }
}
class Roll extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        return (
            <div style={{ textAlign:'center', paddingTop:'100px'}}>
                <button onClick={ ()=> this.props.lowNum() }>low</button>
                <div style={{ display: 'inline', padding:'0 10px'}}>{this.props.num}</div>
                <button onClick={ ()=> this.props.addNum() }>add</button>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Roll)
```
**最终结果：**
![效果](https://img-blog.csdnimg.cn/img_convert/42725993da684e389ce5316904113141.png)
# redux中间件（middleware）
大家可能都用过`redux`的一些中间件，比如`redux-thunk`,`redux-saga`,`redux-logger`等等，但是这些中间件是怎么实现的呢？我们一一道来。

首先为什么需要中间件呢？假设现在有一个场景，我们需要打印我们每次`dispatch`的记录，那很简单能想到就是在执行`dispatch`后打印即可：
```javascript
function dispatchAndPrint(store, dispatch) {
	dispatch({type: 'add'})
	console.log('newState:', store.getState())
}
```
但是现在又来了一个需求需要继续我们捕获dispatch时的错误，那我们需要怎么写呢：

```javascript
function dispatchAndCatch(store, dispatch) {
	try {
		dispatch({type: 'add'})
	} catch(e) {
		console.error('dispatch error: ', err)  
		throw e
	}
}
```
那如果当这些需求越来越多，我们实际上也会写越来越多的dispatch，实际上我们可以把这一步dispatch提取出来：

```javascript
let next = store.dispatch
store.dispatch = function dispatchAndPrint(store) {
	next({type: 'add'})
	console.log('newState:', store.getState())
}

store.dispatch = function dispatchAndCatch(store, dispatch) {
	try {
		next({type: 'add'})
	} catch(e) {
		console.error('dispatch error: ', err)  
		throw e
	}
}
```

## applyMiddleware
我们在`redux`中使用中间件的时候，都会用到`applyMiddleware`，`applyMiddleware`实际上和上面我们写的例子的功能是差不多的，你可以理解成`applyMiddleware`先去获取一个`dispatch`，然后在中间件中修改`dispatch`，具体dispatch会被改造成什么样取决于我们的中间件。对此我们可以实现一个简单版的`applyMiddleware`函数。

```javascript
const applyMiddleware = function(store, middleware){
  let next = store.dispatch;
  store.dispatch = middleware(store)(next);
}
applyMiddleware(dispatchAndPrint)
```

### 多个中间件的链式调用
当时实际上我们使用`applyMiddleware`的时候肯定不是说每次只能使用一个中间件，那假如使用多个中间件该怎么实现呢？

我们可以将前一个中间件返回的`dispatch`，作为下一个中间件的`next函数`传入，对此我们可以将两个函数进行`柯里化`：

```javascript
const dispatchAndPrint = store => next => action => {
	console.log('newState:', store.getState())
	return next(action)
}

const dispatchAndCatch = store => next => action => {
	try {
		next(action)
	} catch(e) {
		console.error('dispatch error: ', err)  
		throw e
	}
}
```
编写applyMiddleware:

```javascript
function applyMiddleware(store, middlewares) {
	// 浅拷贝，防止后面reverse影响到原middleware
	middlewares = middlewares.slice() 
	// 最前面放入的中间件应该在前面执行，此处若不翻转数组，最先放入的函数将会在最里层会导致最后才执行
	middlewares.reverse() 
	
	let dispatch = store.dispatch
	middlewares.map((middleware) => {
		dispatch = middleware(store)(dispatch)
	})
	return { ...store, dispatch }
}
```
这边我们解释一下`applyMiddleware`这个函数，实际上`middlewares`是一个中间件的数组，我们对`middlewares`数组做反转处理是因为每次我们的中间件函数只是返回了一个新的`dispatch`函数给下一个中间件，而我们最终拿到的是最后这个包装`dispatch`的中间件返回的函数，若反转的话则最后这个中间件会先执行然后不断向前推才能执行到第一个中间件。

### 走进applyMiddleware源码
当然我们看`applyMiddleware`的源码的话并不是像我们一样直接反转中间件数组，而是下面这种写法：

```javascript
function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var store = createStore(reducer, preloadedState, enhancer);
    var dispatch = store.dispatch;
    var chain = [];

    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    };
    chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);

    return {...store, dispatch}
  }
}
```
`compose函数`的实现：
```javascript
function compose(...funcs) {
      // 传递的函数集合
    return function (...args) {
       let length = funcs.length;
       if (length == 0) {
         //=>一个函数都不需要执行,直接返回args
         return args;
       }
       if (length == 1) {
         //=>只需要执行一个函数，把函数执行，把其结果返回即可
         return funcs[0](...args)
       }
       // 多个函数执行时，利用reduce去递归处理这些函数
       return funcs.reduce((a,b)=> typeof a === "function" ? a(b(...args)) : b(...args))
     }
   }
```

我们可以看到`applyMiddleware`的源码中实际上通过`compose函数`去实现将上一个中间件的返回值传递下一个中间件作为参数，从而实现中间件串联的效果。

如果中间件顺序是`a,b,c`则`compose函数`组合后结果是`a(b(c(...args)))`。

# 总结
也许后面你看到`redux-thunk`的源码的时候我可能会觉着这个库为什么这么简单就这么几行代码，但是其实没必要惊讶，因为就算是`redux`也不是很复杂，但是背后蕴含的JS编程思想却值得去学习，比如函数的`柯里化`，`函数式编程`，`装饰器`等等知识。

资料：

[8k字 | Redux/react-redux/redux中间件设计实现剖析](https://juejin.cn/post/6844904036013965325#heading-0)

[redux中间件的原理](https://www.cnblogs.com/wshiqtb/p/7909770.html)

[Redux 入门教程（二）：中间件与异步操作](https://www.cnblogs.com/chaoyuehedy/p/9713167.html)

[JavaScript函数柯里化](https://zhuanlan.zhihu.com/p/31271179)

[代码组合（compose）](https://llh911001.gitbooks.io/mostly-adequate-guide-chinese/content/ch5.html)