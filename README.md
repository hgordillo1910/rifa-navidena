# Rifa navideña

Sitio estático con dos rutas: `/` (público) y `/admin` (administración). Valor $20.000 COP, sorteo 2026-12-01. Backend Supabase.

## Despliegue Render

Static site, build command `mkdir -p public && cp index.html app.js config.js public/ && mkdir -p public/admin && cp index.html app.js config.js public/admin/`, publish directory `public`.

## Seguridad

Los compradores solo consultan `raffle_numbers`, nunca `raffle_sales`. Para habilitar una cuenta administradora, después de crearla en Supabase Auth, ejecutar desde SQL Editor con privilegios de propietario:

```sql
insert into public.raffle_admins(user_id)
select id from auth.users where email = 'CORREO_DEL_ADMINISTRADOR'
on conflict do nothing;
```

No introducir contraseñas en SQL ni en GitHub. La contraseña se valida mediante Supabase Auth.
