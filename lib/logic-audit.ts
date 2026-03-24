export type AuditConflictType = "Critical" | "Warning";

/** Alignment Audit 单条结果（与 /api/audit 返回一致） */
export type AuditConflict = {
  line: number;
  type: AuditConflictType;
  reason: string;
};

export function penaltiesFromConflicts(conflicts: AuditConflict[]): {
  critical: number;
  warning: number;
  penalty: number;
} {
  let critical = 0;
  let warning = 0;
  for (const c of conflicts) {
    if (c.type === "Critical") {
      critical += 1;
    } else {
      warning += 1;
    }
  }
  return {
    critical,
    warning,
    penalty: critical * 20 + warning * 5,
  };
}

export function hasCriticalConflict(conflicts: AuditConflict[]): boolean {
  return conflicts.some((c) => c.type === "Critical");
}

/** 同一行上多条冲突时取最高优先级：Critical > Warning */
export function worstConflictOnLine(
  line: number,
  conflicts: AuditConflict[],
): AuditConflict | undefined {
  const onLine = conflicts.filter((c) => c.line === line);
  if (onLine.length === 0) {
    return undefined;
  }
  return onLine.some((c) => c.type === "Critical")
    ? onLine.find((c) => c.type === "Critical")
    : onLine[0];
}
