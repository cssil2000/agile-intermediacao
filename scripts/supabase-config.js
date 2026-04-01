/**
 * Agile Intermediação — Supabase Configuration
 * 
 * INSTRUÇÕES:
 * 1. Vai ao Supabase Dashboard → Settings → API
 * 2. Copia o "Project URL" e o "anon public" key
 * 3. Substitui os valores abaixo
 */

const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';

// Inicializar o cliente Supabase (via CDN global)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
