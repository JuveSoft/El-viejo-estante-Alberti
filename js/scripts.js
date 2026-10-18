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

                <div class="precio">
                    <p>${producto.precio}</p>
                </div>

            </div>
        `;

    });

    contenedor.appendChild(hoja);

}

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