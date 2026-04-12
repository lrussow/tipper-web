# Copilot Instructions — tipper-web

## Project Overview

**tipper-web** is the marketing website for **The Tipper™ by Tip & Tap** — a contactless tipping app powered by Stripe. It is built with:

- **Frontend**: Angular (standalone components, SCSS, no Angular Material — use DevExtreme)
- **Backend**: Python FastAPI with Pydantic models and CORS enabled for `localhost:4200`

---

## Architecture

```
tipper-web/
├── backend/               ← FastAPI
│   ├── main.py
│   └── requirements.txt
└── frontend/              ← Angular
    └── src/app/
        ├── models/                        ← interfaces & data types
        │   ├── feature.model.ts           ← Feature interface
        │   ├── pricing-row.model.ts       ← PricingRow interface
        │   ├── contact-form.model.ts      ← ContactForm interface
        │   └── contact-response.model.ts  ← ContactResponse interface
        ├── viewmodels/                    ← ViewModel classes (one per page)
        │   ├── home.view-model.ts
        │   └── contact.view-model.ts
        ├── pages/
        │   ├── home/
        │   │   ├── home.component.ts      ← thin wrapper only
        │   │   ├── home.component.html
        │   │   └── home.component.scss
        │   └── contact/
        │       ├── contact.component.ts   ← thin wrapper only
        │       ├── contact.component.html
        │       └── contact.component.scss
        └── shared/
            └── navbar/
```

---

## Frontend: MVVM Pattern

**Every page component MUST follow MVVM.** Each page has a corresponding ViewModel file.

### ViewModel Rules

- File naming: `{page-name}.view-model.ts`
- Class naming: `{PageName}ViewModel`
- ViewModels are **plain TypeScript classes** — no `@Injectable`, no Angular decorators
- All state, data properties, computed properties, and action methods live on the ViewModel
- ViewModels receive services via constructor injection (passed in by the component)
- ViewModels expose an `init(): Promise<void>` method for async initialization
- Never put business logic or API calls directly in the component

### Component Rules

- Components are **thin wrappers** — they only:
  1. Declare `vm: PageViewModel`
  2. Instantiate the ViewModel in the constructor, passing required services
  3. Call `await this.vm.init()` in `ngOnInit()`
  4. Delegate all user action methods to `this.vm.someMethod()`
- The template binds exclusively to `vm.*` properties and methods

### Example Pattern

**`home.view-model.ts`:**
```typescript
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export class HomeViewModel {
	features = [...];   // all state here
	isLoading = false;

	constructor(private http: HttpClient) {}

	async init(): Promise<void> {
		// load any async data
	}
}
```

**`home.component.ts`:**
```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HomeViewModel } from './home.view-model';

@Component({ selector: 'app-home', standalone: true, ... })
export class HomeComponent implements OnInit {
	vm: HomeViewModel;

	constructor(private http: HttpClient) {
		this.vm = new HomeViewModel(http);
	}

	async ngOnInit(): Promise<void> {
		await this.vm.init();
	}
}
```

**`home.component.html`:**
```html
@for (f of vm.features; track f.title) { ... }
<p>{{ vm.someProperty }}</p>
<button (click)="vm.doSomething()">Click</button>
```

---

## Frontend: General Standards

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Semicolons**: Required
- **UI Controls**: DevExtreme only — no Angular Material
- **HTTP calls**: Use `firstValueFrom()` / `lastValueFrom()` — never raw `.subscribe()` or `.then()` chains
- **IDs on all interactive elements**: Required for Selenium testing (kebab-case, e.g. `contact-submit`, `nav-home`)
- **No `any` type** — use explicit types or `unknown`
- **`const` over `let`** when never reassigned
- **Colors / palette**: Primary `#4e5e8b`, dark background `#1a1a2e`

---

## Mobile / Responsive Design

- **Desktop-first**: existing desktop styles are the baseline; responsiveness is added via `@media` blocks
- **Two breakpoints**:
  - `≤ 1024px` (tablet): mild adjustments — reduce padding, hide decorative visuals, slightly smaller headings
  - `≤ 640px` (phone): full mobile treatment — stacked layouts, hidden dividers/arrows, further font/padding reduction
- **Navbar hamburger** activates at `≤ 768px` (portrait tablets and all phones)
- All `@media` blocks live **inline in each SCSS file** — no separate mobile stylesheets
- The navbar must include a hamburger toggle button with `id="nav-menu-toggle"`
- No horizontal scrolling on any page at 375px viewport width

---

## Backend: FastAPI Standards

- Pydantic `BaseModel` for all request/response models
- CORS enabled for `http://localhost:4200` (dev)
- All routes prefixed with `/api`
- Use `async def` for all route handlers
- Never commit `appsettings.json` or `.env` with real credentials

---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start    # proxies /api → localhost:8000
```

---

## Testing

- Every component and service must have a `.spec.ts` file
- Selenium UI tests: use `By.Id()` only — never XPath or CSS selectors
- Every testable HTML element needs a unique `id` attribute

---

## Tooling: Image / Asset Conversion

When runtimes (Python, Node.js) are not available locally, use **Docker** for asset processing tasks.

### SVG → favicon.ico

To regenerate `frontend/public/favicon.ico` from `frontend/public/logo.svg` (logo rendered at 80% scale with transparent padding, multi-size ICO):

```bash
docker run --rm -v "${PWD}/frontend/public:/work" python:3.11-slim bash -c "
apt-get update -qq && apt-get install -y -qq libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libffi-dev shared-mime-info &&
pip install cairosvg Pillow --quiet &&
python3 - <<'EOF'
import cairosvg, io
from PIL import Image

inner = int(256 * 0.9)
with open('/work/logo.svg', 'r') as f:
    svg = f.read()

# Swap light/dark blues so circles are dark and T is light
svg = svg.replace('#5ac4f6', '__CIRCLE_MAIN__')
svg = svg.replace('#0042a9', '__T_MAIN__')
svg = svg.replace('#93e3fd', '__CIRCLE_OVERLAY__')
svg = svg.replace('#1a0a52', '__T_SHADOW__')
svg = svg.replace('__CIRCLE_MAIN__',    '#0042a9')
svg = svg.replace('__T_MAIN__',         '#5ac4f6')
svg = svg.replace('__CIRCLE_OVERLAY__', '#1a0a52')
svg = svg.replace('__T_SHADOW__',       '#93e3fd')

png_bytes = cairosvg.svg2png(bytestring=svg.encode(), output_width=inner, output_height=inner)
inner_img = Image.open(io.BytesIO(png_bytes)).convert('RGBA')
canvas = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
offset = (256 - inner) // 2
canvas.paste(inner_img, (offset, offset), inner_img)
canvas.save('/work/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(256,256)])
print('Done')
EOF
"
```
