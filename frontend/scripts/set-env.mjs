import { writeFileSync, readFileSync } from 'fs';

const tipperApiBase = process.env['TIPPER_API_BASE'] ?? '/tipper';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const content = `export const environment = {
\tproduction: true,
\ttipperApiBase: '${tipperApiBase}',
\tappVersion: '${version}',
};
`;

writeFileSync('src/environments/environment.ts', content);
console.log(`environment.ts written — tipperApiBase: ${tipperApiBase}, appVersion: ${version}`);
