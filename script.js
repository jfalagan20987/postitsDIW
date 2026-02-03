//Cargamos postits del local storage
$(document).ready(() => {
  cargarPostits();
});

//Variables
let counter = 1; //Nos servirá para el data-id
let zindex = 1; //Para controlar que al agarrar un post-it venga al frente

//Mostrar y ocultar el popup
const $popup = $('.postit-popup');

//Evento al hacer click en el botón de "Nueva tarea"
$(".nuevaTarea").on("click", () =>{
  $(".overlay").fadeIn(200);

  //Animación y estilo del popup
  $popup.css({
      opacity: 0,
      top: "45%"
    }).show().animate({
      opacity: 1,
      top: "50%"
    }, 300);
});

//Animación y estilo al cerrar el popup
function cerrarPopup() {
  $popup.animate({
    opacity: 0,
    top: "45%"
  }, 200, function () {
    $(this).hide();
  });

  $(".overlay").fadeOut(200);
}

//Opción de cerrar el popup tanto al hacer click en la X como fuera del popup
$(".postit-popup img").on("click", cerrarPopup);
$(".overlay").on("click", cerrarPopup);

//Controlar color del fondo del popup en base al estado
function cambiarColor() {
  $popup.removeClass('pendiente enProceso finalizado');

  const estado = $('input[name="estado"]:checked').attr('id');
  $popup.addClass(estado);
}

cambiarColor();

$('input[name="estado"]').on('change', cambiarColor);


//Creación del postit
$(".crearPostit").on("click", function(e){
  e.preventDefault();

  //Variables del postit
  let estado = $('input[name="estado"]:checked').attr('id');
  let titulo = $("input[name=titulo-postit]").val();
  let descripcion = $("textarea[name=descripcion-postit]").val();

  //Posicionamiento random del postit
  const area = $(".postit-area");
  const maxX = area.width() - 250;
  const maxY = area.height() - 200;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  //Estructura del postit || data-id para diferenciarlos || data-estado para clasificarlos
  const $postit = $(`
    <div class="tarea ${estado}" data-id="${counter}" data-estado="${estado}">
      <div class="toolbar">
        <img class="arrastrar" src="./assets/icons/drag-zone.png">
        <img class="expandir" src="./assets/icons/open.svg">
      </div>
      <h3 contenteditable="true" class="titulo" data-placeholder="Sin título" spellcheck="false">${titulo}</h3>
      <p contenteditable="true" class="descripcion" data-placeholder="Describe la tarea..." spellcheck="false">${descripcion}</p>
    </div>
  `);

  counter++; //Sumamos para controlar los id

  $postit.css({ top: y, left: x }); //Asignamos la posición aleatoria

  $(".postit-area").append($postit); //Añadimos el postit al área

  //Control de arrastre del postit
  $postit.draggable({
    handle: ".toolbar", //Indicamos que esta funcionalidad solo se aplica a la barra de herramientas
    containment: "window", //Pongo esto para evitar arrastrar fuera de la pantalla y que esta crezca de manera descontrolada

    start: function () {
      zindex++;
      $(this).css("z-index", zindex);
    }
  });

  //Actualizar contadores
  actualizarContadores();

  //Cerrar popup y limpiar
  cerrarPopup();
  $("input[name=titulo-postit]").val("");
  $("textarea[name=descripcion-postit]").val("");

  guardarPostits(); //Guardamos en local storage
});

//Control de contadores para cada categoría -- Al seleccionar mediante la clase "dentro", generamos un array. De esta manera, con su longitud ya tenemos el contador
function actualizarContadores(){
  $(".estados .pendiente span").text($(".tarea.pendiente.dentro").length);

  $(".estados .enProceso span").text($(".tarea.enProceso.dentro").length);

  $(".estados .finalizado span").text($(".tarea.finalizado.dentro").length);
}

//Control para plegar y expandir el postit
$(document).on("click", ".expandir", function() {
  const $postit = $(this).closest(".tarea");
  $postit.toggleClass("expandido");
  guardarPostits(); //Esto también lo guardamos en el local storage, para que el usuario se encuentre todo tal y como lo dejó
});

//Estados droppable - Aceptan postits (.tarea) - Ajustan estado según contenedor - Añaden o quitan clase "dentro"
//PENDIENTE
$(".estados .pendiente").droppable({
  accept: ".tarea",
  drop: function(event, ui){
    ui.draggable
      .removeClass("pendiente enProceso finalizado")
      .addClass("pendiente dentro");
    ui.draggable.attr("data-estado", "pendiente");

    actualizarContadores();
  },
  out: function(event, ui){
    ui.draggable.removeClass("dentro");
    actualizarContadores();
  }

  //Con drop y out conseguimos que solo se modifique el estado una vez soltamos dentro del contenedor correspondiente.
  //Esto lo hago para evitar que, al arrastrar hasta la zona de eliminación, el color no vaya cambiando constantemente según pasa por encima de los distintos estados.
});

//EN PROCESO
$(".estados .enProceso").droppable({
  accept: ".tarea",
  drop: function(event, ui){
    ui.draggable
      .removeClass("pendiente enProceso finalizado")
      .addClass("enProceso dentro");
    ui.draggable.attr("data-estado", "enProceso");

    actualizarContadores();
  },
  out: function(event, ui){
    ui.draggable.removeClass("dentro");
    actualizarContadores();
  }
});

//FINALIZADO
$(".estados .finalizado").droppable({
  accept: ".tarea",
  drop: function(event, ui){
    ui.draggable
      .removeClass("pendiente enProceso finalizado")
      .addClass("finalizado dentro");
    ui.draggable.attr("data-estado", "finalizado");

    actualizarContadores();
  },
  out: function(event, ui){
    ui.draggable.removeClass("dentro");
    actualizarContadores();
  }
});

//Función para droppear postits
function dropPostit($postit, tipo){
  $postit.removeClass("pendiente enProceso finalizado").addClass(tipo).attr("data-estado", tipo);

  actualizarContadores();
}

//Eliminación de postits al arrastrar sobre el área de borrado
$(".eliminar-area").droppable({
  accept: ".tarea",

  //Al pasar por encima de la zona de eliminación con un postit, activamos la clase que le cambia el estilo para indicar que ya se puede soltar
  over: function () {
    $(this).addClass("activa");
  },

  out: function () {
    $(this).removeClass("activa");
  },


  //Al hacer drop sobre la zona, se elimina el postit y salta el mensaje de confirmación
  drop: function (event, ui) {
    postitAEliminar = ui.draggable;

    posicionOriginal = {
      top: ui.draggable.css("top"),
      left: ui.draggable.css("left")
    };

    $(this).removeClass("activa");
    abrirModalEliminar();
  }
});

//Modal eliminación
let postitAEliminar = null;
let posicionOriginal = null;

function abrirModalEliminar() {
  $(".overlay-eliminar").fadeIn(200);

  $(".modal-eliminar")
    .css({ opacity: 0, transform: "translate(-50%, -50%) scale(0.9)" })
    .show().animate(
      { opacity: 1 },
      {
        duration: 200,
        step: function () {
          $(this).css("transform", "translate(-50%, -50%) scale(1)");
        }
      }
    );
}

//Animación al cerrar el modal
function cerrarModalEliminar() {
  $(".modal-eliminar").fadeOut(200);
  $(".overlay-eliminar").fadeOut(200);
}

$(".eliminar").on("click", () => {
  if (postitAEliminar) {
    postitAEliminar.remove();
    actualizarContadores();
    guardarPostits();
  }

  postitAEliminar = null;
  cerrarModalEliminar();
});

$(".cancelar, .overlay-eliminar").on("click", () => {
  if (postitAEliminar && posicionOriginal) {
    postitAEliminar.animate(posicionOriginal, 200);
  }

  postitAEliminar = null;
  cerrarModalEliminar();
});


/*LOCAL STORAGE*/
function guardarPostits() {
  const postits = [];

  $(".tarea").each(function() {
    const $tarea = $(this);
    postits.push({
      id: $tarea.attr("data-id"),
      titulo: $tarea.find(".titulo").text(),
      descripcion: $tarea.find(".descripcion").text(),
      estado: $tarea.attr("data-estado"),
      dentro: $tarea.hasClass("dentro"),
      top: $tarea.css("top"),
      left: $tarea.css("left"),
      expandido: $tarea.hasClass("expandido")
    });
  });

  localStorage.setItem("postits", JSON.stringify(postits));
}

function cargarPostits() {
  const postits = JSON.parse(localStorage.getItem("postits") || "[]");

  postits.forEach(p => {
    const $postit = $(`
      <div class="tarea ${p.estado}" data-id="${p.id}" data-estado="${p.estado}">
        <div class="toolbar">
          <img class="arrastrar" src="./assets/icons/drag-zone.png">
          <img class="expandir" src="./assets/icons/open.svg">
        </div>
        <h3 contenteditable="true" class="titulo" data-placeholder="Sin título" spellcheck="false">${p.titulo}</h3>
        <p contenteditable="true" class="descripcion" data-placeholder="Describe la tarea..." spellcheck="false">${p.descripcion}</p>
      </div>
    `);

    if(p.expandido) $postit.addClass("expandido");
    $postit.css({ top: p.top, left: p.left });

    if(p.dentro) $postit.addClass("dentro");

    $(".postit-area").append($postit);

    $postit.draggable({
      handle: ".toolbar",
      containment: "document",
      start: function (){
        zindex++;
        $(this).css("z-index", zindex);
      },
      stop: guardarPostits
    });
  });

  actualizarContadores();
}

$(document).on("input", ".tarea .titulo, .tarea .descripcion", () => guardarPostits());

//Esta es la manera que he encontrado para recuperar los placeholder de los postits
$(document).on("blur", ".tarea .titulo, .tarea .descripcion", function () {
  const texto = $(this).text().trim();

  if (texto === "") {
    $(this).text("");
  }

  guardarPostits();
});

//Evitar saltos de línea en el título
$(document).on("keydown", ".tarea .titulo", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
  }
});

$(document).on("keydown", ".tarea .descripcion", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.execCommand("insertLineBreak");
  }
});