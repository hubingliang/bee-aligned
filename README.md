# PreVibe

把杂乱需求整理成**结构化 Markdown 需求稿**，经**逻辑审计**与 **Vibe（逻辑密度）** 提示后，按角色生成 **Prompt 手册**（生成文档中第一节标题为 **Logic Blueprint**，含 Mermaid、测试矩阵与 `.cursorrules` 建议等）。

- 技术栈：**Next.js**（App Router）+ **shadcn/ui**
- 主界面：**`/workspace`**；另有 **`/`** 介绍页、**`/getting-started`**、**`/help`**

## 本地开发

```bash
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

```bash
pnpm run build   # 生产构建
pnpm exec tsc --noEmit   # 仅类型检查
```

## API Key 放哪里

默认在浏览器 **localStorage** 中保存各厂商 Key，请求经你的 Next 服务端转发到模型（见 `lib/llm.ts` 中的请求头约定）。

可选：在部署环境中配置**服务端环境变量**，作为未带浏览器 Key 时的回退（与请求头二选一，由 `pickKey` 合并）：

| 变量 | 用途 |
|------|------|
| `ANTHROPIC_API_KEY` | Claude 模型 |
| `OPENAI_API_KEY` | GPT-4o / GPT-4o-mini |
| `OPENAI_BASE_URL` | 可选，OpenAI 兼容 API 基址，默认官方 `https://api.openai.com/v1` |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `DEEPSEEK_BASE_URL` | 可选，默认 `https://api.deepseek.com` |
| `GEMINI_API_KEY` | Google Gemini |
| `ACHAT_API_KEY` | 公司 Achat → Azure 代理 |
| `ACHAT_DEPLOYMENT_ID` | 与 Achat 配合的 Deployment Id |

**说明：** 本项目根目录未附带 `.env.example`；若需团队统一约定，可自行增加并在 `.gitignore` 中忽略 `.env*.local`。

## 术语与界面语言

对外产品文案以**中文**为主；文档结构名 **Logic Blueprint** 等与模型输出对齐，保留英文。详见 [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md)。

## 添加 shadcn 组件

```bash
npx shadcn@latest add button
```

组件生成在 `components/ui/`。
