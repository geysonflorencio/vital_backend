const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

// Configuração do Supabase (mesma do index.js)
const supabaseUrl = process.env.SUPABASE_URL || 'https://aeysoqtbencykavivgoe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNvcXRiZW5jeWthdml2Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE4MTY1OSwiZXhwIjoyMDY0NzU3NjU5fQ.g64X3iebdB_TY_FWd6AI8mlej4uKMrKiFLG11z6hZlQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/hospitais - Listar hospitais
router.get("/", async (req, res) => {
  try {
    console.log('🏥 Buscando hospitais...');
    
    const { data, error } = await supabase
      .from("hospitais")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar hospitais:', error);
      throw error;
    }
    
    console.log(`✅ Encontrados ${data?.length || 0} hospitais`);
    res.json(data || []);
  } catch (error) {
    console.error("Erro ao buscar hospitais:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hospitais - Criar hospital
router.post("/", async (req, res) => {
  try {
    const { nome, endereco, telefone, email } = req.body;
    
    console.log('🏥 Criando hospital:', { nome, endereco, telefone, email });
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const { data, error } = await supabase
      .from("hospitais")
      .insert([{ nome, endereco, telefone, email }])
      .select();

    if (error) {
      console.error('❌ Erro ao criar hospital:', error);
      throw error;
    }
    
    console.log('✅ Hospital criado:', data[0].id);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Erro ao criar hospital:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
