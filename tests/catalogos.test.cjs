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
    "SEAT", "Toyota", "Volkswagen"
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

test("todas las fotos de bombas de combustible tienen ficha y las nuevas usan marca vacía y precio provisorio", () => {
    const productos = cargar([fuenteBombas])[0].productos;
    const fotos = fs.readdirSync(path.join(path.dirname(fuenteBombas), "img"))
        .filter(nombre => /\.(png|webp)$/i.test(nombre));
    for(const foto of fotos){
        assert.equal(productos.filter(p => p.foto === `img/${foto}`).length, 1, foto);
    }
    const nuevas = productos.filter(p => p.foto.endsWith(".png"));
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

test("las bombas pendientes de foto conservan sus fichas y precios originales", () => {
    const productos = cargar([fuenteBombas])[0].productos;
    const pendientes = productos.filter(p => p.foto === "img/foto_pendiente.svg");
    assert.equal(productos.length, 19);
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
