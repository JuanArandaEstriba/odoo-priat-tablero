// Herramienta local de Claude para leer y guardar los datos cifrados del tablero.
// La llave de datos vive fuera del repositorio, en ~/.config/odoo-tablero/llave-datos (permiso 600).
//   node claude-datos.mjs importar-llave <archivo>   guarda la llave descargada de configurar.html
//   node claude-datos.mjs leer <salida.json>         git pull y descifra los datos
//   node claude-datos.mjs guardar <entrada.json> "<mensaje>"   cifra, hace commit y push
import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(fileURLToPath(import.meta.url));
const DATA = join(REPO, "data", "tablero.enc.json");
const KEYDIR = join(homedir(), ".config", "odoo-tablero");
const KEYFILE = join(KEYDIR, "llave-datos");
const { subtle } = globalThis.crypto;

const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { stdio: ["ignore", "pipe", "inherit"] }).toString();
async function key() {
  if (!existsSync(KEYFILE)) throw new Error("Falta la llave de datos. Usa: importar-llave <archivo>");
  return subtle.importKey("raw", Buffer.from(readFileSync(KEYFILE, "utf8").trim(), "base64"), "AES-GCM", false, ["encrypt", "decrypt"]);
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === "importar-llave") {
  const b = readFileSync(a1, "utf8").trim();
  if (Buffer.from(b, "base64").length !== 32) throw new Error("Ese archivo no es una llave de datos válida.");
  mkdirSync(KEYDIR, { recursive: true, mode: 0o700 });
  writeFileSync(KEYFILE, b, { mode: 0o600 }); chmodSync(KEYFILE, 0o600);
  console.log("Llave guardada en", KEYFILE);
} else if (cmd === "leer") {
  git("pull", "-q", "--rebase");
  const enc = JSON.parse(readFileSync(DATA, "utf8"));
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: Buffer.from(enc.iv, "base64") }, await key(), Buffer.from(enc.ct, "base64"));
  writeFileSync(a1, Buffer.from(pt).toString("utf8"));
  console.log("Datos descifrados en", a1);
} else if (cmd === "guardar") {
  const raw = JSON.parse(readFileSync(a1, "utf8"));
  raw.actualizado = new Date().toISOString();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, await key(), Buffer.from(JSON.stringify(raw)));
  git("pull", "-q", "--rebase");
  writeFileSync(DATA, JSON.stringify({ v: 1, iv: Buffer.from(iv).toString("base64"), ct: Buffer.from(ct).toString("base64") }));
  git("add", "data/tablero.enc.json");
  git("-c", "user.name=Claude (tablero)", "-c", "user.email=tablero-odoo@users.noreply.github.com", "commit", "-q", "-m", `Claude: ${a2 || "cambios en el tablero"}`);
  git("push", "-q");
  console.log("Guardado y publicado.");
} else {
  console.log("Uso: importar-llave <archivo> | leer <salida.json> | guardar <entrada.json> \"<mensaje>\"");
}
