import { Project, SyntaxKind, CallExpression } from "ts-morph";
import * as fs from "fs";

const project = new Project();
const routesFile = project.addSourceFileAtPath("server/routes.ts");

// Define which domain we are extracting
const TARGET_PREFIX = "/api/users/:userId/journal";
const OMIT_PREFIXES = [];
const ROUTER_OUTPUT = "server/routes/journal.routes.ts";

console.log(`Analyzing ${routesFile.getFilePath()}...`);

// We want to find all calls to `app.get`, `app.post`, `app.patch`, `app.put`, `app.delete`
// inside the `registerRoutes` function.
const registerRoutesFunc = routesFile.getFunction("registerRoutes");
if (!registerRoutesFunc) {
  console.error("Could not find registerRoutes function");
  process.exit(1);
}

const callExpressions = registerRoutesFunc.getDescendantsOfKind(SyntaxKind.CallExpression);

let extractedRoutesCode = "";

// Keep track of nodes to remove later (to avoid messing up iteration)
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
          const path = args[0].getText().replace(/['"]/g, ''); // e.g. "/api/users/..."
          
          if (path.startsWith(TARGET_PREFIX)) {
            // Check if it's in the omit list
            const shouldOmit = OMIT_PREFIXES.some(omit => path.startsWith(omit));
            if (!shouldOmit) {
              console.log(`Extracting: ${name.toUpperCase()} ${path}`);
              
              // Rewrite path: remove "/api/users" from the beginning
              let newPath = path.substring(TARGET_PREFIX.length);
              if (newPath === "") newPath = "/";
              
              // Get the full text of the route registration
              let routeText = callExpr.getFullText();
              
              // Replace `app.get("/api/users/...", ` with `router.get("/...", `
              // Note: using regex to ensure we only replace the path part
              const oldPathStr = `"${path}"`;
              const newPathStr = `"${newPath}"`;
              routeText = routeText.replace(`app.${name}(${oldPathStr}`, `router.${name}(${newPathStr}`);
              
              extractedRoutesCode += routeText + ";\n\n";
              nodesToRemove.push(callExpr);
            }
          }
        }
      }
    }
  }
}

if (nodesToRemove.length > 0) {
  console.log(`Extracted ${nodesToRemove.length} routes.`);
  
  // Actually remove the statements from the source file
  // Since callExpr is inside an ExpressionStatement, we should remove the statement
  nodesToRemove.forEach(node => {
    const statement = node.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
    if (statement) {
      // Check if there are preceding comments we should preserve or remove
      statement.remove();
    }
  });

  // Save the modified routes.ts
  routesFile.saveSync();
  console.log("Saved server/routes.ts");

  // Read the router template and inject the extracted code
  let templateContent = fs.readFileSync(ROUTER_OUTPUT, "utf8");
  
  // Replace the TODOs with the actual extracted code
  // We'll just append it before `export default router;` for simplicity
  templateContent = templateContent.replace("export default router;", `${extractedRoutesCode}\nexport default router;`);
  
  // Clean up the TODOs
  templateContent = templateContent.replace(/\/\/ TODO: Copy handler.*?\n/g, "");
  
  fs.writeFileSync(ROUTER_OUTPUT, templateContent);
  console.log(`Saved extracted routes to ${ROUTER_OUTPUT}`);
} else {
  console.log("No routes found to extract.");
}
