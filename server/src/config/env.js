import dotenv from 'dotenv'
dotenv.config()

export default {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  jwtSecret: process.env.JWT_SECRET || 'escavio-dev-secret-2026',
  moolre: {
    baseUrl: (process.env.MOOLRE_BASE_URL || 'https://api.moolre.com').trim(),
    apiUser: process.env.MOOLRE_API_USER?.trim(),
    apiKey: process.env.MOOLRE_API_KEY?.trim(),
    pubKey: process.env.MOOLRE_API_PUBKEY?.trim(),
    vasKey: process.env.MOOLRE_API_VASKEY?.trim(),
    webhookSecret: process.env.MOOLRE_WEBHOOK_SECRET?.trim(),
    accountNumber: process.env.MOOLRE_ACCOUNT_NUMBER?.trim(),
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER,
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5000',
  openrouterKey: process.env.OPENROUTER_API_KEY,
}
