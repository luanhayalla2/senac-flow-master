/**
 * Script para criar um usuário admin no Supabase.
 * Uso: node scripts/create-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jdnltiiaxaaibyvlejoe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkbmx0aWlheGFhaWJ5dmxlam9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTk5NDAsImV4cCI6MjA5NjIzNTk0MH0.wIPSR4hQ3z4XPVrb5HGNgRWvmtDVwZdDijiRt8of37c";

const EMAIL = "admin@senac.com";
const PASSWORD = "Admin@2024";
const NOME = "Administrador SENAC";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log(`\n🔧 Criando admin: ${EMAIL}\n`);

  // 1. Registrar o usuário via Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: {
      data: { nome_completo: NOME },
    },
  });

  if (authError) {
    // Se o usuário já existe, tenta fazer login
    if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
      console.log("⚠️  Usuário já existe. Fazendo login...");
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD,
      });
      if (loginError) {
        console.error("❌ Erro ao fazer login:", loginError.message);
        process.exit(1);
      }
      const userId = loginData.user.id;
      console.log(`✅ Login OK. User ID: ${userId}`);
      await assignAdminRole(userId);
      return;
    }
    console.error("❌ Erro ao criar usuário:", authError.message);
    process.exit(1);
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error("❌ Não foi possível obter o ID do usuário.");
    process.exit(1);
  }

  console.log(`✅ Usuário criado. ID: ${userId}`);

  // Fazer login para ter sessão ativa
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (loginError) {
    console.log("⚠️  Aviso no login:", loginError.message);
  }

  // 2. Verificar/criar profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    const { error: profError } = await supabase.from("profiles").insert({
      id: userId,
      nome_completo: NOME,
      email: EMAIL,
    });
    if (profError) {
      console.log("⚠️  Profile (pode já existir via trigger):", profError.message);
    } else {
      console.log("✅ Profile criado.");
    }
  } else {
    console.log("✅ Profile já existe.");
  }

  // 3. Atribuir role admin
  await assignAdminRole(userId);
}

async function assignAdminRole(userId) {
  // Verificar se já tem o role
  const { data: existing } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (existing) {
    console.log("✅ Role 'admin' já atribuído.");
  } else {
    // Remover roles anteriores (opcional)
    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });
    if (error) {
      console.error("❌ Erro ao atribuir role:", error.message);
    } else {
      console.log("✅ Role 'admin' atribuído com sucesso!");
    }
  }

  console.log("\n🎉 Pronto! Faça login com:");
  console.log(`   📧 Email: ${EMAIL}`);
  console.log(`   🔑 Senha: Admin@2024\n`);
}

main().catch(console.error);
