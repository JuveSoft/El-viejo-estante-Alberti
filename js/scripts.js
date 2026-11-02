document.getElementById("estante").textContent = catalogo.estante;
document.getElementById("categoria").textContent = catalogo.categoria;

const contenedor = document.querySelector(".contenedor");

for(let i = 0; i < catalogo.productos.length; i += 4){

    const hoja = document.createElement("section");

    hoja.className = "hoja";

    const grupo = catalogo.productos.slice(i, i + 4);

    grupo.forEach(producto => {

        hoja.innerHTML += `
            <div class="card">

                <img class="imagen"
                     src="${producto.foto}"
                     alt="producto">

                <div class="dato">
                    ${producto.aplicacion}
                </div>

                 <div class="marca">
                    ${producto.marca}
                </div>

                <div class="precio">
                    <p>${producto.precio}</p>
                </div>

            </div>
        `;

    });

    contenedor.appendChild(hoja);

}

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

contenedor.querySelectorAll(".card .imagen").forEach(imagen => {
    const descripcion = imagen.closest(".card").querySelector(".dato").textContent.trim();
    imagen.alt = descripcion;
    imagen.setAttribute("role", "button");
    imagen.setAttribute("tabindex", "0");
    imagen.setAttribute("aria-haspopup", "dialog");
    imagen.setAttribute("aria-label", `Ampliar imagen: ${descripcion}`);
    imagen.title = "Haz clic o toca para ampliar";

    imagen.addEventListener("click", () => {
        imagenOrigen = imagen;
        imagenAmpliada.src = imagen.currentSrc || imagen.src;
        imagenAmpliada.alt = imagen.alt;
        visor.showModal();
        document.documentElement.classList.add("visor-abierto");
    });

    imagen.addEventListener("keydown", evento => {
        if(evento.key === "Enter" || evento.key === " "){
            evento.preventDefault();
            imagen.click();
        }
    });
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

const hojas = document.querySelectorAll(".hoja");
const contador = document.getElementById("contador");

let actual = 0;

hojas.forEach((hoja, i) => {

    if(i !== 0){
        hoja.style.display = "none";
    }

});

function actualizarContador(){

    contador.textContent =
        `Página ${actual + 1} de ${hojas.length}`;

}

actualizarContador();

document
.getElementById("siguiente")
.addEventListener("click", () => {

    hojas[actual].style.display = "none";

    actual++;

    if(actual >= hojas.length){
        actual = 0;
    }

    hojas[actual].style.display = "grid";

    actualizarContador();

});

document
.getElementById("anterior")
.addEventListener("click", () => {

    hojas[actual].style.display = "none";

    actual--;

    if(actual < 0){
        actual = hojas.length - 1;
    }

    hojas[actual].style.display = "grid";

    actualizarContador();

});