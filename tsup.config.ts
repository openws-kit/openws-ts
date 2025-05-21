import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/client/index.ts"],
	outDir: "dist/client",
	format: ["esm", "cjs"],
	dts: true,
	splitting: false,
	clean: true,
});
