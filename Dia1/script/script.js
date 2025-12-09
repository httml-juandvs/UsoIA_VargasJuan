const input = document.getElementById("id1");
const button = document.querySelector(".bt1");
const container = document.querySelector(".container-cards");

button.addEventListener("click", () => {
    const name = input.value.trim();

    if (name === "") {
        alert("Ingrese un nombre del personaje");
        return;
    }
0
    fetch(`https://rickandmortyapi.com/api/character/?name=${name}`)
        .then(res => res.json())
        .then(data => {
            mostrarPersonajes(data.results);
        })
        .catch(() => {
            container.innerHTML = "";
        }); 
});


function mostrarPersonajes(lista) {
    container.innerHTML = "";

    lista.forEach(p => {
        const card = `
            <div class="cont-character">
                <div class="pict-character">
                    <img src="${p.image}" alt="${p.name}">
                </div>
                <div class="info-character">
                    <h2>Nombre: ${p.name}</h2>
                    <p>Estado: ${p.status}</p>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}
