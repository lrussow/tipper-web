import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const svgPath = 'C:/src/tipper-web/frontend/public/logo.svg';
const outPath = 'C:/src/tipper-web/frontend/public/favicon.ico';

let svg = readFileSync(svgPath, 'utf8');

// Inject a dark blue background rect covering the full viewBox (110 125 480 360)
svg = svg.replace(
	'<g\n     id="g1">',
	'<rect x="110" y="125" width="480" height="360" rx="80" ry="80" fill="#1a1a2e"/>\n  <g\n     id="g1">'
);

const sizes = [16, 32, 48, 256];

const buffers = await Promise.all(
	sizes.map(size =>
		sharp(Buffer.from(svg))
			.resize(size, size)
			.png()
			.toBuffer()
	)
);

console.log('Rendered sizes:', sizes.map((s, i) => `${s}x${s} (${buffers[i].length}b)`).join(', '));

writeFileSync(outPath, buildIco(buffers, sizes));
console.log('favicon.ico written to', outPath);

function buildIco(buffers, sizes) {
	const count = buffers.length;
	const headerSize = 6;
	const dirEntrySize = 16;
	const dataOffset = headerSize + dirEntrySize * count;

	const offsets = [];
	let offset = dataOffset;
	for (const buf of buffers) {
		offsets.push(offset);
		offset += buf.length;
	}

	const out = Buffer.alloc(offset);
	out.writeUInt16LE(0, 0);
	out.writeUInt16LE(1, 2);
	out.writeUInt16LE(count, 4);

	for (let i = 0; i < count; i++) {
		const base = headerSize + i * dirEntrySize;
		const sz = sizes[i] === 256 ? 0 : sizes[i];
		out.writeUInt8(sz, base);
		out.writeUInt8(sz, base + 1);
		out.writeUInt8(0, base + 2);
		out.writeUInt8(0, base + 3);
		out.writeUInt16LE(1, base + 4);
		out.writeUInt16LE(32, base + 6);
		out.writeUInt32LE(buffers[i].length, base + 8);
		out.writeUInt32LE(offsets[i], base + 12);
	}

	for (let i = 0; i < count; i++) {
		buffers[i].copy(out, offsets[i]);
	}
	return out;
}
