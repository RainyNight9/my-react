// import React from 'react';
// import ReactDOM from 'react-dom';
import ReactDOM from './myreact3/react-dom';
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


