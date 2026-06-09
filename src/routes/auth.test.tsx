/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------- Mocks globais ----------------
vi.mock("@/assets/senac-logo.png", () => ({ default: "senac-logo.png" }));

const { toastMock, supabaseMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  supabaseMock: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (cfg: unknown) => cfg,
  Link: ({ children, to }: { children: React.ReactNode; to?: string }) =>
    <a href={to ?? "#"}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Imports DEPOIS dos mocks
import { EsqueceuSenhaDialog } from "@/routes/auth";
import { ResetPasswordPage } from "@/routes/reset-password";

const ORIGEM = "http://localhost";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(toastMock).forEach((fn) => fn.mockReset?.());
  // jsdom: garante window.location.origin esperado
  Object.defineProperty(window, "location", {
    value: { ...window.location, origin: ORIGEM, hash: "" },
    writable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// =================== Esqueceu a senha — diálogo ===================
describe("Fluxo E2E — Esqueceu a senha (diálogo)", () => {
  async function abrirDialogo(emailInicial = "") {
    const user = userEvent.setup();
    render(<EsqueceuSenhaDialog emailInicial={emailInicial} />);
    await user.click(screen.getByRole("button", { name: /esqueceu a senha/i }));
    return user;
  }

  it("mostra mensagem clara para e-mail inválido e bloqueia envio", async () => {
    const user = await abrirDialogo();
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/e-mail institucional/i);

    await user.type(input, "naoeum-email");
    expect(await within(dialog).findByText("E-mail inválido")).toBeInTheDocument();

    const enviar = within(dialog).getByRole("button", { name: /enviar link/i });
    expect(enviar).toBeDisabled();
    expect(supabaseMock.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("também recusa formatos parecidos a CPF (não são e-mails válidos)", async () => {
    const user = await abrirDialogo();
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/e-mail institucional/i);

    await user.type(input, "529.982.247-25");
    expect(await within(dialog).findByText("E-mail inválido")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /enviar link/i })).toBeDisabled();
  });

  it("envia recuperação com sucesso e mostra confirmação institucional", async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const user = await abrirDialogo("joao@ma.senac.br");
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /enviar link/i }));

    await waitFor(() => expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1));
    expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledWith("joao@ma.senac.br", {
      redirectTo: `${ORIGEM}/reset-password`,
    });

    expect(
      await within(dialog).findByText(/e-mail enviado para joao@ma\.senac\.br/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/link expira/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /fechar/i })).toBeInTheDocument();
  });

  it("traduz erros do Supabase em mensagem amigável SENAC", async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { message: "User not found" },
    });

    const user = await abrirDialogo("ninguem@ma.senac.br");
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /enviar link/i }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringMatching(/não encontramos um cadastro/i),
      ),
    );
  });
});

// =================== Reset password — recovery ===================
describe("Fluxo E2E — Página /reset-password (expiração do recovery)", () => {
  it("exibe mensagem de link expirado quando não há sessão de recovery", async () => {
    vi.useFakeTimers();
    supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });

    render(<ResetPasswordPage />);
    expect(screen.getByText(/validando link de recuperação/i)).toBeInTheDocument();

    // resolve a Promise do getSession e dispara o setTimeout(1500ms)
    await vi.runAllTimersAsync();

    expect(
      await screen.findByText(/link inválido ou expirado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/solicite um novo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nova senha/i)).not.toBeInTheDocument();
  });

  it("com recovery ativo, valida força e confirmação antes de salvar", async () => {
    const user = userEvent.setup();
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });
    supabaseMock.auth.updateUser.mockResolvedValue({ data: {}, error: null });
    supabaseMock.auth.signOut.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const nova = await screen.findByLabelText(/^nova senha$/i);
    const confirmar = screen.getByLabelText(/confirmar nova senha/i);
    const salvar = screen.getByRole("button", { name: /salvar nova senha/i });

    // 1) senha fraca → botão desabilitado
    await user.type(nova, "abc");
    expect(salvar).toBeDisabled();

    // 2) senha forte mas confirmação diferente → mensagem clara, botão desabilitado
    await user.clear(nova);
    await user.type(nova, "Senac@2026");
    await user.type(confirmar, "Outra@2026");
    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
    expect(salvar).toBeDisabled();

    // 3) corrige confirmação → salva
    await user.clear(confirmar);
    await user.type(confirmar, "Senac@2026");
    await waitFor(() => expect(salvar).toBeEnabled());

    await user.click(salvar);
    await waitFor(() =>
      expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: "Senac@2026" }),
    );
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith(expect.stringMatching(/senha atualizada/i));
  });
});
