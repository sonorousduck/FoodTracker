#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Project } = require("ts-morph");

const [,, BACKEND_SRC, FRONTEND_TYPES, DATE_AS_STRING, ADD_BANNER] = process.argv;

// Ensure frontend types folder exists
fs.mkdirSync(FRONTEND_TYPES, { recursive: true });

// Step 1: Collect all DTO/entity classes
const typeMap = new Map();

function collectTypes(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTypes(full);
    } else if (entry.isFile() && full.endsWith(".ts") && !/\.spec\.ts$|\.test\.ts$/.test(full)) {
      if (full.includes(`${path.sep}dto${path.sep}`) ||
          full.includes(`${path.sep}entities${path.sep}`) ||
          full.endsWith(".entity.ts")) {

        const project = new Project();
        const source = project.addSourceFileAtPath(full);
        source.getClasses().forEach(cls => {
          const name = cls.getName();
          if (!name) return;
          const relPath = path.relative(BACKEND_SRC, full)
            .replace(/[/\\]dto[/\\]/, "/")
            .replace(/[/\\]entities?[/\\]/, "/")
            .replace(/\.dto\.ts$/, "")
            .replace(/\.entity\.ts$/, "");
          typeMap.set(name, relPath);
        });
      }
    }
  }
}

collectTypes(BACKEND_SRC);

// Step 2: Map backend file to frontend path
function mapBackendPathToFrontend(file) {
  let rel = path.relative(BACKEND_SRC, file)
    .replace(/[/\\]dto[/\\]/, "/")
    .replace(/[/\\]entities?[/\\]/, "/")
    .replace(/\/$/, "")
    .replace(/\.dto\.ts$/, ".d.ts")
    .replace(/\.entity\.ts$/, ".d.ts");
  return path.join(FRONTEND_TYPES, rel);
}

// Step 3: Transform a single file
const bannerRegex = /^\/\*\*\n \* Auto-generated from backend DTOs\/Entities on [^\n]+\n \* Do not edit manually\.\n \*\/\n\n/;

function stripBanner(text) {
  return text.replace(bannerRegex, "");
}

function transformFile(inputPath, outputPath) {
  const project = new Project();
  const source = project.addSourceFileAtPath(inputPath);

  const imports = new Map();

  source.getClasses().forEach(cls => {
    cls.getDecorators().forEach(d => d.remove());

    // Remove heritage - Use removeExtends() method on the class
    if (cls.getExtends()) {
      cls.removeExtends();
    }
    
    cls.getImplements().forEach(i => i.remove());

    // Strip 'Entity' suffix for frontend interface
    const originalName = cls.getName() || "";
    const frontendName = originalName.replace(/Entity$/, "");

    const iface = source.addInterface({ name: frontendName, isExported: true });

    iface.addProperties(
      cls.getProperties().map(p => {
        let typeText = p.getTypeNode()?.getText() || p.getType().getText();

        // Replace known DTO/entity types with frontend name
        typeMap.forEach((relPath, key) => {
          const keyFrontend = key.replace(/Entity$/, "");
          const regex = new RegExp(`\\b${key}\\b`, "g");
          if (regex.test(typeText)) {
            typeText = typeText.replace(regex, keyFrontend);

            // Generate import path
            let importPath = path.relative(
              path.dirname(outputPath),
              path.join(FRONTEND_TYPES, relPath)
            );
            importPath = importPath.startsWith(".") ? importPath : `./${importPath}`;
            importPath = importPath.replace(/\\/g, "/");

            imports.set(keyFrontend, importPath);
          }
        });

        return {
          name: p.getName(),
          type: typeText,
          hasQuestionToken: p.hasQuestionToken(),
        };
      })
    );

    cls.remove();
  });

  source.getImportDeclarations().forEach(d => d.remove());
  source.getExportAssignments().forEach(d => d.remove());

  // Prepend imports
  let importText = "";
  imports.forEach((relPath, key) => {
    importText += `import { ${key} } from "${relPath}";\n`;
  });

  let output = importText + "\n" + source.getFullText();

  if (ADD_BANNER === "true") {
    output = `/**\n * Auto-generated from backend DTOs/Entities on ${DATE_AS_STRING}\n * Do not edit manually.\n */\n\n` + output;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  let existing = "";
  if (fs.existsSync(outputPath)) {
    existing = fs.readFileSync(outputPath, "utf8");
  }

  const nextComparable = stripBanner(output);
  const existingComparable = stripBanner(existing);

  if (nextComparable === existingComparable) {
    console.log("Unchanged:", outputPath);
    return;
  }

  fs.writeFileSync(outputPath, output, "utf8");
  console.log("Generated:", outputPath);
}

// Step 4: Walk backend folder recursively
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith(".ts") && !/\.spec\.ts$|\.test\.ts$/.test(full)) {
      if (full.includes(`${path.sep}dto${path.sep}`) ||
          full.includes(`${path.sep}entities${path.sep}`) ||
          full.endsWith(".entity.ts")) {
        const out = mapBackendPathToFrontend(full);
        transformFile(full, out);
      }
    }
  }
}

walk(BACKEND_SRC);
