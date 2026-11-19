// Conecta la llave de GitHub al tablero. La toma del portapapeles, la cifra con la
// contraseña para editar (guardada en ~/.config/odoo-tablero/) y sube llave.json.
// La llave nunca se imprime ni se guarda sin cifrar. Uso: node conectar-llave.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(fileURLToPath(import.meta.url));
const H = join(homedir(), ".config", "odoo-tablero");
const { subtle } = globalThis.crypto;
const rnd = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const B = (u) => Buffer.from(u).toString("base64");

const tk = execFileSync("pbpaste").toString().trim();
if (!/^github_pat_[A-Za-z0-9_]{40,}$/.test(tk)) { console.error("El portapapeles no tiene una llave de GitHub. Cópiala con el ícono de copiar y vuelve a correr el comando."); process.exit(1); }
const r = await fetch("https://api.github.com/repos/JuanArandaEstriba/odoo-priat-tablero", { headers: { Authorization: `Bearer ${tk}` } });
if (!r.ok) { console.error("Esa llave no abre el repositorio del tablero."); process.exit(1); }

const editar = readFileSync(join(H, "contrasenas.txt"), "utf8").match(/EDITAR[^:]*:\s+(\S+)/)[1];
const dk = readFileSync(join(H, "llave-datos"), "utf8").trim();
const salt = rnd(16), iv = rnd(12);
const base = await subtle.importKey("raw", new TextEncoder().encode(editar), "PBKDF2", false, ["deriveKey"]);
const key = await subtle.deriveKey({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify({ tk, dk })));
const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { stdio: ["ignore", "ignore", "inherit"] });
git("pull", "-q", "--rebase");
writeFileSync(join(REPO, "llave.json"), JSON.stringify({ v: 1, iter: 310000, salt: B(salt), iv: B(iv), ct: B(ct), creada: new Date().toISOString() }, null, 1));
git("add", "llave.json");
git("-c", "user.name=Juan Carlos Aranda", "-c", "user.email=JuanArandaEstriba@users.noreply.github.com", "commit", "-q", "-m", "Llave de edición conectada (cifrada)");
git("push", "-q");
execFileSync("pbcopy", { input: "" });
console.log("Listo. La llave quedó conectada y cifrada; en uno o dos minutos ya se puede editar.");
