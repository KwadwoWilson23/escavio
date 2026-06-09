import dotenv from 'dotenv'
dotenv.config()

export default {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  jwtSecret: process.env.JWT_SECRET || 'escavio-dev-secret-2026',
  moolre: {
    baseUrl: process.env.MOOLRE_BASE_URL || 'https://api.moolre.com',
    apiUser: process.env.MOOLRE_API_USER,
    apiKey: process.env.MOOLRE_API_KEY,
    pubKey: process.env.MOOLRE_API_PUBKEY,
    vasKey: process.env.MOOLRE_API_VASKEY,
    webhookSecret: process.env.MOOLRE_WEBHOOK_SECRET,
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER,
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5000',
  openrouterKey: process.env.OPENROUTER_API_KEY,
}
