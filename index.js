// index.js - Versão simplificada para Vercel
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configurado para appvital.com.br
app.use(cors({
  origin: ['https://appvital.com.br', 'https://www.appvital.com.br', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: ' VITAL API - Sistema de Triagem Hospitalar',
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Cadastrar usuário - versão simplificada
app.post('/api/cadastrar-usuario', async (req, res) => {
  try {
    const { nome, email, role } = req.body;
    
    if (!nome || !email || !role) {
      return res.status(400).json({
        error: 'Nome, email e role são obrigatórios'
      });
    }
    
    // Simular sucesso por enquanto
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso! (modo simplificado)',
      data: {
        nome,
        email,
        role,
        id: Math.random().toString(36).substr(2, 9)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Definir senha inicial - versão simplificada
app.post('/api/definir-senha-inicial', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }
    
    // Simular sucesso por enquanto
    res.json({
      success: true,
      message: 'Senha definida com sucesso! (modo simplificado)',
      email
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// Para desenvolvimento local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
