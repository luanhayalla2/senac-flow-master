## SENAC Service Desk Enterprise — Plano do MVP

Sistema corporativo de Service Desk com classificação automática N1/N2/N3, SLA, filas, escalonamento e auditoria, seguindo o fluxo operacional especificado.

### 1. Infraestrutura
- Ativar **Lovable Cloud** (auth + Postgres + RLS).
- Autenticação por **e-mail/senha** (login institucional) + Google opcional depois.
- Tabela `profiles` (nome, matrícula, unidade, setor) ligada a `auth.users`.
- Tabela `user_roles` com enum `app_role`: `solicitante | tecnico_n1 | tecnico_n2 | tecnico_n3 | coordenador | gestor | admin`.
- Função `has_role()` SECURITY DEFINER + função `get_user_level()` para roteamento.

### 2. Modelo de dados
- `unidades` (unidades SENAC-MA)
- `categorias` e `subcategorias` (cada subcategoria já carrega `nivel` N1/N2/N3, SLA de resposta e de solução — fonte da classificação automática)
- `chamados`: número (CH-2026-NNNNNN), título, descrição, solicitante, unidade, setor, categoria, subcategoria, prioridade, **nivel** (derivado da subcategoria), **status** (Aberto, Em Atendimento, Escalonado, Resolvido, Fechado, Reaberto), tecnico_responsavel, SLA resposta/solução, datas
- `chamado_historico` (toda mudança de status, atribuição, escalonamento — auditoria)
- `chamado_anexos` (storage)
- `avaliacoes` (5 estrelas em 5 dimensões)
- RLS rígido conforme regras: técnico só vê fila do seu nível; coordenador vê unidade; admin vê tudo.

### 3. Identidade visual — SENAC oficial
- Paleta institucional: **laranja SENAC** (`#F57C00` aprox) como primary, **azul SENAC** (`#003B71`) como secondary, neutros corporativos.
- Tipografia: Inter (corpo) + Montserrat (títulos) — sóbria e corporativa.
- Tokens oklch em `src/styles.css`, dark mode incluído.
- Componentes Shadcn + variantes customizadas (botões `senac`, badges de nível N1/N2/N3, badges de SLA).
- Sidebar institucional com cabeçalho SENAC e indicador de perfil.

### 4. Telas (rotas TanStack)
Públicas:
- `/auth` — login + cadastro institucional

Protegidas (`/_authenticated/`):
- `/portal` — Portal de Serviços (home do solicitante: meus chamados, abrir novo, base de conhecimento resumida)
- `/chamados/novo` — wizard de abertura em 4 passos (Identificação → Categoria → Problema → Confirmação) com classificação automática visível
- `/chamados` — lista com filtros (status, nível, unidade, SLA)
- `/chamados/$id` — detalhes, histórico, comentários, escalonamento, resolução, validação, avaliação
- `/fila` — fila do técnico (N1/N2/N3) com SLA em tempo real
- `/dashboard` — indicadores: chamados abertos, em SLA, vencidos, por nível, por unidade (Recharts)
- `/admin/categorias`, `/admin/unidades`, `/admin/usuarios` — gestão (admin)
- `/auditoria` — log de ações (admin/gestor)

### 5. Lógica do fluxo (server functions)
- `abrir_chamado`: gera número, identifica nível pela subcategoria, calcula SLA, enfileira.
- `atribuir_automaticamente`: técnico do nível com menor carga na unidade.
- `iniciar_atendimento`, `escalonar` (com motivo obrigatório, registra histórico), `resolver`, `validar`, `fechar`, `reabrir`.
- `monitor_sla`: cálculo em tempo real no frontend a partir de `aberto_em` + SLA da subcategoria; flag visual quando perto/vencido.

### 6. Regras de negócio aplicadas
Todas as 10 regras viram políticas RLS + validações em server functions: categoria obrigatória, responsável obrigatório, histórico em toda transição, técnico não vê níveis acima, coordenador vê setor, admin total.

### Detalhes técnicos
- Stack: TanStack Start + React 19 + Tailwind v4 + Shadcn + Supabase (Lovable Cloud) + Recharts.
- Server functions via `createServerFn` com `requireSupabaseAuth`; admin via `supabaseAdmin` apenas em operações privilegiadas (geração de número de chamado, escalonamento).
- Seeds iniciais: 5 unidades SENAC-MA fictícias, ~20 subcategorias mapeadas aos 3 níveis com SLAs especificados.
- Primeiro usuário cadastrado vira `admin` automaticamente (trigger).

### Fora deste MVP (próximas iterações)
Chat em tempo real, base de conhecimento completa, exportação PDF/Excel, notificações por e-mail, integração WhatsApp, BI avançado, app mobile. A arquitetura já fica preparada.

### Entrega
App funcional ponta-a-ponta com o fluxo completo das 13 etapas operacionais, login real, dados persistidos e identidade visual SENAC. Pronto para apresentação acadêmica.