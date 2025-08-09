// index.js - Entrada principal (arquitetura modular unificada)
// Refatorado em 2025-08-08 para usar config/server + routes/*
// Objetivo: eliminar duplicação e restaurar rota DELETE /api/auth/excluir-usuario

const { createServer } = require('./config/server');
const apiRoutes = require('./routes');
const authRoutes = require('./routes/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Cria app com middlewares base / segurança / rate limiting
const { app } = createServer();

// Monta rotas principais sob /api
app.use('/api', apiRoutes);

// Alias LEGACY: manter compatibilidade com frontend antigo que chama /api/excluir-usuario
// Redireciona internamente para /api/auth/excluir-usuario
app.delete('/api/excluir-usuario', (req, res, next) => {
  console.log('♻️ [ALIAS] Redirecionando DELETE /api/excluir-usuario -> /api/auth/excluir-usuario');
  // Ajusta URL para que o router de auth processe corretamente
  req.url = '/excluir-usuario';
  req.originalUrl = '/api/auth/excluir-usuario';
  return authRoutes(req, res, next);
});

// Rota raiz simples (informativa)
app.get('/', (req, res) => {
  res.json({
    message: 'VITAL API - Modular',
    status: 'online',
    version: '2.0.0-modular',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth/*',
      solicitacoes: '/api/solicitacoes/*',
      legacy_delete_alias: '/api/excluir-usuario'
    }
  });
});

// Handlers finais
app.use(notFoundHandler);
app.use(errorHandler);

// Execução local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 VITAL API (modular) escutando na porta ${PORT}`);
  });
}

module.exports = app;
