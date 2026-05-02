-- Agregar columnas country y state a la tabla barbers
alter table public.barbers 
add column if not exists country text,
add column if not exists state text;