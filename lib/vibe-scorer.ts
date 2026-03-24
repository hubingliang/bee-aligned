import type { AuditConflict } from "@/lib/logic-audit";
import { penaltiesFromConflicts } from "@/lib/logic-audit";

export type VibeScoreResult = {
  /** 0–100，侧重逻辑密度（Logic Density），已含 Alignment Audit 扣分 */
  score: number;
  suggestions: string[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** If / Then / 分支 / 条件链 */
function scoreIfThenLogic(md: string): { pts: number; hit: boolean } {
  const patterns = [
    /\bif\b|\bthen\b|\belse\b|\bwhen\b|\botherwise\b|\bcase\b|\bbranch\b/i,
    /若|则|否则|当|且|或|分支|条件|假设|满足|不满足/,
    /\b=>\b|->|⇒/,
    /\b(and|or|not)\b.+\b(if|when)\b/i,
  ];
  const hit = patterns.some((re) => re.test(md));
  return { pts: hit ? 28 : 0, hit };
}

/** 数据模型 / 实体 / 契约 */
function scoreDataModel(md: string): { pts: number; hit: boolean } {
  const patterns = [
    /\b(schema|entity|model|dto|enum|field|column|table)\b/i,
    /数据结构|数据模型|实体|字段|表|主键|外键|JSON|UUID|类型|接口契约/,
    /```\s*(ts|typescript|json|yaml|yml)\b/i,
  ];
  const hit = patterns.some((re) => re.test(md));
  return { pts: hit ? 26 : 0, hit };
}

/** 错误流 / 异常 / 边界 */
function scoreErrorFlow(md: string): { pts: number; hit: boolean } {
  const patterns = [
    /\b(error|fail|retry|rollback|timeout|abort|reject|exception)\b/i,
    /异常|失败|重试|回滚|超时|空状态|边界|403|401|幂等|补偿|降级/,
    /Error\s*[:：]|错误码|失败时|若.*失败/,
  ];
  const hit = patterns.some((re) => re.test(md));
  return { pts: hit ? 26 : 0, hit };
}

/** 纯视觉 / 样式噪音（越多越减分） */
function visualNoiseRatio(md: string): number {
  const lines = md.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return 0;
  let visualHits = 0;
  const visualRes = [
    /红色|蓝色|绿色|黄色|#[0-9a-fA-F]{3,8}\b/,
    /\b(px|rem|em|padding|margin|rounded|shadow|font|color|bg-|text-|主题|配色)\b/i,
    /按钮是|背景色|圆角|描边|渐变|动效|hover|点击.*颜色/,
    /好看|美观|大气|简洁.*风/,
  ];
  for (const line of lines) {
    if (visualRes.some((re) => re.test(line))) {
      visualHits++;
    }
  }
  return visualHits / lines.length;
}

/**
 * 根据 Refine Markdown 估算 **逻辑密度（Logic Density）**：
 * - 奖励：If/Then 类描述、数据模型、错误流。
 * - 惩罚：大量纯视觉描述（颜色、间距、样式词）而逻辑信号弱。
 * - Alignment Audit：每个 Critical −20，每个 Warning −5（在基础分上扣除）。
 */
export function calculateVibeScore(
  markdown: string,
  auditConflicts?: AuditConflict[],
): VibeScoreResult {
  const md = markdown.trim();
  const suggestions: string[] = [];

  if (!md) {
    return {
      score: 0,
      suggestions: ["在需求稿编辑器中添加内容后再评估逻辑密度。"],
    };
  }

  const ifThen = scoreIfThenLogic(md);
  const data = scoreDataModel(md);
  const err = scoreErrorFlow(md);
  const noise = visualNoiseRatio(md);

  if (!ifThen.hit) {
    suggestions.push("补充显式分支：if / when / 若…则 / else 路径。");
  }
  if (!data.hit) {
    suggestions.push("描述数据形态、实体或 schema（正文或 ```json / ts 代码块）。");
  }
  if (!err.hit) {
    suggestions.push("补充错误路径：失败、重试、空状态或不变量。");
  }

  let raw = ifThen.pts + data.pts + err.pts;

  const logicHits = [ifThen.hit, data.hit, err.hit].filter(Boolean).length;
  if (logicHits === 3) {
    raw += 12;
  } else if (logicHits === 2) {
    raw += 5;
  }

  if (noise >= 0.45 && logicHits < 2) {
    raw -= 35;
    suggestions.push(
      "视觉描述偏多，请补充逻辑、数据与错误路径，并精简纯样式描述。",
    );
  } else if (noise >= 0.35) {
    raw -= 18;
    suggestions.push("减少纯样式行，优先写清算法与约束。");
  }

  if (auditConflicts?.length) {
    const { penalty, critical, warning } = penaltiesFromConflicts(auditConflicts);
    raw -= penalty;
    if (critical > 0) {
      suggestions.unshift(
        `Alignment Audit：${critical} 条 Critical（各 −20 分）。建议先修复需求稿再生成 Final Spec，以降低输出偏差。`,
      );
    }
    if (warning > 0) {
      suggestions.push(`Alignment Audit：${warning} 条 Warning（各 −5 分）。`);
    }
  }

  raw = clamp(raw, 0, 100);
  const score = Math.round(raw);

  if (score >= 80) {
    suggestions.push("逻辑密度高，适合生成 Final Spec。");
  }

  return {
    score,
    suggestions: dedupeSuggestions(suggestions).slice(0, 6),
  };
}

function dedupeSuggestions(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out.slice(0, 8);
}
