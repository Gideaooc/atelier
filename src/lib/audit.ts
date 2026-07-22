import {
  createAdminPermissions,
  createEmptyPermissions,
  type AuditAction,
  type AuditLog,
  type AuditModule,
  type AuditPayload,
  type PermissionMap,
  type ProductionState,
  type UserAccount,
} from "@/lib/demo-data";

export const MAX_DEMO_AUDIT_LOGS = 2000;

type AuditDraft = {
  action: AuditAction;
  module: AuditModule;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  description: string;
  before?: AuditPayload;
  after?: AuditPayload;
};

function actorFromState(state: ProductionState, actorUserId: string | null) {
  const actor = state.users.find((user) => user.id === actorUserId);
  return {
    actorUserId: actor?.id ?? actorUserId,
    actorName: actor?.name ?? (actorUserId ? "Usuário removido" : "Sistema"),
  };
}

function makeLogs(
  state: ProductionState,
  actorUserId: string | null,
  drafts: AuditDraft[],
): AuditLog[] {
  const actor = actorFromState(state, actorUserId);
  const createdAt = new Date().toISOString();

  return drafts.map((draft) => ({
    id: crypto.randomUUID(),
    ...actor,
    action: draft.action,
    module: draft.module,
    entityType: draft.entityType,
    entityId: draft.entityId,
    entityLabel: draft.entityLabel,
    description: draft.description,
    before: draft.before ?? null,
    after: draft.after ?? null,
    createdAt,
  }));
}

function safeUser(user: UserAccount) {
  return {
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active,
    permissions: user.permissions,
  };
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function operationName(state: ProductionState, operationId: string) {
  return state.operations.find((operation) => operation.id === operationId)?.name ?? "Operação removida";
}

function bookletLabel(state: ProductionState, bookletId: string) {
  const booklet = state.booklets.find((item) => item.id === bookletId);
  return booklet ? `Talão ${booklet.number}` : "Talão removido";
}

export function deriveAuditLogs(
  previous: ProductionState,
  next: ProductionState,
  actorUserId: string | null,
): AuditLog[] {
  const drafts: AuditDraft[] = [];

  const previousOperations = new Map(previous.operations.map((item) => [item.id, item]));
  const nextOperations = new Map(next.operations.map((item) => [item.id, item]));

  for (const operation of next.operations) {
    const before = previousOperations.get(operation.id);
    if (!before) {
      drafts.push({
        action: "CREATE",
        module: "OPERATIONS",
        entityType: "operation",
        entityId: operation.id,
        entityLabel: operation.name,
        description: `Cadastrou a operação “${operation.name}”.`,
        after: { name: operation.name },
      });
    } else if (before.name !== operation.name) {
      drafts.push({
        action: "UPDATE",
        module: "OPERATIONS",
        entityType: "operation",
        entityId: operation.id,
        entityLabel: operation.name,
        description: `Alterou o nome da operação de “${before.name}” para “${operation.name}”.`,
        before: { name: before.name },
        after: { name: operation.name },
      });
    }
  }

  for (const operation of previous.operations) {
    if (!nextOperations.has(operation.id)) {
      drafts.push({
        action: "DELETE",
        module: "OPERATIONS",
        entityType: "operation",
        entityId: operation.id,
        entityLabel: operation.name,
        description: `Excluiu a operação “${operation.name}”.`,
        before: { name: operation.name },
      });
    }
  }

  const previousOperationOrder = previous.operations.map((item) => item.id);
  const nextOperationOrder = next.operations.map((item) => item.id);
  if (
    previousOperationOrder.length === nextOperationOrder.length &&
    previousOperationOrder.every((id) => nextOperations.has(id)) &&
    !sameJson(previousOperationOrder, nextOperationOrder)
  ) {
    drafts.push({
      action: "REORDER",
      module: "OPERATIONS",
      entityType: "operation_order",
      entityId: null,
      entityLabel: "Ordem das operações",
      description: "Alterou a ordem geral das operações.",
      before: { order: previous.operations.map((item) => item.name) },
      after: { order: next.operations.map((item) => item.name) },
    });
  }

  const previousReferences = new Map(previous.references.map((item) => [item.id, item]));
  const nextReferences = new Map(next.references.map((item) => [item.id, item]));

  for (const reference of next.references) {
    const before = previousReferences.get(reference.id);
    if (!before) {
      drafts.push({
        action: "CREATE",
        module: "REFERENCES",
        entityType: "reference",
        entityId: reference.id,
        entityLabel: `Referência ${reference.code}`,
        description: `Cadastrou a referência ${reference.code}.`,
        after: {
          code: reference.code,
          description: reference.description,
          route: reference.operations.map((route, index) => ({
            position: index + 1,
            operation: operationName(next, route.operationId),
            pricePerPair: route.pricePerPair,
          })),
        },
      });
      continue;
    }

    if (before.code !== reference.code || before.description !== reference.description) {
      drafts.push({
        action: "UPDATE",
        module: "REFERENCES",
        entityType: "reference",
        entityId: reference.id,
        entityLabel: `Referência ${reference.code}`,
        description: `Alterou os dados da referência ${before.code}.`,
        before: { code: before.code, description: before.description },
        after: { code: reference.code, description: reference.description },
      });
    }

    const previousRoute = new Map(before.operations.map((item) => [item.operationId, item]));
    const nextRoute = new Map(reference.operations.map((item) => [item.operationId, item]));

    for (const route of reference.operations) {
      const oldRoute = previousRoute.get(route.operationId);
      const name = operationName(next, route.operationId);
      if (!oldRoute) {
        drafts.push({
          action: "CREATE",
          module: "REFERENCES",
          entityType: "reference_operation",
          entityId: `${reference.id}:${route.operationId}`,
          entityLabel: `${reference.code} · ${name}`,
          description: `Incluiu “${name}” no roteiro da referência ${reference.code}.`,
          after: {
            position: reference.operations.findIndex((item) => item.operationId === route.operationId) + 1,
            operation: name,
            pricePerPair: route.pricePerPair,
          },
        });
      } else if (oldRoute.pricePerPair !== route.pricePerPair) {
        drafts.push({
          action: "UPDATE",
          module: "REFERENCES",
          entityType: "reference_operation",
          entityId: `${reference.id}:${route.operationId}`,
          entityLabel: `${reference.code} · ${name}`,
          description: `Alterou o preço por par de “${name}” na referência ${reference.code}.`,
          before: { pricePerPair: oldRoute.pricePerPair },
          after: { pricePerPair: route.pricePerPair },
        });
      }
    }

    for (const route of before.operations) {
      if (!nextRoute.has(route.operationId)) {
        const name = operationName(previous, route.operationId);
        drafts.push({
          action: "DELETE",
          module: "REFERENCES",
          entityType: "reference_operation",
          entityId: `${reference.id}:${route.operationId}`,
          entityLabel: `${reference.code} · ${name}`,
          description: `Removeu “${name}” do roteiro da referência ${reference.code}.`,
          before: {
            operation: name,
            pricePerPair: route.pricePerPair,
          },
        });
      }
    }

    const beforeOrder = before.operations.map((item) => item.operationId);
    const afterOrder = reference.operations.map((item) => item.operationId);
    if (
      beforeOrder.length === afterOrder.length &&
      beforeOrder.every((id) => nextRoute.has(id)) &&
      !sameJson(beforeOrder, afterOrder)
    ) {
      drafts.push({
        action: "REORDER",
        module: "REFERENCES",
        entityType: "reference_route",
        entityId: reference.id,
        entityLabel: `Roteiro ${reference.code}`,
        description: `Alterou a ordem do roteiro da referência ${reference.code}.`,
        before: { order: beforeOrder.map((id) => operationName(previous, id)) },
        after: { order: afterOrder.map((id) => operationName(next, id)) },
      });
    }
  }

  for (const reference of previous.references) {
    if (!nextReferences.has(reference.id)) {
      drafts.push({
        action: "DELETE",
        module: "REFERENCES",
        entityType: "reference",
        entityId: reference.id,
        entityLabel: `Referência ${reference.code}`,
        description: `Excluiu a referência ${reference.code}.`,
        before: { code: reference.code, description: reference.description },
      });
    }
  }

  const previousBooklets = new Map(previous.booklets.map((item) => [item.id, item]));
  const nextBooklets = new Map(next.booklets.map((item) => [item.id, item]));

  for (const booklet of next.booklets) {
    const before = previousBooklets.get(booklet.id);
    const reference = next.references.find((item) => item.id === booklet.referenceId);
    if (!before) {
      drafts.push({
        action: "CREATE",
        module: "BOOKLETS",
        entityType: "booklet",
        entityId: booklet.id,
        entityLabel: `Talão ${booklet.number}`,
        description: `Cadastrou o talão ${booklet.number}.`,
        after: {
          number: booklet.number,
          reference: reference?.code ?? booklet.referenceId,
          totalPairs: booklet.totalPairs,
          receivedAt: booklet.receivedAt,
          status: booklet.status,
        },
      });
    } else {
      const beforeData = {
        number: before.number,
        referenceId: before.referenceId,
        totalPairs: before.totalPairs,
        receivedAt: before.receivedAt,
      };
      const afterData = {
        number: booklet.number,
        referenceId: booklet.referenceId,
        totalPairs: booklet.totalPairs,
        receivedAt: booklet.receivedAt,
      };
      if (!sameJson(beforeData, afterData)) {
        drafts.push({
          action: "UPDATE",
          module: "BOOKLETS",
          entityType: "booklet",
          entityId: booklet.id,
          entityLabel: `Talão ${booklet.number}`,
          description: `Alterou os dados do talão ${before.number}.`,
          before: beforeData,
          after: afterData,
        });
      }
      if (before.status !== booklet.status) {
        drafts.push({
          action: "STATUS_CHANGE",
          module: "BOOKLETS",
          entityType: "booklet",
          entityId: booklet.id,
          entityLabel: `Talão ${booklet.number}`,
          description: `O talão ${booklet.number} mudou de ${before.status} para ${booklet.status}.`,
          before: { status: before.status },
          after: { status: booklet.status },
        });
      }
    }
  }

  for (const booklet of previous.booklets) {
    if (!nextBooklets.has(booklet.id)) {
      drafts.push({
        action: "DELETE",
        module: "BOOKLETS",
        entityType: "booklet",
        entityId: booklet.id,
        entityLabel: `Talão ${booklet.number}`,
        description: `Excluiu o talão ${booklet.number}.`,
        before: {
          number: booklet.number,
          referenceId: booklet.referenceId,
          totalPairs: booklet.totalPairs,
          receivedAt: booklet.receivedAt,
          status: booklet.status,
        },
      });
    }
  }

  const previousCompletions = new Map(previous.completions.map((item) => [item.id, item]));
  const nextCompletions = new Map(next.completions.map((item) => [item.id, item]));

  for (const completion of next.completions) {
    if (!previousCompletions.has(completion.id)) {
      const booklet = next.booklets.find((item) => item.id === completion.bookletId);
      const user = next.users.find((item) => item.id === completion.userId);
      const operation = operationName(next, completion.operationId);
      drafts.push({
        action: "COMPLETE",
        module: "PRODUCTION",
        entityType: "completion",
        entityId: completion.id,
        entityLabel: `${booklet ? `Talão ${booklet.number}` : "Talão"} · ${operation}`,
        description: `Marcou ${completion.quantity} par(es) de “${operation}” como concluídos para ${user?.name ?? "usuário removido"}.`,
        after: {
          booklet: booklet?.number ?? completion.bookletId,
          operation,
          employee: user?.name ?? completion.userId,
          quantity: completion.quantity,
          notes: completion.notes,
          completedAt: completion.completedAt,
        },
      });
    }
  }

  for (const completion of previous.completions) {
    if (!nextCompletions.has(completion.id)) {
      const booklet = previous.booklets.find((item) => item.id === completion.bookletId);
      const user = previous.users.find((item) => item.id === completion.userId);
      const operation = operationName(previous, completion.operationId);
      drafts.push({
        action: "DELETE",
        module: "PRODUCTION",
        entityType: "completion",
        entityId: completion.id,
        entityLabel: `${booklet ? `Talão ${booklet.number}` : "Talão removido"} · ${operation}`,
        description: `Excluiu um apontamento de ${completion.quantity} par(es) de “${operation}”.`,
        before: {
          booklet: booklet?.number ?? completion.bookletId,
          operation,
          employee: user?.name ?? completion.userId,
          quantity: completion.quantity,
          notes: completion.notes,
          completedAt: completion.completedAt,
        },
      });
    }
  }

  const previousUsers = new Map(previous.users.map((item) => [item.id, item]));
  const nextUsers = new Map(next.users.map((item) => [item.id, item]));

  for (const user of next.users) {
    const before = previousUsers.get(user.id);
    if (!before) {
      drafts.push({
        action: "CREATE",
        module: "USERS",
        entityType: "user",
        entityId: user.id,
        entityLabel: user.name,
        description: `Cadastrou o usuário ${user.name}.`,
        after: safeUser(user),
      });
      continue;
    }

    const beforeSafe = safeUser(before);
    const afterSafe = safeUser(user);
    const passwordChanged = before.password !== user.password;
    if (!sameJson(beforeSafe, afterSafe) || passwordChanged) {
      const onlyStatusChanged =
        before.active !== user.active &&
        before.name === user.name &&
        before.username === user.username &&
        before.role === user.role &&
        sameJson(before.permissions, user.permissions) &&
        !passwordChanged;
      drafts.push({
        action: onlyStatusChanged ? "STATUS_CHANGE" : "UPDATE",
        module: "USERS",
        entityType: "user",
        entityId: user.id,
        entityLabel: user.name,
        description: onlyStatusChanged
          ? `${user.active ? "Ativou" : "Desativou"} a conta de ${user.name}.`
          : `Alterou os dados ou permissões do usuário ${user.name}.`,
        before: { ...beforeSafe, passwordChanged: false },
        after: { ...afterSafe, passwordChanged },
      });
    }
  }

  for (const user of previous.users) {
    if (!nextUsers.has(user.id)) {
      drafts.push({
        action: "DELETE",
        module: "USERS",
        entityType: "user",
        entityId: user.id,
        entityLabel: user.name,
        description: `Excluiu o usuário ${user.name}.`,
        before: safeUser(user),
      });
    }
  }

  return makeLogs(previous, actorUserId, drafts);
}

export function appendExplicitAudit(
  state: ProductionState,
  actorUserId: string | null,
  draft: AuditDraft,
) {
  return {
    ...state,
    auditLogs: [
      ...makeLogs(state, actorUserId, [draft]),
      ...(state.auditLogs ?? []),
    ].slice(0, MAX_DEMO_AUDIT_LOGS),
  };
}

export function migrateProductionState(raw: ProductionState): ProductionState {
  const users = (raw.users ?? []).map((user) => {
    const basePermissions: PermissionMap =
      user.role === "ADMIN" ? createAdminPermissions() : createEmptyPermissions();
    const mergedPermissions = {
      ...basePermissions,
      ...(user.permissions ?? {}),
    };
    mergedPermissions["audit.logs"] = {
      view: mergedPermissions["audit.logs"].view,
      edit: false,
    };
    return {
      ...user,
      permissions: mergedPermissions,
    };
  });

  return {
    users,
    operations: raw.operations ?? [],
    references: raw.references ?? [],
    booklets: raw.booklets ?? [],
    completions: raw.completions ?? [],
    auditLogs: raw.auditLogs ?? [],
  };
}

export function auditEntityLabel(state: ProductionState, entityType: string, entityId: string | null) {
  if (!entityId) return "Registro";
  if (entityType === "booklet") return bookletLabel(state, entityId);
  return entityId;
}
