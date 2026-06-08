# SENAC Service Help Desk

![SENAC Logo](https://via.placeholder.com/150x50?text=SENAC+Logo) <!-- Substitua pela URL da logo real do SENAC, se necessário -->

> **SENAC Service Help Desk** é um portal de atendimento corporativo moderno e eficiente.

## 🌟 Visão Geral

O **SENAC Service Help Desk** foi desenvolvido para fornecer um fluxo completo de abertura de chamados, classificação automática em níveis de suporte (N1, N2 e N3) e gestão de SLAs. O sistema foi projetado seguindo as melhores práticas da biblioteca **ITIL**, garantindo excelência operacional. 

A interface de usuário foi construída visando fornecer uma experiência moderna, responsiva e altamente acessível aos usuários e atendentes.

---

## 📦 Tecnologias Principais

O projeto utiliza um stack moderno focado em performance, reatividade e boa experiência de desenvolvimento:

- **[React 19](https://react.dev/)** – Interface de usuário declarativa e reativa.
- **[TanStack Router](https://tanstack.com/router/latest)** – Roteamento avançado com tipagem forte e carregamento assíncrono.
- **[Vite 7](https://vitejs.dev/)** – Bundler extremamente rápido com suporte a Hot Module Replacement (HMR).
- **[Supabase](https://supabase.com/)** – Backend as a Service completo, provendo Autenticação, Storage e banco de dados PostgreSQL.
- **[Tailwind CSS 4](https://tailwindcss.com/)** – Design system configurável e estilização utilitária com as cores institucionais do SENAC.
- **[Radix UI](https://www.radix-ui.com/)** – Componentes primitivos, não estilizados e altamente acessíveis.
- **[Zod](https://zod.dev/)** – Validação de esquemas e dados.
- **Docker** – Containerização para padronização de ambientes e produção.
- **Vercel** – Plataforma para deployment simplificado.

---

## 🚀 Como Executar (Localmente)

**Requisitos Pré-vistos:**
- [Node.js 20 LTS](https://nodejs.org/) ou [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/) (opcional, caso queira rodar via container)

### 1. Clone o repositório
Caso não tenha clonado ainda:
```bash
git clone https://github.com/luanhayalla2/senac-flow-master.git
cd senac-flow-master
```

### 2. Instale as dependências
```bash
npm install
# ou utilize "bun install"
```
> **Dica**: Caso enfrente conflitos de `peer-dependencies`, utilize `npm install --legacy-peer-deps`.

### 3. Inicie o servidor de desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em [http://localhost:5173](http://localhost:5173).

---

## 🐳 Executando via Docker

Se preferir rodar a aplicação em um container Docker isolado:

1. **Faça o build da imagem:**
```bash
docker build -t senac-service-help-desk .
```

2. **Execute o container:**
```bash
docker run -p 8080:80 senac-service-help-desk
```
Acesse a aplicação em [http://localhost:8080](http://localhost:8080).

---

## 📦 Deploy na Vercel

O projeto já conta com o arquivo `vercel.json` configurado para facilitar o deploy na Vercel.

**Passo a passo:**
1. Crie um projeto no dashboard da Vercel.
2. Conecte este repositório do GitHub.
3. Defina o comando de build como:
   `npm install --legacy-peer-deps && npm run build`
4. Acione o Deploy Automático.

---

## 🔐 Autenticação

A aplicação utiliza **Supabase Auth** para gerenciamento de credenciais institucionais. Após a autenticação bem-sucedida, os usuários são automaticamente redirecionados para a rota restrita `/portal`.

---

## 📂 Estrutura de Diretórios

Abaixo está um resumo da estrutura de pastas da aplicação:

```text
src/
├─ assets/            # Imagens e logotipos
├─ components/        # Componentes UI reutilizáveis (Sidebar, Header, Botões, etc.)
├─ hooks/             # Custom Hooks do React (sessão, autorização, etc.)
├─ integrations/      # Cliente e integrações do Supabase
├─ routes/            # Configurações de rotas do TanStack Router
│   ├─ __root.tsx     # Layout base principal
│   ├─ auth.tsx       # Rota de autenticação
│   ├─ index.tsx      # Rota inicial
│   └─ _authenticated/# Rotas protegidas que exigem login
├─ styles.css         # Importações do Tailwind e design tokens customizados
└─ vite.config.ts     # Configurações do Vite e plugins do TanStack
```

---

## 🧪 Qualidade e Testes

O projeto adota ferramentas consolidadas para garantir a saúde e padronização da base de código:

- **TypeScript 5**: Tipagem estática rigorosa por todo o sistema.
- **ESLint 9 & Prettier 3**: Análise estática, formatação automática e enforcement de boas práticas.
- **Sonner**: Gerenciamento eficiente e bonito de Toast Notifications.
- **Zod**: Validação de formulários e segurança de tipos em runtime.

---

## 📚 Documentação Adicional

- **Design System:** O arquivo `src/styles.css` contém os tokens de tipografia e as cores institucionais do SENAC (`#F57C00` Laranja, `#003B71` Azul).
- **Fluxo Operacional:** Acesse o arquivo `operational_flow.md` para um detalhamento profundo sobre as etapas de atendimento e fluxos ITIL.
- **Roadmap:** Acesse o arquivo `task.md` para acompanhar a evolução e tarefas pendentes do projeto.

---

## 🤝 Contribuindo

Sinta-se à vontade para contribuir com a evolução deste portal:

1. Faça um **Fork** do repositório.
2. Crie uma nova branch para sua funcionalidade ou correção: `git checkout -b feature/minha-feature`.
3. Faça o commit das suas alterações: `git commit -m "feat: adiciona nova funcionalidade XYZ"`.
4. Envie as modificações para o seu fork: `git push origin feature/minha-feature`.
5. Abra um **Pull Request**.

---

## 📜 Licença

Este projeto está licenciado sob a **MIT License**. Sinta-se livre para utilizar, modificar e distribuir o código-fonte deste software.

---

## 📞 Contato

**Equipe SENAC Service Help Desk**
- **Email:** [suporte@senc-ma.senac.br](mailto:suporte@senc-ma.senac.br)
- **Slack:** `#senac-service-help-desk`

> Desenvolvido com ❤️ por desenvolvedores apaixonados por excelência no atendimento.
