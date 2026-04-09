const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Conectando ao Supabase como Admin...');
    const { data: tables, error } = await supabase.from('authorized_emails').select('*').limit(1);
    if (error) {
        console.error('Falha na conexo:', error.message);
    } else {
        console.log('Conexo ADMIN estabelecida com sucesso!');
        console.log('Tabela authorized_emails acessada.');
    }
}
test();
