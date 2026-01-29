// index.js - VITAL Backend (VERSAO CORRIGIDA + NOTIFICACOES AGENDADAS)
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { getPasswordRedirectURL, logURLConfiguration } = require('./utils/urlUtils');

const app = express();

// CORS - Configuracao simplificada e funcional
app.use(cors({
  origin: [
    'https://appvital.com.br',
    'https://www.appvital.com.br',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://vital-deploy.vercel.app',
    'https://vitalv2.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Configuracao do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://aeysoqtbencykavivgoe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNvcXRiZW5jeWthdml2Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE4MTY1OSwiZXhwIjoyMDY0NzU3NjU5fQ.g64X3iebdB_TY_FWd6AI8mlej4uKMrKiFLG11z6hZlQ';
console.log('Inicializando Supabase...', { url: supabaseUrl });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Disponibilizar supabase para as rotas
app.set('supabase', supabase);

// Log da configuracao de URLs
logURLConfiguration();

// Importar rotas de notificacoes agendadas
let scheduledNotificationsRouter = null;
let processarNotificacoesPendentes = null;
try {
  const scheduledModule = require('./routes/scheduled-notifications');
  scheduledNotificationsRouter = scheduledModule.router;
  processarNotificacoesPendentes = scheduledModule.processarNotificacoesPendentes;
  console.log('Modulo de notificacoes agendadas carregado');
} catch (error) {
  console.log('Modulo de notificacoes agendadas nao disponivel:', error.message);
}

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'VITAL API - Backend Funcional',
    status: 'online',
    version: '3.1.0-notifications',
    timestamp: new Date().toISOString(),
    features: ['notificacoes-agendadas']
  });
});

// Rotas de notificacoes agendadas
if (scheduledNotificationsRouter) {
  app.use('/api/notifications', scheduledNotificationsRouter);
}

// ROTA DELETE EXCLUIR USUARIO - IMPLEMENTACAO DIRETA
app.delete('/api/excluir-usuario', async (req, res) => {
  try {
    console.log('DELETE /api/excluir-usuario chamado');
    console.log('Body recebido:', req.body);

    const { user_id, id, userId } = req.body;
    const userIdToDelete = user_id || id || userId;

    if (!userIdToDelete) {
      return res.status(400).json({
        error: 'ID do usuario e obrigatorio',
        expected: 'user_id, id ou userId no body da requisicao'
      });
    }

    console.log('Excluindo usuario: ' + userIdToDelete);

    // 1. Deletar referencias na tabela user_hospitals
    const { error: userHospitalError } = await supabase
      .from('user_hospitals')
      .delete()
      .eq('user_id', userIdToDelete);

    if (userHospitalError) {
      console.warn('Erro ao deletar user_hospitals:', userHospitalError);
    }

    // 2. Deletar solicitacoes relacionadas
    const { error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('user_id', userIdToDelete);

    if (solicitacoesError) {
      console.warn('Erro ao deletar solicitacoes:', solicitacoesError);
    }

    // 3. Deletar perfil do usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);

    if (profileError) {
      console.error('Erro ao deletar perfil:', profileError);
      return res.status(500).json({
        error: 'Erro ao deletar perfil do usuario',
        details: profileError.message
      });
    }

    // 4. Deletar da autenticacao do Supabase
    const { error: authError } = await supabase.auth.admin.deleteUser(userIdToDelete);
    
    if (authError) {
      console.warn('Erro ao deletar da auth (perfil ja foi removido):', authError.message);
    }

    console.log('Usuario excluido com sucesso:', userIdToDelete);

    res.json({
      success: true,
      message: 'Usuario excluido com sucesso',
      user_id: userIdToDelete,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao excluir usuario:', error);
    res.status(500).json({
      error: 'Erro interno ao excluir usuario',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ROTA POST CADASTRAR USUARIO - IMPLEMENTACAO DIRETA
app.post('/api/cadastrar-usuario', async (req, res) => {
  try {
    console.log('POST /api/cadastrar-usuario chamado');
    console.log('Body recebido:', req.body);

    const { nome, email, role, hospital_id } = req.body;

    // Validacao basica
    if (!nome || !email || !role) {
      return res.status(400).json({
        error: 'Nome, email e role sao obrigatorios',
        required: ['nome', 'email', 'role'],
        optional: ['hospital_id']
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email invalido',
        email: email
      });
    }

    console.log('Criando usuario: ' + nome + ' (' + email + ') - Role: ' + role);

    // 1. Criar usuario na autenticacao do Supabase com email de convite
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: false, // Nao confirmar automaticamente para forcar definicao de senha
      user_metadata: {
        nome_completo: nome,
        role: role
      }
    });

    if (authError) {
      console.error('Erro ao criar usuario na auth:', authError);
      return res.status(400).json({
        error: 'Erro ao criar usuario: ' + authError.message
      });
    }

    console.log('Usuario criado na auth:', authUser.user.id);

    // 2. Enviar email de convite para definir senha
    console.log('Tentando enviar email de convite...');
    const redirectURL = getPasswordRedirectURL();
    console.log('URL de redirecionamento:', redirectURL);

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectURL,
      data: {
        nome_completo: nome,
        role: role,
        user_id: authUser.user.id
      }
    });

    if (inviteError) {
      console.error('ERRO ao enviar email de convite:', inviteError);
      console.error('Detalhes do erro:', {
        code: inviteError.code,
        message: inviteError.message,
        details: inviteError.details || 'Sem detalhes adicionais'
      });
      // Nao falhar a criacao por causa do email, apenas avisar
    } else {
      console.log('Email de convite enviado com sucesso para:', email);
      console.log('Dados do envio:', inviteData);
    }

    // 2. Criar perfil do usuario na tabela profiles
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
      console.error('Erro ao criar perfil:', profileError);
      // Tentar remover o usuario da auth se o perfil falhar
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({
        error: 'Erro ao criar perfil do usuario',
        details: profileError.message
      });
    }

    console.log('Perfil criado:', profile.id);

    // 3. Criar vinculo com hospital se fornecido
    if (hospital_id) {
      const { error: hospitalError } = await supabase
        .from('user_hospitals')
        .insert({
          user_id: authUser.user.id,
          hospital_id: hospital_id
        });

      if (hospitalError) {
        console.warn('Erro ao vincular hospital:', hospitalError);
      } else {
        console.log('Usuario vinculado ao hospital:', hospital_id);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Usuario cadastrado com sucesso! Email de convite enviado.',
      data: {
        id: authUser.user.id,
        email: email,
        nome_completo: nome,
        role: role,
        hospital_id: hospital_id,
        ativo: true,
        email_enviado: !inviteError
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao cadastrar usuario:', error);
    res.status(500).json({
      error: 'Erro interno ao cadastrar usuario',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ROTA POST DEFINIR SENHA MANUAL - SOLUCAO PARA PROBLEMAS DE EMAIL
app.post('/api/definir-senha-manual', async (req, res) => {
  try {
    console.log('POST /api/definir-senha-manual chamado');
    console.log('Body recebido:', req.body);

    const { user_id, email, senha } = req.body;

    // Validacao basica
    if (!user_id || !senha) {
      return res.status(400).json({
        error: 'user_id e senha sao obrigatorios',
        required: ['user_id', 'senha']
      });
    }

    // Validar senha (minimo 6 caracteres)
    if (senha.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    console.log('Definindo senha manual para usuario: ' + user_id);

    // 1. Atualizar senha no Supabase Auth
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
      password: senha,
      email_confirm: true // Confirmar email automaticamente
    });

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return res.status(400).json({
        error: 'Erro ao definir senha: ' + updateError.message
      });
    }

    console.log('Senha definida com sucesso:', user_id);

    res.json({
      success: true,
      message: 'Senha definida com sucesso! Usuario pode fazer login.',
      user_id: user_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao definir senha manual:', error);
    res.status(500).json({
      error: 'Erro interno ao definir senha',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VITAL API',
    scheduled_notifications: processarNotificacoesPendentes ? 'enabled' : 'disabled'
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota nao encontrada',
    path: req.path,
    method: req.method
  });
});

// Iniciar job de notificacoes agendadas
let notificationJobInterval = null;

function iniciarJobNotificacoes() {
  if (!processarNotificacoesPendentes) {
    console.log('Job de notificacoes nao iniciado - modulo nao disponivel');
    return;
  }
  
  if (notificationJobInterval) {
    clearInterval(notificationJobInterval);
  }
  
  console.log('Iniciando job de notificacoes agendadas (a cada 30 segundos)');
  
  // Executar imediatamente e depois a cada 30 segundos
  processarNotificacoesPendentes(supabase);
  
  notificationJobInterval = setInterval(() => {
    processarNotificacoesPendentes(supabase);
  }, 30000); // 30 segundos
}

// Execucao local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log('VITAL API na porta ' + PORT);
    
    // Iniciar job de notificacoes
    iniciarJobNotificacoes();
  });
}

module.exports = app;
