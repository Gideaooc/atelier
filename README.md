# Fluxo Terceirizado V5

Demonstração de controle de produção terceirizada para talões recebidos da fábrica, referências, roteiros de operações, valores por par, usuários e conclusão de serviços.

## Executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Contas de demonstração

- Administrador: `admin` / `123456`
- Funcionária: `ana` / `123456`

## Publicar na Vercel

A pasta pode ser enviada pelo Vercel Drop. Ela deve conter diretamente `package.json`, `src`, `public` e `vercel.json`.

## Observação

A demonstração armazena os dados no `localStorage` do navegador. Para uso simultâneo por vários funcionários será necessário conectar banco de dados e autenticação no servidor.
