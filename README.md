# Aguas en alerta

**Cada zona cuenta: rescata a tiempo antes de que la tormenta avance.**

## Cómo se juega

- Toca o haz clic en una zona para seleccionarla; con teclado, recórrelas con `Tab` y selecciónala con `Enter`.
- Elige **Avisar y evacuar** o **Drenar zona**; usa `Tab` para llegar a la acción y `Enter` para activarla.
- Tienes tres acciones por turno; después sube el agua. Salva al menos el 70 % de las familias para ganar.

## Jugar

[Jugar Aguas en alerta](https://drackenz.github.io/proyectotormenta/)

## Cómo ejecutarlo en otra máquina

Requiere Node.js 22 y npm. Desde la raíz del proyecto:

```sh
npm ci
npm run dev
```

Para verificar las pruebas, revisar el código y generar la versión de producción:

```sh
npm test
npm run lint
npm run build
npm run preview
```

## Organización del proyecto

- `index.html`: documento HTML inicial y punto de montaje de la aplicación.
- `src/main.ts`: interfaz, pantallas y enlace de controles a las acciones del juego.
- `src/estilo.css`: diseño adaptable, colores y estilos de accesibilidad.
- `src/juego.ts`: estado, reglas, acciones, turnos y resumen de la partida.
- `test/juego.test.ts`: pruebas de las reglas y de partidas completas.
- `vitest.config.ts`: selección de las pruebas y entorno Node para Vitest.
- `vite.config.ts`: configuración de Vite y ruta base para GitHub Pages.
- `eslint.config.js`: reglas flat de ESLint para JavaScript y TypeScript.
- `package.json`: dependencias y comandos del proyecto.
- `package-lock.json`: versiones fijadas de las dependencias npm.
- `public/favicon.svg`: icono del sitio.
- `public/icons.svg`: recursos SVG del sitio.
- `.github/workflows/deploy.yml`: pruebas, build y publicación automática en GitHub Pages.

## Qué dirigí yo

<!-- Completar aquí. -->

## Qué error encontré jugando que la máquina no avisó

<!-- Completar aquí. -->

## Declaración de autoría

- Herramienta utilizada: <!-- Completar aquí. -->
- Declaración sobre el código generado por un agente de IA bajo mi dirección: <!-- Completar aquí. -->
- Partes del proyecto que puedo explicar: <!-- Completar aquí. -->
