import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

it("keeps the CommonJS schedule declaration aligned with the checked implementation", () => {
  const helper = path.resolve("scripts/weekly_digest_schedule.cjs");
  const declaration = path.resolve("scripts/weekly_digest_schedule.d.cts");
  const program = ts.createProgram([helper], {
    allowJs: true,
    checkJs: true,
    strict: true,
    declaration: true,
    emitDeclarationOnly: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ESNext,
    types: [],
    skipLibCheck: true,
  });
  const outputs = new Map<string, string>();
  // Emit only in memory: never overwrite the declaration being verified.
  const result = program.emit(undefined, (name, text) => outputs.set(name, text));
  const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics];
  expect(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: name => name,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    }),
  ).toBe("");
  expect(result.emitSkipped).toBe(false);
  const inferred = outputs.get(declaration);
  expect(inferred).toBeDefined();

  // Normalize formatting/comments, but compare all exports, parameters and return
  // types. Export/signature changes must update the shipped declaration too.
  const printer = ts.createPrinter({ removeComments: true });
  const normalize = (text: string) => printer.printFile(
    ts.createSourceFile(declaration, text, ts.ScriptTarget.Latest, true),
  );
  expect(normalize(readFileSync(declaration, "utf8"))).toBe(normalize(inferred!));
});
