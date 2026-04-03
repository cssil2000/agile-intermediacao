import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const lines = envFile.split('\n');
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  });
} catch (e) {
  console.log('Erro a ler .env.local', e);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchCase() {
  const { data, error } = await supabase.from('cases').select('id').limit(1);
  if (error) {
    console.error('Erro ao buscar case:', error.message);
  } else {
    console.log('----- RESULTADO (ID DO CASE) -----');
    if (data && data.length > 0) {
      console.log(data[0].id);
    } else {
      console.log('NENHUM CASE ENCONTRADO');
    }
  }
}

fetchCase();
