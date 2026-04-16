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
