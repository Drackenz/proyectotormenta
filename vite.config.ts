// GitHub Pages sirve el sitio en una subcarpeta con el nombre del repositorio.
// Sin esta base, las rutas de los recursos fallan y la página sale en blanco.
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/tormenta/',
})
