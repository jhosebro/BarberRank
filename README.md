# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

npx expo prebuild --clean To build android and ios
Siempre verificar que se esta compilando el proyecto con java 17 para evitar conflictos

- Promtp SRP:
  Actúa como un arquitecto de software senior especializado en React Native y Clean Architecture.

  Voy a darte un archivo de una pantalla (screen). Tu tarea es refactorizarlo aplicando separación de responsabilidades, pero con las siguientes restricciones estrictas:

  REGLAS OBLIGATORIAS:
  1.  NO debes crear nuevas carpetas.
  2.  NO debes cambiar la estructura del proyecto.
  3.  NO debes dividir en múltiples archivos (todo debe permanecer en el mismo archivo).
  4.  NO debes introducir nuevas librerías.
  5.  SOLO puedes reorganizar la lógica existente y mover responsabilidades al hook si aplica.
  6.  NO cambies el comportamiento funcional.

  OBJETIVO:

  Aplicar separación de responsabilidades según Clean Architecture:
  - La UI (screen) debe ser completamente declarativa.
  - Toda la lógica de negocio debe vivir en el hook.
  - La UI NO debe:
  - Tener lógica condicional compleja
  - Validar datos
  - Transformar datos
  - Controlar flujo de navegación
  - Conocer estructuras internas complejas del estado

  LO QUE DEBES HACER:
  1.  Identificar lógica dentro del componente UI y moverla al hook.
  2.  Crear dentro del hook (si no existen):
      - canContinue
      - handleContinue
      - funciones como skipPhoto (o equivalentes)
  3.  Reemplazar en la UI:
      - condicionales complejos → props del hook
      - lógica inline → funciones del hook
  4.  Mantener los componentes visuales (StepInfo, StepPhoto, etc.) sin lógica de negocio.
  5.  Mejorar levemente tipado si es necesario (sin sobreingeniería).
  6.  No tocar estilos salvo que afecten responsabilidades.

  FORMATO DE RESPUESTA:
  1.  Explicación breve (máximo 10 líneas) de los cambios realizados.
  2.  Código final completo del archivo refactorizado.
  3.  Comentar dentro del código cada mejora con:
      // ✅ Mejora: explicación breve

  CRITERIO DE CALIDAD:

  El resultado debe cumplir con:
  - Principio de Responsabilidad Única (SRP)
  - Separación clara entre UI y lógica
  - Código legible y mantenible
  - Sin sobrearquitectura

  REFERENCIA TEÓRICA:

  Basarse en:
  - Clean Architecture (Robert C. Martin)
  - Separación de responsabilidades en React (react.dev)

  Ahora refactoriza el siguiente código:
