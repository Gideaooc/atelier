# Fluxo Terceirizado 0.6

Controle de produção terceirizada para talões recebidos da fábrica, referências, roteiros de operações, valores por par, usuários, permissões, apontamentos e auditoria.

## Novidades desta versão

- menu e tela de auditoria;
- filtros por texto, período, usuário, módulo e ação;
- paginação e ordenação dos logs;
- detalhes com valores anteriores e posteriores;
- registro de login, logout, cadastros, alterações, exclusões, reordenações e pares concluídos;
- permissão `audit.logs`, liberada por padrão somente para administradores;
- GitHub Codespaces configurado para abrir a porta 3000;
- validação automática pelo GitHub Actions;
- migration inicial para PostgreSQL/Supabase com RLS e logs imutáveis.

## Executar no GitHub Codespaces

Ao criar ou reconstruir o Codespace, o ambiente instala as dependências e inicia a aplicação automaticamente.

Execução manual:

```bash
npm install
npm run dev:codespaces
```

Abra a aba **PORTAS** e acesse a porta `3000`.

## Executar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Contas de demonstração

- Administrador: `admin` / `123456`
- Funcionária: `ana` / `123456`

A demonstração continua usando `localStorage` apenas para homologação sem banco. Não deve ser usada com dados reais de clientes.

## Auditoria

O administrador acessa:

```text
Auditoria → Logs do sistema
```

A tela permite pesquisar por usuário, talão, referência, operação, descrição e conteúdo alterado. Os registros mostram o estado anterior e posterior.

## Versão comercial

A estrutura do PostgreSQL está em:

```text
supabase/migrations/202607220001_initial_commercial_schema.sql
```

As instruções completas estão em [docs/MIGRACAO_SUPABASE.md](docs/MIGRACAO_SUPABASE.md).

## Validação

```bash
npm run typecheck
npm run build
```

O workflow `.github/workflows/ci.yml` executa essas verificações em pushes e Pull Requests.

## Publicação

A aplicação pode ser importada na Vercel diretamente pelo repositório GitHub. Para produção comercial, configure as variáveis do Supabase no ambiente da Vercel antes de ativar o modo conectado ao banco.
