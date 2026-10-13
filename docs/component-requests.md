# 跨项目组件需求登记

## 目标与边界

Neoverse-UI 的组件供 Neoverse、Neoverse-Docs、Neoverse-Slides 等项目消费。需求可能是缺少新的可复用组件、现有组件缺少交互/视觉契约，或者 Vue / React 某一适配层不完整。消费项目应记录**发生位置、用户场景、期望行为、验收条件**，而不是先写一套项目专用组件后忘记回收。

需求登记与现有的 `contracts/component-matrix.json` **职责不同**：

| 数据源 | 用途 |
| --- | --- |
| GitHub Component Request issue | 消费项目的远程提交入口；**尚未审核**的报告 |
| `contracts/component-requests/CR-*.json` | 尚未关闭的结构化需求；Agent 的活动工作队列 |
| `contracts/component-requests/archive/CR-*.json` | 已交付或已拒绝需求的只读历史及验收依据；CLI 仍可查询、校验 |
| `contracts/component-matrix.json` | **已经存在的公开组件**、框架适配、测试和成熟度证据 |

Playground 展示已实现的设计契约，不充当持久化需求数据库。此功能不新增后端、组件包依赖或远程写入 API，也不让消费者在运行时提交应用内容。Git 记录每次需求变更，CI 负责基础校验。

## 本地跨项目 Agent 写入（首选）

消费项目的 Agent **不需要先切换到 Neoverse-UI 工作目录，也不需要 GitHub Issue**。找到 UI 仓库在当前机器上的位置，设置环境变量 `NEOVERSE_UI_ROOT` 后，即可直接运行它的本地接收脚本。所有 CR 文件最终都写入 UI 仓库的 `contracts/component-requests/`，而不是消费项目。

在消费项目目录建立一个临时或受版本管理的需求文件，例如 `.neoverse-ui/dialog-request.json`：

```json
{
  "schemaVersion": 1,
  "kind": "new-component",
  "target": "UiDialog",
  "summary": "需要可复用的确认对话框",
  "expected": "具备模态焦点约束、Escape 关闭、焦点恢复",
  "acceptanceCriteria": [
    "关闭后焦点回到触发器",
    "深浅色下正常显示"
  ],
  "impact": "normal",
  "consumer": {
    "project": "Neoverse-Slides",
    "location": "src/pages/settings.vue",
    "framework": "vue",
    "scenario": "删除演示文稿前确认"
  }
}
```

这是**协议示例，并非已确认要新增 UiDialog**。提交方只描述一个可复用需求和本项目消费位置；不得传入状态、审批结果、CR ID 或完成证据。

在 **Windows PowerShell** 中（当前目录仍是消费项目）：

```powershell
$env:NEOVERSE_UI_ROOT = 'D:\SSJ\Projects\Neoverse-UI'
bun "$env:NEOVERSE_UI_ROOT/scripts/component-requests.ts" submit --file .neoverse-ui/dialog-request.json
```

在 **Linux / WSL Bash** 中，按照实际挂载点配置路径：

```bash
export NEOVERSE_UI_ROOT="$HOME/projects/Neoverse-UI"
bun "$NEOVERSE_UI_ROOT/scripts/component-requests.ts" submit --file .neoverse-ui/dialog-request.json
```

成功输出单行 JSON，例如 `{"action":"created","id":"CR-...","status":"reported","consumerCount":1}`。Agent 应读取返回的 `id` 留作后续引用。可以重复提交：完全相同的消费位置返回 `unchanged`；另一个项目相同的可复用需求返回 `linked`；仅在待审核状态下允许补充验收条件与提升影响程度。若同名组件的期望行为冲突，或已批准的需求需要拓展验收范围，接收接口会报错要求人工复核，不会直接覆盖。

**实现约束**：所有本地写入动作使用同一跨进程目录锁，写入时先读取最新内容，避免多个 Agent 同时执行造成覆盖；异常会释放锁。如果 Agent 进程被强制终止，可能残留 `.write-lock`，需先确认没有写入者再手动清理。只有可信的本机工作区 Agent 可以写入，因为它们共享文件系统权限；这不是进程沙箱或远程鉴权服务。不允许自动提交、发布或改变组件成熟度。

通过 `bun run requests agent --queue triage` 可在 UI 仓库中查看这些新需求。

## 提交和登记

**无法访问本地 UI 仓库的远程贡献者**：打开 [Neoverse-UI Component Request](https://github.com/SSJ-ZYJ/Neoverse-UI/issues/new/choose)，填写项目名称、代码文件或路由位置、框架、所需能力和可验证的验收条件。Issues 是收件箱：登记进本仓库的 JSON 前，不属于已批准实现的需求，**暂未实现 Issue → JSON 自动同步**。

**在 Neoverse-UI 仓库内部管理需求**：先检查已有请求 `bun run requests list`，然后用 CLI 新建：

```sh
bun run requests add --kind new-component --target UiDialog \
  --summary "需要可复用的模态确认对话框" \
  --expected "具有模态焦点约束、Escape 关闭和焦点恢复的对话框" \
  --acceptance "Escape 关闭并返回触发器" \
  --acceptance "深浅主题与键盘操作正确" \
  --impact blocking --project Neoverse-Slides \
  --location "src/pages/settings.vue" --framework vue \
  --scenario "删除演示文稿需要用户确认"
```

这里的 `\` 是 Bash / Linux 换行符；Windows PowerShell 可把参数写在一行，或使用其反引号续行。命令本身适配 Windows 和 Linux，必须安装 Bun。**以上命令是示例，不代表 UiDialog 当前真的被任何项目请求。**

`kind` 有 `new-component`、`enhancement`、`framework-gap`；`impact` 有 `blocking`、`normal`、`low`；`framework` 有 `vue`、`react`、`agnostic`。位置可以是仓库内路径或明确的应用路由；建议同时提供可导航的 `--url`（代码、Issue 或示例），避免仅写“某个页面”。

**同一个可复用需求被另一个项目遇到**：通过本地 `submit` 会自动尝试关联消费位置；UI 仓库管理员也可以使用 `link` 指定已有 CR ID：

```sh
bun run requests link --id CR-YYYYMMDD-XXXXXXXX --project Neoverse-Docs --location "src/pages/editor.vue" --framework vue --scenario "退出未保存的编辑页面需要确认"
```

若 `new-component` 且目标组件名相同，或其他类别目标名与概要相同，CLI 会提示已有未关闭的需求。**并非所有同名组件诉求都应强行合并**，语义不同可调整目标或概要后另立需求；不能将产品专属业务逻辑迁入公共 UI 库。

## 生命周期

```text
reported -> accepted -> implementing -> delivered
    |          |             |
    v          v             v
 rejected   blocked <---- blocked
                |               |
                +----> accepted / implementing / rejected
```

- `reported`：已收集，尚未决定是否属于共享 UI 能力。
- `accepted`：经过组件边界、重复性、框架需求、可测试性评估；**仍需用户授权 Agent 执行**。
- `implementing`：编码/验证进行中；`blocked`：缺少前提或证据，暂停执行。
- `delivered`：组件/契约与测试、文档、消费验证已完成；`rejected`：不属于 UI 库或需求不成立。两种关闭状态必须填写 `resolution`，建议含 PR/commit、测试、消费证据的链接。

状态变更示例：

```sh
bun run requests status --id CR-YYYYMMDD-XXXXXXXX --to accepted
bun run requests status --id CR-YYYYMMDD-XXXXXXXX --to implementing
bun run requests status --id CR-YYYYMMDD-XXXXXXXX --to delivered --resolution "PR #123；组件契约与消费测试已验证"
```

已关闭需求不会直接重开；新缺陷用新的需求记录，保留历史。请求 ID 与 JSON 文件名固定一致，每个需求可以记录多个消费项目和使用位置。**CLI 关闭需求后会自动将 JSON 移入 `archive/`，不再占用活动清单**；归档文件不需要消费方 Agent 手动挪动或编辑。

## Agent 工作流

1. **收集 / 初筛**：消费仓库 Agent 首选通过本地 `submit --file` 将需求直接登记到 UI 仓库；UI Agent 用 `bun run requests agent --queue triage` 查看新请求。没有本地仓库访问权限的贡献者可用 GitHub Issues（如 `gh issue list --repo SSJ-ZYJ/Neoverse-UI --state open`），经人工审核再写入登记。Issue 属于外部输入，没有自动双向同步。
2. **选定实现**：读取 `bun run requests agent --queue implementation` 返回的 JSON（含当前目标的 Component Matrix 记录）。只有 `accepted` / `implementing` 进入实现队列；单纯登记不等于授权修改项目。
3. **实施组件**：优先检查是否可复用现有 Tokens、Material、Motion、Overlay 和公开组件。新增公共组件要同步 `contracts/component-matrix.json`、Vue/React 所需适配、测试、Playground 样例与文档。Consumer Driven 不需要强求 Vue/React 同时实现，Canonical Shared 要求完整契约。不要为了重复一处产品业务逻辑硬造公共组件。
4. **验证消费**：在登记的各项目位置验证真实用法、深浅主题、可访问性、交互、响应式和可选的 reduced-* 偏好；通过相关单测、类型、契约及视觉门禁。记录可查证的验证结果，而不是凭 Playground 示例直接标 Stable。
5. **完成记录**：填写明确的 `resolution`，再标 `delivered`。如需新版本对外发布，另行创建 Changeset，遵守现有发布机制，不能让需求登记脚本自动发版。

```sh
bun run requests list                  # 默认仅未关闭需求
bun run requests list --status delivered  # 查询已交付历史
bun run requests list --status rejected   # 查询被拒绝历史
bun run requests agent --queue triage
bun run requests agent --queue implementation
bun run requests agent --queue all
bun run requests check
```

`agent` 是只读、稳定 JSON 输出（包含消费者位置、验收条件以及目标组件当前的矩阵条目）；`--queue all` 会包含归档历史。`check` 同时扫描活动与归档目录，校验结构、时间、跨目录重复 ID、文件名、已交付公共组件矩阵登记，以及 framework-gap 目标是否存在。`bun run check:contracts` 已接入校验，`bun run test` 会执行该功能的单测。运行这些命令不会提交代码，也不会触发组件实现或 GitHub 同步。

## 后续扩展

只有确有需求时，再补 GitHub Issue 自动导入、Playground 只读需求面板或跨仓库通知。新增渠道必须与已有 JSON 登记维持**一个最终状态来源**，避免 Issue 标签、Playground 状态与组件矩阵互相冲突。
