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

