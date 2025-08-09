const { createServer } = require('../config/server');
const apiRoutes = require('../routes');
const authRoutes = require('../routes/auth');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Cria o app Express
const { app } = createServer();

// Rotas da API
app.use('/api', apiRoutes);
app.use('/api', authRoutes);

// Middlewares de erro
app.use(notFoundHandler);
app.use(errorHandler);

// Exporta o app para o Vercel
module.exports = app;
