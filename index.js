// index.js - Vers�o com Supabase integrado
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Importar rotas
const hospitaisRoutes = require('./routes/hospitais');
const usuariosRoutes = require('./routes/usuarios');

const app = express();

// Configura��o do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://aeysoqtbencykavivgoe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNvcXRiZW5jeWthdml2Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE4MTY1OSwiZXhwIjoyMDY0NzU3NjU5fQ.g64X3iebdB_TY_FWd6AI8mlej4uKMrKiFLG11z6hZlQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS configurado para appvital.com.br
app.use(cors({
  origin: ['https://appvital.com.br', 'https://www.appvital.com.br', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Registrar rotas
app.use('/api/hospitais', hospitaisRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: ' VITAL API - Sistema de Triagem Hospitalar',
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    supabase: 'conectado'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'supabase_connected'
  });
});

// Cadastrar usu�rio - com Supabase real
app.post('/api/cadastrar-usuario', async (req, res) => {
  try {
    const { nome, email, role, hospital_id } = req.body;
    
    console.log(' Dados recebidos:', { nome, email, role, hospital_id });
    
    if (!nome || !email || !role) {
      return res.status(400).json({
        error: 'Nome, email e role s�o obrigat�rios'
      });
    }
    
    // Criar usu�rio na autentica��o do Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36).slice(-8), // Senha tempor�ria
      email_confirm: true,
      user_metadata: {
        nome_completo: nome,
        role: role
      }
    });
    
    if (authError) {
      console.error(' Erro ao criar usu�rio na auth:', authError);
      return res.status(400).json({
        error: 'Erro ao criar usu�rio: ' + authError.message
      });
    }
    
    console.log(' Usu�rio criado na auth:', authUser.user.id);
    
    // Criar perfil do usu�rio na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        nome_completo: nome,
        email: email,
        role: role,
        hospital_id: hospital_id || null,
        ativo: true
      })
      .select()
      .single();
    
    if (profileError) {
      console.error(' Erro ao criar perfil:', profileError);
      return res.status(400).json({
        error: 'Erro ao criar perfil: ' + profileError.message
      });
    }
    
    console.log(' Perfil criado:', profile.id);
    
    res.status(201).json({
      success: true,
      message: 'Usu�rio cadastrado com sucesso no banco de dados!',
      data: {
        id: authUser.user.id,
        nome,
        email,
        role,
        hospital_id: hospital_id || null,
        profile_created: true
      }
    });
    
  } catch (error) {
    console.error(' Erro inesperado:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Definir senha inicial - com Supabase real
app.post('/api/definir-senha-inicial', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log(' Definindo senha para:', email);
    
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha s�o obrigat�rios'
      });
    }
    
    // Buscar usu�rio pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(' Erro ao listar usu�rios:', listError);
      return res.status(500).json({
        error: 'Erro ao buscar usu�rio'
      });
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usu�rio n�o encontrado'
      });
    }
    
    // Atualizar senha
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: senha }
    );
    
    if (updateError) {
      console.error(' Erro ao atualizar senha:', updateError);
      return res.status(400).json({
        error: 'Erro ao atualizar senha: ' + updateError.message
      });
    }
    
    console.log(' Senha atualizada para:', email);
    
    res.json({
      success: true,
      message: 'Senha definida com sucesso!',
      email,
      userId: user.id
    });
    
  } catch (error) {
    console.error(' Erro inesperado:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Listar usu�rios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: profiles
    });
    
  } catch (error) {
    console.error(' Erro ao listar usu�rios:', error);
    res.status(500).json({
      error: 'Erro ao listar usu�rios',
      details: error.message
    });
  }
});

// REMOVIDO: Rota duplicada /api/excluir-usuario
// A exclusão agora é tratada na arquitetura modular em:
//   DELETE /api/auth/excluir-usuario (principal)
//   DELETE /api/excluir-usuario (alias legacy definido em routes/index.js)
// Mantido aqui apenas o comentário para evitar reintrodução acidental.

// Middleware de erro
app.use((error, req, res, next) => {
  console.error(' Erro geral:', error);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// Para desenvolvimento local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
    console.log(` Supabase conectado: ${supabaseUrl}`);
  });
}

module.exports = app;
