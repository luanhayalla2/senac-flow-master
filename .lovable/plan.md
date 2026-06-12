# Plano de implementação — Portal Help Desk SENAC-MA

Vou entregar em **4 etapas curtas**, cada uma testável de ponta a ponta. Você aprova essa visão geral e eu começo pela Etapa 1.

## Etapa 1 — Perfil, senha e menus por perfil
- **Nova rota `/perfil`** (Meu Perfil): editar nome completo, matrícula, setor e unidade. Email é só leitura.
- **Nova rota `/senha`** (Alterar Senha): pede senha atual, valida força (8+ com maiúscula/minúscula/número/especial) e usa `supabase.auth.updateUser`.
- **Sidebar reorganizada por perfil** seguindo o spec:
  - **Solicitante:** Dashboard (= Portal), Meus Chamados, Novo Chamado, Meu Perfil, Alterar Senha, Sair.
  - **Técnico (N1/N2/N3):** Dashboard Técnico, Chamados do Meu Nível (= Fila já filtrada pelo nível via `niveis_visiveis`), SLA (nova aba leve em Dashboard), Relatórios, Perfil, Sair.
  - **Admin:** Dashboard Admin, Usuários, Unidades, Setores, Categorias, SLA, Chamados, Relatórios, Auditoria, Segurança, Sair.

## Etapa 2 — Admin: CRUDs e abas
Tudo dentro de `/admin` como abas novas (mantém a aba Usuários e papéis já existente):
- **Unidades** — CRUD da tabela `unidades`.
- **Setores** — nova tabela `setores` (nome, unidade_id) com RLS + GRANT; ligar no `chamados.novo` e `/perfil`.
- **Categorias / Subcategorias** — CRUD com nível N1/N2/N3 e SLA por subcategoria (já existe a tabela).
- **SLA** — visão consolidada (ler/editar `sla_resposta_min` / `sla_solucao_min` por subcategoria).
- **Auditoria** — leitura de `admin_audit_log` + `chamado_historico` com filtros.
- **Segurança** — painel resumo (políticas RLS ativas, últimos eventos de role, status MFA dos usuários).

## Etapa 3 — Segurança corporativa
- **Restrição de e-mail institucional**: validação em `/auth` (cadastro só aceita domínios `@*.senac.br` / `@senacma.com.br` — me confirme a lista exata quando chegarmos lá) e trigger no banco que bloqueia signup fora do domínio permitido.
- **MFA (TOTP)**: nova seção em `/perfil` para inscrever autenticador (`supabase.auth.mfa.enroll` → QR → verify) e desinscrever. Tela de challenge no login quando o usuário tem fator ativo.
- **Política de senha forte** já validada no signup e no `/senha`.
- Ativar `password_hibp_enabled` (proteção contra senhas vazadas).

## Etapa 4 — Exportação CSV + LGPD
- **Export CSV** na lista `/chamados`, `/fila` e em `/admin → Chamados` (botão "Exportar CSV" com os filtros atuais).
- **Página pública `/privacidade`** com política LGPD (controlador, finalidade, base legal, direitos do titular, contato do DPO, cookies). Link no rodapé do `/auth` e no menu Perfil.
- **Consentimento LGPD**: checkbox obrigatório no cadastro com registro em `profiles.lgpd_aceito_em`.

## Detalhes técnicos (referência)
- Migrações novas: `setores` (com GRANT + RLS), `profiles.lgpd_aceito_em timestamptz`, trigger `auth.users` p/ validar domínio, ajustes em `handle_new_user` para gravar consentimento.
- Sidebar: refatorar `src/components/app-sidebar.tsx` em 3 conjuntos de itens conforme o perfil dominante (admin > técnico > solicitante).
- Export CSV no cliente (sem dependência nova; `Blob` + `URL.createObjectURL`).
- MFA usa exclusivamente as APIs nativas do Supabase Auth (sem segredos externos).

## O que **não** está incluso (me avise se quiser)
- App mobile / PWA offline.
- Integração com AD/LDAP do SENAC (SSO SAML pode ser adicionado depois).
- Pesquisa de satisfação automatizada por e-mail (a avaliação dentro do chamado já existe).

---

**Posso começar pela Etapa 1?** Se preferir outra ordem (ex.: começar pela Segurança/MFA), me diga.