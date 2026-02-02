$(document).ready(() => {
  cargarPostits();
});

//Variables
let counter = 1; //Nos servirá para el data-id
let zindex = 1; //Para controlar que al agarrar un post-it venga al frente

//Mostrar y ocultar el popup
const $popup = $('.postit-popup');

$(".nuevaTarea").on("click", () =>{
  $(".overlay").fadeIn(200);

  $popup.css({
      opacity: 0,
      top: "45%"
    }).show().animate({
      opacity: 1,
      top: "50%"
    }, 300);
});

function cerrarPopup() {
  $popup.animate({
    opacity: 0,
    top: "45%"
  }, 200, function () {
    $(this).hide();
  });

  $(".overlay").fadeOut(200);
}

$(".postit-popup img").on("click", cerrarPopup);
$(".overlay").on("click", cerrarPopup);

//Controlar color del fondo del popup
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

  //Estructura del postit
  const $postit = $(`
    <div class="tarea ${estado}" data-id="${counter}" data-estado="${estado}">
      <div class="toolbar">
        <img class="expandir" src="./assets/icons/open.svg">
      </div>
      <h3 contenteditable="true" class="titulo" data-placeholder="Sin título">${titulo}</h3>
      <p contenteditable="true" class="descripcion" data-placeholder="Describe la tarea...">${descripcion}</p>
    </div>
  `);

  counter++; //Sumamos para controlar los id

  $postit.css({ top: y, left: x });

  $(".postit-area").append($postit);

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

  guardarPostits();
});

//Control de contadores para cada categoría
function actualizarContadores(){
  $(".estados .pendiente span").text(
    $(".tarea.pendiente.dentro").length
  );

  $(".estados .enProceso span").text(
    $(".tarea.enProceso.dentro").length
  );

  $(".estados .finalizado span").text(
    $(".tarea.finalizado.dentro").length
  );
}

//Control para plegar y expandir el postit
$(document).on("click", ".expandir", function() {
  const $postit = $(this).closest(".tarea");
  $postit.toggleClass("expandido");
  guardarPostits();
});

//Categorías droppable - Qué aceptan y qué no
$(".estados .pendiente").droppable({
  accept: ".tarea",
  drop: function(event, ui){
    ui.draggable
      .removeClass("pendiente enProceso finalizado")
      .addClass("pendiente dentro");  // ✅ clase "dentro"
    ui.draggable.attr("data-estado", "pendiente");

    actualizarContadores();
  },
  out: function(event, ui){
    ui.draggable.removeClass("dentro"); // ✅ quitar al salir
    actualizarContadores();
  }
});

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

  over: function () {
    $(this).addClass("activa");
  },

  out: function () {
    $(this).removeClass("activa");
  },

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
          <img class="expandir" src="./assets/icons/open.svg">
        </div>
        <h3 contenteditable="true" class="titulo" data-placeholder="Sin título">${p.titulo}</h3>
        <p contenteditable="true" class="descripcion" data-placeholder="Describe la tarea...">${p.descripcion}</p>
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