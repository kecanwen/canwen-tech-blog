---
title: "怎么实现跨端组件库"
slug: cross-platform-component-library
description: "React Native、Taro 和 H5 共用一套原子组件：基座按端导出，业务只写一份。"
tags:
  - Frontend
  - Cross-platform
  - Monorepo
rank: 23
featured: false
date: "2023-03-22"
---

# 怎么实现跨端组件库

配送员端是 React Native（纯 App），用户端是 Taro 小程序，商家端是 Vite H5，这可是**三套完全不同的渲染底座**。

在做这套组件库之前，我们经历过一次非常痛苦的“品牌升级”需求：视觉要求把所有主按钮的圆角和渐变色微调，并且加入卡片悬浮投影。就这么一个简单的改动，因为当时三端样式各自为战（RN 用的是 `StyleSheet`，Taro 用的是 `SCSS`，H5 用的是传统的全局 CSS 配合 Tailwind），结果三个前端开发整整对齐、修 Bug 搞了三天，最后测出来 iOS、Android、小程序和 H5 上的视觉还是有偏差。

这时候我就跟团队说，不能再这么干了，我们必须把 UI 层像拼乐高一样给统一起来。于是，我们基于 **Tailwind CSS + NativeWind** 在 Monorepo 里整了一套跨端原子化组件库 `@delivery/ui`。

---

### 一、 我们是怎么打通三端渲染的？（原子化基座设计）

要让同一套 Tailwind 语义在三端跑通，最大的难点在于：**Web 上的 HTML 标签（`div`, `span`, `button`）在 React Native 里根本不认，而 Taro 又有自己的一套 `<View>`, `<Text>` 标签。**

我们的核心解决方案是**“抽象原子基座（Primitives）”**加**“多端条件导出”**。

我们在组件库里不直接用底层的标签，而是封装了一套跟平台无关的原子组件，比如 `Box`（对应容器）、`Txt`（对应文本）、`Clickable`（对应可点击区域）。

在 Monorepo 的组件库包里，我们利用 Vite / Metro / Taro 的打包机制，做到了**按平台动态加载对应的文件**：

1. **Web端 (Vite H5)**:
   `Box.tsx` 最终渲染的是普通的 `div`。
2. **React Native 移动端**:
   `Box.native.tsx` 最终渲染的是 React Native 的 `View`，并且通过 NativeWind（当时我们升到了 v4）的 `css` 编译器，把类名在编译期直接打碎并转成 RN 的 `StyleSheet` 对象。
3. **Taro 小程序端**:
   `Box.taro.tsx` 最终渲染的是 Taro 提供的 `<View>` 标签，样式走标准的 Web Tailwind PostCSS 编译管道。

这样一来，我们在写具体业务组件（比如一个订单卡片 `OrderCard`）时，代码就变得极其丝滑：

```tsx
// 无论在哪个端，开发人员写出来的代码都是这一套
import { Box, Txt } from '@delivery/ui/primitives';

export const OrderCard = ({ title, status }) => {
  return (
    <Box className="flex-row items-center justify-between p-4 bg-white rounded-lg shadow-sm">
      <Txt className="text-base font-bold text-slate-800">{title}</Txt>
      <Box className="px-2 py-1 bg-orange-100 rounded">
        <Txt className="text-xs text-orange-600">{status}</Txt>
      </Box>
    </Box>
  );
};
```

---

### 二、 统一三端的具体痛点与解决方案

在实际落地过程中，绝对不是配置一下 NativeWind 就万事大吉了，我们踩了无数个关于平台差异的雷。这里有三个最典型的适配痛点，都是我们团队一个一个抠出来的解决方案：

#### 1. 软键盘弹出，布局塌陷问题（Web / H5 端的痛）
在商家端 H5 页面（比如商家修改商品价格或者回复配送延迟原因），一旦点击输入框，手机软键盘弹起，Web 端的 `100vh` 容器高度就会被键盘硬生生挤扁。这会导致底部的绝对定位按钮直接飞到屏幕中间，甚至把输入框给遮挡住。

*   **解决方案**：
    我们封装了一个名为 `<PageContainer>` 的全局页面包裹组件。
    *   在 **H5 端**，我们弃用了 `100vh` 这种粗暴的写法，改用浏览器原生的 `visualViewport` API。当键盘弹起触发 `resize` 事件时，动态计算 `visualViewport.height`，并将这个实际高度写到 CSS 变量 `--vh` 中，容器高度设为 `calc(var(--vh, 1vh) * 100)` [6.6]。
    *   在 **RN 端**，我们则直接使用原生的 `KeyboardAvoidingView`（结合 `behavior="padding"`）来自动撑起页面。
    
    有了这个组件，开发写页面时直接套一层 `<PageContainer>`，三端就再也没出现过键盘遮挡或底部按钮飞起的问题。

#### 2. 1px 物理像素边框对齐
在视网膜（Retina）屏幕上，如果你直接写 `border-b-[1px]`，在一些高清屏的手机 H5 上看，这个边框会显得像 2px 甚至 3px 一样粗，视觉上非常笨重。

*   **解决方案**：
    *   在 **React Native** 里，我们非常轻松，可以直接使用 `StyleSheet.hairlineWidth`，它能保证在任何设备上都只渲染一个物理像素的线。
    *   为了在 **H5 和小程序端**也达到同样纤细的效果，我们在 Tailwind 配置文件中自定义了一个扩展类 `border-hairline`：
        *   在 Web/Taro 侧，这个类会通过 PostCSS 编译生成一个利用伪元素（`::after`）绝对定位、高宽设为 200%，再通过 `transform: scale(0.5)` 缩放回去的样式。
        *   在 Native 侧，我们通过 NativeWind 的 `theme` 映射，把 `border-hairline` 映射为 `borderWidth: StyleSheet.hairlineWidth`。
    
    这套方案一上，三端的边框粗细在视觉上达到了极其精致的统一。

#### 3. iOS 橡皮筋回弹干扰滚动容器
在 iOS 设备的 H5/小程序上，当用户拉到列表底部继续拉时，整个网页会跟着一起往下拉，露出白底（俗称“橡皮筋效果”）。这在列表滑动的体验中非常不爽，尤其是和一些自定义的手势操作（比如左滑删除订单）冲突时。

*   **解决方案**：
    *   在 **H5 / 小程序**上，我们在组件的根容器上使用了 `overscroll-behavior-y: contain`，阻止滚动链传递到最外层 window。
    *   在 **React Native** 端，对于不需要回弹的页面，我们直接把内置 `ScrollView` 的 `bounces` 属性设为 `false`，彻底卡死回弹行为。

---

### 三、 避坑指南：这些硬伤你必须知道

如果你们团队也准备这么搞，有几个硬伤一定要提前预防：

1.  **Flex 布局的默认方向差异**：
    这是最容易让 Web 程序员崩溃的地方。Web 端 `display: flex` 默认是 `row`（横向排列）；而 React Native 默认是 `column`（纵向排列）。
    *   **避坑策略**：我们在团队开发规范里定了一条死命令：**只要用了 `flex` 类，必须显式声明方向（如 `flex-row` 或 `flex-col`）**，绝对不能偷懒使用默认值。我们在 CI 流程里写了个简单的 AST 扫描脚本，不写方向直接不给编译通过。
2.  **NativeWind 无法支持的 CSS 特性**：
    React Native 的渲染引擎（Yoga）是不支持类似 CSS 网格布局（`grid`）、复杂的伪类（如 `:nth-child`）或者复杂的 CSS 渐变的。
    *   **避坑策略**：我们组件库里严格限制了这些属性的使用。如果确实遇到需要格栅布局的场景，一律使用 `flex-wrap` 配合 `w-1/2`、`w-1/3` 等百分比宽度进行模拟。

### 四、 收益数字

这套基于 NativeWind 的多端 UI 体系落地后，效果是非常可观的：
*   **设计到研发的对接耗时大幅缩短**。以前新页面出来，开发有 35% 甚至 40% 的时间在调各种平台的 CSS 兼容性。现在由于基座组件把坑都踩平了，新页面开发中 **UI 适配的耗时占比直接降到了 8% 左右**。
*   **测试返工率暴跌**。以前每次发版，QA 测出来的 UI 缺陷单一大堆（比如“Android 端某某按钮文案折行了”、“H5 键盘弹起把提交按钮顶没了”）。统一组件库后，这类**跨端 UI 适配缺陷的返工率下降了将近 60%**。

当时这个架构落地后，我们前端组在公司内部的技术分享会上拿了优秀项目奖，这也是后来我们能支撑日均 24 万单高频业务、快速迭代各种新活动页面的大底座。
