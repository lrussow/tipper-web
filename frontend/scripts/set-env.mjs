import { writeFileSync } from 'fs';

const tipperApiBase = process.env['TIPPER_API_BASE'] ?? '/tipper';

const content = `export const environment = {
\tproduction: true,
\ttipperApiBase: '${tipperApiBase}',
};
`;

writeFileSync('src/environments/environment.ts', content);
console.log(`environment.ts written — tipperApiBase: ${tipperApiBase}`);
