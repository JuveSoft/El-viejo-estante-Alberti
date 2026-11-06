# El-viejo-estante-Alberti
Artículos, Repuestos y Accesorios del automóvil de otra época

Los índices usan un estilo minimalista de carta de bar: fondo carbón, letras
claras, detalles cobre y separadores finos, definido en
[estilos/caratula.css](estilos/caratula.css), sin depender de una imagen.
Los enlaces conservan sus posiciones y destinos; el menú crece si el texto
necesita más espacio en pantallas pequeñas.

## Buscar por marca de auto

Desde el índice, **Buscar repuestos por marca de auto** abre [la búsqueda general](buscar.html).
Permite combinar estante, marca de auto y **Marca del producto**. Cada catálogo
también tiene ambos filtros de marca, con cuatro artículos por página y ampliación
de fotos al tocar. **Mostrar todos** limpia todos los filtros.

El filtro de producto usa `marca` (o el campo anterior `Marca`). Agrupa códigos
como `Genoud 1050` y `Genoud 2040` bajo **Genoud**, y `SM APK 128` / `SM FI-58`
bajo **SM**, sin cambiar el detalle que muestra la ficha. Las demás marcas se
usan completas, sin recortar nombres compuestos. Un campo vacío o ausente aparece
al elegir **Sin especificar** en este filtro, sin atribuirle un fabricante.

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

La búsqueda general carga nueve catálogos: platinos, platino y condensador,
tapas, bujías, cables de bujías, portalámparas, bombas de combustible, bombas de
agua y filtros de aceite. Las aplicaciones y precios sin confirmar se muestran
sin atribuir compatibilidades y como **Consultar precio**, respectivamente.
No incluye el catálogo antiguo de tapas ni las plantillas de correas, embragues
y filtros generales, que todavía tienen datos de ejemplo.
Para incorporar otro catálogo terminado, agregar su etiqueta `<script data-catalogo>`
en [buscar.html](buscar.html), antes de [js/scripts.js](js/scripts.js).

La carga informa errores si falta un catálogo o un artículo tiene `marcasAuto`
inválido. Los filtros no corrigen las fotos faltantes ni las aplicaciones originales.

En bombas de combustible, las fichas nuevas toman la aplicación indicada en el
nombre de cada foto, sin ampliar compatibilidades. La marca del repuesto queda
vacía cuando no está confirmada y se cargó un precio provisorio de **$ 45.000-**
para las nueve fichas nuevas, pendiente de actualización por el responsable.
Las tres fichas anteriores sin foto (Fiat 128, Perkins y Ford V8) conservan sus
precios y muestran **Foto pendiente**; no se fusionaron con otros artículos.
La foto de la Ford Pick-up 1992 se referencia desde bombas de agua, donde está
guardada. Los nombres de archivo originales se conservan aunque tengan errores
de escritura; las correcciones se muestran en la aplicación del artículo.

En bombas de agua se reemplazaron los datos de ejemplo por las dos fotos de
Fiat 147 diésel y Fiat Duna / Uno con motor Tipo, con marca **Heliodino** y precio
provisorio de **$ 45.000-** cada una. Las aplicaciones parten de los nombres de
archivo; la compatibilidad con aire acondicionado requiere confirmación.
La foto de la bomba de nafta Ford guardada en esa carpeta sigue perteneciendo
solo al catálogo de combustible.

Para comprobar los datos y las rutas de los catálogos con Node.js:

```powershell
node --test tests\catalogos.test.cjs
```
