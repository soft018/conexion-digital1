const CATEGORIAS = {
  tecnologia: "Tecnología",
  empresas: "Empresas",
  comercio: "Comercio",
  deportes: "Deportes",
  ciencia: "Ciencia"
};

const STORAGE = {
  extra: "cd_noticias_extra",
  deleted: "cd_noticias_eliminadas",
  favorites: "cd_favoritos"
};

const IMAGEN_RESERVA = "assets/images/noticia-default.svg";

const SEED_NOTICIAS = [];

function rutaBase() {
  const script = document.querySelector('script[src*="noticias.js"]');
  if (!script) {
    return "";
  }
  return script.src.replace(/js\/noticias\.js.*$/, "");
}

function leerJson(clave, respaldo) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : respaldo;
  } catch (error) {
    console.warn("No se pudo leer", clave, error);
    return respaldo;
  }
}

function escribirJson(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

async function cargarSemilla() {
  try {
    const respuesta = await fetch(`${rutaBase()}data/noticias.json`, { cache: "no-store" });
    if (!respuesta.ok) {
      throw new Error("Respuesta no válida");
    }
    const datos = await respuesta.json();
    SEED_NOTICIAS.splice(0, SEED_NOTICIAS.length, ...datos);
    return datos;
  } catch (error) {
    if (SEED_NOTICIAS.length) {
      return SEED_NOTICIAS;
    }
    console.warn("Usando semilla vacía temporalmente", error);
    return [];
  }
}

async function obtenerNoticias() {
  const semilla = await cargarSemilla();
  const eliminadas = leerJson(STORAGE.deleted, []);
  const extra = leerJson(STORAGE.extra, []);
  return [...semilla.filter((noticia) => !eliminadas.includes(noticia.id)), ...extra]
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function obtenerFavoritosIds() {
  return leerJson(STORAGE.favorites, []);
}

function esFavorito(id) {
  return obtenerFavoritosIds().includes(id);
}

function alternarFavorito(id) {
  const actual = obtenerFavoritosIds();
  const siguiente = actual.includes(id)
    ? actual.filter((item) => item !== id)
    : [...actual, id];
  escribirJson(STORAGE.favorites, siguiente);
  actualizarContadorFavoritos();
  return siguiente.includes(id);
}

function limpiarFavoritos() {
  escribirJson(STORAGE.favorites, []);
  actualizarContadorFavoritos();
}

function actualizarContadorFavoritos() {
  document.querySelectorAll("[data-fav-count]").forEach((nodo) => {
    nodo.textContent = String(obtenerFavoritosIds().length);
  });
}

function etiquetaCategoria(clave) {
  return CATEGORIAS[clave] || clave;
}

function claseCategoria(clave) {
  return `badge-cat is-${clave}`;
}

function formatearFecha(valor) {
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(fecha);
}

function escapar(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function urlDetalle(id) {
  return `detalle.html?id=${encodeURIComponent(id)}`;
}

function urlCategoria(clave) {
  return `noticias.html?categoria=${encodeURIComponent(clave)}`;
}

function filtrarNoticias(lista, { consulta = "", categoria = "" } = {}) {
  const termino = consulta.trim().toLowerCase();
  return lista.filter((noticia) => {
    const coincideCategoria = !categoria || noticia.categoria === categoria;
    const coincideTexto = !termino
      || [noticia.titulo, noticia.resumen, noticia.autor, etiquetaCategoria(noticia.categoria)]
        .join(" ")
        .toLowerCase()
        .includes(termino);
    return coincideCategoria && coincideTexto;
  });
}

function tarjetaArchivo(noticia, destacada) {
  const guardada = esFavorito(noticia.id);
  const extra = destacada ? " archive-feature" : "";
  return `
    <article class="card archive-card${extra}">
      <button class="save-pin" type="button" data-fav-toggle="${noticia.id}" aria-pressed="${guardada}" aria-label="${guardada ? "Quitar de favoritos" : "Agregar a favoritos"}">
        <i class="bi ${guardada ? "bi-bookmark-fill" : "bi-bookmark"}" aria-hidden="true"></i>
      </button>
      <a class="card-media" href="${urlDetalle(noticia.id)}">
        <img src="${escapar(noticia.imagen || IMAGEN_RESERVA)}" alt="${escapar(noticia.imagenAlt || noticia.titulo)}">
      </a>
      <div class="card-body">
        <div class="card-meta">
          <a class="${claseCategoria(noticia.categoria)}" href="${urlCategoria(noticia.categoria)}">${escapar(etiquetaCategoria(noticia.categoria))}</a>
          <time datetime="${escapar(noticia.fecha)}">${formatearFecha(noticia.fecha)}</time>
        </div>
        <h3 class="card-title"><a href="${urlDetalle(noticia.id)}">${escapar(noticia.titulo)}</a></h3>
        <p>${escapar(noticia.resumen)}</p>
        <div class="card-meta">
          <span>${escapar(noticia.autor)}</span>
          <span>${noticia.lecturaMinutos} min de lectura</span>
          <a class="link-more" href="${urlDetalle(noticia.id)}">Leer m&aacute;s</a>
        </div>
      </div>
    </article>
  `;
}

function tarjetaLeido(noticia, indice) {
  return `
    <a class="read-item" href="${urlDetalle(noticia.id)}">
      <span class="read-num">${indice}</span>
      <span class="story-row-media"><img src="${escapar(noticia.imagen || IMAGEN_RESERVA)}" alt="${escapar(noticia.imagenAlt || noticia.titulo)}"></span>
      <span>
        <span class="${claseCategoria(noticia.categoria)}">${escapar(etiquetaCategoria(noticia.categoria))}</span>
        <strong>${escapar(noticia.titulo)}</strong>
        <time datetime="${escapar(noticia.fecha)}">${formatearFecha(noticia.fecha)}</time>
      </span>
    </a>
  `;
}

function tarjetaFila(noticia) {
  return `
    <article class="story-row">
      <a class="story-row-media" href="${urlDetalle(noticia.id)}">
        <img src="${escapar(noticia.imagen || IMAGEN_RESERVA)}" alt="${escapar(noticia.imagenAlt || noticia.titulo)}">
      </a>
      <div>
        <a class="${claseCategoria(noticia.categoria)}" href="${urlCategoria(noticia.categoria)}">${escapar(etiquetaCategoria(noticia.categoria))}</a>
        <h3><a href="${urlDetalle(noticia.id)}">${escapar(noticia.titulo)}</a></h3>
        <time datetime="${escapar(noticia.fecha)}">${formatearFecha(noticia.fecha)}</time>
      </div>
    </article>
  `;
}

function itemTitular(noticia) {
  return `
    <a class="headline-item" href="${urlDetalle(noticia.id)}">
      <strong>${escapar(noticia.titulo)}</strong>
      <time datetime="${escapar(noticia.fecha)}">${formatearFecha(noticia.fecha)}</time>
    </a>
  `;
}

function tarjetaNoticia(noticia, opciones = {}) {
  const compacta = opciones.compacta;
  return `
    <article class="card">
      <a class="card-media" href="${urlDetalle(noticia.id)}">
        <img src="${escapar(noticia.imagen || IMAGEN_RESERVA)}" alt="${escapar(noticia.imagenAlt || noticia.titulo)}">
      </a>
      <div class="card-body">
        <div class="card-meta">
          <a class="${claseCategoria(noticia.categoria)}" href="${urlCategoria(noticia.categoria)}">${escapar(etiquetaCategoria(noticia.categoria))}</a>
          <time datetime="${escapar(noticia.fecha)}">${formatearFecha(noticia.fecha)}</time>
        </div>
        <h3 class="card-title"><a href="${urlDetalle(noticia.id)}">${escapar(noticia.titulo)}</a></h3>
        ${compacta ? "" : `<p>${escapar(noticia.resumen)}</p>`}
        <a class="btn btn-outline" href="${urlDetalle(noticia.id)}">Leer más</a>
      </div>
    </article>
  `;
}

function renderizarLista(destino, noticias, opciones = {}) {
  const contenedor = document.querySelector(destino);
  if (!contenedor) {
    return;
  }
  if (!noticias.length) {
    contenedor.innerHTML = "";
    return;
  }
  contenedor.innerHTML = noticias.map((noticia) => tarjetaNoticia(noticia, opciones)).join("");
}

function mostrarVacio(selector, visible, html) {
  const nodo = document.querySelector(selector);
  if (!nodo) {
    return;
  }
  nodo.hidden = !visible;
  if (visible && html) {
    nodo.innerHTML = html;
  }
}

async function noticiasPorIds(ids) {
  const todas = await obtenerNoticias();
  return ids
    .map((id) => todas.find((noticia) => noticia.id === id))
    .filter(Boolean);
}

function crearNoticia(datos) {
  const extra = leerJson(STORAGE.extra, []);
  const nueva = {
    id: `local-${Date.now()}`,
    categoria: datos.categoria,
    titulo: datos.titulo.trim(),
    resumen: datos.resumen.trim(),
    contenido: datos.contenido
      .split(/\n{2,}/)
      .map((parrafo) => parrafo.trim())
      .filter(Boolean),
    subtitulos: [],
    autor: datos.autor.trim(),
    fecha: datos.fecha,
    imagen: String(datos.imagen || "").trim() || IMAGEN_RESERVA,
    imagenAlt: String(datos.imagenAlt || "").trim() || `Imagen ilustrativa de ${datos.titulo.trim()}`,
    destacada: false,
    lecturaMinutos: Math.max(2, Math.round(datos.contenido.trim().split(/\s+/).length / 180))
  };
  extra.unshift(nueva);
  escribirJson(STORAGE.extra, extra);
  return nueva;
}

function restaurarNoticia(noticia) {
  if (String(noticia.id).startsWith("local-")) {
    const extra = leerJson(STORAGE.extra, []);
    if (!extra.some((item) => item.id === noticia.id)) {
      extra.unshift(noticia);
      escribirJson(STORAGE.extra, extra);
    }
  } else {
    escribirJson(STORAGE.deleted, leerJson(STORAGE.deleted, []).filter((item) => item !== noticia.id));
  }
}

function eliminarNoticia(id) {
  const extra = leerJson(STORAGE.extra, []);
  if (extra.some((noticia) => noticia.id === id)) {
    escribirJson(STORAGE.extra, extra.filter((noticia) => noticia.id !== id));
  } else {
    const eliminadas = new Set(leerJson(STORAGE.deleted, []));
    eliminadas.add(id);
    escribirJson(STORAGE.deleted, [...eliminadas]);
  }
  const favoritos = obtenerFavoritosIds().filter((item) => item !== id);
  escribirJson(STORAGE.favorites, favoritos);
  actualizarContadorFavoritos();
}

window.ConexionDigital = {
  CATEGORIAS,
  obtenerNoticias,
  obtenerFavoritosIds,
  esFavorito,
  alternarFavorito,
  limpiarFavoritos,
  actualizarContadorFavoritos,
  etiquetaCategoria,
  claseCategoria,
  formatearFecha,
  escapar,
  urlDetalle,
  urlCategoria,
  filtrarNoticias,
  tarjetaNoticia,
  tarjetaArchivo,
  tarjetaLeido,
  tarjetaFila,
  itemTitular,
  renderizarLista,
  mostrarVacio,
  noticiasPorIds,
  crearNoticia,
  restaurarNoticia,
  eliminarNoticia,
  IMAGEN_RESERVA
};
