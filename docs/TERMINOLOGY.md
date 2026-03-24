# 术语与语言规范（Bee Aligned）

## 品牌

| 用语 | 说明 |
| --- | --- |
| **Bee Aligned** | 产品正式名称；双关：蜜蜂式协作 + **Be Aligned（保持对齐）**。 |
| **Alignment Line** | 视觉隐喻：左右分栏 Resizable 分割条上的微弱呼吸灯动效，象征对齐线。 |

## 产品术语

| 英文 | 中文说明 | 备注 |
| --- | --- | --- |
| **Alignment Audit** | 对需求稿的冲突/风险扫描（原「逻辑检查 / 逻辑审计」） | 界面与 Toast 优先用英文固定术语。 |
| **Final Spec** | 第三步生成的长篇协作文档（原「生成结果」） | 与「Prompt 手册」可同义；若需括号说明文档结构，可写 **Final Spec（Logic Blueprint）**。 |
| **Logic Blueprint** | 生成文档中第一节标题 | 与 `app/api/generate` 系统提示一致。 |
| **Vibe** | 逻辑密度启发式评分 | VibeMeter 可为「Vibe · Logic Density」。 |
| **Critical / Warning** | Alignment Audit 冲突级别 | 与 API、数据结构一致。 |

## 代码与文件

- 模块路径 `lib/logic-audit.ts` 保留历史文件名；注释与对外文案使用 **Alignment Audit**。
- `package.json` 的 `name` 为 `bee-aligned`；本地存储 key 前缀为 `beealigned_*`，并兼容 `alignspec_*` / `previbe_*`。

## 禁止混用

- 同一屏不要同时出现多种「产出物」称呼指同一份第三步文档——统一为 **Final Spec**，必要时括号注明 **Logic Blueprint**。
