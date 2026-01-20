# Gestión de la Calidad

Este capítulo define los estándares y actividades necesarios para asegurar que la versión digital de **Muses** sea funcional, fiel a la experiencia de juego original y técnicamente robusta bajo el stack Next.js / Spring Boot.

## 1. Planificación de la Calidad
Se han definido estándares técnicos para evitar el retrabajo y asegurar la mantenibilidad:
* **Estándares de Código:** Uso de algunos principios de *Clean Code*:
    - **SOLID**: Responsabilidad única, inversión de dependencias, etc.
    - **DRY**: No repetir código.
    - **KISS**: Mantener el código lo más simple posible.
    - **YAGNI**: No hacer algo si no es necesario.
    - **Naming Conventions**: Uso de nombres descriptivos y consistentes con las convenciones de Java y JavaScript.

*  **Estándares de Assets:** Los assets deben procesarse en formato WebP para optimizar la carga sin perder fidelidad visual.
*  **Criterios de Aceptación:** Una característica se considera "Hecha" (Done) solo si supera las pruebas de validación de reglas (ej. el sistema de desempate en la puntuación final coincide con el diagrama de flujo oficial ).

## 2. Gestión y Control de Calidad
El control de calidad se ejecutará en dos vertientes:

### 2.1. Pruebas Unitarias e Integración (Backend)
Se utilizará JUnit para asegurar que el backend cumpla de forma correcta las reglas del manual.

### 2.2. Playtesting (Frontend y UI)
Al final de cada iteración que sea posible se realizarán sesiones de playtesting para validar que el frontend cumple con las normas del juego y ofrece una experiencia fluida y correcta al usuario.

