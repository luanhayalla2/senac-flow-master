# 🌟 SENAC Service Help Desk

Bem-vindo(a) ao repositório do **SENAC Service Help Desk**, um portal de atendimento corporativo focado em eficiência, usabilidade e integração contínua. 

Este sistema gerencia um fluxo completo de abertura de chamados, classificação automática (N1/N2/N3) e gestão de SLAs, seguindo as melhores práticas da **ITIL**.

---

## 📦 Tecnologias Principais

O projeto foi construído sobre uma arquitetura moderna e escalável, garantindo uma experiência responsiva e altamente acessível:

- **[React 19](https://react.dev/)** – Interface de usuário declarativa e reativa.
- **[TanStack Router](https://tanstack.com/router/latest)** – Roteamento avançado com carregamento assíncrono.
- **[Vite](https://vitejs.dev/)** – Bundler ultrarrápido com suporte a Hot Module Replacement (HMR).
- **[Supabase](https://supabase.com/)** – Backend as a Service (BaaS) fornecendo autenticação, storage e banco de dados PostgreSQL.
- **[Tailwind CSS](https://tailwindcss.com/)** – Design system configurável utilizando as cores institucionais do SENAC.
- **[Radix UI](https://www.radix-ui.com/)** – Componentes acessíveis e sem estilização prévia.
- **[Zod](https://zod.dev/)** – Validação rigorosa de esquemas de dados.

---

## 🚀 Como Executar Localmente

Siga os passos abaixo para iniciar o ambiente de desenvolvimento em sua máquina.

### 📋 Pré-requisitos
- **Node.js**: Versão 20 (LTS) ou superior.
- **Docker** *(opcional)*: Para execução via container.

### 🛠️ Passos para Execução

1. **Acesse a pasta do projeto principal:**
   ```bash
   cd senac-flow-master-main
   ```

2. **Instale as dependências:**
   O projeto utiliza o `npm` por padrão, mas suporta o `bun`.
   ```bash
   npm install
   ```
   > 💡 **Dica:** Caso enfrente problemas com dependências (peer-dependencies), adicione a flag `--legacy-peer-deps` (ex: `npm install --legacy-peer-deps`).

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em: [http://localhost:5173](http://localhost:5173).

---

## 🐳 Executando com Docker

Se preferir rodar a aplicação através de containers Docker, siga estes comandos:

1. **Construa a imagem da aplicação:**
   ```bash
   docker build -t senac-service-help-desk .
   ```

2. **Inicie o container:**
   ```bash
   docker run -p 8080:80 senac-service-help-desk
   ```
   Acesse a aplicação em: [http://localhost:8080](http://localhost:8080).

---

## 📦 Deploy (Vercel)

A aplicação já está configurada para deploy simplificado na [Vercel](https://vercel.com/), através do arquivo `vercel.json`.

**Configurações do repositório na Vercel:**
- **Comando de Build:** `npm install --legacy-peer-deps && npm run build`
- **Diretório de Saída (Output):** `dist`

---

## 🔐 Autenticação

A aplicação utiliza o **Supabase Auth** para garantir o acesso seguro com credenciais institucionais. Após a autenticação, o usuário é automaticamente redirecionado para o `/portal`.

---

## 📂 Estrutura de Pastas

Uma visão geral de como o código está organizado:

```text
src/
├── assets/            # Imagens e logotipos (ex: senac_service_help_desk_logo.png)
├── components/        # Componentes de UI reutilizáveis (Sidebar, Header, etc.)
├── hooks/             # Custom hooks (gerenciamento de sessão, autorização, etc.)
├── integrations/      # Configurações e cliente do Supabase
├── routes/            # Configurações de roteamento via TanStack Router
├── styles.css         # Configurações do Tailwind e design tokens
└── vite.config.ts     # Configuração principal do Vite e plugins
```

---

## 🧪 Qualidade de Código

Buscamos manter o mais alto padrão no desenvolvimento:
- **Linting & Formatação:** ESLint 9 + Prettier 3.
- **Notificações:** Sonner para feedbacks de usuário (toasts).
- **Validação:** Zod em todos os formulários.
- **Tipagem:** TypeScript 5 garantindo a integridade dos dados e props.

---

## 📚 Documentação Adicional

- **Design System:** O arquivo `src/styles.css` contém a paleta de cores institucionais do SENAC (ex: Laranja `#F57C00`, Azul `#003B71`) e tokens de tipografia.
- **Fluxo Operacional:** Consulte o arquivo `operational_flow.md` para visualizar em detalhes as etapas de atendimento e suporte.
- **Roadmap:** Acompanhe a evolução do projeto no `task.md`.

---

## 🤝 Contribuindo

Ficamos felizes com sua contribuição! Para contribuir:

1. Faça o **Fork** do repositório.
2. Crie sua branch para a nova funcionalidade: `git checkout -b feature/minha-feature`.
3. Faça o commit de suas alterações: `git commit -m 'feat: Adiciona nova funcionalidade X'`.
4. Faça o push para a branch: `git push origin feature/minha-feature`.
5. Abra um **Pull Request**.

---

## 📜 Licença

Este projeto é distribuído sob a Licença **MIT**. Sinta-se livre para usar, modificar e distribuir.

---

## 📞 Contato & Suporte

- **Equipe:** SENAC Service Help Desk
- **Email:** [suporte@senc-ma.senac.br](mailto:suporte@senc-ma.senac.br)
- **Slack:** `#senac-service-help-desk`

> Desenvolvido com ❤️ por desenvolvedores apaixonados por excelência em atendimento.
