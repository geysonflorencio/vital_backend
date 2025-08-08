const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Busca o usuário pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return res.status(500).json({ error: `Erro ao buscar usuário: ${listError.message}` });
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado com este email' });
    }

    // Atualiza a senha do usuário
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, { 
      password: senha,
      email_confirm: true // Confirma automaticamente o email se necessário
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return res.status(500).json({ error: `Erro ao atualizar senha: ${error.message}` });
    }

    console.log(`Senha atualizada com sucesso para usuário: ${email}`);
    
    return res.status(200).json({ 
      message: 'Senha definida com sucesso!', 
      email: email,
      userId: user.id,
      success: true
    });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: `Erro interno: ${err.message}` });
  }
};
