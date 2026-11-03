import type { UserConfig } from "tsdown";

const SOURCE_MAP_COMMENT = /\n?\/\/# sourceMappingURL=.*$/u;

export const base = {
  format: "esm",
  platform: "neutral",
  // What the published code needs: `#private` members. Raising it changes which
  // consumers can run the packages, so it takes a major version.
  target: "es2022",
  outDir: "dist",
  clean: true,
  minify: true,
  // JavaScript keeps its source maps. Declarations come from the explicit types
  // (isolatedDeclarations) and carry no map: nothing ships what it points at.
  sourcemap: true,
  dts: { generator: "oxc", sourcemap: false },
  tsconfig: "tsconfig.json",
  // Only a package's own source is bundled. The tsconfig `paths` map core to its
  // source for the typecheck, so core must stay an import: a copy would be a
  // separate, incompatible `Container` type because of its protected members.
  // Anything else not in `dependencies` fails the build instead of being inlined.
  deps: { neverBundle: [/^containerized-state$/u], onlyBundle: [] },
  plugins: [
    {
      // Rolldown appends a `sourceMappingURL` comment to a declaration file
      // even when no map is written for it, which leaves a dangling reference.
      name: "no-dangling-declaration-map-comment",
      generateBundle: (_options, bundle) => {
        for (const file of Object.values(bundle)) {
          if (file.type === "chunk" && file.fileName.endsWith(".d.ts")) {
            file.code = file.code.replace(SOURCE_MAP_COMMENT, "");
          }
        }
      },
    },
  ],
} satisfies UserConfig;
