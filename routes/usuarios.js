const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

// Configuração do Supabase (mesma do index.js)
const supabaseUrl = process.env.SUPABASE_URL || 'https://aeysoqtbencykavivgoe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNvcXRiZW5jeWthdml2Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE4MTY1OSwiZXhwIjoyMDY0NzU3NjU5fQ.g64X3iebdB_TY_FWd6AI8mlej4uKMrKiFLG11z6hZlQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/usuarios - Listar usuários
router.get("/", async (req, res) => {
  try {
    console.log('👥 Buscando usuários...');
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }
    
    console.log(`✅ Encontrados ${data?.length || 0} usuários`);
    res.json(data || []);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/usuarios/:id - Deletar usuário
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deletando usuário:', id);
    
    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }
    
    // Primeiro, deletar da tabela profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      console.error('❌ Erro ao deletar perfil:', profileError);
      throw profileError;
    }
    
    // Depois, deletar da autenticação do Supabase
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error('⚠️ Aviso: Erro ao deletar da auth (perfil já foi deletado):', authError.message);
      // Não vamos falhar aqui porque o perfil já foi deletado
    }
    
    console.log('✅ Usuário deletado com sucesso:', id);
    res.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
