# Aplicar a atualização 0.6 no Codespaces

1. Baixe `atelier-v0.6-auditoria-comercial.zip` da conversa.
2. Arraste o ZIP para a raiz do projeto no Explorador do Codespaces.
3. Confirme que está na branch `feat/auditoria`.
4. Execute os comandos abaixo no terminal:

```bash
rm -rf /tmp/atelier-v06
mkdir -p /tmp/atelier-v06
unzip -o atelier-v0.6-auditoria-comercial.zip -d /tmp/atelier-v06
cp -a /tmp/atelier-v06/. .
rm -f atelier-v0.6-auditoria-comercial.zip
npm install
npm run typecheck
npm run dev:codespaces
```

5. Abra a aba **PORTAS** e acesse a porta `3000`.
6. Entre com `admin` / `123456`.
7. Valide o menu **Auditoria** e os filtros.
8. Depois de validar:

```bash
git status
git add .
git commit -m "feat: adiciona auditoria e base comercial PostgreSQL"
git push
```

Não execute a migration do Supabase antes de criar o projeto e revisar as variáveis descritas em `docs/MIGRACAO_SUPABASE.md`.
