"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialProductionState,
  type AccessMode,
  type PermissionArea,
  type PermissionMap,
  type ProductionState,
  type ReferenceOperation,
  type UserAccount,
  type UserRole,
} from "@/lib/demo-data";
import {
  getOperationProgress,
  withUpdatedBookletStatus,
} from "@/lib/production";

const STORAGE_KEY = "controle-producao-terceirizada:v5";
const SESSION_KEY = "controle-producao-terceirizada:session:v5";

type UserInput = {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  permissions: PermissionMap;
};

type ReferenceBatchItem = {
  code: string;
  description: string;
};

type CompletionInput = {
  operationId: string;
  quantity: number;
};

type ProductionDataContextValue = ProductionState & {
  ready: boolean;
  currentUser: UserAccount | null;
  login: (username: string, password: string) => void;
  logout: () => void;
  hasAccess: (area: PermissionArea, mode?: AccessMode) => boolean;
  createOperations: (names: string[]) => void;
  updateOperation: (operationId: string, name: string) => void;
  moveOperation: (operationId: string, direction: -1 | 1) => void;
  deleteOperation: (operationId: string) => void;
  createReferencesBatch: (items: ReferenceBatchItem[], route: ReferenceOperation[]) => void;
  updateReferenceMeta: (referenceId: string, code: string, description: string) => void;
  insertReferenceOperation: (
    referenceId: string,
    operationId: string,
    position: number,
    pricePerPair: number,
  ) => void;
  updateReferenceOperation: (
    referenceId: string,
    index: number,
    operationId: string,
    pricePerPair: number,
  ) => void;
  moveReferenceOperation: (referenceId: string, index: number, direction: -1 | 1) => void;
  deleteReferenceOperation: (referenceId: string, index: number) => void;
  deleteReference: (referenceId: string) => void;
  createBooklet: (input: {
    number: string;
    referenceId: string;
    totalPairs: number;
    receivedAt: string;
  }) => void;
  updateBooklet: (
    bookletId: string,
    input: { number: string; referenceId: string; totalPairs: number; receivedAt: string },
  ) => void;
  deleteBooklet: (bookletId: string) => void;
  recordCompletions: (input: {
    bookletId: string;
    userId: string;
    items: CompletionInput[];
    notes: string;
  }) => void;
  deleteCompletion: (completionId: string) => void;
  createUser: (input: UserInput) => void;
  updateUser: (userId: string, input: UserInput) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  resetDemo: () => void;
};

const ProductionDataContext = createContext<ProductionDataContextValue | null>(null);

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePrice(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error("Informe um valor por par válido.");
  return Math.round(value * 100) / 100;
}

function normalizePermissions(permissions: PermissionMap): PermissionMap {
  return Object.fromEntries(
    Object.entries(permissions).map(([key, value]) => [
      key,
      { view: Boolean(value.view || value.edit), edit: Boolean(value.edit) },
    ]),
  ) as PermissionMap;
}

export function ProductionDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProductionState>(initialProductionState);
  const stateRef = useRef<ProductionState>(initialProductionState);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const commit = useCallback((nextState: ProductionState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ProductionState;
        stateRef.current = parsed;
        setState(parsed);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    const sessionUserId = window.localStorage.getItem(SESSION_KEY);
    if (sessionUserId) setCurrentUserId(sessionUserId);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const currentUser = useMemo(() => {
    const user = state.users.find((item) => item.id === currentUserId) ?? null;
    return user?.active ? user : null;
  }, [currentUserId, state.users]);

  const login = useCallback((username: string, password: string) => {
    const normalized = normalizeUsername(username);
    const user = stateRef.current.users.find(
      (item) => item.username === normalized && item.password === password,
    );
    if (!user) throw new Error("Usuário ou senha inválidos.");
    if (!user.active) throw new Error("Esta conta está desativada.");
    setCurrentUserId(user.id);
    window.localStorage.setItem(SESSION_KEY, user.id);
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasAccess = useCallback(
    (area: PermissionArea, mode: AccessMode = "view") => {
      const permission = currentUser?.permissions[area];
      if (!permission) return false;
      return mode === "edit" ? permission.edit : permission.view || permission.edit;
    },
    [currentUser],
  );

  const createOperations = useCallback(
    (rawNames: string[]) => {
      const current = stateRef.current;
      const existing = new Set(current.operations.map((item) => item.name.toLowerCase()));
      const names = rawNames
        .map(normalizeText)
        .filter(Boolean)
        .filter((name, index, list) =>
          list.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index,
        );
      if (!names.length) throw new Error("Adicione ao menos uma operação na prévia.");
      const duplicate = names.find((name) => existing.has(name.toLowerCase()));
      if (duplicate) throw new Error(`A operação “${duplicate}” já está cadastrada.`);
      commit({
        ...current,
        operations: [
          ...current.operations,
          ...names.map((name) => ({ id: crypto.randomUUID(), name })),
        ],
      });
    },
    [commit],
  );

  const updateOperation = useCallback(
    (operationId: string, rawName: string) => {
      const current = stateRef.current;
      const name = normalizeText(rawName);
      if (!name) throw new Error("Informe o nome da operação.");
      if (
        current.operations.some(
          (item) => item.id !== operationId && item.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        throw new Error("Já existe uma operação com esse nome.");
      }
      commit({
        ...current,
        operations: current.operations.map((item) =>
          item.id === operationId ? { ...item, name } : item,
        ),
      });
    },
    [commit],
  );

  const moveOperation = useCallback(
    (operationId: string, direction: -1 | 1) => {
      const current = stateRef.current;
      const index = current.operations.findIndex((item) => item.id === operationId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.operations.length) return;
      const operations = [...current.operations];
      [operations[index], operations[target]] = [operations[target], operations[index]];
      commit({ ...current, operations });
    },
    [commit],
  );

  const deleteOperation = useCallback(
    (operationId: string) => {
      const current = stateRef.current;
      if (current.references.some((item) => item.operations.some((op) => op.operationId === operationId))) {
        throw new Error("A operação está vinculada a uma referência.");
      }
      if (current.completions.some((item) => item.operationId === operationId)) {
        throw new Error("A operação possui histórico de produção.");
      }
      commit({ ...current, operations: current.operations.filter((item) => item.id !== operationId) });
    },
    [commit],
  );

  const createReferencesBatch = useCallback(
    (rawItems: ReferenceBatchItem[], rawRoute: ReferenceOperation[]) => {
      const current = stateRef.current;
      const items = rawItems
        .map((item) => ({
          code: normalizeText(item.code).toUpperCase(),
          description: normalizeText(item.description),
        }))
        .filter((item) => item.code);
      if (!items.length) throw new Error("Adicione ao menos uma referência na prévia.");
      const duplicatedCode = items.find((item, index) =>
        items.findIndex((other) => other.code === item.code) !== index,
      );
      if (duplicatedCode) throw new Error(`A referência ${duplicatedCode.code} está repetida na prévia.`);
      const existing = items.find((item) => current.references.some((ref) => ref.code === item.code));
      if (existing) throw new Error(`A referência ${existing.code} já está cadastrada.`);

      const route: ReferenceOperation[] = rawRoute.map((item) => {
        if (!current.operations.some((operation) => operation.id === item.operationId)) {
          throw new Error("O roteiro possui uma operação inválida.");
        }
        return { operationId: item.operationId, pricePerPair: normalizePrice(item.pricePerPair) };
      });
      const duplicateOperation = route.find((item, index) =>
        route.findIndex((other) => other.operationId === item.operationId) !== index,
      );
      if (duplicateOperation) throw new Error("O roteiro não pode repetir a mesma operação.");

      commit({
        ...current,
        references: [
          ...current.references,
          ...items.map((item) => ({ id: crypto.randomUUID(), ...item, operations: route })),
        ].sort((a, b) => a.code.localeCompare(b.code)),
      });
    },
    [commit],
  );

  const updateReferenceMeta = useCallback(
    (referenceId: string, rawCode: string, rawDescription: string) => {
      const current = stateRef.current;
      const code = normalizeText(rawCode).toUpperCase();
      if (!code) throw new Error("Informe o código da referência.");
      if (current.references.some((item) => item.id !== referenceId && item.code === code)) {
        throw new Error("Já existe uma referência com esse código.");
      }
      commit({
        ...current,
        references: current.references.map((item) =>
          item.id === referenceId
            ? { ...item, code, description: normalizeText(rawDescription) }
            : item,
        ),
      });
    },
    [commit],
  );

  const insertReferenceOperation = useCallback(
    (referenceId: string, operationId: string, rawPosition: number, rawPrice: number) => {
      const current = stateRef.current;
      const reference = current.references.find((item) => item.id === referenceId);
      if (!reference) throw new Error("Referência não encontrada.");
      if (!current.operations.some((item) => item.id === operationId)) {
        throw new Error("Selecione uma operação válida.");
      }
      if (reference.operations.some((item) => item.operationId === operationId)) {
        throw new Error("Essa operação já faz parte do roteiro.");
      }
      const position = Math.max(1, Math.min(Math.trunc(rawPosition), reference.operations.length + 1));
      const operations = [...reference.operations];
      operations.splice(position - 1, 0, {
        operationId,
        pricePerPair: normalizePrice(rawPrice),
      });
      commit({
        ...current,
        references: current.references.map((item) =>
          item.id === referenceId ? { ...item, operations } : item,
        ),
      });
    },
    [commit],
  );

  const updateReferenceOperation = useCallback(
    (referenceId: string, index: number, operationId: string, rawPrice: number) => {
      const current = stateRef.current;
      const reference = current.references.find((item) => item.id === referenceId);
      if (!reference?.operations[index]) throw new Error("Operação do roteiro não encontrada.");
      if (!current.operations.some((item) => item.id === operationId)) {
        throw new Error("Selecione uma operação válida.");
      }
      if (
        reference.operations.some(
          (item, itemIndex) => itemIndex !== index && item.operationId === operationId,
        )
      ) {
        throw new Error("Essa operação já faz parte do roteiro.");
      }
      const operations = reference.operations.map((item, itemIndex) =>
        itemIndex === index
          ? { operationId, pricePerPair: normalizePrice(rawPrice) }
          : item,
      );
      commit({
        ...current,
        references: current.references.map((item) =>
          item.id === referenceId ? { ...item, operations } : item,
        ),
      });
    },
    [commit],
  );

  const moveReferenceOperation = useCallback(
    (referenceId: string, index: number, direction: -1 | 1) => {
      const current = stateRef.current;
      const reference = current.references.find((item) => item.id === referenceId);
      if (!reference) return;
      const target = index + direction;
      if (index < 0 || target < 0 || target >= reference.operations.length) return;
      const operations = [...reference.operations];
      [operations[index], operations[target]] = [operations[target], operations[index]];
      commit({
        ...current,
        references: current.references.map((item) =>
          item.id === referenceId ? { ...item, operations } : item,
        ),
      });
    },
    [commit],
  );

  const deleteReferenceOperation = useCallback(
    (referenceId: string, index: number) => {
      const current = stateRef.current;
      const reference = current.references.find((item) => item.id === referenceId);
      if (!reference) return;
      const removed = reference.operations[index];
      if (!removed) return;
      const bookletIds = new Set(
        current.booklets.filter((item) => item.referenceId === referenceId).map((item) => item.id),
      );
      if (
        current.completions.some(
          (item) => bookletIds.has(item.bookletId) && item.operationId === removed.operationId,
        )
      ) {
        throw new Error("A operação possui apontamentos em talões desta referência.");
      }
      commit({
        ...current,
        references: current.references.map((item) =>
          item.id === referenceId
            ? { ...item, operations: item.operations.filter((_, itemIndex) => itemIndex !== index) }
            : item,
        ),
      });
    },
    [commit],
  );

  const deleteReference = useCallback(
    (referenceId: string) => {
      const current = stateRef.current;
      if (current.booklets.some((item) => item.referenceId === referenceId)) {
        throw new Error("A referência possui talões cadastrados.");
      }
      commit({ ...current, references: current.references.filter((item) => item.id !== referenceId) });
    },
    [commit],
  );

  const createBooklet = useCallback(
    (input: { number: string; referenceId: string; totalPairs: number; receivedAt: string }) => {
      const current = stateRef.current;
      const number = normalizeText(input.number).toUpperCase();
      if (!number) throw new Error("Informe o número do talão.");
      if (!current.references.some((item) => item.id === input.referenceId)) {
        throw new Error("Selecione uma referência válida.");
      }
      if (!Number.isInteger(input.totalPairs) || input.totalPairs <= 0) {
        throw new Error("Informe uma quantidade válida de pares.");
      }
      if (current.booklets.some((item) => item.number === number)) {
        throw new Error("Já existe um talão com esse número.");
      }
      commit({
        ...current,
        booklets: [
          {
            id: crypto.randomUUID(),
            number,
            referenceId: input.referenceId,
            totalPairs: input.totalPairs,
            receivedAt: input.receivedAt,
            status: "OPEN",
          },
          ...current.booklets,
        ],
      });
    },
    [commit],
  );

  const updateBooklet = useCallback(
    (
      bookletId: string,
      input: { number: string; referenceId: string; totalPairs: number; receivedAt: string },
    ) => {
      const current = stateRef.current;
      const number = normalizeText(input.number).toUpperCase();
      if (!number) throw new Error("Informe o número do talão.");
      if (current.booklets.some((item) => item.id !== bookletId && item.number === number)) {
        throw new Error("Já existe um talão com esse número.");
      }
      const targetReference = current.references.find((item) => item.id === input.referenceId);
      if (!targetReference) {
        throw new Error("Selecione uma referência válida.");
      }
      const currentBooklet = current.booklets.find((item) => item.id === bookletId);
      const bookletCompletions = current.completions.filter((item) => item.bookletId === bookletId);
      if (currentBooklet && currentBooklet.referenceId !== input.referenceId && bookletCompletions.length) {
        throw new Error("Não é possível alterar a referência de um talão que já possui apontamentos.");
      }
      if (!Number.isInteger(input.totalPairs) || input.totalPairs <= 0) {
        throw new Error("Informe uma quantidade válida de pares.");
      }
      const maxCompleted = current.completions
        .filter((item) => item.bookletId === bookletId)
        .reduce((max, item) => {
          const operationTotal = current.completions
            .filter(
              (completion) =>
                completion.bookletId === bookletId && completion.operationId === item.operationId,
            )
            .reduce((sum, completion) => sum + completion.quantity, 0);
          return Math.max(max, operationTotal);
        }, 0);
      if (input.totalPairs < maxCompleted) {
        throw new Error(`A quantidade não pode ser menor que ${maxCompleted}, já apontados em uma operação.`);
      }
      const next = {
        ...current,
        booklets: current.booklets.map((item) =>
          item.id === bookletId ? { ...item, ...input, number } : item,
        ),
      };
      commit(withUpdatedBookletStatus(next, bookletId));
    },
    [commit],
  );

  const deleteBooklet = useCallback(
    (bookletId: string) => {
      const current = stateRef.current;
      commit({
        ...current,
        booklets: current.booklets.filter((item) => item.id !== bookletId),
        completions: current.completions.filter((item) => item.bookletId !== bookletId),
      });
    },
    [commit],
  );

  const recordCompletions = useCallback(
    (input: { bookletId: string; userId: string; items: CompletionInput[]; notes: string }) => {
      const current = stateRef.current;
      const booklet = current.booklets.find((item) => item.id === input.bookletId);
      if (!booklet) throw new Error("Selecione um talão válido.");
      const reference = current.references.find((item) => item.id === booklet.referenceId);
      if (!reference) throw new Error("A referência do talão não foi encontrada.");
      const user = current.users.find((item) => item.id === input.userId);
      if (!user?.active) throw new Error("Usuário inválido ou desativado.");
      const items = input.items.filter((item) => item.quantity > 0);
      if (!items.length) throw new Error("Marque ao menos uma operação e informe a quantidade.");

      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error("As quantidades devem ser números inteiros maiores que zero.");
        }
        if (!reference.operations.some((route) => route.operationId === item.operationId)) {
          throw new Error("Uma das operações não pertence à referência do talão.");
        }
        const progress = getOperationProgress(current, booklet.id, item.operationId);
        if (item.quantity > progress.remaining) {
          const operation = current.operations.find((operationItem) => operationItem.id === item.operationId);
          throw new Error(`${operation?.name ?? "Operação"}: restam apenas ${progress.remaining} pares.`);
        }
      }

      const now = new Date().toISOString();
      const next = {
        ...current,
        completions: [
          ...items.map((item) => ({
            id: crypto.randomUUID(),
            bookletId: booklet.id,
            operationId: item.operationId,
            userId: user.id,
            quantity: item.quantity,
            completedAt: now,
            notes: normalizeText(input.notes),
          })),
          ...current.completions,
        ],
      };
      commit(withUpdatedBookletStatus(next, booklet.id));
    },
    [commit],
  );

  const deleteCompletion = useCallback(
    (completionId: string) => {
      const current = stateRef.current;
      const completion = current.completions.find((item) => item.id === completionId);
      if (!completion) return;
      const next = {
        ...current,
        completions: current.completions.filter((item) => item.id !== completionId),
      };
      commit(withUpdatedBookletStatus(next, completion.bookletId));
    },
    [commit],
  );

  const createUser = useCallback(
    (input: UserInput) => {
      const current = stateRef.current;
      const name = normalizeText(input.name);
      const username = normalizeUsername(input.username);
      if (!name) throw new Error("Informe o nome do usuário.");
      if (!username) throw new Error("Informe o usuário de acesso.");
      if (input.password.length < 4) throw new Error("A senha deve ter ao menos 4 caracteres.");
      if (current.users.some((item) => item.username === username)) {
        throw new Error("Já existe uma conta com esse usuário.");
      }
      commit({
        ...current,
        users: [
          ...current.users,
          {
            id: crypto.randomUUID(),
            name,
            username,
            password: input.password,
            role: input.role,
            active: true,
            permissions: normalizePermissions(input.permissions),
          },
        ].sort((a, b) => a.name.localeCompare(b.name)),
      });
    },
    [commit],
  );

  const updateUser = useCallback(
    (userId: string, input: UserInput) => {
      const current = stateRef.current;
      const name = normalizeText(input.name);
      const username = normalizeUsername(input.username);
      if (!name || !username) throw new Error("Informe nome e usuário.");
      if (input.password.length < 4) throw new Error("A senha deve ter ao menos 4 caracteres.");
      if (current.users.some((item) => item.id !== userId && item.username === username)) {
        throw new Error("Já existe uma conta com esse usuário.");
      }
      commit({
        ...current,
        users: current.users.map((item) =>
          item.id === userId
            ? {
                ...item,
                name,
                username,
                password: input.password,
                role: input.role,
                permissions: normalizePermissions(input.permissions),
              }
            : item,
        ),
      });
    },
    [commit],
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      const current = stateRef.current;
      if (userId === currentUserId) throw new Error("Você não pode desativar a conta em uso.");
      commit({
        ...current,
        users: current.users.map((item) =>
          item.id === userId ? { ...item, active: !item.active } : item,
        ),
      });
    },
    [commit, currentUserId],
  );

  const deleteUser = useCallback(
    (userId: string) => {
      const current = stateRef.current;
      if (userId === currentUserId) throw new Error("Você não pode remover a conta em uso.");
      if (current.completions.some((item) => item.userId === userId)) {
        throw new Error("Este usuário possui histórico. Desative a conta para preservar os registros.");
      }
      commit({ ...current, users: current.users.filter((item) => item.id !== userId) });
    },
    [commit, currentUserId],
  );

  const resetDemo = useCallback(() => {
    commit(initialProductionState);
    setCurrentUserId("user-admin");
    window.localStorage.setItem(SESSION_KEY, "user-admin");
  }, [commit]);

  const value = useMemo<ProductionDataContextValue>(
    () => ({
      ...state,
      ready,
      currentUser,
      login,
      logout,
      hasAccess,
      createOperations,
      updateOperation,
      moveOperation,
      deleteOperation,
      createReferencesBatch,
      updateReferenceMeta,
      insertReferenceOperation,
      updateReferenceOperation,
      moveReferenceOperation,
      deleteReferenceOperation,
      deleteReference,
      createBooklet,
      updateBooklet,
      deleteBooklet,
      recordCompletions,
      deleteCompletion,
      createUser,
      updateUser,
      toggleUserStatus,
      deleteUser,
      resetDemo,
    }),
    [
      state,
      ready,
      currentUser,
      login,
      logout,
      hasAccess,
      createOperations,
      updateOperation,
      moveOperation,
      deleteOperation,
      createReferencesBatch,
      updateReferenceMeta,
      insertReferenceOperation,
      updateReferenceOperation,
      moveReferenceOperation,
      deleteReferenceOperation,
      deleteReference,
      createBooklet,
      updateBooklet,
      deleteBooklet,
      recordCompletions,
      deleteCompletion,
      createUser,
      updateUser,
      toggleUserStatus,
      deleteUser,
      resetDemo,
    ],
  );

  return <ProductionDataContext.Provider value={value}>{children}</ProductionDataContext.Provider>;
}

export function useProductionData() {
  const context = useContext(ProductionDataContext);
  if (!context) throw new Error("useProductionData deve ser usado dentro do provider.");
  return context;
}
