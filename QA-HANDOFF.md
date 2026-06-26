# Bruchou home QA handoff

## Ruta y stack

- Home real: `index.html`, servida en `/`.
- Ruta secundaria existente: `areas-de-practica.html`.
- Stack: HTML, CSS y JavaScript estatico. No hay `package.json`.
- Servidor local disponible: `node .serve.js`.
- URL local: `http://127.0.0.1:4173/`.

## Scripts disponibles

- `node .serve.js`: servidor local.
- Build: no configurado.
- Lint: no configurado.
- Test: no configurado.

## Orden de home para QA

1. Header / navegacion.
2. Hero.
3. Como trabajamos.
4. Sectores estrategicos.
5. Asuntos representativos.
6. Areas y liderazgo.
7. Insights.
8. AI Search.
9. Reconocimientos.
10. Footer.

## Breakpoints a revisar

- Desktop: 1440px.
- Tablet: 768px.
- Mobile: 390px.

## Evidencia generada

- `qa-screenshots/desktop.png`
- `qa-screenshots/tablet.png`
- `qa-screenshots/mobile.png`

QA automatizado con Chrome local:

- HTTP `/`: 200.
- Overflow horizontal: no detectado en 1440px, 768px ni 390px.
- Orden de secciones confirmado en DOM: Hero, Metodo, Sectores, Asuntos, Areas/liderazgo, Insights, AI Search, Reconocimientos.
- Terminos prohibidos auditados: sin coincidencias.
- Aviso de entorno: Google Fonts queda bloqueado cuando el sandbox no permite red; el sitio usa fallback del sistema si no cargan fuentes externas.

## TODO Bruchou / Legal

- Validar los tres asuntos representativos antes de publicar clientes, montos, jurisdicciones, resultados o permisos.
- Confirmar al menos un asunto no energetico.
- Confirmar metadata de sector, tipo, alcance y capacidades por asunto.
- Validar nombres o referencias de liderazgo antes de publicar responsables individuales.
- Validar insights, fechas y relacion con sectores.
- Confirmar rankings, categorias, anos y permisos de uso de reconocimientos.

## Checklist de aprobacion

- La primera mitad sigue Hero -> Metodo -> Sectores -> Asuntos -> Areas/liderazgo.
- AI Search aparece despues de insights y no domina la narrativa.
- Reconocimientos quedan compactos y secundarios.
- No aparece "casos de exito".
- Los CTAs son especificos.
- Los TODOs visibles corresponden a datos sensibles no validados.
- Desktop, tablet y mobile son legibles y mantienen el orden narrativo.
