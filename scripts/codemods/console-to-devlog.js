/**
 * jscodeshift codemod
 * - console.log(...) -> devLog.debug(...)
 * - leaves warn/error intact
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // ensure import exists (TypeScript or JS)
  const ensureImport = () => {
    const hasImport = root.find(j.ImportDeclaration, {
      source: { value: "@/utils/devLogger" }
    }).size() > 0;

    if (!hasImport) {
      const firstImport = root.find(j.ImportDeclaration).at(0);
      const imp = j.importDeclaration(
        [j.importDefaultSpecifier(j.identifier("devLog"))],
        j.literal("@/utils/devLogger")
      );
      if (firstImport.size()) firstImport.insertBefore(imp);
      else root.get().node.program.body.unshift(imp);
    }
  };

  let touched = false;

  root.find(j.MemberExpression, {
    object: { name: "console" },
    property: { name: "log" },
  })
  .forEach(path => {
    // Replace console.log(...) call with devLog.debug(...)
    const call = path.parent.node;
    if (call.type !== "CallExpression") return;
    path.replace(
      j.memberExpression(j.identifier("devLog"), j.identifier("debug"))
    );
    touched = true;
  });

  if (touched) ensureImport();
  return touched ? root.toSource() : null;
}
