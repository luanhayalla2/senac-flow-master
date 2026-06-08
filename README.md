SENAC Service Help Desk
🌟 Visão geral
SENAC Service Help Desk é um portal de atendimento corporativo desenvolvido com React, TanStack Router, Vite, e Supabase. Ele fornece um fluxo completo de abertura, classificação automática (N1/N2/N3) e gestão de SLAs, seguindo as melhores práticas de ITIL. A UI foi construída com Tailwind CSS, Radix UI e componentes customizados, proporcionando uma experiência moderna, responsiva e altamente acessível.

📦 Tecnologias principais
React 19 – UI declarativa e reativa.
TanStack Router 1 – roteamento avançado com carregamento assíncrono.
Vite 7 – bundler rápido e suporte a HMR.
Supabase – backend completo (autenticação, storage, PostgreSQL).
Tailwind CSS 4 – design system configurável com cores institucionais SENAC.
Radix UI – componentes acessíveis.
Zod – validação de esquemas de dados.
Docker – containerização para produção.
Vercel – deployment simplificado (configurado em vercel.json).
🚀 Começando (local)
Requisitos: Node 20 (LTS) ou bun (opcional) e Docker (para container). O projeto usa npm, mas aceita bun.

# Clone o repositório (já está em sua máquina)
cd c:/Users/aluno/Downloads/senac-flow-master/senac-flow-master

# Instalar dependências
npm install   # ou "bun install" se preferir

# Iniciar ambiente de desenvolvimento
npm run dev   # Vite dev server → http://localhost:5173
Dica: Caso enfrente conflitos de peer‑dependencies, use npm install --legacy-peer-deps (já configurado no Dockerfile).

🐳 Executando via Docker
# Build da imagem
docker build -t senac-service-help-desk .

# Executar o container
docker run -p 8080:80 senac-service-help-desk
A aplicação ficará disponível em http://localhost:8080.

📦 Deploy na Vercel
O arquivo vercel.json já contém a configuração necessária:

{
  "builds": [{ "src": "vite.config.ts", "use": "@vercel/static-build" }],
  "routes": [{ "src": "/(.*)", "dest": "/index.html" }]
}
Crie um projeto na Vercel.
Conecte o repositório.
Defina npm install --legacy-peer-deps && npm run build como comando de build.
Deploy automático.
🔐 Autenticação
O fluxo de login utiliza Supabase Auth com credenciais institucionais. Usuários são redirecionados para /portal após autenticação bem‑sucedida.

📂 Estrutura de pastas
src/
├─ assets/            # logotipo (senac_service_help_desk_logo.png)
├─ components/        # UI reutilizável (Sidebar, Header, etc.)
├─ hooks/             # hooks de sessão e autorização
├─ integrations/      # cliente Supabase
├─ routes/            # rotas do TanStack Router
│   ├─ __root.tsx
│   ├─ auth.tsx
│   ├─ index.tsx
│   └─ _authenticated/…
├─ styles.css         # Tailwind & design tokens
└─ vite.config.ts     # configuração Vite/TanStack
🧪 Testes & qualidade
ESLint 9 + Prettier 3 – lint e formatação automática.
Sonner – toast notifications.
Zod – validação de formulários.
Código está tipado com TypeScript 5.
📚 Documentação adicional
Design System – src/styles.css contém as cores institucional SENAC (#F57C00 laranja, #003B71 azul) e tokens de tipografia.
Fluxo operacional – veja operational_flow.md para detalhamento das etapas de atendimento.
Roadmap – adicione tarefas em task.md conforme evolui o projeto.
🤝 Contribuindo
Fork o repositório.
Crie uma branch (git checkout -b feature/nome).
Commit as mudanças (git commit -m "feat: descrição").
Abra um Pull Request.
📜 Licença
Este projeto está licenciado sob a MIT License – sinta‑se livre para usar, modificar e distribuir.

📞 Contato
Equipe SENAC Service Help Desk

Email: suporte@senc-ma.senac.br
Slack: #senac-service-help-desk
Feito com ❤️ por desenvolvedores apaixonados por excelência em atendimento.
