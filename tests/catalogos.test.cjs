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
