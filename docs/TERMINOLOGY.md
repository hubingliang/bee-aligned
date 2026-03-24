# 术语与语言规范（PreVibe）

面向**中文用户**时的默认约定：界面与帮助以**简体中文**为主；与模型输出、行业习惯或技术标识对齐的专有名词保留**英文**。

## 保留英文（固定写法）

| 用语 | 说明 |
|------|------|
| **Logic Blueprint** | 生成文档中第一节标题，与 `app/api/generate` 系统提示一致；用户可见处可写作「Prompt 手册（文档内为 Logic Blueprint）」。 |
| **Vibe** | 产品内品牌式称呼，与「逻辑密度」说明连用；VibeMeter 卡片上可为「Vibe · Logic Density」。 |
| **Target Role** | 设置中的角色维度（Product / Frontend / Backend）；选项标签可保持英文或全中文，需全站统一。 |
| **Critical / Warning** | 逻辑审计冲突级别，与 API、数据结构一致。 |
| **Clean** | 步骤 1 的动作名（如按钮 **Clean to Markdown**）；可与「整理需求稿」并列说明。 |
| **`.cursorrules`** | 文件名与 Markdown 代码块语言标记，保持原样。 |

## 中文主文案（示例）

| 概念 | 推荐中文 |
|------|----------|
| 三步产物（对外） | **导入** → **需求稿** → **Prompt 手册** |
| Step 3 简称（顶栏） | **手册**（与「Prompt 手册」同义） |
| 降噪/整理动作 | **Clean**、**Clean to Markdown** |
| 第三步生成动作 | **Vibe Check**（括号内可写 Generate Prompt） |
| 审计面板标题 | 可用 **Logic Audit** 或 **逻辑审计**（二选一后全站统一） |

## 不建议混用的写法

- 同一屏同时出现「执行手册」「开发手册」「Blueprint」多种叫法指同一份产出——统一为 **Prompt 手册**，必要时括号注明 **Logic Blueprint**。
- 用户可见句子中避免全大写缩写堆砌；**API**、**Key**、**JSON** 等可保留。

## 与代码的关系

- 路由、组件名、注释可用英文。
- `lib/vibe-scorer.ts` 等面向**用户展示**的字符串优先中文（与 Vibe 卡片、帮助中心一致）。
