export type PermissionArea =
  | "dashboard.summary"
  | "dashboard.filters"
  | "dashboard.bookletList"
  | "dashboard.details"
  | "booklets.form"
  | "booklets.list"
  | "booklets.actions"
  | "production.selector"
  | "production.entry"
  | "production.history"
  | "operations.batch"
  | "operations.list"
  | "references.batch"
  | "references.list"
  | "references.route"
  | "users.list"
  | "users.form"
  | "users.permissions"
  | "audit.logs";

export type AccessMode = "view" | "edit";

export type AreaPermission = {
  view: boolean;
  edit: boolean;
};

export type PermissionMap = Record<PermissionArea, AreaPermission>;

export type PermissionRegionDefinition = {
  key: PermissionArea;
  label: string;
  description: string;
  readOnly?: boolean;
};

export type PermissionMenuDefinition = {
  key: "dashboard" | "booklets" | "production" | "cadastros" | "users" | "audit";
  label: string;
  description: string;
  regions: PermissionRegionDefinition[];
};

export const permissionMenus: PermissionMenuDefinition[] = [
  {
    key: "dashboard",
    label: "Visão geral",
    description: "Acompanhamento resumido da produção",
    regions: [
      { key: "dashboard.summary", label: "Indicadores", description: "Totais de talões, pares e operações" },
      { key: "dashboard.filters", label: "Filtros", description: "Pesquisa, referência e período" },
      { key: "dashboard.bookletList", label: "Lista de talões", description: "Talões e andamento resumido" },
      { key: "dashboard.details", label: "Detalhes do talão", description: "Operações, saldos e participantes" },
    ],
  },
  {
    key: "booklets",
    label: "Talões",
    description: "Entrada dos serviços enviados pela fábrica",
    regions: [
      { key: "booklets.form", label: "Cadastro de talão", description: "Número, referência, quantidade e data" },
      { key: "booklets.list", label: "Lista de talões", description: "Consulta e progresso dos talões" },
      { key: "booklets.actions", label: "Ações do talão", description: "Editar e remover talões" },
    ],
  },
  {
    key: "production",
    label: "Conclusão de serviço",
    description: "Registro das operações realizadas",
    regions: [
      { key: "production.selector", label: "Seleção do talão", description: "Pesquisa e escolha do serviço" },
      { key: "production.entry", label: "Lançamento de produção", description: "Operações e quantidades concluídas" },
      { key: "production.history", label: "Histórico", description: "Funcionários, operações e quantidades" },
    ],
  },
  {
    key: "cadastros",
    label: "Cadastros",
    description: "Operações, referências e roteiros",
    regions: [
      { key: "operations.batch", label: "Operações · cadastro em lote", description: "Digitação e prévia automática" },
      { key: "operations.list", label: "Operações · lista", description: "Consulta, edição e exclusão" },
      { key: "references.batch", label: "Referências · cadastro em lote", description: "Código e descrição" },
      { key: "references.list", label: "Referências · lista e dados", description: "Consulta e edição da referência" },
      { key: "references.route", label: "Referências · roteiro", description: "Operações, ordem e valor por par" },
    ],
  },
  {
    key: "users",
    label: "Usuários",
    description: "Contas e regras de acesso",
    regions: [
      { key: "users.list", label: "Lista de usuários", description: "Consulta, ativação e exclusão" },
      { key: "users.form", label: "Dados da conta", description: "Nome, usuário, senha e perfil" },
      { key: "users.permissions", label: "Permissões", description: "Acesso por menu e região" },
    ],
  },
  {
    key: "audit",
    label: "Auditoria",
    description: "Rastreabilidade das alterações realizadas",
    regions: [
      {
        key: "audit.logs",
        label: "Logs do sistema",
        description: "Consulta de acessos, cadastros, edições, exclusões e apontamentos",
        readOnly: true,
      },
    ],
  },
];

export const permissionAreas = permissionMenus.flatMap((menu) =>
  menu.regions.map((region) => ({ ...region, group: menu.label })),
);

export type UserRole = "ADMIN" | "USER";

export type UserAccount = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  active: boolean;
  permissions: PermissionMap;
};

export type Operation = {
  id: string;
  name: string;
};

export type ReferenceOperation = {
  operationId: string;
  pricePerPair: number;
};

export type ProductReference = {
  id: string;
  code: string;
  description: string;
  operations: ReferenceOperation[];
};

export type BookletStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED";

export type Booklet = {
  id: string;
  number: string;
  referenceId: string;
  totalPairs: number;
  receivedAt: string;
  status: BookletStatus;
};

export type Completion = {
  id: string;
  bookletId: string;
  operationId: string;
  userId: string;
  quantity: number;
  completedAt: string;
  notes: string;
};

export type AuditModule =
  | "AUTH"
  | "OPERATIONS"
  | "REFERENCES"
  | "BOOKLETS"
  | "PRODUCTION"
  | "USERS"
  | "SYSTEM";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "REORDER"
  | "COMPLETE"
  | "RESET";

export type AuditPayload = Record<string, unknown> | null;

export type AuditLog = {
  id: string;
  actorUserId: string | null;
  actorName: string;
  action: AuditAction;
  module: AuditModule;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  description: string;
  before: AuditPayload;
  after: AuditPayload;
  createdAt: string;
};

export type ProductionState = {
  users: UserAccount[];
  operations: Operation[];
  references: ProductReference[];
  booklets: Booklet[];
  completions: Completion[];
  auditLogs: AuditLog[];
};

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  USER: "Usuário",
};

export const auditModuleLabels: Record<AuditModule, string> = {
  AUTH: "Acesso",
  OPERATIONS: "Operações",
  REFERENCES: "Referências",
  BOOKLETS: "Talões",
  PRODUCTION: "Produção",
  USERS: "Usuários",
  SYSTEM: "Sistema",
};

export const auditActionLabels: Record<AuditAction, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  CREATE: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
  STATUS_CHANGE: "Mudança de status",
  REORDER: "Reordenação",
  COMPLETE: "Pares concluídos",
  RESET: "Restauração",
};

const allPermissionKeys = permissionMenus.flatMap((menu) => menu.regions.map((region) => region.key));

export function createEmptyPermissions(): PermissionMap {
  return Object.fromEntries(
    allPermissionKeys.map((key) => [key, { view: false, edit: false }]),
  ) as PermissionMap;
}

export function createAdminPermissions(): PermissionMap {
  return Object.fromEntries(
    allPermissionKeys.map((key) => [
      key,
      { view: true, edit: key !== "audit.logs" },
    ]),
  ) as PermissionMap;
}

export function createWorkerPermissions(): PermissionMap {
  const permissions = createEmptyPermissions();
  permissions["dashboard.summary"] = { view: true, edit: false };
  permissions["dashboard.filters"] = { view: true, edit: false };
  permissions["dashboard.bookletList"] = { view: true, edit: false };
  permissions["dashboard.details"] = { view: true, edit: false };
  permissions["booklets.list"] = { view: true, edit: false };
  permissions["production.selector"] = { view: true, edit: false };
  permissions["production.entry"] = { view: true, edit: true };
  permissions["production.history"] = { view: true, edit: false };
  return permissions;
}

const operations: Operation[] = [
  { id: "op-corte", name: "Corte" },
  { id: "op-preparacao", name: "Preparação" },
  { id: "op-cola", name: "Passar cola" },
  { id: "op-costura", name: "Costura" },
  { id: "op-refilado", name: "Refilado" },
  { id: "op-revisao", name: "Revisão" },
];

export const initialProductionState: ProductionState = {
  users: [
    {
      id: "user-admin",
      name: "Administrador Demo",
      username: "admin",
      password: "123456",
      role: "ADMIN",
      active: true,
      permissions: createAdminPermissions(),
    },
    {
      id: "user-ana",
      name: "Ana Souza",
      username: "ana",
      password: "123456",
      role: "USER",
      active: true,
      permissions: createWorkerPermissions(),
    },
    {
      id: "user-joao",
      name: "João Lima",
      username: "joao",
      password: "123456",
      role: "USER",
      active: true,
      permissions: createWorkerPermissions(),
    },
  ],
  operations,
  references: [
    {
      id: "ref-102030",
      code: "102030",
      description: "Tênis infantil linha casual",
      operations: [
        { operationId: "op-corte", pricePerPair: 0.45 },
        { operationId: "op-preparacao", pricePerPair: 0.65 },
        { operationId: "op-cola", pricePerPair: 0.35 },
        { operationId: "op-costura", pricePerPair: 1.25 },
        { operationId: "op-refilado", pricePerPair: 0.3 },
        { operationId: "op-revisao", pricePerPair: 0.2 },
      ],
    },
    {
      id: "ref-204050",
      code: "204050",
      description: "Sandália infantil verão",
      operations: [
        { operationId: "op-corte", pricePerPair: 0.4 },
        { operationId: "op-preparacao", pricePerPair: 0.55 },
        { operationId: "op-costura", pricePerPair: 1.1 },
        { operationId: "op-revisao", pricePerPair: 0.2 },
      ],
    },
  ],
  booklets: [
    {
      id: "booklet-3",
      number: "3",
      referenceId: "ref-102030",
      totalPairs: 100,
      receivedAt: "2026-07-15",
      status: "IN_PROGRESS",
    },
    {
      id: "booklet-4",
      number: "4",
      referenceId: "ref-204050",
      totalPairs: 12,
      receivedAt: "2026-07-16",
      status: "OPEN",
    },
  ],
  completions: [
    {
      id: "completion-1",
      bookletId: "booklet-3",
      operationId: "op-costura",
      userId: "user-ana",
      quantity: 10,
      completedAt: "2026-07-16T10:30:00.000Z",
      notes: "",
    },
    {
      id: "completion-2",
      bookletId: "booklet-3",
      operationId: "op-corte",
      userId: "user-ana",
      quantity: 60,
      completedAt: "2026-07-15T17:00:00.000Z",
      notes: "",
    },
    {
      id: "completion-3",
      bookletId: "booklet-3",
      operationId: "op-corte",
      userId: "user-joao",
      quantity: 40,
      completedAt: "2026-07-15T17:20:00.000Z",
      notes: "",
    },
  ],
  auditLogs: [
    {
      id: "audit-demo-start",
      actorUserId: null,
      actorName: "Sistema",
      action: "CREATE",
      module: "SYSTEM",
      entityType: "demo",
      entityId: null,
      entityLabel: "Ambiente de demonstração",
      description: "Dados iniciais da demonstração foram carregados.",
      before: null,
      after: { version: "0.6.0", storage: "localStorage" },
      createdAt: "2026-07-15T08:00:00.000Z",
    },
  ],
};
