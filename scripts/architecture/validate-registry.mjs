// Explicit offline invocation; no implicit Git or cloud access.
import {validateRegistryFiles} from "./registry-validator-files.mjs";

const args=process.argv.slice(2);
if(args.length!==4||args[0]!=="--root"||args[2]!=="--previous"||!args[1]||!args[3]) {
  process.stderr.write("Usage: node scripts/architecture/validate-registry.mjs --root <registry-dir> --previous <v0.5-file>\n");
  process.exitCode=2;
} else {
  try {
    const result=validateRegistryFiles(args[1],args[3]);
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    process.exitCode=result.structurallyValid?0:1;
  } catch {
    process.stderr.write("REGISTRY_INPUT_ERROR: unable to read or parse explicit metadata inputs\n");
    process.exitCode=2;
  }
}
