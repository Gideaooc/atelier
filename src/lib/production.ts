import type {
  Booklet,
  BookletStatus,
  ProductionState,
} from "@/lib/demo-data";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function getOperationProgress(
  state: ProductionState,
  bookletId: string,
  operationId: string,
) {
  const booklet = state.booklets.find((item) => item.id === bookletId);
  const total = booklet?.totalPairs ?? 0;
  const completions = state.completions.filter(
    (item) => item.bookletId === bookletId && item.operationId === operationId,
  );
  const completed = completions.reduce((sum, item) => sum + item.quantity, 0);
  const remaining = Math.max(total - completed, 0);
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const participantMap = new Map<string, number>();
  for (const completion of completions) {
    participantMap.set(
      completion.userId,
      (participantMap.get(completion.userId) ?? 0) + completion.quantity,
    );
  }

  const participants = [...participantMap.entries()]
    .map(([userId, quantity]) => ({
      user: state.users.find((user) => user.id === userId),
      quantity,
    }))
    .filter((item) => item.user)
    .sort((a, b) => b.quantity - a.quantity);

  return { total, completed, remaining, percent, participants, completions };
}

export function deriveBookletStatus(
  state: ProductionState,
  bookletId: string,
): BookletStatus {
  const booklet = state.booklets.find((item) => item.id === bookletId);
  if (!booklet) return "OPEN";
  const reference = state.references.find((item) => item.id === booklet.referenceId);
  if (!reference || reference.operations.length === 0) return "OPEN";

  const progress = reference.operations.map((item) =>
    getOperationProgress(state, bookletId, item.operationId),
  );

  if (progress.every((item) => item.completed >= booklet.totalPairs)) {
    return "COMPLETED";
  }

  if (progress.some((item) => item.completed > 0)) return "IN_PROGRESS";
  return "OPEN";
}

export function withUpdatedBookletStatus(
  state: ProductionState,
  bookletId: string,
): ProductionState {
  const status = deriveBookletStatus(state, bookletId);
  return {
    ...state,
    booklets: state.booklets.map((item) =>
      item.id === bookletId ? { ...item, status } : item,
    ),
  };
}

export function getBookletAverageProgress(
  state: ProductionState,
  booklet: Booklet,
) {
  const reference = state.references.find((item) => item.id === booklet.referenceId);
  if (!reference || reference.operations.length === 0) return 0;
  const sum = reference.operations.reduce(
    (total, item) => total + getOperationProgress(state, booklet.id, item.operationId).percent,
    0,
  );
  return Math.round(sum / reference.operations.length);
}
