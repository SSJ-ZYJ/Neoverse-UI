# 终端组合

Status: adopted

[English](../../architecture/terminal-composition.md)

<!-- Source: docs/architecture/terminal-composition.md -->
<!-- Source-SHA256: 18624fa30e3e673ba473f2c7e1d57ea26d8c6ef3e986eceb4d1caa46ed193694 -->

Neoverse-UI 提供的是**终端展示**，不是 Shell 模拟器或命令运行时。提示行是文本行，不是表单字段表面：半透明极光玻璃留在外层 `UiTerminalSurface` 上；编辑器本身没有边框、填充、阴影或圆角盒子。

## Vue 示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  type TerminalPromptSegment,
  UiTerminalEcho,
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
} from '@neoverse-ui/vue';

const command = ref('');
const history = ref<{ text: string; segments: readonly TerminalPromptSegment[] }[]>([]);
const segments = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/workspace', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch' },
] as const;
function submit(event: KeyboardEvent) {
  if (event.isComposing || event.key !== 'Enter' || !command.value.trim()) return;
  event.preventDefault();
  history.value.push({ text: command.value, segments: segments.map(segment => ({ ...segment })) });
  command.value = '';
}
</script>

<template>
  <UiTerminalSurface title="Workspace terminal">
    <template #status>Connected</template>
    <UiTerminalTranscript label="Terminal history">
      <UiTerminalLine text="Welcome to the workspace." />
      <UiTerminalEcho v-for="(line, i) in history" :key="i" :text="line.text" :segments="line.segments" />
    </UiTerminalTranscript>
    <UiTerminalPrompt
      v-model="command"
      label="Terminal command"
      :segments="segments"
      placeholder="type a command…"
      @keydown="submit"
    />
  </UiTerminalSurface>
</template>
```

- `UiTerminalSurface` 把既有极光玻璃表面与无障碍标题和操作插槽组合在一起。
- `UiTerminalLine` 把字符串渲染为文本，保留复制/选择；`preformatted` 单独处理 ASCII 横幅。
- `UiTerminalTranscript` 具有原生滚动区域与嵌套实时日志；仅在位于底部时自动跟随，并复用 `scrollbar-immersive`。
- `UiTerminalPrompt` 拥有一个透明的**原生** `<input>`，外观与行内终端文本难以区分。不要在这里使用 `UiInput`。提示行用 `--neoverse-terminal-cursor` 绘制自己的闪烁光标；选择、IME 组合、密码掩码、`readonly`/`disabled` 与强制颜色模式会把光标交还浏览器。光标横跨已移动的跨度并收缩回竖条，时长随移动距离增长，上限为 glide 变量；在 `prefers-reduced-motion` 下滑动停止，但不透明度闪烁保留。竖条移动时保持实心，落定后重新闪烁。提示行有可组合的 `segments` 数组（host、path、branch、runtime、time）或 `#context` 插槽；`#segment="{ segment }"` 定制每个片段的内容，同时保留共享形状与颜色。text/password/search 类型、禁用、只读、错误与原生属性仍可用。焦点通过 `ref.focus()` 暴露给消费项目。Enter 处理与 IME 组合由消费项目负责。
- `UiTerminalEcho` 把已记录命令渲染为可选择的转义文本，没有输入、标签或 Tab 停靠点。它的 `text`、`segments`、`symbol` 与 `error` 复用实时提示的内部片段渲染器、几何与变量；Vue `#segment` 与 React `renderSegment` 定制同一外观。空 segments 省略上下文行。提交历史时保留 segment 值，而不是把旧条目绑定到当前工作目录。`UiTerminalPrompt readonly` 仍是原生输入，不是 transcript echo。
- 浅色与深色主题都通过 `cssVariables.components.terminal` 暴露所有片段颜色。分层上下文颜色派生自 `--neoverse-color-accent-primary` 与主题的中性/文本角色；两种主题中光标都跟随主题主强调色，而命令标记在深色中保留更亮的次强调色，在浅色中使用既有 `mint-700` 调色板角色，以在浅色画布上保持足够对比。浅色使用浅色不透明上下文填充，深色使用更深的不透明填充，在不重叠半透明颜色的前提下保留齐平圆角过渡。branch、runtime 与 time 前景各有独立语义角色。改变主题颜色不改变几何或排版。不捆绑第三方字体。
- 三条全高阴影带汇入齐平、相互重叠的圆帽。上下文与下一行编辑器共享同一等宽字号；在狭窄屏幕上，最后一个圆帽保持在可横向滚动的上下文内。所有形状使用 CSS 几何，不使用 Nerd Font 私有字形。可省略 host、branch 或 runtime 片段，而不改变接合几何。
- 所有终端基础组件都使用 `--neoverse-font-family-code-maple`，它优先使用已安装的 **Maple Mono NF CN** 处理中文与拉丁文本。常规 Maple Mono 拉丁 webfont 是回退，不是 NF CN 字体的替代。未安装 NF CN 字体的消费项目可为该字体族提供 `@font-face`；否则字体栈显式包含共享中文无衬线字体。终端之外的默认代码字体角色仍可独立配置。
- 既有的 `UiInput appearance="terminal"` 方案已移除。普通表单输入保留常规表单外观。

### 消费项目自有页头

Vue 的 `#header` 插槽与 React 的可选 `header` ReactNode 只替换既有 `UiTerminalSurface` 页头的内容。没有 Vue header 插槽，或 React `header` 为 nullish 时，标题、状态与操作保留既有回退。自定义 header 会替换全部三项：回退标题、状态与操作工具栏不会与它一起渲染。

共享组件仍拥有页头元素、内边距与材质、无障碍表面标签（`ariaLabel`，回退到 `title`）以及不变的正文。即使替换可见渲染，也要继续传 `title`。消费项目负责替换布局、可见标题/状态、操作分组与无障碍操作名称；真实控件使用 `UiButton` / `UiIconButton`。平台检测、窗口外观与平台特定样式留在消费项目，不进入共享终端组件。

```vue
<UiTerminalSurface title="Workspace terminal">
  <template #header>
    <span>Workspace terminal</span>
    <UiButton @click="closeTerminal">Close terminal</UiButton>
  </template>
  <p>Ready</p>
</UiTerminalSurface>
```

等价的 React 组合是
`<UiTerminalSurface title="Workspace terminal" header={<UiButton onClick={closeTerminal}>Close terminal</UiButton>}><p>Ready</p></UiTerminalSurface>`。
两种 API 都不改变终端输出、transcript 或提示行行为。

可选 `suggestion` prop 是完整建议值。共享提示行只显示匹配的后缀，使用弱化斜体文本，不改变输入值。它仅在聚焦于末尾、没有选择或 IME 组合时出现，并在 password、只读与禁用输入中隐藏。覆盖层跟随原生横向滚动，并被排除在无障碍与文本选择之外。候选选择、关闭与接受键由消费项目负责。XCA 使用会话补全/历史与 ArrowRight 接受。

终端文本启用字体的 `liga` 与 `calt` 特性。原生编辑器与 ghost 前缀继承相同设置。当消费项目只提供常规字体面并全局禁用合成时，ghost 后缀允许斜体合成。

## React 示例

```tsx
import { useState } from 'react';
import { UiTerminalSurface, UiTerminalTranscript, UiTerminalLine, UiTerminalEcho, UiTerminalPrompt, type TerminalPromptSegment } from '@neoverse-ui/react';

const segments: readonly TerminalPromptSegment[] = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/workspace', tone: 'path' },
];

export function Terminal() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<{ text: string; segments: readonly TerminalPromptSegment[] }[]>([]);
  return (
    <UiTerminalSurface title="Workspace terminal" status="Connected">
      <UiTerminalTranscript label="Terminal history">
        <UiTerminalLine text="Welcome to the workspace." />
        {history.map((line, index) => <UiTerminalEcho key={index} text={line.text} segments={line.segments} />)}
        <UiTerminalPrompt
          label="Terminal command"
          value={command}
          onValueChange={setCommand}
          suggestion="help --all"
          segments={segments}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.key !== 'Enter' || !command.trim()) return;
            event.preventDefault();
            setHistory(lines => [...lines, { text: command, segments: segments.map(segment => ({ ...segment })) }]);
            setCommand('');
          }}
        />
      </UiTerminalTranscript>
    </UiTerminalSurface>
  );
}
```

把交互式 React 组合放在应用的客户端边界内。`context` 与 `renderSegment(segment)` 对应 Vue 的 context 与 segment 插槽；`status` 与 `actions` 是表面上的 ReactNode 属性。prompt ref 指向其原生输入。新增 React 适配器的验证范围见[框架对应](../../architecture/framework-parity.md)。

## 视觉灵感与许可边界

设计**灵感来自** [Starship Tokyo Night 预设](https://starship.rs/zh-CN/presets/tokyo-night)，尤其是其紧凑的分层 Powerline 式上下文与独立下一行命令标记。

- [Starship](https://github.com/starship/starship) 使用 ISC 许可，版权 © 2019–至今 Starship Contributors。
- Starship 注明为灵感来源的 [Tokyo Night VS Code 主题](https://github.com/tokyo-night/tokyo-night-vscode-theme) 使用 MIT 许可。
- 此 UI 包含独立编写的 CSS 形状、标记与语义颜色映射。没有复制或再分发任何预设 TOML、图片、授权字体文件、Logo、截图或第三方源码。上述名称仅用于署名，**不表示隶属或背书**。
- 如果未来改动引入 Starship 配置、Tokyo Night 主题源码、Nerd Font 或官方资源，必须单独记录其**准确**的上游许可与版权声明。当前实现避免了这一依赖。

## 范围与验证

终端基础组件只处理展示。Shell 解析、认证、命令历史、补全与 XCA Boot → Dock 动画仍留在消费项目。提示行光标是展示覆盖层，不是模拟光标引擎：它只为可编辑提示中的折叠光标渲染，并在选择、IME 组合、密码掩码、`readonly`/`disabled` 与强制颜色模式下让位给原生光标。其节奏来自共享动效变量，呼吸只动画不透明度，因此在 `prefers-reduced-motion` 下与原生光标一样继续运行，并且在访客输入时保持实心。

XCA 通过真实命令输入验证 `UiTerminalPrompt`，包括 ghost 建议、原生选择/IME 与既有 Tab 循环（`tests/e2e/terminal-completion.spec.ts`）。`UiTerminalEcho` 由 Vue 终端与 React 对应浏览器场景，以及 XCA `terminal-shared-ui.spec.ts` / `terminal-visual-acceptance.spec.ts` 消费场景覆盖：已记录 host/path 快照、桌面/窄屏浅色/深色、文本选择、一个原生编辑器、无障碍实时日志与 transcript 跟随。Windows 与 Linux 截图基线同时包含实时与已记录提示。React 有浏览器测试页面证据，不是真实产品消费证据。既有四个终端基础组件保留 Stable 状态；echo 保持 Consumer Validation，不被自动提升。

本地 `CR-20261024-7E4A21C9` 证据：Vue 适配器套件 75 项通过，React 适配器套件 38 项通过，Windows 与原生 Linux 终端/React 浏览器场景各 50 项通过（不更新快照），XCA 共享 UI/视觉/补全场景 17 项通过（不更新快照）。八个包归档通过公开导出/类型验证。XCA 的五份 Windows 基线与 UI 的平台特定基线覆盖 echo 切换。

包版本管理与 npm 发布仍是独立步骤。