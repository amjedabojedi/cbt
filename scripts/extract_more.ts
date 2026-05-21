import { Project, SyntaxKind, CallExpression } from "ts-morph";
import * as fs from "fs";

const project = new Project();
const routesFile = project.addSourceFileAtPath("server/routes.ts");

const EXTRACTION_MAP = [
  { prefix: "/api/admin", output: "server/routes/admin.routes.ts" },
  { prefix: "/api/journal", output: "server/routes/journal.routes.ts" },
  { prefix: "/api/goals", output: "server/routes/goals.routes.ts" },
  { prefix: "/api/milestones", output: "server/routes/goals.routes.ts" }, // milestones go with goals
  { prefix: "/api/thoughts", output: "server/routes/thoughts.routes.ts" }, // global thoughts
];

console.log(`Analyzing ${routesFile.getFilePath()}...`);

const registerRoutesFunc = routesFile.getFunction("registerRoutes");
if (!registerRoutesFunc) process.exit(1);

const callExpressions = registerRoutesFunc.getDescendantsOfKind(SyntaxKind.CallExpression);

const extractedCodeByFile: Record<string, string> = {};
const nodesToRemove: CallExpression[] = [];

for (const callExpr of callExpressions) {
  const expr = callExpr.getExpression();
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
    if (propAccess) {
      const obj = propAccess.getExpression().getText();
      const name = propAccess.getName();
      
      if (obj === "app" && ["get", "post", "put", "patch", "delete"].includes(name)) {
        const args = callExpr.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
          const path = args[0].getText().replace(/['"]/g, '');
          
          for (const target of EXTRACTION_MAP) {
            if (path.startsWith(target.prefix)) {
              console.log(`Extracting: ${name.toUpperCase()} ${path} -> ${target.output}`);
              
              let newPath = path.substring(target.prefix.length);
              if (newPath === "") newPath = "/";
              else if (!newPath.startsWith("/")) newPath = "/" + newPath;
              
              // We don't strip the full prefix if it's mapped differently, 
              // wait, let's keep it simple: keep the original path but strip /api/
              // Wait, if we keep the original path, we can't mount it effectively at /api/admin.
              // We should just replace "app." with "router." and keep the FULL path, OR use newPath.
              // Let's use the FULL PATH but strip "/api". Then we can mount everything at "/api" in index.ts!
              // BUT wait, in index.ts I did `router.use("/admin", adminRouter)`.
              // So I should strip `/api/admin` to `/`.
              
              // To handle `/api/milestones` going to `goals`, stripping the prefix is tricky.
              // Let's just strip `/api` and put the full path! e.g., `router.get("/admin/stats")`
              // Then in index.ts we just `app.use("/api", ...)`.
              
              const relativePath = path.substring("/api".length); // e.g. "/admin/stats"
              
              let routeText = callExpr.getFullText();
              const oldPathStr = `"${path}"`;
              const newPathStr = `"${relativePath}"`;
              routeText = routeText.replace(`app.${name}(${oldPathStr}`, `router.${name}(${newPathStr}`);
              
              extractedCodeByFile[target.output] = (extractedCodeByFile[target.output] || "") + routeText + ";\n\n";
              nodesToRemove.push(callExpr);
              break; // only match the first valid prefix
            }
          }
        }
      }
    }
  }
}

if (nodesToRemove.length > 0) {
  nodesToRemove.forEach(node => {
    const statement = node.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
    if (statement) statement.remove();
  });
  routesFile.saveSync();
  console.log("Saved server/routes.ts");

  for (const [outputFile, code] of Object.entries(extractedCodeByFile)) {
    let templateContent = "";
    if (fs.existsSync(outputFile)) {
      templateContent = fs.readFileSync(outputFile, "utf8");
      // Append before export default router;
      if (templateContent.includes("export default router;")) {
        templateContent = templateContent.replace("export default router;", `${code}\nexport default router;`);
      } else {
        templateContent += `\n${code}\nexport default router;`;
      }
    } else {
      // create bare file
      templateContent = `import { Router } from "express";\nconst router = Router({ mergeParams: true });\n\n${code}\nexport default router;`;
    }
    fs.writeFileSync(outputFile, templateContent);
    console.log(`Saved extracted routes to ${outputFile}`);
  }
} else {
  console.log("No routes found to extract.");
}
