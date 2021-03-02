// 类组件必须继承自 Component 或者 PureComponent
function Component(props) {
  // 需要绑定一下this
  this.props = props;
}

// 做了一个 类组件的标记
Component.prototype.isReactComponent = {};

export default Component;
