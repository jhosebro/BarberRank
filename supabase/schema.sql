-- ============================================
-- BarberApp MVP - Schema Supabase
-- Ejecutar en: Supabase > SQL Editor
-- ============================================

-- -----------------------------------------------
-- EXTENSIONES
-- -----------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "postgis"; -- Para búsqueda por ciudad/ubicación

-- -----------------------------------------------
-- TABLA: profiles (extiende auth.users de Supabase)
-- -----------------------------------------------
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'client' check (role in ('client', 'barber', 'admin')),
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------
-- TABLA: barbers (perfil extendido del barbero)
-- -----------------------------------------------
create table public.barbers (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid references public.profiles(id) on delete cascade not null unique,
  bio           text,
  city          text not null,
  address       text,
  lat           double precision,
  lng           double precision,
  rating        numeric(3,2) default 0.00,
  review_count  int default 0,
  is_active     boolean default true,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------
-- TABLA: services (servicios que ofrece un barbero)
-- -----------------------------------------------
create table public.services (
  id            uuid primary key default uuid_generate_v4(),
  barber_id     uuid references public.barbers(id) on delete cascade not null,
  name          text not null,
  description   text,
  duration_min  int not null default 30,  -- duración en minutos
  price         numeric(10,2) not null,
  is_active     boolean default true,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------
-- TABLA: availability (horarios disponibles del barbero)
-- -----------------------------------------------
create table public.availability (
  id          uuid primary key default uuid_generate_v4(),
  barber_id   uuid references public.barbers(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Dom, 1=Lun...
  start_time  time not null,
  end_time    time not null,
  is_active   boolean default true
);

-- -----------------------------------------------
-- TABLA: bookings (citas)
-- -----------------------------------------------
create type booking_status as enum (
  'pending',    -- esperando confirmación del barbero
  'confirmed',  -- confirmada
  'completed',  -- completada
  'cancelled',  -- cancelada
  'no_show'     -- el cliente no apareció
);

create table public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid references public.profiles(id) on delete set null,
  barber_id       uuid references public.barbers(id) on delete set null,
  service_id      uuid references public.services(id) on delete set null,
  scheduled_at    timestamptz not null,
  ends_at         timestamptz not null,
  status          booking_status not null default 'pending',
  total_price     numeric(10,2) not null,
  notes           text,
  -- Pago
  payment_status  text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  payment_ref     text, -- referencia de Wompi
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------
-- TABLA: reviews (reseñas post-servicio)
-- -----------------------------------------------
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings(id) on delete cascade not null unique,
  client_id   uuid references public.profiles(id) on delete set null,
  barber_id   uuid references public.barbers(id) on delete cascade not null,
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------
-- FUNCIONES Y TRIGGERS
-- -----------------------------------------------

-- Auto-crear profile cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_bookings_updated
  before update on public.bookings
  for each row execute procedure public.handle_updated_at();

-- Actualizar rating del barbero cuando se agrega una reseña
create or replace function public.update_barber_rating()
returns trigger as $$
begin
  update public.barbers
  set
    rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where barber_id = new.barber_id
    ),
    review_count = (
      select count(*)
      from public.reviews
      where barber_id = new.barber_id
    )
  where id = new.barber_id;
  return new;
end;
$$ language plpgsql;

create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_barber_rating();

-- -----------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------

alter table public.profiles    enable row level security;
alter table public.barbers     enable row level security;
alter table public.services    enable row level security;
alter table public.availability enable row level security;
alter table public.bookings    enable row level security;
alter table public.reviews     enable row level security;

-- PROFILES
create policy "Perfil público visible para todos"
  on public.profiles for select using (true);

create policy "Usuario edita su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- BARBERS
create policy "Barberos visibles para todos"
  on public.barbers for select using (true);

create policy "Barbero edita su propio registro"
  on public.barbers for update
  using (auth.uid() = profile_id);

create policy "Barbero puede crearse"
  on public.barbers for insert
  with check (auth.uid() = profile_id);

-- SERVICES
create policy "Servicios visibles para todos"
  on public.services for select using (true);

create policy "Barbero gestiona sus servicios"
  on public.services for all
  using (
    barber_id in (
      select id from public.barbers where profile_id = auth.uid()
    )
  );

-- AVAILABILITY
create policy "Disponibilidad visible para todos"
  on public.availability for select using (true);

create policy "Barbero gestiona su disponibilidad"
  on public.availability for all
  using (
    barber_id in (
      select id from public.barbers where profile_id = auth.uid()
    )
  );

-- BOOKINGS
create policy "Cliente ve sus propias citas"
  on public.bookings for select
  using (auth.uid() = client_id);

create policy "Barbero ve sus citas"
  on public.bookings for select
  using (
    barber_id in (
      select id from public.barbers where profile_id = auth.uid()
    )
  );

create policy "Cliente puede crear una cita"
  on public.bookings for insert
  with check (auth.uid() = client_id);

create policy "Barbero puede actualizar estado de cita"
  on public.bookings for update
  using (
    barber_id in (
      select id from public.barbers where profile_id = auth.uid()
    )
  );

-- REVIEWS
create policy "Reseñas visibles para todos"
  on public.reviews for select using (true);

create policy "Cliente crea reseña de su cita"
  on public.reviews for insert
  with check (auth.uid() = client_id);
