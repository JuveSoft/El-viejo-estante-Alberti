(window.catalogos = window.catalogos || []).push({
    base: new URL(".", document.currentScript.src).href,

    estante: "Repuestos de motor",
    categoria: "Filtros de aceite",

    productos: [
          {
            foto: "img/aceite_cordoba.webp",
            aplicacion: "Filtro aceite Seat Cordoba",
            marcasAuto: ["SEAT"],
            precio: "$ 5.000-"
        },
        {
            foto: "img/f_aceite_cherokee_4.0.webp",
            aplicacion: "Filtro aceite Cherokee",
            marcasAuto: ["Jeep"],
            precio: "$ 5.000-"
        }

    ]
});
