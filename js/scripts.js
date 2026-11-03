const contenedor = document.querySelector(".contenedor");
const catalogosDisponibles = window.catalogos;
const esGeneral = document.body.dataset.catalogo === "general";
const esperados = document.querySelectorAll("script[data-catalogo]").length || 1;

if(!Array.isArray(catalogosDisponibles) || catalogosDisponibles.length !== esperados){
    contenedor.textContent = "No se pudieron cargar todos los catálogos. Recargá la página.";
    throw new Error("Faltan archivos de catálogo");
}

const productos = catalogosDisponibles.flatMap(catalogo => catalogo.productos.map(producto => {
    if(!Array.isArray(producto.marcasAuto) ||
       producto.marcasAuto.some(marca => typeof marca !== "string" || !marca.trim())){
        contenedor.textContent = "Hay un artículo con marcas de auto mal cargadas.";
        throw new Error(`marcasAuto inválido: ${producto.aplicacion}`);
    }
    return {
        ...producto,
        estante: catalogo.estante,
        categoria: catalogo.categoria,
        base: catalogo.base
    };
}));

document.getElementById("estante").textContent =
    esGeneral ? "Todos los estantes" : catalogosDisponibles[0].estante;
document.getElementById("categoria").textContent =
    esGeneral ? "Buscar por marca de auto" : catalogosDisponibles[0].categoria;

const filtros = document.createElement("div");
filtros.className = "filtros-catalogo";
contenedor.prepend(filtros);

function crearSelector(id, titulo, opcionTodas, valores){
    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = id;
    etiqueta.textContent = titulo;
    const selector = document.createElement("select");
    selector.id = id;
    selector.add(new Option(opcionTodas, ""));
    [...new Set(valores)].sort((a, b) => a.localeCompare(b, "es")).forEach(valor => {
        selector.add(new Option(valor, valor));
    });
    filtros.append(etiqueta, selector);
    return selector;
}

const filtroEstante = esGeneral
    ? crearSelector("filtro-estante", "Estante", "Todos los estantes", productos.map(p => p.estante))
    : null;
const filtroMarca = crearSelector(
    "filtro-marca", "Marca de auto", "Todas las marcas", productos.flatMap(p => p.marcasAuto)
);
filtroMarca.add(new Option("Sin especificar", "sin-especificar"));

const limpiar = document.createElement("button");
limpiar.type = "button";
limpiar.textContent = "Mostrar todos";
filtros.appendChild(limpiar);

const aviso = document.createElement("p");
aviso.className = "aviso-compatibilidad";
aviso.textContent = "La marca no garantiza compatibilidad con todos sus modelos. " +
    "Consultá la aplicación del repuesto. “Sin especificar” no significa universal.";
filtros.appendChild(aviso);

if(!esGeneral){
    const enlace = document.createElement("a");
    enlace.href = new URL("../buscar.html", document.currentScript.src).href;
    enlace.textContent = "Buscar en todos los estantes";
    filtros.appendChild(enlace);
}

const resumen = document.createElement("p");
resumen.className = "resumen-resultados";
resumen.setAttribute("role", "status");
filtros.after(resumen);

const hoja = document.createElement("section");
hoja.className = "hoja";
contenedor.appendChild(hoja);
const contador = document.getElementById("contador");
const siguiente = document.getElementById("siguiente");
const anterior = document.getElementById("anterior");
let filtrados = productos;
let actual = 0;

function mostrarPagina(){
    hoja.replaceChildren();
    const paginas = Math.ceil(filtrados.length / 4);
    contador.textContent = paginas ? `Página ${actual + 1} de ${paginas}` : "Sin páginas";
    anterior.disabled = siguiente.disabled = paginas <= 1;

    filtrados.slice(actual * 4, actual * 4 + 4).forEach(producto => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "card";
        const imagen = document.createElement("img");
        imagen.className = "imagen";
        imagen.src = new URL(producto.foto, producto.base).href;
        imagen.alt = producto.aplicacion;
        imagen.setAttribute("role", "button");
        imagen.tabIndex = 0;
        imagen.setAttribute("aria-haspopup", "dialog");
        imagen.setAttribute("aria-label", `Ampliar imagen: ${producto.aplicacion}`);
        imagen.title = "Haz clic o toca para ampliar";
        tarjeta.appendChild(imagen);

        if(esGeneral){
            const origen = document.createElement("a");
            origen.className = "origen-producto";
            origen.href = new URL("index.html", producto.base).href;
            origen.textContent = `${producto.estante} · ${producto.categoria}`;
            tarjeta.appendChild(origen);
        }

        const dato = document.createElement("div");
        dato.className = "dato";
        dato.textContent = producto.aplicacion;
        const marca = document.createElement("div");
        marca.className = "marca";
        marca.textContent = producto.marca ?? producto.Marca ?? "";
        const precio = document.createElement("div");
        precio.className = "precio";
        const importe = document.createElement("p");
        importe.textContent = producto.precio;
        precio.appendChild(importe);
        tarjeta.append(dato, marca, precio);
        hoja.appendChild(tarjeta);
    });
}

function filtrar(){
    filtrados = productos.filter(producto => {
        const coincideEstante = !filtroEstante || !filtroEstante.value ||
            producto.estante === filtroEstante.value;
        const coincideMarca = !filtroMarca.value ||
            (filtroMarca.value === "sin-especificar"
                ? producto.marcasAuto.length === 0
                : producto.marcasAuto.includes(filtroMarca.value));
        return coincideEstante && coincideMarca;
    });
    actual = 0;
    resumen.textContent = filtrados.length
        ? `${filtrados.length} artículo${filtrados.length === 1 ? "" : "s"}`
        : "No hay artículos para esta selección. Probá otra marca o estante.";
    mostrarPagina();
}

filtroMarca.addEventListener("change", filtrar);
if(filtroEstante){
    filtroEstante.addEventListener("change", filtrar);
}
limpiar.addEventListener("click", () => {
    filtroMarca.value = "";
    if(filtroEstante){
        filtroEstante.value = "";
    }
    filtrar();
});
siguiente.addEventListener("click", () => {
    actual = (actual + 1) % Math.ceil(filtrados.length / 4);
    mostrarPagina();
});
anterior.addEventListener("click", () => {
    const paginas = Math.ceil(filtrados.length / 4);
    actual = (actual + paginas - 1) % paginas;
    mostrarPagina();
});

const visor = document.createElement("dialog");
visor.className = "visor-imagen";
visor.setAttribute("aria-label", "Imagen ampliada del producto");
visor.innerHTML = `
    <button class="cerrar-visor" type="button" aria-label="Cerrar imagen ampliada" autofocus>
        Cerrar &times;
    </button>
    <img class="imagen-ampliada" alt="" title="Toca la imagen para cerrar">
`;
document.body.appendChild(visor);

const imagenAmpliada = visor.querySelector(".imagen-ampliada");
let imagenOrigen;

contenedor.addEventListener("click", evento => {
    const imagen = evento.target.closest(".card .imagen");
    if(imagen){
        imagenOrigen = imagen;
        imagenAmpliada.src = imagen.currentSrc || imagen.src;
        imagenAmpliada.alt = imagen.alt;
        visor.showModal();
        document.documentElement.classList.add("visor-abierto");
    }
});

contenedor.addEventListener("keydown", evento => {
    if(evento.target.matches(".card .imagen") &&
       (evento.key === "Enter" || evento.key === " ")){
        evento.preventDefault();
        evento.target.click();
    }
});

visor.querySelector(".cerrar-visor").addEventListener("click", () => visor.close());
visor.addEventListener("click", evento => {
    if(evento.target === visor || evento.target === imagenAmpliada){
        visor.close();
    }
});
visor.addEventListener("keydown", evento => {
    if(evento.key === "Escape"){
        evento.preventDefault();
        visor.close();
    }
});
visor.addEventListener("close", () => {
    document.documentElement.classList.remove("visor-abierto");
    imagenAmpliada.removeAttribute("src");
    imagenOrigen.focus({ preventScroll: true });
});

filtrar();
