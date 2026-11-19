# Tablero de implementación de Odoo · Grupo PRIAT

Página estática en GitHub Pages. **Todo está cifrado**: para ver se pide la contraseña para ver; para editar, tocar **Editar**, elegir quién eres (Juan Carlos, Iván o Aarón) y poner la contraseña para editar.

- `index.html`: el tablero (resumen, plan, tareas, semanas, procesos, decisiones y buzón para Claude).
- `data/tablero.enc.json`: los datos, cifrados con AES-GCM. Cada cambio hecho en la página es un commit con el nombre de quien lo hizo.
- `acceso.json`: la llave de datos protegida con la contraseña para ver (PBKDF2 + AES-GCM).
- `llave.json`: el token de GitHub y la llave de datos protegidos con la contraseña para editar.
- `configurar.html`: pone o cambia contraseñas y token, en el navegador.
- `claude-datos.mjs`: herramienta local de Claude para leer y guardar los datos cifrados.
- `img/juan.jpg`, `img/ivan.jpg`, `img/aaron.jpg`: fotos (si faltan, se usan iniciales).
