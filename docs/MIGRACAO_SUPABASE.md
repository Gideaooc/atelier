# Migração comercial para PostgreSQL/Supabase

A versão `0.6.0` mantém o modo de demonstração no navegador para permitir validação imediata no GitHub Codespaces. A estrutura comercial do PostgreSQL já está preparada em:

```text
supabase/migrations/202607220001_initial_commercial_schema.sql
```

O arquivo cria:

- organizações para separar os dados de cada ateliê;
- perfis e permissões por usuário;
- operações;
- referências e roteiros;
- talões;
- apontamentos de produção;
- logs de auditoria imutáveis;
- políticas de Row Level Security;
- gatilhos de auditoria executados no PostgreSQL.

## 1. Criar o projeto no Supabase

1. Crie um projeto no painel do Supabase.
2. Guarde a URL do projeto e a chave publicável.
3. Não coloque a chave `service_role` em variáveis iniciadas por `NEXT_PUBLIC_`.

## 2. Aplicar o banco

Opção pelo painel:

1. Abra **SQL Editor**.
2. Copie o conteúdo da migration.
3. Execute o script.

Opção pela CLI:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

## 3. Criar o primeiro administrador

1. Crie um usuário no Supabase Auth usando e-mail e senha.
2. Entre com esse usuário na aplicação comercial.
3. Execute uma vez a função abaixo usando a sessão autenticada:

```sql
select public.bootstrap_organization(
  'Nome do ateliê',
  'admin',
  'Administrador'
);
```

A função cria a organização e o perfil proprietário com todas as permissões. O log da criação é gravado automaticamente.

## 4. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE
```

A `SUPABASE_SERVICE_ROLE_KEY` deve ser usada apenas no servidor para tarefas administrativas, como criar contas no Supabase Auth. Nunca importe essa variável em Client Components.

## 5. Integração Next.js

Antes de ativar `NEXT_PUBLIC_DATA_MODE=supabase`, instale:

```bash
npm install @supabase/ssr @supabase/supabase-js
```

Os exemplos iniciais estão em:

```text
docs/supabase-examples/client.ts.example
docs/supabase-examples/server.ts.example
docs/supabase-examples/proxy.ts.example
```

Na fase de conexão, eles devem ser copiados para:

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/proxy.ts
```

## 6. Regras de auditoria

Na demonstração, os logs são gerados pelo provider e persistidos no `localStorage`.

Na versão comercial:

- os logs de dados são gravados por triggers do PostgreSQL;
- login e logout devem chamar `record_auth_audit('LOGIN')` e `record_auth_audit('LOGOUT')` (antes de encerrar a sessão);
- usuários autenticados não possuem permissão de inserir, editar ou excluir logs;
- somente usuários com `audit.logs.view` podem consultar;
- alterações armazenam os valores anteriores e posteriores em JSON;
- o campo `organization_id` impede que uma empresa veja os dados de outra.

## 7. Ordem recomendada da conexão

1. autenticação e sessão em cookies;
2. leitura do perfil e das permissões;
3. operações e referências;
4. talões;
5. apontamentos de produção;
6. usuários via Route Handler protegido;
7. leitura dos logs de auditoria;
8. remoção definitiva do provider de demonstração.

A troca deve ser feita módulo por módulo, mantendo uma branch estável de demonstração durante a homologação.
