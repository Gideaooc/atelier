# Contexto completo do projeto Atelier

> Documento de continuidade para retomar o desenvolvimento em outro chat, com outra pessoa ou após uma pausa.
>
> **Repositório:** `https://github.com/Gideaooc/atelier`  
> **Branch principal:** `main`  
> **Último marco confirmado:** Pull Request `#1` mesclado na `main`  
> **Data deste registro:** 22/07/2026  
> **Versão atual do projeto:** `0.6.0`

---

## 1. Objetivo do projeto

O projeto **Atelier / Fluxo Terceirizado** é uma aplicação web para controlar produção terceirizada de calçados.

O sistema deve permitir o acompanhamento de:

- talões recebidos da fábrica;
- referências de produtos;
- operações e roteiros de produção;
- valores pagos por par;
- usuários e permissões;
- apontamentos de pares concluídos;
- histórico de alterações;
- auditoria por usuário;
- separação de dados por empresa ou ateliê.

O objetivo final é transformar a demonstração atual em um produto comercial, seguro, publicado na internet e utilizável por vários funcionários simultaneamente.

---

## 2. Requisitos funcionais principais

### 2.1 Visão geral

A aplicação possui ou deverá possuir:

- painel inicial;
- gestão de talões;
- gestão da produção;
- cadastros;
- gestão de usuários;
- permissões de acesso;
- auditoria;
- autenticação real;
- banco PostgreSQL;
- publicação web.

### 2.2 Auditoria

Foi solicitado e implementado um módulo de auditoria com o mesmo padrão visual da aplicação.

A auditoria deve registrar, entre outros eventos:

- login;
- logout;
- criação de registros;
- edição de registros;
- exclusão de registros;
- alteração de nome;
- alteração de preço;
- alteração de roteiro;
- criação e edição de talão;
- marcação de pares concluídos;
- exclusão de apontamentos;
- criação de usuário;
- edição de usuário;
- ativação ou desativação de usuário;
- alteração de permissões.

Os registros devem identificar:

- data e hora;
- usuário responsável;
- ação;
- módulo;
- tipo de entidade;
- registro afetado;
- descrição;
- valores anteriores;
- valores posteriores.

Na versão comercial, logs não podem ser editados ou excluídos pela interface.

### 2.3 Filtros da auditoria

A tela de auditoria foi criada com recursos de navegação e consulta, incluindo:

- pesquisa textual;
- filtro por período;
- filtro por usuário;
- filtro por módulo;
- filtro por ação;
- ordenação;
- paginação;
- contador de resultados;
- botão para limpar filtros;
- visualização de antes e depois.

### 2.4 Permissões

O projeto já utiliza uma estrutura de permissões por área e ação.

O módulo de auditoria deve seguir esta regra:

- administrador: pode visualizar os logs;
- usuário comum: bloqueado por padrão;
- nenhum usuário pode editar ou excluir logs;
- o servidor e o banco deverão validar as permissões;
- esconder menus no frontend não é segurança suficiente.

---

## 3. Estado atual confirmado

### Concluído

- [x] Repositório disponibilizado publicamente no GitHub.
- [x] Projeto executado pelo GitHub Codespaces.
- [x] Node.js 22 configurado no ambiente.
- [x] `npm install` executado.
- [x] `npm run typecheck` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Tela de auditoria criada.
- [x] Menu de auditoria criado.
- [x] Filtros da auditoria criados.
- [x] Permissão da auditoria incluída.
- [x] Estrutura inicial para PostgreSQL/Supabase incluída.
- [x] Migration SQL inicial incluída.
- [x] Configuração de GitHub Codespaces incluída.
- [x] GitHub Actions incluído.
- [x] Pull Request `#1` criado.
- [x] Verificações do GitHub Actions concluídas.
- [x] Pull Request mesclado na `main`.
- [x] Codespace atualizado com a `main`.

### Ainda não concluído

- [ ] Criar projeto no Supabase.
- [ ] Executar a migration no Supabase.
- [ ] Instalar os pacotes oficiais do Supabase no projeto.
- [ ] Configurar variáveis de ambiente reais.
- [ ] Implementar autenticação real.
- [ ] Remover as credenciais demonstrativas.
- [ ] Migrar usuários para o PostgreSQL.
- [ ] Migrar operações para o PostgreSQL.
- [ ] Migrar referências e roteiros para o PostgreSQL.
- [ ] Migrar talões para o PostgreSQL.
- [ ] Migrar apontamentos de produção para o PostgreSQL.
- [ ] Migrar auditoria para o PostgreSQL.
- [ ] Remover o `localStorage` como armazenamento principal.
- [ ] Testar isolamento entre organizações.
- [ ] Publicar ambiente de homologação.
- [ ] Publicar ambiente de produção.
- [ ] Configurar domínio.
- [ ] Criar documentos legais e operacionais.

---

## 4. Stack atual

O projeto utiliza:

- Next.js `16.2.10`;
- React `19.2.4`;
- React DOM `19.2.4`;
- TypeScript `5.9.3`;
- Tailwind CSS `4.3.3`;
- Lucide React;
- Sonner;
- Node.js `22.x`;
- npm;
- Next.js App Router.

Scripts disponíveis:

```bash
npm run dev
npm run dev:codespaces
npm run typecheck
npm run build
npm run start
npm run check
```

O comando `npm run check` executa:

```bash
npm run typecheck && npm run build
```

---

## 5. Arquivos importantes

### Aplicação

```text
src/app/
src/components/
src/lib/
```

### Auditoria

```text
src/app/app/auditoria/page.tsx
src/lib/audit.ts
```

### Estado e modo de demonstração

```text
src/components/providers/production-data-provider.tsx
src/lib/demo-data.ts
```

### Layout e menus

```text
src/components/app-shell.tsx
```

### Configuração do ambiente

```text
package.json
package-lock.json
next.config.ts
tsconfig.json
.env.example
.gitignore
```

### Codespaces

```text
.devcontainer/devcontainer.json
```

### GitHub Actions

```text
.github/workflows/ci.yml
```

### Supabase e PostgreSQL

```text
supabase/migrations/202607220001_initial_commercial_schema.sql
docs/MIGRACAO_SUPABASE.md
docs/supabase-examples/client.ts.example
docs/supabase-examples/server.ts.example
docs/supabase-examples/proxy.ts.example
```

---

## 6. Funcionamento atual

A versão atual ainda é uma demonstração.

Os dados principais são armazenados no:

```text
localStorage
```

Isso permite validar a interface sem banco, mas não é adequado para produção porque:

- os dados ficam presos ao navegador;
- computadores diferentes não compartilham os dados;
- limpar o navegador pode apagar informações;
- usuários podem alterar dados pelo console do navegador;
- permissões do frontend podem ser contornadas;
- não existe persistência centralizada;
- não existe backup confiável;
- não existe isolamento seguro entre empresas.

### Contas demonstrativas

```text
Administrador: admin / 123456
Funcionária: ana / 123456
```

Essas credenciais são apenas para demonstração e deverão ser removidas.

---

## 7. Arquitetura comercial definida

A arquitetura escolhida é:

```text
Next.js
   |
   |-- interface
   |-- Server Actions ou Route Handlers
   |-- autenticação e sessão
   |-- validação de permissões
   |
   +--> Supabase
          |-- PostgreSQL
          |-- Supabase Auth
          |-- Row Level Security
          |-- auditoria
          |-- armazenamento futuro, se necessário
```

### Conceitos

- **PostgreSQL/Postgres:** banco de dados relacional.
- **Supabase:** plataforma que fornece PostgreSQL gerenciado, autenticação, APIs e recursos de segurança.
- **Neon:** outra opção de PostgreSQL gerenciado.
- A decisão inicial foi usar Supabase porque o projeto precisa de banco, login e controle de acesso integrados.

---

## 8. Estratégia multiempresa

O sistema deve ser preparado para atender vários ateliês.

Cada registro de negócio deve possuir:

```text
organization_id
```

Esse campo deverá separar:

- usuários;
- permissões;
- operações;
- referências;
- roteiros;
- talões;
- apontamentos;
- logs.

Nenhuma empresa pode acessar dados de outra empresa.

Essa separação deverá ser garantida por:

- relacionamentos no banco;
- políticas de Row Level Security;
- validações no servidor;
- testes automatizados.

---

## 9. Banco de dados preparado

A migration inicial está em:

```text
supabase/migrations/202607220001_initial_commercial_schema.sql
```

Ela prepara estruturas relacionadas a:

- organizações;
- perfis;
- permissões;
- operações;
- referências;
- roteiros;
- talões;
- apontamentos;
- logs de auditoria;
- políticas de segurança;
- gatilhos de auditoria.

Antes de executar a migration em produção:

1. revisar o SQL;
2. executar primeiro em ambiente de desenvolvimento;
3. validar tabelas e políticas;
4. criar um administrador de teste;
5. testar acesso com usuário sem permissão;
6. testar isolamento entre duas organizações.

---

## 10. Segurança

### Regras obrigatórias

- Nunca enviar `.env.local` ao Git.
- Nunca colocar senha do banco no repositório.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- Nunca usar `service_role` em variável `NEXT_PUBLIC_*`.
- Nunca registrar senhas nos logs.
- Nunca confiar apenas em permissões visuais.
- Validar ações no servidor.
- Aplicar Row Level Security.
- Manter logs de auditoria imutáveis.
- Revogar qualquer chave exposta por engano.
- Não compartilhar chaves ou senhas em chats ou capturas de tela.

### Variáveis previstas

O arquivo `.env.example` deverá servir apenas como modelo:

```env
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_PRIVADA_DE_SERVIDOR
```

A chave privada só pode ser utilizada em código executado no servidor.

---

## 11. Próxima etapa imediata

### Etapa 1 — criar projeto no Supabase

Criar um projeto gratuito com:

```text
Nome sugerido: atelier-prod
Plano: Free
Região: mais próxima do público principal
```

Guardar a senha do banco em um gerenciador seguro.

Não enviar a senha ou chaves no chat.

### Etapa 2 — executar migration

Pelo painel:

1. abrir o SQL Editor;
2. copiar o conteúdo da migration;
3. executar;
4. revisar possíveis erros;
5. conferir as tabelas criadas.

Migration:

```text
supabase/migrations/202607220001_initial_commercial_schema.sql
```

### Etapa 3 — instalar integração Supabase

Criar uma nova branch:

```bash
git checkout main
git pull origin main
git checkout -b feat/supabase-auth
```

Instalar:

```bash
npm install @supabase/ssr @supabase/supabase-js
```

Criar:

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/proxy.ts
```

Usar como referência:

```text
docs/supabase-examples/
```

### Etapa 4 — autenticação real

Implementar:

- login com e-mail e senha;
- logout;
- sessão em cookies;
- recuperação de senha;
- troca de senha;
- bloqueio de usuário inativo;
- carregamento do perfil;
- carregamento das permissões.

Remover gradualmente:

```text
admin / 123456
ana / 123456
```

### Etapa 5 — migração módulo por módulo

Ordem recomendada:

1. autenticação;
2. perfil e permissões;
3. operações;
4. referências;
5. roteiros;
6. talões;
7. produção;
8. usuários;
9. auditoria;
10. remoção do provider demonstrativo.

Não migrar tudo de uma vez sem manter uma versão funcional.

---

## 12. Auditoria comercial

Na demonstração, os logs ainda podem estar no navegador.

Na versão comercial:

- alterações de dados devem gerar logs no PostgreSQL;
- triggers podem registrar alterações em tabelas;
- login e logout devem gerar eventos específicos;
- logs devem ter organização;
- logs devem ter usuário;
- logs devem guardar antes e depois;
- logs não devem guardar senha;
- logs não podem ser alterados pela interface;
- consulta deve exigir permissão;
- exclusão deve ser bloqueada para usuários comuns.

Permissão prevista:

```text
audit.logs.view
```

---

## 13. Desenvolvimento online

O desenvolvimento pode ser feito inteiramente pelo GitHub Codespaces.

### Iniciar

No repositório:

```text
Code -> Codespaces -> Create codespace
```

### Configurar Node

```bash
nvm install 22
nvm use 22
```

### Instalar e executar

```bash
npm install
npm run typecheck
npm run dev:codespaces
```

### Acessar

1. abrir a aba `PORTAS`;
2. localizar a porta `3000`;
3. selecionar `Open in Browser`.

### Porta ocupada

Ver processos:

```bash
ps aux | grep "next dev"
```

Encerrar processo específico:

```bash
kill NUMERO_DO_PID
```

### Erro de hydration

Foi observado um erro de hydration relacionado a um elemento externo com identificação semelhante a:

```text
esg_atica
```

A hipótese é interferência de extensão do navegador.

Testar:

- janela anônima;
- extensões desabilitadas;
- outro navegador.

Se `GET / 200` aparecer e o sistema funcionar, confirmar primeiro se a origem é uma extensão antes de alterar o código.

---

## 14. Fluxo Git recomendado

Nunca trabalhar diretamente na `main`.

### Criar branch

```bash
git checkout main
git pull origin main
git checkout -b feat/nome-da-funcionalidade
```

### Validar

```bash
npm run typecheck
npm run build
git diff --check
git status --short
```

### Commit

```bash
git add .
git commit -m "feat: descrição objetiva"
git push -u origin feat/nome-da-funcionalidade
```

### Pull Request

- base: `main`;
- compare: branch criada;
- aguardar GitHub Actions;
- fazer merge apenas com verificações verdes;
- atualizar o Codespace depois do merge.

```bash
git checkout main
git pull origin main
```

---

## 15. GitHub Actions

Foi criada uma automação em:

```text
.github/workflows/ci.yml
```

A automação deve validar alterações antes do merge.

Antes de aceitar um Pull Request:

- verificar se todas as etapas passaram;
- não fazer merge com erro de TypeScript;
- não fazer merge com build quebrado;
- revisar arquivos inesperados;
- verificar se nenhum segredo entrou no commit.

---

## 16. Publicação

### Homologação

Primeiro publicar um ambiente de testes.

Objetivos:

- validar login;
- validar banco;
- validar permissões;
- validar auditoria;
- validar uso simultâneo;
- validar telas em celular e computador.

### Produção

Publicação prevista:

```text
GitHub -> Vercel -> Supabase
```

Na hospedagem, configurar:

- variáveis de ambiente;
- domínio;
- logs;
- monitoramento;
- política de deploy;
- ambiente de produção separado de testes.

### Atenção

A versão atual pode ser publicada como demonstração, mas não deve ser vendida como produto final enquanto depender do `localStorage` e das credenciais demonstrativas.

---

## 17. Testes mínimos para produção

### Autenticação

- login válido;
- login inválido;
- logout;
- sessão expirada;
- recuperação de senha;
- usuário inativo.

### Permissões

- administrador acessa usuários;
- funcionário não acessa usuários, quando bloqueado;
- administrador acessa auditoria;
- funcionário não acessa auditoria, quando bloqueado;
- chamadas diretas ao servidor também são bloqueadas.

### Dados

- criar;
- editar;
- excluir;
- validar campos obrigatórios;
- impedir duplicidade;
- impedir quantidade inválida.

### Produção

- marcar pares;
- impedir quantidade acima do total;
- excluir apontamento autorizado;
- recalcular totais;
- registrar auditoria.

### Multiempresa

- empresa A não vê empresa B;
- usuário A não altera dados de B;
- filtros e relatórios respeitam a organização.

### Auditoria

- preço antes e depois;
- nome antes e depois;
- pares marcados;
- usuário responsável;
- data correta;
- logs não editáveis;
- logs não excluíveis.

---

## 18. Critérios para considerar comercial

O projeto só deverá ser tratado como comercial quando:

- [ ] não depender de `localStorage`;
- [ ] possuir autenticação real;
- [ ] possuir recuperação de senha;
- [ ] possuir banco centralizado;
- [ ] possuir isolamento multiempresa;
- [ ] possuir permissões no servidor;
- [ ] possuir auditoria no banco;
- [ ] possuir backup;
- [ ] possuir monitoramento;
- [ ] possuir ambiente de homologação;
- [ ] possuir ambiente de produção;
- [ ] possuir testes;
- [ ] possuir documentação;
- [ ] possuir política de privacidade;
- [ ] possuir termos de uso;
- [ ] possuir canal de suporte;
- [ ] possuir processo de restauração.

---

## 19. Itens legais e operacionais

Antes da venda:

- Política de Privacidade;
- Termos de Uso;
- definição do controlador dos dados;
- definição dos fornecedores;
- processo de exclusão de dados;
- processo de exportação;
- política de retenção;
- resposta a incidentes;
- rotina de backup;
- rotina de restauração;
- canal de suporte;
- gestão de licenças e dependências.

---

## 20. Decisões tomadas

### Supabase em vez de apenas PostgreSQL isolado

Motivo:

- PostgreSQL gerenciado;
- autenticação integrada;
- políticas de acesso;
- APIs;
- menor esforço inicial;
- adequado ao piloto.

### Codespaces

Motivo:

- máquina local possui restrições de firewall;
- permite desenvolver pelo navegador;
- permite executar Node.js;
- facilita testes e commits.

### Auditoria

Motivo:

- rastrear alterações;
- identificar usuário responsável;
- registrar alteração de preços;
- registrar pares concluídos;
- melhorar governança;
- preparar o produto para uso comercial.

### Migração gradual

Motivo:

- reduzir risco;
- manter a demonstração funcionando;
- permitir validação por módulo;
- facilitar rollback.

---

## 21. Preferências de condução do projeto

Para continuar o trabalho:

- fornecer instruções objetivas;
- avançar uma etapa por vez;
- informar quando comandos podem ser colados juntos;
- validar a saída antes do próximo passo;
- não enviar grandes blocos desnecessários;
- não presumir que uma etapa foi concluída sem confirmação;
- revisar segurança antes de commits;
- evitar pedir senhas e chaves;
- manter o layout atual sempre que possível.

---

## 22. Instruções para um novo chat ou novo desenvolvedor

Ao retomar:

1. ler este arquivo inteiro;
2. abrir o repositório;
3. conferir a branch `main`;
4. verificar o último commit;
5. executar `git status`;
6. executar `npm install`;
7. executar `npm run typecheck`;
8. executar `npm run build`;
9. confirmar se o Supabase já foi criado;
10. continuar pela primeira tarefa não concluída.

Mensagem sugerida para iniciar outro chat:

```text
Leia primeiro o arquivo docs/CONTEXTO_PROJETO.md do repositório
https://github.com/Gideaooc/atelier

Continue o projeto a partir do status registrado nesse arquivo.
Antes de sugerir alterações, confira a branch main e os arquivos atuais.
Conduza uma etapa por vez e seja objetivo.
```

---

## 23. Comandos de diagnóstico

```bash
git status
git branch --show-current
git log --oneline -5
node --version
npm --version
npm run typecheck
npm run build
```

Pesquisar referências ao modo demonstrativo:

```bash
grep -RniE "localStorage|123456|demo-data|ProductionDataProvider" src
```

Pesquisar auditoria:

```bash
grep -RniE "auditoria|audit|logs" src supabase
```

Pesquisar variáveis públicas e privadas:

```bash
grep -RniE "SUPABASE|NEXT_PUBLIC" .env.example src docs
```

Não executar comandos que mostrem o conteúdo de `.env.local` em capturas de tela ou chats.

---

## 24. Próxima tarefa objetiva

A próxima tarefa é:

```text
Criar o projeto gratuito no Supabase e executar a migration inicial.
```

Depois:

```text
Criar a branch feat/supabase-auth e implementar autenticação real.
```

---

## 25. Observação final

Este arquivo deve ser atualizado após cada marco importante.

Exemplos:

- Supabase criado;
- migration aplicada;
- autenticação concluída;
- primeiro módulo migrado;
- homologação publicada;
- produção publicada.

Manter no topo:

- versão atual;
- último Pull Request;
- data;
- etapa atual;
- próxima tarefa.
