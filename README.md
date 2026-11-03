# El-viejo-estante-Alberti
Artículos, Repuestos y Accesorios del automóvil de otra época

## Buscar por marca de auto

Desde el índice, **Buscar repuestos por marca de auto** abre [la búsqueda general](buscar.html).
Permite combinar estante y marca. Cada catálogo también tiene su filtro por marca,
con cuatro artículos por página y ampliación de fotos al tocar.

Cada artículo tiene una lista explícita de marcas compatibles:

```js
marcasAuto: ["Citroën", "Peugeot", "Renault"],
```

Un repuesto multimarca aparece al seleccionar cualquiera de esas marcas, sin
duplicarlo. `marca` (o el campo anterior `Marca`) sigue siendo la marca del repuesto.
Usar nombres consistentes: `Volkswagen`, `Alfa Romeo`, `Citroën`, `SEAT`, etc.
No usar modelos como nombres de marca.

`marcasAuto: []` indica **Sin especificar**, no compatibilidad universal. Los artículos
con "Varios", referencias genéricas o un motor sin marca de auto confirmada se mantienen
visibles en "Todas las marcas" y "Sin especificar". En aplicaciones parcialmente
identificadas se cargan solo las marcas claras: por ejemplo, "Corsa / Alfa / Varios"
incluye Alfa Romeo, sin atribuir Corsa a Chevrolet u Opel. Torino queda pendiente de
identificar su aplicación IKA/Renault. La clasificación parte de las descripciones
existentes y modelos identificables; no reemplaza la verificación de compatibilidad.

Los archivos de datos se registran en `window.catalogos`; `base` conserva la ubicación
de sus imágenes tanto desde su página como desde la búsqueda general. Editar un
artículo en su archivo original actualiza ambas vistas.

La búsqueda general carga los siete catálogos existentes de platinos, platino y
condensador, tapas, bujías, portalámparas, bombas de combustible y filtros de aceite.
No incluye el catálogo antiguo de tapas ni las plantillas de bombas de agua,
correas, embragues y filtros generales, que todavía tienen datos de ejemplo.
Para incorporar otro catálogo terminado, agregar su etiqueta `<script data-catalogo>`
en [buscar.html](buscar.html), antes de [js/scripts.js](js/scripts.js).

La carga informa errores si falta un catálogo o un artículo tiene `marcasAuto`
inválido. Los filtros no corrigen las fotos faltantes ni las aplicaciones originales.

Para comprobar los datos y las rutas de los catálogos con Node.js:

```powershell
node --test tests\catalogos.test.cjs
```
