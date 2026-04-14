import { writeFileSync } from 'fs';

const tipperApiBase = process.env['TIPPER_API_BASE'] ?? '/tipper';
const supabaseUrl = process.env['SUPABASE_URL'] ?? 'https://your-project.supabase.co';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] ?? 'your-anon-key';

const content = `export const environment = {
\tproduction: true,
\tsupabaseUrl: '${supabaseUrl}',
\tsupabaseAnonKey: '${supabaseAnonKey}',
\ttipperApiBase: '${tipperApiBase}',
};
`;

writeFileSync('src/environments/environment.ts', content);
console.log(`environment.ts written — tipperApiBase: ${tipperApiBase}`);
