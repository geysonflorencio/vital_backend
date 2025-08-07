const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    return res.status(200).json({ 
      message: 'Conexão com Supabase OK!', 
      url: supabaseUrl ? 'Configurada' : 'Não configurada',
      key: supabaseKey ? 'Configurada' : 'Não configurada'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
