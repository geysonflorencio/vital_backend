// utils/urlUtils.js
// Função para gerar URLs dinâmicas baseada na documentação do Vercel

/**
 * Gera URL dinâmica baseada no ambiente (desenvolvimento, preview, produção)
 * Implementação baseada na documentação oficial do Vercel
 */
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    process?.env?.FRONTEND_URL ?? // Fallback para nossa configuração
    'http://localhost:3000/' // Default para desenvolvimento local
  
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

/**
 * Gera URL específica para redirecionamento de emails
 * Garante que sempre aponte para produção em emails
 */
const getEmailRedirectURL = () => {
  // Para emails, sempre usar URL de produção
  const productionURL = process?.env?.NEXT_PUBLIC_SITE_URL || 'https://www.appvital.com.br'
  
  // Garantir https e barra final
  let url = productionURL.startsWith('http') ? productionURL : `https://${productionURL}`
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

/**
 * Gera URL de redirecionamento para definir senha inicial
 * Direciona para página que processa tokens de convite
 */
const getPasswordRedirectURL = () => {
  const baseURL = getEmailRedirectURL()
  // Redirecionar para página que processa o token de convite
  return `${baseURL}definir-senha-simples.html`
}

/**
 * Log das URLs sendo utilizadas (para debug)
 */
const logURLConfiguration = () => {
  console.log('🌐 Configuração de URLs:')
  console.log('   NEXT_PUBLIC_SITE_URL:', process?.env?.NEXT_PUBLIC_SITE_URL || 'não definida')
  console.log('   NEXT_PUBLIC_VERCEL_URL:', process?.env?.NEXT_PUBLIC_VERCEL_URL || 'não definida')
  console.log('   FRONTEND_URL:', process?.env?.FRONTEND_URL || 'não definida')
  console.log('   URL gerada:', getURL())
  console.log('   URL para emails:', getEmailRedirectURL())
  console.log('   URL definir senha:', getPasswordRedirectURL())
}

module.exports = {
  getURL,
  getEmailRedirectURL,
  getPasswordRedirectURL,
  logURLConfiguration
}
