const { createServer } = require('../config/server');
const apiRoutes = require('../routes');
const authRoutes = require('../routes/auth');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const { app } = createServer();

app.use('/api', apiRoutes);
app.use('/api', authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
