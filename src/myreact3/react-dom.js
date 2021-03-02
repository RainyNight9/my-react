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
          // 3---不能重复处理了
          // node.textContent = nextVal[k]?.join('')
        }
      } else {
        node[k] = nextVal[k]
      }
    }); // 生成属性
}

// 文本节点
function updateTextComponent(workInProgress) {
  if(!workInProgress.stateNode) {
    // 真实dom节点
    workInProgress.stateNode = document.createTextNode(workInProgress.props);
  }
}

// 函数组件
function updateFunctionComponent(workInProgress) {
  const {type, props} = workInProgress;
  // 函数的子节点就是 函数执行的结果
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

    // 3-- 文本情况
    if (typeof child === 'string') {
      newFiber.props = child
    }

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
  } else if (typeof type === 'undefined') {
    updateTextComponent(workInProgress)
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
  
  // 循环 父fiber 不一定有dom 节点
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

