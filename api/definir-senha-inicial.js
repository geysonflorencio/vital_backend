module.exports = (req, res) => {
  if (req.method === 'POST') {
    // Aqui você pode chamar sua lógica de cadastro de senha
    res.status(200).json({ message: 'Endpoint POST definir-senha-inicial funcionando!' });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
};
