/* eslint-disable */
const fs = require('fs');
const path = require('path');
const os = require('os');

function posix(p) { return p.split(path.sep).join(path.posix.sep); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function stripTsExt(p) { return p.replace(/\.tsx?$/i, ''); }
function toRelImport(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  let rel = posix(path.relative(fromDir, toFile));
  rel = stripTsExt(rel);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

const bannedImportRe = /^(?:@nestjs\/|class-validator|class-transformer|@nestjs-swagger|@nestjs\/mapped-types|nestjs)/;

const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('Usage: node dto-transformer.cjs <BACKEND_SRC> <FRONTEND_TYPES> <DATE_AS_STRING:true|false> <ADD_BANNER:true|false>');
  process.exit(1);
}
const BACKEND_SRC = path.resolve(args[0]);
const FRONTEND_TYPES = path.resolve(args[1]);
const DATE_AS_STRING = args[2] === 'true';
const ADD_BANNER = args[3] === 'true';

let tsMorph;
try { tsMorph = require('ts-morph'); }
catch {
  console.error("❌ ts-morph not installed. Run: npm i -D ts-morph");
  process.exit(1);
}
const { Project, SyntaxKind } = tsMorph;

const project = new Project({
  compilerOptions: {
    allowJs: false,
    declaration: false,
    emitDeclarationOnly: false,
    target: 99, // ESNext
    module: 99,
    esModuleInterop: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    noEmit: true,
    baseUrl: BACKEND_SRC,
  },
});

// Load all TS so relative import resolution works
project.addSourceFilesAtPaths(posix(path.join(BACKEND_SRC, '**/*.ts')));

// Discover DTO files
function isDtoDir(dirPath) {
  return path.basename(dirPath).toLowerCase() === 'dto';
}
function walkDirs(start) {
  const out = [];
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    const p = path.join(start, entry.name);
    if (entry.isDirectory()) {
      if (isDtoDir(p)) out.push(p);
      out.push(...walkDirs(p));
    }
  }
  return out;
}
const dtoDirs = walkDirs(BACKEND_SRC);

const dtoFiles = [];
for (const d of dtoDirs) {
  for (const f of fs.readdirSync(d)) {
    if (!/\.ts$/i.test(f)) continue;
    if (/\.(spec|test)\.ts$/i.test(f)) continue;
    dtoFiles.push(path.join(d, f));
  }
}

// Collect auxiliary files to copy (enums/types imported by DTOs)
const auxToCopy = new Set();

function isEnumOrTypesFile(sf) {
  const fp = posix(sf.getFilePath());
  return /\/enums\//i.test(fp) || /\.enum\.ts$/i.test(fp) || /\/types\//i.test(fp) || /\.type(s)?\.ts$/i.test(fp);
}

function mapMappedTypeCall(callExpr) {
  const id = callExpr.getExpression().getText();
  const args = callExpr.getArguments();
  const mapInner = (expr) => {
    if (expr.getKind() === SyntaxKind.CallExpression) return mapMappedTypeCall(expr);
    return expr.getText();
  };
  if (id === 'PartialType' && args.length >= 1) {
    return `Partial<${mapInner(args[0])}>`;
  }
  if (id === 'PickType' && args.length >= 2) {
    const base = mapInner(args[0]);
    const arr = args[1];
    let keys = '';
    if (arr.getKind() === SyntaxKind.ArrayLiteralExpression) {
      const elems = arr.getElements().map(e => e.getText().replace(/^['"`]|['"`]$/g, ''));
      keys = elems.map(k => `'${k}'`).join(' | ');
    } else {
      keys = arr.getText();
    }
    return `Pick<${base}, ${keys}>`;
  }
  if (id === 'OmitType' && args.length >= 2) {
    const base = mapInner(args[0]);
    const arr = args[1];
    let keys = '';
    if (arr.getKind() === SyntaxKind.ArrayLiteralExpression) {
      const elems = arr.getElements().map(e => e.getText().replace(/^['"`]|['"`]$/g, ''));
      keys = elems.map(k => `'${k}'`).join(' | ');
    } else {
      keys = arr.getText();
    }
    return `Omit<${base}, ${keys}>`;
  }
  if (id === 'IntersectionType' && args.length >= 2) {
    return `${mapInner(args[0])} & ${mapInner(args[1])}`;
  }
  // Fallback: keep original text
  return callExpr.getText();
}

function propIsOptional(prop) {
  if (prop.hasQuestionToken()) return true;
  const decos = prop.getDecorators().map(d => d.getName());
  if (decos.includes('IsOptional') || decos.includes('ApiPropertyOptional')) return true;
  // ApiProperty({ required: false })
  const ap = prop.getDecorators().find(d => d.getName() === 'ApiProperty');
  if (ap) {
    const args = ap.getArguments();
    if (args.length && args[0].getText().includes('required') && /required\s*:\s*false/.test(args[0].getText())) {
      return true;
    }
  }
  return false;
}

function massageTypeText(t) {
  let text = t || 'any';
  // Remove definite assignment or question marks around name handled elsewhere
  // Map Date -> string (and arrays/unions)
  if (DATE_AS_STRING) {
    // Replace standalone Date tokens
    text = text.replace(/\bDate\b/g, 'string');
  }
  // Normalize Readonly<T> to readonly properties is handled by prop flag; leave types alone
  return text;
}

function getJsDocText(node) {
  const jsDocs = node.getJsDocs?.() || [];
  if (!jsDocs.length) return '';
  return jsDocs.map(d => d.getInnerText()).join('\n');
}

function buildPropertyLine(prop) {
  const name = prop.getName();
  const q = propIsOptional(prop) ? '?' : '';
  const readonly = prop.isReadonly() ? 'readonly ' : '';
  const tn = prop.getTypeNode();
  const typeText = massageTypeText(tn ? tn.getText() : 'any');
  const jsdoc = prop.getJsDocs().map(doc => doc.getText()).join('\n');
  const exclam = ''; // drop definite assignment
  const line = `${readonly}${name}${q}: ${typeText};`;
  return (jsdoc ? `${jsdoc}\n` : '') + line;
}

function transformClassToInterfaceOrType(cls) {
  const name = cls.getName() || 'AnonymousDto';
  const isDefault = cls.isDefaultExport();
  const heritage = cls.getHeritageClauses();
  const extendsParts = [];
  let hasMapped = false;

  heritage.forEach(h => {
    const types = h.getTypeNodes();
    types.forEach(t => {
      const expr = t.getExpression();
      if (!expr) return;
      const k = expr.getKind();
      if (k === SyntaxKind.Identifier || k === SyntaxKind.PropertyAccessExpression) {
        // Simple extends/implements
        extendsParts.push(t.getText());
      } else if (k === SyntaxKind.CallExpression) {
        hasMapped = true;
        extendsParts.push(mapMappedTypeCall(expr));
      } else {
        extendsParts.push(t.getText());
      }
    });
  });

  const props = cls.getProperties();
  const propLines = props.map(p => '  ' + buildPropertyLine(p));

  let out = '';
  if (hasMapped || extendsParts.length > 0) {
    // Build as type alias combining bases with inline shape
    const base = extendsParts.join(' & ');
    if (propLines.length > 0) {
      out += `export type ${name} = ${base || 'unknown'} & {\n${propLines.join('\n')}\n};\n`;
    } else if (base) {
      out += `export type ${name} = ${base};\n`;
    } else {
      out += `export interface ${name} {}\n`;
    }
    if (isDefault) out += `export default ${name};\n`;
    return out;
  } else {
    const extendsIfc = extendsParts.length ? ` extends ${extendsParts.join(', ')}` : '';
    out += `export interface ${name}${extendsIfc} {\n${propLines.join('\n')}\n}\n`;
    if (isDefault) out += `export default ${name};\n`;
    return out;
  }
}

function rewriteImportsAndCollectAux(sourceFile, outFilePath) {
  const lines = [];
  for (const imp of sourceFile.getImportDeclarations()) {
    const mod = imp.getModuleSpecifierValue();

    // Drop banned Nest/validator/etc
    if (bannedImportRe.test(mod)) continue;

    // Re-exports are handled below
    const targetSf = imp.getModuleSpecifierSourceFile();

    // Turn all imports into type-only to avoid runtime
    const named = imp.getNamedImports().map(s => s.getText());
    const deflt = imp.getDefaultImport() ? imp.getDefaultImport().getText() : null;
    const ns = imp.getNamespaceImport() ? imp.getNamespaceImport().getText() : null;

    let newModule = mod;

    if (targetSf) {
      const targetPath = targetSf.getFilePath();
      // Record aux files to copy if enums/types
      if (isEnumOrTypesFile(targetSf)) auxToCopy.add(targetPath);

      // Map module path to new output location
      const mappedTarget = mapBackendPathToFrontend(targetPath);
      newModule = toRelImport(outFilePath, mappedTarget);
    } else {
      // Non-relative import (package) – keep as-is
      newModule = mod;
    }

    if (deflt) {
      lines.push(`import type ${deflt} from "${newModule}";`);
    }
    if (ns) {
      lines.push(`import type * as ${ns} from "${newModule}";`);
    }
    if (named.length) {
      lines.push(`import type { ${named.join(', ')} } from "${newModule}";`);
    }
  }

  // Handle export-from ("export { X } from './...'") and rewrite paths similarly
  for (const exp of sourceFile.getExportDeclarations()) {
    const mod = exp.getModuleSpecifierValue?.();
    if (!mod) continue;
    const targetSf = exp.getModuleSpecifierSourceFile?.();
    let newModule = mod;
    if (targetSf) {
      const mappedTarget = mapBackendPathToFrontend(targetSf.getFilePath());
      newModule = toRelImport(outFilePath, mappedTarget);
    }
    const named = exp.getNamedExports().map(ne => ne.getText());
    if (named.length) {
      lines.push(`export type { ${named.join(', ')} } from "${newModule}";`);
    } else if (exp.isExportAll()) {
      lines.push(`export * from "${newModule}";`);
    }
  }

  return lines;
}

function mapBackendPathToFrontend(absBackendFile) {
  const rel = posix(path.relative(BACKEND_SRC, absBackendFile)); // e.g. food/dto/create-x.dto.ts
  // Remove '/dto/' segment
  const relNoDto = rel.replace(/\/dto\//i, '/');
  // Map root
  const out = posix(path.join(FRONTEND_TYPES, relNoDto));
  return out;
}

function bannerText() {
  return `// AUTO-GENERATED FROM backend DTOs.
// Do not edit by hand. Run scripts/sync-dtos.sh to regenerate.
`;
}

function processDtoFile(absPath) {
  const sf = project.getSourceFile(absPath);
  if (!sf) return;

  const mappedOut = mapBackendPathToFrontend(absPath);
  ensureDir(path.dirname(mappedOut));

  // Prepare content pieces
  const outLines = [];
  if (ADD_BANNER) {
    outLines.push(bannerText());
    outLines.push('/* eslint-disable */');
  }

  // Imports (rewritten)
  outLines.push(...rewriteImportsAndCollectAux(sf, mappedOut));

  // Keep enums, type aliases, interfaces (not classes)
  const statements = sf.getStatements();
  for (const st of statements) {
    const k = st.getKind();
    // Skip pure import/export decls (already handled), skip classes (we'll transform)
    if (k === SyntaxKind.ImportDeclaration || k === SyntaxKind.ExportDeclaration) continue;

    if (k === SyntaxKind.EnumDeclaration ||
        k === SyntaxKind.TypeAliasDeclaration ||
        (k === SyntaxKind.InterfaceDeclaration)) {
      outLines.push(st.getText());
    }
  }

  // Transform every class decl
  const classes = sf.getClasses();
  for (const cls of classes) {
    outLines.push(transformClassToInterfaceOrType(cls));
