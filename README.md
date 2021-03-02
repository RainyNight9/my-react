# React17核心原理

掘金地址：https://juejin.cn/post/6933096899037790215，https://juejin.cn/post/6933505441636810760

# 1、React 工作原理

## 1.1、虚拟DOM

### 常见问题：react virtual dom是什么？说一下diff算法？

拿到一个问题，一般回答都是是什么？为什么？怎么办？那就按照这个思路来吧！

#### what

>用 JavaScript 对象表示 DOM 信息和结构，当状态变更的时候，重新渲染这个 JavaScript 的对象结构。这个 JavaScript 对象称为virtual dom；

#### why

>DOM操作很慢，轻微的操作都可能导致页面重新排版，非常耗性能。相对于DOM对象，js对象处理起来更快，而且更简单。通过diff算法对比新旧vdom之间的差异，可以批量的、最小化的执行dom操作，从而提高性能。

#### where

>React中用JSX语法描述视图，通过babel-loader转译后它们变为React.createElement(...)形式，该函数将生成vdom来描述真实dom。将来如果状态变化，vdom将作出相应变化，再通过diff算法对比新老vdom区别从而做出最终dom操作。

这里说到了JSX，那就顺带大致说一下：

#### 什么是JSX

    语法糖， React 使用 JSX 来替代常规的 JavaScript。
    
    JSX 是一个看起来很像 XML 的 JavaScript 语法扩展。
    
#### 为什么需要JSX

    开发效率：使用 JSX 编写模板简单快速。
    
    执行效率：JSX编译为 JavaScript 代码后进行了优化，执行更快。
    
    类型安全：在编译过程中就能发现错误。
    
#### React 16原理

    babel-loader会预编译JSX为React.createElement(...)
    
#### React 17原理

    React 17中的 JSX 转换不会将 JSX 转换为 React.createElement，而是自动从 React 的 package 中引入新的入口函数并调用。另外此次升级不会改变 JSX 语法，旧的 JSX 转换也将继续工作。
    
#### 与vue的异同

   react中虚拟dom+jsx的设计一开始就有，vue则是演进过程中才出现的，2.0版本后出现。
   
   jsx本来就是js扩展，转义过程简单直接的多；vue把template编译为render函数的过程需要复杂的编译器转换字符串-ast-js函数字符串

## 1.2、render、Component基础核心api

### render

```
ReactDOM.render(element, container[, callback]);
```

当首次调用的时候，容器节点里的所有DOM 元素都会被替换，后续的调用则会使用React的DOM的差分算法（DOM diffing algorithm）进行高效的更新。

如果提供了可选的回调函数，该回调将在组件被渲染或更新之后被执行。

### 节点类型

    1、文本节点
    2、html 标签节点
    3、函数组件
    4、类组件
    ...
    
#### 函数组件

```
// 大些字母开头
function Welcome(props) {
    return <h1>Hello, {props.name}</h1>
}
```

#### 类组件

React 的组件可以定义为class 或函数的形式，如需定义class 组件，需要继承React.Component 或 React.PureComponent:

```
class Welcome extends React.Component {
    render() {
        return <h1>Hello, {this.props.name}</h1>
    }
}
```
    

## 1.3、手写简版myreact

实现原生标签节点、文本节点、函数组件和类组件的初次渲染

先用 Create React App 创建一个 React 项目，安装依赖并运行；

接着在 src/index.js 里边加上 这段代码查看一下版本号，保证自己的是17版本

```
console.log("version", React.version);
```

正是因为 React17 中，React会自动替换JSX为js对象，所以我们主要需要注释掉 src/index.js 中：

```
// import React from "react";
// import ReactDOM from "react-dom";
```

接着在src 下创建一个myreact文件夹，在里边创建一个 react-dome.js

```
// vnode 虚拟dom对象
// node 真实dom节点

// ! 初次渲染
function render(vnode, container) {
  // react17 可以自动转虚拟dom
  console.log("vnode", vnode);
  // vnode->node
  const node = createNode(vnode);

  // node->container
  container.appendChild(node);
}

// 创建节点
function createNode(vnode) {
  let node;
  const {type} = vnode;

  // todo 根据组件类型的不同创建不同的node节点

  if (typeof type === "string") { // 原生标签节点
    node = updateHostComponent(vnode);
  } else if (typeof type == "function") { // 函数组件 再次区分一下类组件和函数组件
    node = type.prototype.isReactComponent  
      ? updateClassComponent(vnode)
      : updateFunctionComponent(vnode);
  } else { // 文本节点
    node = updateTextComponent(vnode);
  }

  return node;
}

// 原生标签节点
function updateHostComponent(vnode) {
  const {type, props} = vnode;
  const node = document.createElement(type);

  console.log('document.createElement', node)

  // 更新节点部分
  updateNode(node, props); // 属性

  reconcileChildren(node, props.children); // 遍历children

  return node;
}

// 更新属性
function updateNode(node, nextVal) {
  Object.keys(nextVal)
    .filter((k) => k !== "children") // 过滤一下 children
    .forEach((k) => (node[k] = nextVal[k])); // 生成属性
}

// 文本节点
function updateTextComponent(vnode) {
  const node = document.createTextNode(vnode);
  return node;
}

// 函数组件
function updateFunctionComponent(vnode) {
  const {type, props} = vnode;
  // type 是一个 function
  const vvnode = type(props);
  // vvnode->node
  const node = createNode(vvnode);

  return node;
}

// 类组件
function updateClassComponent(vnode) {
  const {type, props} = vnode;
  // 类组件需要 new 
  const instance = new type(props);

  console.log('instance', instance);

  const vvnode = instance.render();

  console.log('vvnode', vvnode);
  // vvnode->node
  const node = createNode(vvnode);
  return node;
}

// 遍历children
function reconcileChildren(parentNode, children) {
  // 和源码一点写法区别，但是也是为了判断是否是数组
  const newChildren = Array.isArray(children) ? children : [children];

  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i];
    // vnode
    // vnode->node, node插入到parentNode
    render(child, parentNode);
  }
}

export default { render };

```

接着，还要在创建一个 src/myreact/Component.js 文件：

```
// 类组件必须继承自 Component 或者 PureComponent
function Component(props) {
  // 需要绑定一下this
  this.props = props;
}

// 做了一个 类组件的标记
Component.prototype.isReactComponent = {};

export default Component;

```

奥，不能忘了还要改动一下 src/index.js 文件内容：

```
// import React from 'react';
// import ReactDOM from 'react-dom';
import ReactDOM from './myreact/react-dom';
import Component from "./myreact/Component";
import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';

class ClassComponent extends Component {
  render() {
    return (
      <div>
        <p>类组件-{this.props.name}</p>
      </div>
    );
  }
}

export default ClassComponent;

function FunctionComponent(props) {
  return (
    <div>
      <p>函数组件-{props.name}</p>
    </div>
  );
}

const jsx = (
  <div className="myjsx">
    <h1>111111</h1>
    <h2>222222</h2>
    <h3>111111</h3>
    <a href="https://www.baidu.com/">百度</a>
    <FunctionComponent name="我是函数组件" />
    <ClassComponent name="我是类组件" />
  </div>
)

// 原生标签
// 文本节点
// 函数组件
// 类组件

ReactDOM.render(
  jsx,
  document.getElementById('root')
);

// console.log("version", React.version); // version 17.0.1

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

整体代码就是这样，具体过程就不在这里细致说明了，大家好好品一下代码，有疑问的可以联系我。


## 小结

    1、React17 中，React会自动替换JSX为js对象。
    
    2、js对象即vdom，它能够完整描述dom结构。
    
    3、ReactDOM.render(vdom, container)可以将vdom转换为dom并追加到container中。
    
    4、实际上，转换过程需要经过一个diff过程。
    
    
    
    
----------------------


# 2、应该知道的 fiber

## 2.1、react diff

### reconciliation协调

#### 设计动机

在某一时间节点调用 React 的 render() 方法，会创建一棵由 React 元素组成的树。在下一次 state 或 props 更新时，相同的 render() 方法会返回一棵不同的树。React 需要基于这两棵树之间的差别来判断如何高效的更新 UI，以保证当前 UI 与最新的树保持同步。

此算法有一些通用的解决方案，即生成将一棵树转换成另一棵树的最小操作次数。然而，即使使用最优的算法，该算法的复杂程度仍为 O(n 3 )，其中 n 是树中元素的数量。

如果在 React 中使用该算法，那么展示 1000 个元素则需要 10 亿次的比较。这个开销实在是太过高昂。于是 React 在以下两个假设的基础之上提出了一套 O(n) 的启发式算法：

    1、两个不同类型的元素会产生出不同的树；

    2、开发者可以通过设置 key 属性，来告知渲染哪些子元素在不同的渲染下可以保存不变；
    
在实践中，我们发现以上假设在几乎所有实用的场景下都成立。

#### Diffing 算法

算法复杂度O(n)

#### diff 策略

    1、同级比较，web UI 中 的 DOM 节点跨层级的移动操作特别少，可以忽略不计。
    
    2、拥有不同类型的两个组件将会生成不同的树形结构。
    
    3、开发者可以通过 key prop 来暗示哪些子元素在不同的渲染下能保持稳定。
    
#### diff 过程

对比 两个虚拟 DOM 时 会有三种操作：删除，替换，更新。

vnode 是现在的虚拟DOM，newVnode 是新的虚拟DOM。

    * 删除：newVnode 不存在时
    
    * 替换：vnode 和 newVnode 类型不同或key不同时
    
    * 更新：有相同类型和key，但vnode和newVnode不同时
    
在实践中也证明这三个前提策略是合理且准确的，它保证了整体界面构建的性能。

## 2.2、fiber 源码

依然遵循 是什么？ 为什么？ 怎么办？ 答题三步骤：

### what

字面意思就是纤维，也是语义话的一种叫法，你品，你细品。

。。。

算了，不给你绕了。。。

Fiber在英文中的意思为“纤维化”，即细化，将任务进行细化。我们可以把一个耗时长的任务分成很多小片，每一个小片的运行时间很短，虽然总时间依然很长，但是在每个小片执行完之后，都给其他任务一个执行的机会，这样唯一的线程就不会被独占，其他任务依然有运行的机会。

官方的一句话解释是“React Fiber是对核心算法的一次重新实现”。

### why

对于大型项目，组件树会很大，这个时候递归的成本就会很高，会造成主线程被持续占用，结果就是主线程上的布局、动画等周期性任务就无法立即等到处理，造成视觉上的卡顿，影响用户体验。

### where

    1、任务分解
    
    2、增量渲染，把渲染任务拆分成块，匀到多帧。
    
    3、更新时能够暂停，终止，复用渲染任务。
    
    4、给不同的类型的更新赋予优先级，谁的优先级高，先执行谁。
    
    5、并发方面新的基础能力。
    
    6、更加流畅

来一起看看源码中的fiber, 以下是fiber 的数据类型：

```
// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {|
  // Tag identifying the type of fiber.
  tag: WorkTag,

  // Unique identifier of this child.
  key: null | string,

  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  elementType: any,

  // The resolved function/class/ associated with this fiber.
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null,

  // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref:
    | null
    | (((handle: mixed) => void) & {_stringRef: ?string, ...})
    | RefObject,

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: mixed,

  // The state used to create the output
  memoizedState: any,

  // Dependencies (contexts, events) for this fiber, if it has any
  dependencies: Dependencies | null,

  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the mode of its
  // parent. Additional flags can be set at creation time, but after that the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  mode: TypeOfMode,

  // Effect
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null,

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null,

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,

  lanes: Lanes,
  childLanes: Lanes,

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null,

  // Time spent rendering this Fiber and its descendants for the current update.
  // This tells us how well the tree makes use of sCU for memoization.
  // It is reset to 0 each time we render and only updated when we don't bailout.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualDuration?: number,

  // If the Fiber is currently active in the "render" phase,
  // This marks the time at which the work began.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualStartTime?: number,

  // Duration of the most recent render time for this Fiber.
  // This value is not updated when we bailout for memoization purposes.
  // This field is only set when the enableProfilerTimer flag is enabled.
  selfBaseDuration?: number,

  // Sum of base times for all descendants of this Fiber.
  // This value bubbles up during the "complete" phase.
  // This field is only set when the enableProfilerTimer flag is enabled.
  treeBaseDuration?: number,

  // Conceptual aliases
  // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // to be the same as work in progress.
  // __DEV__ only
  _debugID?: number,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
  _debugNeedsRemount?: boolean,

  // Used to verify that the order of hooks does not change between renders.
  _debugHookTypes?: Array<HookType> | null,
|};
```

fiber 源代码在 packages/react-reconciler 目录下，此处不方便粘贴，可自行下载源码去看一下。

### 实现fiber

MDN 如下介绍：

```
window.requestIdleCallback(callback[, options])
```

window.requestIdleCallback()方法将在浏览器的空闲时段内调用的函数排队。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应。函数一般会按先进先调用的顺序执行，然而，如果回调函数指定了执行超时时间timeout，则有可能为了在超时前执行函数而打乱执行顺序。

你可以在空闲回调函数中调用requestIdleCallback()，以便在下一次通过事件循环之前调度另一个回调。

callback 

一个在事件循环空闲时即将被调用的函数的引用。函数会接收到一个名为 IdleDeadline 的参数，这个参数可以获取当前空闲时间以及回调是否在超时时间前已经执行的状态。

options 可选

包括可选的配置参数。具有如下属性：
    
    timeout：如果指定了timeout并具有一个正值，并且尚未通过超时毫秒数调用回调，那么回调会在下一次空闲时期被强制执行，尽管这样很可能会对性能造成负面影响。
    


## 2.3、实现 fiber架构的 myreact

不废话，直接上代码，但是代码需要一步步好好看看，品一品。

把上期myreact项目代码 copy 一份，做出一些修改。

仅修改 src/myreact2/react-dom.js，完了看效果，细品代码！

```
// vnode 虚拟dom对象
// node 真实dom节点

// ! 初次渲染

// work in progress 进行当中的 fiber
// 定义一个跟节点
let wipRoot = null;
function render(vnode, container) {
  // // react17 可以自动转虚拟dom
  // console.log("vnode", vnode);
  // // vnode->node
  // const node = createNode(vnode);

  // // node->container
  // container.appendChild(node);

  wipRoot = {
    type: 'div',
    props: {
      children: {...vnode},
    },
    stateNode: container,
  };

  nextUnitOfWOrk = wipRoot;
}

// 创建节点 2---变更参数
// 函数组件 和 类组件 是没有 直接指向dom 节点的
function createNode(workInProgress) {
  const {type} = workInProgress;

  const node = document.createElement(type)

  updateNode(node, workInProgress.props)

  return node;
}

// 原生标签节点  2---修改了参数 fiber 节点
function updateHostComponent(workInProgress) {
  const {type, props} = workInProgress;

  if(!workInProgress.stateNode) {
    workInProgress.stateNode = createNode(workInProgress)
  }

  // 协调
  reconcileChildren(workInProgress, props.children); // 遍历children

  console.log('workInProgress', workInProgress)
}

// 更新属性 2--修改
function updateNode(node, nextVal) {
  Object.keys(nextVal)
    // .filter((k) => k !== "children") // 过滤一下 children
    .forEach((k) => {
      console.log('k', k, nextVal[k], Array.isArray(nextVal[k]))
      if (k === 'children') {
        if (typeof nextVal[k] === "string") {
          node.textContent = nextVal[k];
        } else if (Array.isArray(nextVal[k]) && typeof nextVal[k][0] === "string") {
          console.log('nextVal[k]?.join()', nextVal[k]?.join())
          node.textContent = nextVal[k]?.join('')
        }
      } else {
        node[k] = nextVal[k]
      }
    }); // 生成属性
}

// 文本节点
function updateTextComponent(vnode) {
  const node = document.createTextNode(vnode);
  return node;
}

// 函数组件
function updateFunctionComponent(workInProgress) {
  const {type, props} = workInProgress;
  const child = type(props);
  reconcileChildren(workInProgress, child);
}

// 类组件
function updateClassComponent(workInProgress) {
  const {type, props} = workInProgress;
  // 类组件需要 new 
  const instance = new type(props);

  console.log('instance', instance);

  const child = instance.render();

  reconcileChildren(workInProgress, child);
}

// 遍历children 2--- 修改参数  fiber 节点
// 2--- 协调子节点
function reconcileChildren(workInProgress, children) {
  // 是 文本 或者是一个 数字 就生成 fiber ，当作属性处理
  if (typeof children === "string" || typeof children === "number") {
    return;
  } 

  // 和源码一点写法区别，但是也是为了判断是否是数组
  const newChildren = Array.isArray(children) ? children : [children];

  // 需要记录上一个 fiber
  let previousNewFiber = null;

  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i];
    // 遍历的时候改变成 fiber 结构
    let newFiber = {
      key: child.key,
      type: child.type,
      props: {...child.props},
      stateNode: null,
      child: null,
      sibling: null,
      return: workInProgress,
    }; 

    if (i === 0) {
      // 第一个子fiber
      workInProgress.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    // 记录上一个fiber
    previousNewFiber = newFiber;
  }
}


// 2---下一个单元任务 fiber
let nextUnitOfWOrk = null;

// fiber js 对象
// type 类型
// key
// props 属性
// stateNode
// child 第一个子节点
// sibling 下一个兄弟节点
// return 父节点

// 2---下一个任务
function performUnitOfWork(workInProgress) {
  // step1 执行任务
  // todo
  const {type} = workInProgress;
  if (typeof type === "string") {
    // 原生标签节点
    updateHostComponent(workInProgress);
  } else if (typeof type === "function") {
    type.prototype.isReactComponent
      ? updateClassComponent(workInProgress)
      : updateFunctionComponent(workInProgress);
  }

  // step2 并且返回下一个执行任务
  // 王朝的故事，传皇位，深度优先
  if (workInProgress.child) {
    return workInProgress.child;
  }
  // 没有 孩子 传给 兄弟
  let nextFiber = workInProgress;
  while (nextFiber) {
    if (nextFiber.sibling) { // 有兄弟节点传兄弟节点
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return; // 没有，指向父节点
  }
}

// 2---
function workLoop(IdleDeadline) {
  // 返回一个时间DOMHighResTimeStamp, 并且是浮点类型的数值，它用来表示当前闲置周期的预估剩余毫秒数。
  // 如果idle period已经结束，则它的值是0。
  // 你的回调函数(传给requestIdleCallback的函数)可以重复的访问这个属性用来判断当前线程的闲置时间是否可以在结束前执行更多的任务。
  while (nextUnitOfWOrk && IdleDeadline.timeRemaining() > 1) {
    // 执行任务， 并且返回下一个执行任务
    nextUnitOfWOrk = performUnitOfWork(nextUnitOfWOrk);
  }

  // 提交
  if (!nextUnitOfWOrk && wipRoot) {
    commitRoot();
  }
}

// 方法用法：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback
// 2--- 在浏览器的空闲时段内调用的函数排队
requestIdleCallback(workLoop);

// 2---提交跟节点
function commitRoot() {
  commitWorker(wipRoot.child);
  wipRoot = null;
}

// 2---
function commitWorker(workInProgress) {
  // 提交自己
  if (!workInProgress) {
    return;
  }

  // parentNode dom节点
  // ? 所有fiber节点都有dom节点吗  函数组件 类组件 Provider等
  // 倒叙写，第三步 父节点 fiber
  let parentNodeFiber = workInProgress.return; // fiber
  // 有些节点是没有dom节点的

  while (!parentNodeFiber.stateNode) {
    parentNodeFiber = parentNodeFiber.return;
  }

  // 倒叙写，第二步 父节点 dom 节点
  let parentNode = parentNodeFiber.stateNode;

  // 新增
  if (workInProgress.stateNode) {
    // 倒叙写，第一步
    parentNode.appendChild(workInProgress.stateNode);
  }

  // 提交子节点
  commitWorker(workInProgress.child);

  // 提交兄弟节点
  commitWorker(workInProgress.sibling);
}

export default { render };

```


--------------


# 3、解读Hooks

## 3.1、解读Hooks

### Hook 简介

Hook 是 React 16.8 的新增特性。它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

    1、Hooks 是什么？为了拥抱函数式
    
    2、Hooks 带来的变革，让函数组件有了状态和其他的React 特性，可以替代class
    
```
import React, { useState } from 'react';

function Example() {
  // 声明一个新的叫做 “count” 的 state 变量
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

### 没有破坏性改动

在我们继续之前，请记住 Hook 是：

    * 完全可选的。 你无需重写任何已有代码就可以在一些组件中尝试 Hook。但是如果你不想，你不必现在就去学习或使用 Hook。
    
    * 100% 向后兼容的。 Hook 不包含任何破坏性改动。
    
    * 现在可用。 Hook 已发布于 v16.8.0。

没有计划从 React 中移除 class。

Hook 不会影响你对 React 概念的理解。 恰恰相反，Hook 为已知的 React 概念提供了更直接的 API：props， state，context，refs 以及生命周期。

### Hooks 解决了什么问题？

Hook 解决了我们五年来编写和维护成千上万的组件时遇到的各种各样看起来不相关的问题。无论你正在学习 React，或每天使用，或者更愿尝试另一个和 React 有相似组件模型的框架，你都可能对这些问题似曾相识。

#### 在组件之间复用状态逻辑很难

React 没有提供将可复用性行为“附加”到组件的途径（例如，把组件连接到 store）。如果你使用过 React 一段时间，你也许会熟悉一些解决此类问题的方案，比如 render props 和 高阶组件。但是这类方案需要重新组织你的组件结构，这可能会很麻烦，使你的代码难以理解。如果你在 React DevTools 中观察过 React 应用，你会发现由 providers，consumers，高阶组件，render props 等其他抽象层组成的组件会形成“嵌套地狱”。尽管我们可以在 DevTools 过滤掉它们，但这说明了一个更深层次的问题：React 需要为共享状态逻辑提供更好的原生途径。

你可以使用 Hook 从组件中提取状态逻辑，使得这些逻辑可以单独测试并复用。Hook 使你在无需修改组件结构的情况下复用状态逻辑。 这使得在组件间或社区内共享 Hook 变得更便捷。

#### 复杂组件变得难以理解

我们经常维护一些组件，组件起初很简单，但是逐渐会被状态逻辑和副作用充斥。每个生命周期常常包含一些不相关的逻辑。例如，组件常常在 componentDidMount 和 componentDidUpdate 中获取数据。但是，同一个 componentDidMount 中可能也包含很多其它的逻辑，如设置事件监听，而之后需在 componentWillUnmount 中清除。相互关联且需要对照修改的代码被进行了拆分，而完全不相关的代码却在同一个方法中组合在一起。如此很容易产生 bug，并且导致逻辑不一致。

在多数情况下，不可能将组件拆分为更小的粒度，因为状态逻辑无处不在。这也给测试带来了一定挑战。同时，这也是很多人将 React 与状态管理库结合使用的原因之一。但是，这往往会引入了很多抽象概念，需要你在不同的文件之间来回切换，使得复用变得更加困难。

为了解决这个问题，Hook 将组件中相互关联的部分拆分成更小的函数（比如设置订阅或请求数据），而并非强制按照生命周期划分。你还可以使用 reducer 来管理组件的内部状态，使其更加可预测。

#### 难以理解的 class

除了代码复用和代码管理会遇到困难外，我们还发现 class 是学习 React 的一大屏障。你必须去理解 JavaScript 中 this 的工作方式，这与其他语言存在巨大差异。还不能忘记绑定事件处理器。没有稳定的语法提案，这些代码非常冗余。大家可以很好地理解 props，state 和自顶向下的数据流，但对 class 却一筹莫展。即便在有经验的 React 开发者之间，对于函数组件与 class 组件的差异也存在分歧，甚至还要区分两种组件的使用场景。

另外，React 已经发布五年了，我们希望它能在下一个五年也与时俱进。就像 Svelte，Angular，Glimmer等其它的库展示的那样，组件预编译会带来巨大的潜力。尤其是在它不局限于模板的时候。最近，我们一直在使用 Prepack 来试验 component folding，也取得了初步成效。但是我们发现使用 class 组件会无意中鼓励开发者使用一些让优化措施无效的方案。class 也给目前的工具带来了一些问题。例如，class 不能很好的压缩，并且会使热重载出现不稳定的情况。因此，我们想提供一个使代码更易于优化的 API。

为了解决这些问题，Hook 使你在非 class 的情况下可以使用更多的 React 特性。 从概念上讲，React 组件一直更像是函数。而 Hook 则拥抱了函数，同时也没有牺牲 React 的精神原则。Hook 提供了问题的解决方案，无需学习复杂的函数式或响应式编程技术。

### Hooks 原理

```
function FunctionalComponent () {
    const [state1, setState1] = useState(1)
    const [state2, setState2] = useState(2)
    const [state3, setState3] = useState(3)
}

hook1 => Fiber.memoizedState
state1 === hook1.memoizedState

hook1.next => hook2
state2 === hook2.memoizedState

hook2.next => hook3
state3 === hook3.memoizedState
```

具体的 hooks 源码在 ReactFiberHooks.old.js 文件里，大家有时间都下载一下 react 源码搂一搂！