const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");

const raiz = path.resolve(__dirname, "..");
const pagina = fs.readFileSync(path.join(raiz, "buscar.html"), "utf8");
const fuentes = [...pagina.matchAll(/<script data-catalogo src="([^"]+)"/g)]
    .map(coincidencia => path.join(raiz, ...coincidencia[1].split("/")));
const marcasValidas = new Set([
    "Alfa Romeo", "BMW", "Chevrolet", "Citroën", "Dodge", "Fiat", "Ford",
    "IKA", "Jeep", "Kaiser", "Lada", "Moskvitch", "Peugeot", "Renault",
    "SEAT", "Siam", "Toyota", "Volkswagen"
]);

function cargar(archivos){
    const contexto = vm.createContext({ window: {}, document: {}, URL });
    for(const archivo of archivos){
        contexto.document.currentScript = { src: pathToFileURL(archivo).href };
        vm.runInContext(fs.readFileSync(archivo, "utf8"), contexto, { filename: archivo });
    }
    return contexto.window.catalogos;
}

test("los catálogos comparten datos sin colisiones", () => {
    assert.ok(fuentes.length > 0);
    const catalogos = cargar(fuentes);
    assert.equal(catalogos.length, fuentes.length);
    catalogos.forEach((catalogo, i) => {
        assert.ok(catalogo.estante && catalogo.categoria);
        assert.ok(catalogo.productos.length > 0);
        const local = cargar([fuentes[i]])[0];
        assert.equal(JSON.stringify(catalogo), JSON.stringify(local));
        assert.equal(catalogo.base, new URL(".", pathToFileURL(fuentes[i])).href);
        for(const producto of catalogo.productos){
            assert.ok(Array.isArray(producto.marcasAuto), producto.aplicacion);
            assert.equal(new Set(producto.marcasAuto).size, producto.marcasAuto.length);
            producto.marcasAuto.forEach(marca => assert.ok(marcasValidas.has(marca), marca));
        }
    });
});

test("bujías y cables usan sus fotos y páginas correctas", () => {
    const fuenteBujias = path.join(raiz, "estante_encendido", "Bujias", "bujias.js");
    const fuenteCables = path.join(raiz, "estante_encendido",
        "Cable de bujías_y_Bujías", "cables.js");
    assert.ok(fuentes.includes(fuenteBujias));
    assert.ok(fuentes.includes(fuenteCables));

    for(const [fuente, categoria, cantidad] of [
        [fuenteBujias, "Bujías", 33],
        [fuenteCables, "Cables de bujías", 5]
    ]){
        const catalogo = cargar([fuente])[0];
        const productos = catalogo.productos;
        const directorioImagenes = path.join(path.dirname(fuente), "img");
        const fotos = fs.readdirSync(directorioImagenes)
            .filter(nombre => /\.(png|jpe?g|webp)$/i.test(nombre));
        assert.equal(catalogo.categoria, categoria);
        assert.equal(productos.length, cantidad);
        assert.equal(fotos.length, cantidad);
        for(const producto of productos){
            const archivo = path.resolve(path.dirname(fuente), ...producto.foto.split("/"));
            assert.ok(fs.existsSync(archivo), producto.foto);
            assert.equal(productos.filter(p => p.foto === producto.foto).length, 1);
            assert.equal(producto.precio, "Consultar precio");
        }
        for(const foto of fotos){
            assert.equal(productos.filter(p => p.foto === `img/${foto}`).length, 1, foto);
        }
    }

    const indice = fs.readFileSync(path.join(raiz, "estante_encendido", "indice.html"), "utf8");
    assert.match(indice, /href="Bujias\/indice\.html"/);
    for(const ruta of [
        path.join(raiz, "estante_encendido", "Bujias", "indice.html"),
        path.join(raiz, "estante_encendido", "Cable de bujías_y_Bujías", "index.html")
    ]){
        assert.ok(fs.existsSync(ruta), ruta);
    }
});

test("las nueve bujías agregadas conservan códigos, fabricantes y aplicaciones identificadas", () => {
    const fuente = path.join(raiz, "estante_encendido", "Bujias", "bujias.js");
    const nuevas = cargar([fuente])[0].productos.slice(24);
    assert.equal(nuevas.length, 9);
    for(const codigo of ["AGSF22C", "AGSF32C", "AGSP32C", "AGSR32C"]){
        const producto = nuevas.find(p => p.aplicacion === `Motorcraft ${codigo}`);
        assert.ok(producto, codigo);
        assert.equal(producto.marca, "Motorcraft");
        assert.equal(producto.marcasAuto.length, 0);
    }
    const h56 = nuevas.find(p => p.aplicacion.startsWith("Bosch H56"));
    assert.deepEqual(Array.from(h56.marcasAuto), ["Ford", "Renault"]);
    for(const marca of ["Bosch", "Wega"]){
        assert.ok(nuevas.some(p => p.marca === marca && p.marcasAuto.includes("Ford")));
    }
    assert.ok(nuevas.every(p => p.precio === "Consultar precio"));
});

test("las lámparas tienen catálogo propio y cubren las fotos sin mezclarse con portalámparas", () => {
    const fuente = path.join(raiz, "Iluminacion", "lamparas", "lamparas.js");
    assert.ok(fuentes.includes(fuente));
    const catalogo = cargar([fuente])[0];
    assert.equal(catalogo.categoria, "Lámparas");
    assert.equal(catalogo.estante, "Iluminación");
    assert.equal(catalogo.productos.length, 3);
    assert.deepEqual(Array.from(catalogo.productos, p => p.foto), [
        "../img/Osram_h7_cool_blue.png",
        "../img/Lamp_9007_100_80.png",
        "../img/lamp_6v_45W40.jpg"
    ]);
    assert.equal(catalogo.productos[0].marca, "Osram");
    assert.match(catalogo.productos[0].aplicacion, /12 V - 55 W/);
    assert.deepEqual(Array.from(catalogo.productos, p => p.precio), [
        "$ 20.000,-", "$ 8.000,-", "$ 5.000,-"
    ]);
    for(const producto of catalogo.productos){
        const archivo = path.resolve(path.dirname(fuente), ...producto.foto.split("/"));
        assert.ok(fs.readdirSync(path.dirname(archivo)).includes(path.basename(archivo)));
        assert.equal(producto.marcasAuto.length, 0);
    }
    const portalamparas = cargar(fuentes).find(c => c.categoria === "Portalámparas");
    assert.equal(portalamparas.productos.length, 8);
    const indice = fs.readFileSync(path.join(raiz, "Iluminacion", "indice.html"), "utf8");
    assert.match(indice, /href="lamparas\/index\.html"/);
});

test("multimarca y fabricantes de repuestos son campos separados", () => {
    const productos = cargar(fuentes).flatMap(c => c.productos);
    const tapa = productos.find(p => p.foto.endsWith("Tapa_distr_genoud_1075_Varios.jpeg"));
    assert.deepEqual(Array.from(tapa.marcasAuto), ["Citroën", "Peugeot", "Renault"]);
    for(const marca of tapa.marcasAuto){
        assert.equal(productos.filter(p => p.marcasAuto.includes(marca) && p === tapa).length, 1);
    }
    assert.equal(tapa.marca, "Genoud 1075");
    assert.equal(productos.some(p => p.marcasAuto.includes("Genoud")), false);
    const perkins = productos.filter(p => p.aplicacion === "Motor Perkins");
    assert.ok(perkins.length > 0);
    assert.ok(perkins.every(p => p.marcasAuto.length === 0));
    assert.ok(productos.filter(p => p.aplicacion.includes("Torino"))
        .every(p => p.marcasAuto.length === 0));
});

test("las páginas de origen cargan su catálogo y el visor compartido", () => {
    for(const fuente of fuentes){
        const directorio = path.dirname(fuente);
        const html = fs.readFileSync(path.join(directorio, "index.html"), "utf8");
        const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
            .map(coincidencia => path.resolve(directorio, ...coincidencia[1].split("/")));
        assert.ok(scripts.includes(fuente), fuente);
        assert.ok(scripts.includes(path.join(raiz, "js", "scripts.js")));
        scripts.forEach(script => assert.ok(fs.existsSync(script), script));
        const estilos = [...html.matchAll(/<link[^>]*href="([^"]+)"/g)];
        estilos.forEach(([, href]) =>
            assert.ok(fs.existsSync(path.resolve(directorio, ...href.split("/"))), href));
    }
});

const fuenteBombas = path.join(raiz, "estante_bombas_combustible_agua",
    "bombas_combustible", "bombas_combustible.js");

test("las bombas de combustible tienen fotos existentes con mayúsculas exactas", () => {
    const catalogo = cargar([fuenteBombas])[0];
    for(const producto of catalogo.productos){
        const archivo = path.resolve(path.dirname(fuenteBombas), ...producto.foto.split("/"));
        assert.ok(fs.existsSync(archivo), producto.foto);
        assert.ok(fs.readdirSync(path.dirname(archivo)).includes(path.basename(archivo)),
            producto.foto);
    }
});

test("todas las fotos de bombas de combustible tienen ficha y las nueve incorporaciones originales conservan sus datos", () => {
    const productos = cargar([fuenteBombas])[0].productos;
    const fotos = fs.readdirSync(path.join(path.dirname(fuenteBombas), "img"))
        .filter(nombre => /\.(png|webp)$/i.test(nombre));
    for(const foto of fotos){
        assert.equal(productos.filter(p => p.foto === `img/${foto}`).length, 1, foto);
    }
    const nuevas = productos.slice(0, 19).filter(p => p.foto.endsWith(".png"));
    assert.equal(nuevas.length, 9);
    for(const producto of nuevas){
        assert.equal(producto.Marca, "");
        assert.equal(producto.precio, "$ 45.000-");
    }
    const esperadas = [
        ["IKA - Motor de 4 cilindros", ["IKA"]],
        ["Fiat Regata 100 / Weekend - Motor 1.6", ["Fiat"]],
        ["Motor Perkins 6-305 - Pata corta", []],
        ["Renault 12 / 18 - Motor 1.4", ["Renault"]],
        ["Renault 12 / 18 - Motor 1.4 - Con retorno", ["Renault"]],
        ["Citroën 3CV", ["Citroën"]],
        ["Volkswagen Escarabajo / Kombi", ["Volkswagen"]],
        ["Ford Fairlane V8", ["Ford"]],
        ["Ford Pick-up 1992 - Con retorno", ["Ford"]]
    ];
    for(const [aplicacion, marcas] of esperadas){
        const producto = nuevas.find(p => p.aplicacion === aplicacion);
        assert.ok(producto, aplicacion);
        assert.deepEqual(Array.from(producto.marcasAuto), marcas);
    }
});

test("las trece bombas agregadas tienen aplicaciones, marcas y precios pendientes sin mezclar variantes", () => {
    const catalogo = cargar([fuenteBombas])[0];
    const esperadas = [
        ["Bomba_kobla_1129_r-11_c.retorno.png", "Renault 11 - Con retorno - Kobla 1129", ["Renault"], "Kobla"],
        ["Kobla_nafta-Ford_Taunus_Equipo_original_hsta_85.png", "Ford Taunus - Equipo original hasta 1985", ["Ford"], "Kobla"],
        ["Kobla_nafta_Citroen_3CV-Ami 8.png", "Citroën 3CV / Ami 8", ["Citroën"], "Kobla"],
        ["kobla_diesel_Perkins_6-354_6 cilindros_Iny-Directa_Todos.png", "Motor Perkins 6-354 diésel - 6 cilindros - Inyección directa", [], "Kobla"],
        ["kobla_nafta_Ford_F100-150_Pick-Up_6_cil_Con-retorno-89.png", "Ford F100 / F150 Pick-up - 6 cilindros - Con retorno - 1989", ["Ford"], "Kobla"],
        ["kobla_nafta_Ford_Sierra_ 2.3-XR4_Todos.png", "Ford Sierra 2.3 / XR4", ["Ford"], "Kobla"],
        ["kobla_nafta_Siam_Di-Tella_Todos..png", "Siam Di Tella", ["Siam"], "Kobla"],
        ["kobla_nafta_Sierra_1.6_Todos.png", "Ford Sierra 1.6", ["Ford"], "Kobla"],
        ["kobla_nafta_Taunus_Equipo_original_77-80.png", "Ford Taunus - Equipo original 1977-1980", ["Ford"], "Kobla"],
        ["kobla_nafta_Taunus_Equipo_original_hasta_81-82.png", "Ford Taunus - Equipo original hasta 1981-1982", ["Ford"], "Kobla"],
        ["kobla_nafta_Valiant_II-II-IV_Polara_Pick-Up_Todos.png", "Valiant / Dodge Polara / Pick-up - Serie de Valiant a confirmar", ["Dodge"], "Kobla"],
        ["kobla_nafta__Taunus_Equipo_original_74-77.png", "Ford Taunus - Equipo original 1974-1977", ["Ford"], "Kobla"],
        ["nafta_R4-R6_Sin_retorno_Brazo_Largo84.png", "Renault 4 / 6 - Sin retorno - Brazo largo - 1984", ["Renault"], ""]
    ];
    assert.equal(catalogo.productos.length, 32);
    assert.equal(catalogo.productos.filter(p => p.precio === "Consultar precio").length, 13);
    for(const [foto, aplicacion, marcas, marca] of esperadas){
        const producto = catalogo.productos.find(p => p.foto === `img/${foto}`);
        assert.ok(producto, foto);
        assert.equal(producto.aplicacion, aplicacion);
        assert.deepEqual(Array.from(producto.marcasAuto), marcas);
        assert.equal(producto.Marca, marca);
        assert.equal(producto.precio, "Consultar precio");
    }
    const generales = cargar(fuentes).filter(c => c.categoria === "Bombas de combustible");
    assert.equal(generales.length, 1);
    assert.equal(JSON.stringify(generales[0]), JSON.stringify(catalogo));
});

test("las bombas pendientes de foto conservan sus fichas y precios originales", () => {
    const productos = cargar([fuenteBombas])[0].productos;
    const pendientes = productos.filter(p => p.foto === "img/foto_pendiente.svg");
    assert.equal(productos.length, 32);
    assert.equal(pendientes.length, 3);
    for(const [aplicacion, precio] of [
        ["Fiat 128 / Varios", "$ 40.000-"],
        ["Motor Perkins", "$ 48.000-"],
        ["Ford V8", "$ 50.000-"]
    ]){
        assert.ok(pendientes.some(p => p.aplicacion === aplicacion && p.precio === precio));
    }
    assert.ok(productos.every(p => !p.aplicacion.includes("Reanult")));
});

test("las bombas de agua reemplazan la plantilla y aparecen en la búsqueda general", () => {
    const fuente = path.join(raiz, "estante_bombas_combustible_agua",
        "bombas_agua", "bombas_agua.js");
    assert.ok(fuentes.includes(fuente));
    const catalogo = cargar([fuente])[0];
    assert.equal(catalogo.estante, "Bombas de combustible y agua");
    assert.equal(catalogo.categoria, "Bombas de agua");
    assert.deepEqual(Array.from(catalogo.productos, p => p.aplicacion), [
        "Fiat 147 diésel", "Fiat Duna / Uno - Motor Tipo"
    ]);
    const fotos = fs.readdirSync(path.join(path.dirname(fuente), "img"))
        .filter(nombre => nombre.startsWith("bomba_agua_"));
    assert.equal(fotos.length, 2);
    for(const producto of catalogo.productos){
        assert.deepEqual(Array.from(producto.marcasAuto), ["Fiat"]);
        assert.equal(producto.marca, "Heliodino");
        assert.equal(producto.precio, "$ 45.000-");
        const archivo = path.resolve(path.dirname(fuente), ...producto.foto.split("/"));
        assert.ok(fs.existsSync(archivo), producto.foto);
        assert.ok(fotos.includes(path.basename(archivo)), producto.foto);
    }
    for(const foto of fotos){
        assert.equal(catalogo.productos.filter(p => p.foto === `img/${foto}`).length, 1);
    }
    const generales = cargar(fuentes).filter(c => c.categoria === "Bombas de agua");
    assert.equal(generales.length, 1);
    assert.equal(JSON.stringify(generales[0]), JSON.stringify(catalogo));
});

function cargarVisor(general = true, catalogos = cargar(fuentes)){
    const elementos = new Map();
    function elemento(){
        return {
            value: "", children: [], eventos: {}, textContent: "",
            append(...hijos){ this.children.push(...hijos); },
            appendChild(hijo){ this.append(hijo); },
            prepend(hijo){ this.children.unshift(hijo); },
            after(){},
            add(opcion){ this.children.push(opcion); },
            replaceChildren(){ this.children = []; },
            setAttribute(){},
            addEventListener(tipo, accion){ this.eventos[tipo] = accion; },
            querySelector(){ return elemento(); }
        };
    }
    const contexto = vm.createContext({
        window: { catalogos },
        URL,
        Option: function(text, value){ return { text, value }; },
        document: {
            body: Object.assign(elemento(), { dataset: { catalogo: general ? "general" : "" } }),
            currentScript: { src: pathToFileURL(path.join(raiz, "js", "scripts.js")).href },
            querySelector(selector){
                if(!elementos.has(selector)) elementos.set(selector, elemento());
                return elementos.get(selector);
            },
            querySelectorAll(){ return { length: general ? catalogos.length : 0 }; },
            getElementById(id){ return this.querySelector(`#${id}`); },
            createElement: elemento
        }
    });
    vm.runInContext(fs.readFileSync(path.join(raiz, "js", "scripts.js"), "utf8"), contexto);
    return expresion => vm.runInContext(expresion, contexto);
}

test("el filtro de producto agrupa códigos sin alterar marcas compuestas ni fichas", () => {
    const evaluar = cargarVisor();
    for(const [producto, esperado] of [
        [{ marca: "Genoud 1050" }, "Genoud"],
        [{ marca: "genoud 2040" }, "Genoud"],
        [{ marca: "SM APK 128" }, "SM"],
        [{ Marca: "Kobla" }, "Kobla"],
        [{ marca: "  Heliodino  " }, "Heliodino"],
        [{ marca: "Marca Compuesta" }, "Marca Compuesta"],
        [{ marca: "" }, ""],
        [{}, ""]
    ]){
        assert.equal(evaluar(`marcaDelProducto(${JSON.stringify(producto)})`), esperado);
    }
    assert.throws(() => evaluar('marcaDelProducto({ marca: 42, aplicacion: "Inválida" })'),
        /Marca del producto inválida/);
    assert.equal(evaluar('productos.find(p => p.marca === "Genoud 1075").marcaProducto'), "Genoud");
    const opciones = JSON.parse(evaluar('JSON.stringify(filtroMarcaProducto.children)'));
    assert.equal(opciones.filter(o => o.value === "Genoud").length, 1);
    assert.ok(opciones.some(o => o.value === "sin-especificar"));
    assert.ok(opciones.every(o => !/^Genoud \d/.test(o.value)));
});

test("los tres filtros se combinan, reinician la página y se limpian juntos", () => {
    const evaluar = cargarVisor();
    evaluar(`filtroMarcaProducto.value = "Heliodino";
        filtroMarca.value = "Fiat";
        filtroEstante.value = "Bombas de combustible y agua";
        actual = 3;
        filtroMarcaProducto.eventos.change();`);
    assert.equal(evaluar("filtrados.length"), 2);
    assert.equal(evaluar("actual"), 0);
    assert.equal(evaluar("contador.textContent"), "Página 1 de 1");
    evaluar('filtroMarca.value = "Ford"; filtroMarca.eventos.change();');
    assert.equal(evaluar("filtrados.length"), 0);
    assert.equal(evaluar("contador.textContent"), "Sin páginas");
    assert.equal(evaluar("siguiente.disabled && anterior.disabled"), true);
    evaluar("limpiar.eventos.click();");
    assert.equal(evaluar("filtrados.length === productos.length"), true);
    assert.equal(evaluar('filtroMarcaProducto.value + filtroMarca.value + filtroEstante.value'), "");
    evaluar('filtroMarcaProducto.value = "sin-especificar"; filtrar();');
    assert.equal(evaluar("filtrados.length > 0 && filtrados.every(p => !p.marcaProducto)"), true);
});

test("el filtro de producto también funciona en el catálogo local", () => {
    const evaluar = cargarVisor(false, cargar([fuenteBombas]));
    evaluar('filtroMarcaProducto.value = "Kobla"; filtroMarcaProducto.eventos.change();');
    assert.equal(evaluar("filtroEstante"), null);
    assert.equal(evaluar("filtrados.length"), 22);
    assert.equal(evaluar("contador.textContent"), "Página 1 de 6");
    evaluar("siguiente.eventos.click();");
    assert.equal(evaluar("contador.textContent"), "Página 2 de 6");
    evaluar("limpiar.eventos.click();");
    assert.equal(evaluar("filtrados.length"), 32);
    assert.equal(evaluar("actual"), 0);
});
