// config/supabase-safe.js
// Configuração direta e confiável do Supabase

require('dotenv').config();

let supabaseClient = null;
let isSupabaseAvailable = false;

try {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  isSupabaseAvailable = true;
  console.log('✅ Supabase conectado com sucesso');
  console.log('🔧 URL:', supabaseUrl);
  
} catch (error) {
  console.error('❌ Erro CRÍTICO ao configurar Supabase:', error.message);
  console.error('❌ Stack:', error.stack);
  throw error; // Falhar ao invés de usar mock
}

module.exports = {
  supabase: supabaseClient,
  isSupabaseAvailable
};
