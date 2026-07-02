# Tesoro Estudio - Tienda

## Cómo correrlo local (Paso 1)

1. Instalar dependencias:
   ```
   npm install
   ```

2. Copiar el archivo de ejemplo de variables de entorno:
   ```
   cp .env.local.example .env.local
   ```

3. Abrir `.env.local` y completar con tus datos reales de Supabase
   (Project Settings → Data API en el dashboard de Supabase):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. Levantar el servidor de desarrollo:
   ```
   npm run dev
   ```

5. Abrir [http://localhost:3000](http://localhost:3000) — deberías ver la página de inicio.

6. Abrir [http://localhost:3000/api/health](http://localhost:3000/api/health) —
   debería devolver `"status": "ok"` si las 3 variables están bien cargadas.

## Subir a GitHub

```
git init
git add .
git commit -m "esqueleto inicial del proyecto"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tesoro-tienda.git
git push -u origin main
```

(Reemplazá la URL del remote por la de tu repo real)

## Siguiente paso

Paso 2: crear las tablas en Supabase (`products`, `orders`, `order_items`)
y un endpoint que liste productos reales desde la base.
