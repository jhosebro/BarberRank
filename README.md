# 💈 BarberApp

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Platform](https://img.shields.io/badge/platform-React%20Native-blue)
![Expo](https://img.shields.io/badge/expo-managed%20workflow-black)
![Backend](https://img.shields.io/badge/backend-Supabase-green)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

Aplicación móvil para la gestión de citas en barberías, permitiendo a los clientes agendar servicios de forma rápida y a los barberos administrar su disponibilidad y posicionamiento dentro de la plataforma.

---

## 📸 Screenshots

![Login](./assets/images/login.jpg)
![Booking](./assets/images/booking.png)
![Profile](./assets/images/profile.png)

---

## 📌 Descripción

BarberApp es una solución enfocada en optimizar la relación entre barberos y clientes mediante la digitalización del proceso de agendamiento. La aplicación facilita la reserva de citas y permite identificar a los mejores barberos mediante un sistema de ranking.

---

## 🎯 Usuarios objetivo

- Barberos que desean gestionar su disponibilidad y aumentar su visibilidad.
- Clientes que buscan agendar citas de manera rápida y eficiente.

---

## 🚀 Funcionalidades principales

- 📅 Gestión de disponibilidad de barberos
- 📲 Agendamiento de citas por parte de clientes
- ⭐ Sistema de ranking de barberos
- 🔐 Autenticación de usuarios

---

## 🧠 Arquitectura del proyecto

El proyecto sigue una arquitectura modular basada en separación de responsabilidades:

```
src/
│
├── components/       # Componentes reutilizables UI
├── screens/          # Pantallas principales
├── hooks/            # Lógica reutilizable (custom hooks)
├── services/         # Comunicación con APIs (Supabase)
├── context/          # Manejo de estado global (Auth, etc.)
├── utils/            # Funciones auxiliares
├── types/            # Tipado con TypeScript
└── constants/        # Configuraciones y valores estáticos
```

### 🔍 Principios aplicados

- Separación de responsabilidades
- Clean Code
- Uso de hooks personalizados
- Tipado estricto con TypeScript

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** React Native + Expo
- **Backend / BaaS:** Supabase
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth

---

## ⚙️ Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/barberapp.git
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar la aplicación:

```bash
npx expo start
```

---

## ▶️ Uso

Una vez iniciada la aplicación:

- Escanea el código QR con Expo Go (Android / iOS)
- O ejecútala en un emulador

---

## 🧱 Estado del proyecto

🚧 En desarrollo

Actualmente existe un MVP funcional listo para despliegue en Google Play Store.

---

## 📈 Roadmap

- 💳 Integración de pagos
- 🔔 Notificaciones push
- 👤 Perfil avanzado de barberos
- 📊 Historial de citas
- ⭐ Sistema de reseñas

---

## 🔐 Seguridad

- Autenticación gestionada mediante Supabase Auth
- Control de acceso basado en usuarios (barberos / clientes)
- Validación de datos en frontend y backend

---

## 🤝 Contribución

Actualmente este proyecto no acepta contribuciones externas.

---

## 📄 Licencia

© 2026 Jhoan Rojas. Todos los derechos reservados.

Este software y su código fuente son propiedad exclusiva del autor.
No está permitido copiar, modificar, distribuir, sublicenciar o utilizar este proyecto sin autorización expresa del propietario.

---

## 📚 Referencias

- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- https://choosealicense.com/no-permission/
- https://opensource.guide/starting-a-project/
- https://www.markdownguide.org/basic-syntax/
