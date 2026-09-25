const paginaActual = document.body.dataset.page || "";

function marcarNavegacion() {
  document.querySelectorAll("[data-nav]").forEach((enlace) => {
    if (enlace.dataset.nav === paginaActual) {
      enlace.setAttribute("aria-current", "page");
    }
  });
}

function configurarMenu() {
  const boton = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-panel]");
  const buscador = document.querySelector("[data-header-search]");
  const abrirBusqueda = document.querySelector("[data-search-toggle]");

  if (boton && menu) {
    boton.addEventListener("click", () => {
      const abierto = menu.classList.toggle("is-open");
      boton.setAttribute("aria-expanded", String(abierto));
    });
  }

  if (abrirBusqueda && buscador) {
    abrirBusqueda.addEventListener("click", () => {
      buscador.classList.toggle("is-open");
      const campo = buscador.querySelector("input");
      if (campo && buscador.classList.contains("is-open")) {
        campo.focus();
      }
    });
  }
}

function fechaPortada() {
  const nodo = document.querySelector("[data-today]");
  if (!nodo) {
    return;
  }
  nodo.textContent = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function mostrarAviso(mensaje, tipo = "success") {
  const pila = document.querySelector("[data-toasts]") || crearPilaToasts();
  const aviso = document.createElement("div");
  aviso.className = `toast-msg is-${tipo}`;
  aviso.setAttribute("role", "status");
  const deshacer = mensaje.indexOf("eliminada") >= 0
    ? `<button type="button" class="toast-undo" data-undo-delete>Deshacer</button>`
    : "";
  aviso.innerHTML = `<i class="bi ${tipo === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}" aria-hidden="true"></i><span>${mensaje}</span>${deshacer}<button type="button" class="toast-close" aria-label="Cerrar">&times;</button>`;
  pila.append(aviso);
  const cerrar = () => aviso.remove();
  aviso.querySelector(".toast-close")?.addEventListener("click", cerrar);
  window.setTimeout(cerrar, deshacer ? 7000 : 4200);
}

function crearPilaToasts() {
  const pila = document.createElement("div");
  pila.className = "toast-stack";
  pila.dataset.toasts = "";
  document.body.append(pila);
  return pila;
}

function configurarBoletin() {
  const formulario = document.querySelector("[data-newsletter]");
  if (!formulario) {
    return;
  }
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const correo = formulario.querySelector('input[type="email"]');
    const aviso = formulario.querySelector("[data-newsletter-msg]");
    if (!correo.checkValidity()) {
      correo.classList.add("input-invalid");
      aviso.hidden = false;
      aviso.className = "feedback is-error";
      aviso.textContent = "Ingresa un correo electrónico válido.";
      return;
    }
    correo.classList.remove("input-invalid");
    aviso.hidden = false;
    aviso.className = "feedback is-success";
    aviso.textContent = "Suscripción de demostración registrada. No se envió información a un servidor.";
    formulario.reset();
  });
}

function parametros() {
  return new URLSearchParams(window.location.search);
}

async function iniciarInicio() {
  const noticias = await ConexionDigital.obtenerNoticias();
  if (!noticias.length) {
    const aviso = document.querySelector("[data-featured-main]");
    if (aviso) {
      aviso.innerHTML = `<div class="panel empty-state"><h2>No se pudieron cargar las noticias</h2><p>Abre el proyecto con un servidor local, por ejemplo <code>http://localhost/PERIODICO/</code>.</p></div>`;
    }
    return;
  }

  const destacadas = noticias.filter((noticia) => noticia.destacada);
  const principal = destacadas[0] || noticias[0];
  const laterales = noticias.filter((noticia) => noticia.id !== principal.id).slice(0, 4);
  const recientes = noticias.filter((noticia) => noticia.id !== principal.id).slice(0, 5);
  const latestMain = recientes[0];
  const latestSide = recientes.slice(1, 5);

  const ticker = document.querySelector("[data-ticker]");
  if (ticker) {
    const piezas = noticias.slice(0, 8).map((noticia) => `<a href="${ConexionDigital.urlDetalle(noticia.id)}">${ConexionDigital.escapar(noticia.titulo)}</a>`);
    ticker.innerHTML = `<div class="ticker-move">${piezas.join("")}${piezas.join("")}</div>`;
  }

  const bloquePrincipal = document.querySelector("[data-featured-main]");
  if (bloquePrincipal && principal) {
    bloquePrincipal.innerHTML = `
      <article class="card featured-main">
        <img src="${ConexionDigital.escapar(principal.imagen)}" alt="${ConexionDigital.escapar(principal.imagenAlt)}">
        <div class="featured-copy">
          <a class="${ConexionDigital.claseCategoria(principal.categoria)}" href="${ConexionDigital.urlCategoria(principal.categoria)}">${ConexionDigital.escapar(ConexionDigital.etiquetaCategoria(principal.categoria))}</a>
          <h2><a href="${ConexionDigital.urlDetalle(principal.id)}">${ConexionDigital.escapar(principal.titulo)}</a></h2>
          <p>${ConexionDigital.escapar(principal.resumen)}</p>
          <div class="meta-row">
            <span>${ConexionDigital.escapar(principal.autor)}</span>
            <time datetime="${ConexionDigital.escapar(principal.fecha)}">${ConexionDigital.formatearFecha(principal.fecha)}</time>
            <span>${principal.lecturaMinutos} min</span>
          </div>
        </div>
      </article>
    `;
  }

  const lado = document.querySelector("[data-featured-side]");
  if (lado) {
    lado.innerHTML = laterales.map((noticia) => ConexionDigital.tarjetaFila(noticia)).join("");
  }

  const latestBloque = document.querySelector("[data-latest-main]");
  if (latestBloque && latestMain) {
    latestBloque.innerHTML = ConexionDigital.tarjetaNoticia(latestMain);
  }

  const latestLista = document.querySelector("[data-latest]");
  if (latestLista) {
    latestLista.innerHTML = latestSide.map((noticia) => ConexionDigital.tarjetaFila(noticia)).join("");
  }

  Object.keys(ConexionDigital.CATEGORIAS).forEach((clave) => {
    const grupo = noticias.filter((noticia) => noticia.categoria === clave);
    const dest = document.querySelector(`[data-cat-feature="${clave}"]`);
    const lista = document.querySelector(`[data-cat-list="${clave}"]`);
    if (dest && grupo[0]) {
      dest.innerHTML = ConexionDigital.tarjetaNoticia(grupo[0], { compacta: true });
    }
    if (lista) {
      lista.innerHTML = grupo.slice(1, 4).map((noticia) => ConexionDigital.itemTitular(noticia)).join("");
    }
  });

}

function ordenarNoticias(lista, orden) {
  const copia = [...lista];
  if (orden === "antiguas") {
    return copia.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  if (orden === "titulo") {
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  }
  return copia.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function filtrarPorFecha(lista, dias) {
  if (!dias) {
    return lista;
  }
  const limite = new Date();
  limite.setDate(limite.getDate() - Number(dias));
  return lista.filter((noticia) => new Date(`${noticia.fecha}T00:00:00`) >= limite);
}

async function iniciarListado() {
  const todas = await ConexionDigital.obtenerNoticias();
  const params = parametros();
  const estado = {
    consulta: params.get("q") || "",
    categoria: params.get("categoria") || "",
    orden: "recientes",
    dias: "",
    pagina: 1,
    porPagina: 5
  };

  const campo = document.querySelector("#busqueda-noticias");
  const cabecera = document.querySelector("#q-header");
  if (campo) {
    campo.value = estado.consulta;
  }
  if (cabecera && estado.consulta) {
    cabecera.value = estado.consulta;
  }

  const leidos = document.querySelector("[data-most-read]");
  if (leidos) {
    leidos.innerHTML = todas.slice(0, 4).map((noticia, i) => ConexionDigital.tarjetaLeido(noticia, i + 1)).join("");
  }

  document.querySelectorAll("[data-filter]").forEach((boton) => {
    boton.setAttribute("aria-pressed", String(boton.dataset.filter === estado.categoria));
    boton.classList.toggle("is-active", boton.dataset.filter === estado.categoria);
    boton.addEventListener("click", () => {
      estado.categoria = boton.dataset.filter;
      estado.pagina = 1;
      document.querySelectorAll("[data-filter]").forEach((otro) => {
        otro.setAttribute("aria-pressed", String(otro === boton));
        otro.classList.toggle("is-active", otro === boton);
      });
      actualizarUrl();
      pintar();
    });
  });

  document.querySelector("[data-news-search]")?.addEventListener("submit", (evento) => {
    evento.preventDefault();
    estado.consulta = campo.value;
    estado.pagina = 1;
    actualizarUrl();
    pintar();
  });

  document.querySelector("[data-sort]")?.addEventListener("change", (evento) => {
    estado.orden = evento.target.value;
    estado.pagina = 1;
    pintar();
  });

  document.querySelector("[data-date]")?.addEventListener("change", (evento) => {
    estado.dias = evento.target.value;
    estado.pagina = 1;
    pintar();
  });

  document.querySelector("[data-clear-filters]")?.addEventListener("click", () => {
    estado.consulta = "";
    estado.categoria = "";
    estado.orden = "recientes";
    estado.dias = "";
    estado.pagina = 1;
    if (campo) {
      campo.value = "";
    }
    const sort = document.querySelector("[data-sort]");
    const date = document.querySelector("[data-date]");
    if (sort) {
      sort.value = "recientes";
    }
    if (date) {
      date.value = "";
    }
    document.querySelectorAll("[data-filter]").forEach((boton) => {
      const activo = boton.dataset.filter === "";
      boton.setAttribute("aria-pressed", String(activo));
      boton.classList.toggle("is-active", activo);
    });
    actualizarUrl();
    pintar();
  });

  document.querySelector("[data-news-list]")?.addEventListener("click", alPulsarFavorito);
  document.querySelector("[data-news-featured]")?.addEventListener("click", alPulsarFavorito);

  document.querySelector("[data-pagination]")?.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-page-go]");
    if (!boton) {
      return;
    }
    estado.pagina = Number(boton.dataset.pageGo);
    pintar();
    document.querySelector("#contenido")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function actualizarUrl() {
    const url = new URL(window.location.href);
    if (estado.consulta) {
      url.searchParams.set("q", estado.consulta);
    } else {
      url.searchParams.delete("q");
    }
    if (estado.categoria) {
      url.searchParams.set("categoria", estado.categoria);
    } else {
      url.searchParams.delete("categoria");
    }
    window.history.replaceState({}, "", url);
  }

  function alPulsarFavorito(evento) {
    const boton = evento.target.closest("[data-fav-toggle]");
    if (!boton) {
      return;
    }
    evento.preventDefault();
    const activo = ConexionDigital.alternarFavorito(boton.dataset.favToggle);
    boton.setAttribute("aria-pressed", String(activo));
    boton.querySelector("i").className = `bi ${activo ? "bi-bookmark-fill" : "bi-bookmark"}`;
    mostrarAviso(activo ? "Noticia guardada en favoritos." : "Noticia retirada de favoritos.");
  }

  function pintar() {
    const filtradas = ordenarNoticias(
      filtrarPorFecha(ConexionDigital.filtrarNoticias(todas, estado), estado.dias),
      estado.orden
    );
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / estado.porPagina));
    if (estado.pagina > totalPaginas) {
      estado.pagina = totalPaginas;
    }
    const inicio = (estado.pagina - 1) * estado.porPagina;
    const pagina = filtradas.slice(inicio, inicio + estado.porPagina);
    const destacada = estado.pagina === 1 ? pagina[0] : null;
    const resto = estado.pagina === 1 ? pagina.slice(1) : pagina;

    const bloqueDestacada = document.querySelector("[data-news-featured]");
    const lista = document.querySelector("[data-news-list]");
    if (bloqueDestacada) {
      bloqueDestacada.innerHTML = destacada ? ConexionDigital.tarjetaArchivo(destacada, true) : "";
    }
    if (lista) {
      const extras = resto.map((noticia) => ConexionDigital.tarjetaArchivo(noticia, false));
      if (filtradas.length && estado.pagina === totalPaginas) {
        extras.push(`
          <article class="card archive-cta">
            <h3>&iquest;No encuentras lo que buscas?</h3>
            <p>Prueba otra categor&iacute;a o vuelve a la portada para recorrer los bloques tem&aacute;ticos.</p>
            <a class="btn btn-primary" href="noticias.html">Ver todas las categor&iacute;as</a>
          </article>
        `);
      }
      lista.innerHTML = extras.join("");
    }

    const vacio = document.querySelector("[data-empty]");
    const resumen = document.querySelector("[data-results-count]");
    const paginacion = document.querySelector("[data-pagination]");
    if (resumen) {
      resumen.textContent = filtradas.length
        ? `${filtradas.length} noticia${filtradas.length === 1 ? "" : "s"} encontrada${filtradas.length === 1 ? "" : "s"}`
        : "Sin coincidencias";
    }
    if (vacio) {
      vacio.hidden = filtradas.length > 0;
    }
    if (paginacion) {
      paginacion.hidden = filtradas.length === 0 || totalPaginas < 2;
      if (!paginacion.hidden) {
        const botones = [];
        botones.push(`<button class="page-btn" type="button" data-page-go="${estado.pagina - 1}" ${estado.pagina === 1 ? "disabled" : ""}>Anterior</button>`);
        for (let i = 1; i <= totalPaginas; i += 1) {
          botones.push(`<button class="page-btn${i === estado.pagina ? " is-current" : ""}" type="button" data-page-go="${i}" aria-current="${i === estado.pagina ? "page" : "false"}">${i}</button>`);
        }
        botones.push(`<button class="page-btn" type="button" data-page-go="${estado.pagina + 1}" ${estado.pagina === totalPaginas ? "disabled" : ""}>Siguiente</button>`);
        paginacion.innerHTML = botones.join("");
      }
    }
  }

  pintar();
}

function fotoAutor(nombre) {
  const fotos = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
  ];
  const suma = [...String(nombre)].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return fotos[suma % fotos.length];
}

function citaArticulo(categoria) {
  const citas = {
    deportes: "Los datos no ganan partidos, pero nos ayudan a hacer mejores preguntas.",
    tecnologia: "La herramienta no reemplaza el criterio de quien programa.",
    empresas: "Antes del precio, hay que preguntar si las plataformas pueden convivir.",
    comercio: "Un catálogo honesto muestra lo que realmente hay en anaquel.",
    ciencia: "El color de una imagen espacial es una convención, no un recuerdo visual."
  };
  return citas[categoria] || "Esta nota es un caso de estudio académico, no una crónica de un hecho real.";
}

async function iniciarDetalle() {
  const id = parametros().get("id");
  const noticias = await ConexionDigital.obtenerNoticias();
  const noticia = noticias.find((item) => item.id === id);
  const destino = document.querySelector("[data-article]");

  if (!destino) {
    return;
  }

  if (!noticia) {
    destino.innerHTML = `
      <div class="panel empty-state">
        <h1>No encontramos esta noticia</h1>
        <p>El identificador no existe o la nota fue eliminada en la administración de demostración.</p>
        <a class="btn btn-primary" href="noticias.html">Volver al listado</a>
      </div>
    `;
    return;
  }

  document.title = noticia.titulo + " | Conexión Digital";
  document.querySelectorAll("[data-cat-nav]").forEach((enlace) => {
    if (enlace.dataset.catNav === noticia.categoria) {
      enlace.setAttribute("aria-current", "page");
    }
  });

  const subtitulos = noticia.subtitulos || [];
  const parrafos = noticia.contenido.map((texto, indice) => {
    const clase = indice === 0 ? " class=\"drop-cap\"" : "";
    return "<p" + clase + ">" + ConexionDigital.escapar(texto) + "</p>";
  });
  if (subtitulos[0] && parrafos[1]) {
    parrafos.splice(2, 0, "<h2 id=\"seccion-1\">" + ConexionDigital.escapar(subtitulos[0]) + "</h2>");
    parrafos.splice(3, 0, "<blockquote class=\"article-quote\"><p>" + ConexionDigital.escapar(citaArticulo(noticia.categoria)) + "</p><cite>Redacción de aula</cite></blockquote>");
  }
  if (subtitulos[1] && parrafos.length > 5) {
    parrafos.splice(5, 0, "<h2 id=\"seccion-2\">" + ConexionDigital.escapar(subtitulos[1]) + "</h2>");
  }

  const indice = noticias.findIndex((item) => item.id === noticia.id);
  const anterior = noticias[indice + 1];
  const siguiente = noticias[indice - 1];
  const guardada = ConexionDigital.esFavorito(noticia.id);
  const foto = fotoAutor(noticia.autor);
  const tocItems = ["<li><a href=\"#inicio-nota\">Presentación</a></li>"].concat(
    subtitulos.map((titulo, i) => "<li><a href=\"#seccion-" + (i + 1) + "\">" + ConexionDigital.escapar(titulo) + "</a></li>")
  );
  const tocNodo = document.querySelector("[data-toc]");
  if (tocNodo) {
    tocNodo.innerHTML = tocItems.join("");
  }
  const leidos = document.querySelector("[data-most-read]");
  if (leidos) {
    leidos.innerHTML = noticias.filter((item) => item.id !== noticia.id).slice(0, 3)
      .map((item, i) => ConexionDigital.tarjetaLeido(item, i + 1)).join("");
  }

  const navAnt = anterior
    ? "<a href=\"" + ConexionDigital.urlDetalle(anterior.id) + "\"><span>Noticia anterior</span><strong>" + ConexionDigital.escapar(anterior.titulo) + "</strong></a>"
    : "";
  const navSig = siguiente
    ? "<a href=\"" + ConexionDigital.urlDetalle(siguiente.id) + "\"><span>Siguiente noticia</span><strong>" + ConexionDigital.escapar(siguiente.titulo) + "</strong></a>"
    : "";

  destino.innerHTML = `
    <nav aria-label="Ruta">
      <ol class="breadcrumb">
        <li><a href="index.html">Inicio</a></li>
        <li>/</li>
        <li><a href="noticias.html">Noticias</a></li>
        <li>/</li>
        <li><a href="${ConexionDigital.urlCategoria(noticia.categoria)}">${ConexionDigital.escapar(ConexionDigital.etiquetaCategoria(noticia.categoria))}</a></li>
      </ol>
    </nav>
    <a class="badge-cat is-${noticia.categoria} badge-solid" href="${ConexionDigital.urlCategoria(noticia.categoria)}">${ConexionDigital.escapar(ConexionDigital.etiquetaCategoria(noticia.categoria))}</a>
    <h1 class="article-title" id="inicio-nota">${ConexionDigital.escapar(noticia.titulo)}</h1>
    <p class="lead">${ConexionDigital.escapar(noticia.resumen)}</p>
    <div class="article-meta-bar">
      <div class="author-chip">
        <img src="${foto}" alt="Retrato ilustrativo de ${ConexionDigital.escapar(noticia.autor)}">
        <div>
          <strong>${ConexionDigital.escapar(noticia.autor)}</strong>
          <p>
            <time datetime="${ConexionDigital.escapar(noticia.fecha)}">${ConexionDigital.formatearFecha(noticia.fecha)}</time>
            &middot; Actualizado hace 6 horas &middot; ${noticia.lecturaMinutos} min de lectura
          </p>
        </div>
      </div>
      <div class="article-mini-actions">
        <button class="icon-action" type="button" data-fav-toggle="${noticia.id}" aria-pressed="${guardada}">
          <i class="bi ${guardada ? "bi-bookmark-fill" : "bi-bookmark"}"></i> Guardar
        </button>
        <button class="icon-action" type="button" data-share="copy"><i class="bi bi-share"></i> Compartir</button>
        <button class="icon-action" type="button" data-print><i class="bi bi-printer"></i> Imprimir</button>
      </div>
    </div>
    <figure class="article-hero">
      <img src="${ConexionDigital.escapar(noticia.imagen)}" alt="${ConexionDigital.escapar(noticia.imagenAlt)}">
      <figcaption>${ConexionDigital.escapar(noticia.imagenAlt)} &middot; Imagen de demostración</figcaption>
    </figure>
    <div class="article-body">${parrafos.join("")}</div>
    <div class="notice-box">
      <i class="bi bi-info-circle" aria-hidden="true"></i>
      <p>Nota de demostración académica. El texto ilustra el diseño y no describe un suceso real.</p>
    </div>
    <div class="tag-row">
      <a class="filter-chip" href="${ConexionDigital.urlCategoria(noticia.categoria)}">${ConexionDigital.escapar(ConexionDigital.etiquetaCategoria(noticia.categoria))}</a>
      <span class="filter-chip">Aula</span>
      <span class="filter-chip">Demostración</span>
    </div>
    <section class="author-card">
      <img src="${foto}" alt="Retrato ilustrativo de ${ConexionDigital.escapar(noticia.autor)}">
      <div>
        <h2>${ConexionDigital.escapar(noticia.autor)}</h2>
        <p>Firma de la redacción de aula de Conexión Digital. Los textos se escriben para ensayar lectura, no para informar un hecho de actualidad.</p>
        <p>
          <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="bi bi-twitter-x"></i></a>
        </p>
      </div>
    </section>
    <div class="article-actions article-actions-wide">
      <button class="btn ${guardada ? "btn-primary" : "btn-outline"}" type="button" data-fav-toggle="${noticia.id}">
        <i class="bi ${guardada ? "bi-bookmark-check-fill" : "bi-bookmark-plus"}"></i>
        <span>${guardada ? "Guardado" : "Guardar"}</span>
      </button>
      <button class="btn btn-ghost" type="button" data-share="copy"><i class="bi bi-share"></i> Compartir</button>
      <button class="btn btn-ghost" type="button" data-print><i class="bi bi-printer"></i> Imprimir</button>
    </div>
    <nav class="article-switch">
      <div>${navAnt}</div>
      <div class="is-next">${navSig}</div>
    </nav>
  `;

  function refrescarFavorito(activo) {
    destino.querySelectorAll("[data-fav-toggle]").forEach((boton) => {
      boton.setAttribute("aria-pressed", String(activo));
      const icono = boton.querySelector("i");
      const texto = boton.querySelector("span");
      if (icono) {
        icono.className = "bi " + (activo ? "bi-bookmark-fill" : "bi-bookmark");
      }
      if (texto) {
        texto.textContent = activo ? "Guardado" : "Guardar";
      }
      if (boton.classList.contains("btn")) {
        boton.classList.toggle("btn-primary", activo);
        boton.classList.toggle("btn-outline", !activo);
      }
    });
  }

  destino.addEventListener("click", async (evento) => {
    const fav = evento.target.closest("[data-fav-toggle]");
    const share = evento.target.closest("[data-share='copy']");
    const print = evento.target.closest("[data-print]");
    if (fav) {
      refrescarFavorito(ConexionDigital.alternarFavorito(noticia.id));
      mostrarAviso(ConexionDigital.esFavorito(noticia.id) ? "Noticia guardada en favoritos." : "Noticia retirada de favoritos.");
    }
    if (share) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        mostrarAviso("Enlace copiado al portapapeles.");
      } catch (error) {
        mostrarAviso("No se pudo copiar el enlace.");
      }
    }
    if (print) {
      window.print();
    }
  });

  const relacionadas = noticias.filter((item) => item.categoria === noticia.categoria && item.id !== noticia.id).slice(0, 3);
  const related = document.querySelector("[data-related]");
  if (related) {
    related.innerHTML = relacionadas.map((item) => ConexionDigital.tarjetaArchivo(item, false)).join("");
  }
}

async function iniciarFavoritos() {
  const ids = ConexionDigital.obtenerFavoritosIds();
  const guardadas = await ConexionDigital.noticiasPorIds(ids);
  const todas = await ConexionDigital.obtenerNoticias();
  const lista = document.querySelector("[data-fav-list]");
  const vacio = document.querySelector("[data-empty]");
  const limpiar = document.querySelector("[data-clear-favs]");
  const estado = { consulta: "", categoria: "", orden: "recientes", vista: "lista" };

  const reco = document.querySelector("[data-reco]");
  const sugerida = todas.find((noticia) => !ids.includes(noticia.id)) || todas[0];
  if (reco && sugerida) {
    reco.innerHTML = "<h2>Recomendación editorial</h2>" + ConexionDigital.tarjetaFila(sugerida);
  }

  document.querySelector("[data-saved-search]")?.addEventListener("submit", (evento) => {
    evento.preventDefault();
    estado.consulta = document.querySelector("#busqueda-guardados").value;
    pintar();
  });

  document.querySelectorAll("[data-saved-filters] [data-filter]").forEach((boton) => {
    boton.addEventListener("click", () => {
      estado.categoria = boton.dataset.filter;
      document.querySelectorAll("[data-saved-filters] [data-filter]").forEach((otro) => {
        otro.classList.toggle("is-active", otro === boton);
        otro.setAttribute("aria-pressed", String(otro === boton));
      });
      pintar();
    });
  });

  document.querySelector("[data-saved-sort]")?.addEventListener("change", (evento) => {
    estado.orden = evento.target.value;
    pintar();
  });

  document.querySelectorAll("[data-view]").forEach((boton) => {
    boton.addEventListener("click", () => {
      estado.vista = boton.dataset.view;
      document.querySelectorAll("[data-view]").forEach((otro) => {
        otro.classList.toggle("is-current", otro === boton);
        otro.setAttribute("aria-pressed", String(otro === boton));
      });
      lista.classList.toggle("is-lista", estado.vista === "lista");
      lista.classList.toggle("is-grid", estado.vista === "grid");
    });
  });

  lista?.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-remove-fav]");
    if (!boton) {
      return;
    }
    ConexionDigital.alternarFavorito(boton.dataset.removeFav);
    mostrarAviso("La noticia se elimino de favoritos.");
    pintar();
  });

  limpiar?.addEventListener("click", () => {
    if (window.confirm("Deseas vaciar toda la lista de favoritos?")) {
      ConexionDigital.limpiarFavoritos();
      mostrarAviso("Se limpiaron todos los favoritos.");
      pintar();
    }
  });

  function pintar() {
    const actuales = ConexionDigital.obtenerFavoritosIds();
    let visibles = guardadas.filter((noticia) => actuales.includes(noticia.id));
    visibles = ConexionDigital.filtrarNoticias(visibles, estado);
    visibles = ordenarNoticias(visibles, estado.orden);
    const conteo = document.querySelector("[data-saved-count]");
    if (conteo) {
      conteo.textContent = visibles.length
        ? visibles.length + " noticia" + (visibles.length === 1 ? "" : "s") + " guardada" + (visibles.length === 1 ? "" : "s")
        : "";
    }
    if (!actuales.length || !visibles.length) {
      lista.innerHTML = "";
      vacio.hidden = actuales.length > 0 && !visibles.length ? false : actuales.length === 0 ? false : true;
      if (!actuales.length) {
        vacio.hidden = false;
        vacio.querySelector("h2").textContent = "Aun no has guardado ninguna noticia";
        vacio.querySelector("p").textContent = "Abre un articulo y usa Guardar. La lista se mantiene aunque recargues la pagina.";
      }
      if (limpiar) {
        limpiar.hidden = actuales.length === 0;
      }
      if (actuales.length && !visibles.length) {
        vacio.querySelector("h2").textContent = "No hay coincidencias en tus guardados";
        vacio.querySelector("p").textContent = "Prueba otra palabra o limpia el filtro de categoría.";
      }
      if (!actuales.length) {
        return;
      }
      if (!visibles.length) {
        return;
      }
    }
    vacio.hidden = true;
    if (limpiar) {
      limpiar.hidden = false;
    }
    lista.classList.toggle("is-lista", estado.vista === "lista");
    lista.classList.toggle("is-grid", estado.vista === "grid");
    lista.innerHTML = visibles.map((noticia) => {
      const foto = typeof fotoAutor === "function" ? fotoAutor(noticia.autor) : noticia.imagen;
      return `
        <article class="saved-card">
          <a class="saved-media" href="${ConexionDigital.urlDetalle(noticia.id)}">
            <img src="${ConexionDigital.escapar(noticia.imagen)}" alt="${ConexionDigital.escapar(noticia.imagenAlt)}">
          </a>
          <div class="saved-copy">
            <div class="card-meta">
              <span class="${ConexionDigital.claseCategoria(noticia.categoria)}">${ConexionDigital.escapar(ConexionDigital.etiquetaCategoria(noticia.categoria))}</span>
              <time datetime="${ConexionDigital.escapar(noticia.fecha)}">${ConexionDigital.formatearFecha(noticia.fecha)}</time>
            </div>
            <h2 class="card-title"><a href="${ConexionDigital.urlDetalle(noticia.id)}">${ConexionDigital.escapar(noticia.titulo)}</a></h2>
            <p>${ConexionDigital.escapar(noticia.resumen)}</p>
            <div class="saved-meta">
              <img class="mini-avatar" src="${foto}" alt="Retrato ilustrativo">
              <span>${ConexionDigital.escapar(noticia.autor)}</span>
              <span>${noticia.lecturaMinutos} min de lectura</span>
            </div>
            <div class="article-actions">
              <a class="btn btn-accent" href="${ConexionDigital.urlDetalle(noticia.id)}">Continuar leyendo</a>
              <button class="icon-action" type="button" data-remove-fav="${noticia.id}" title="Quitar de guardados" aria-label="Quitar de guardados">
                <i class="bi bi-bookmark-fill"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  pintar();
}

function validarContacto(formulario) {
  const campos = {
    nombre: { requerido: true, mensaje: "El nombre es obligatorio." },
    correo: { requerido: true, correo: true, mensaje: "Ingresa un correo electrónico válido." },
    asunto: { requerido: true, mensaje: "El asunto es obligatorio." },
    categoria: { requerido: true, mensaje: "Selecciona una categoría de consulta." },
    mensaje: { requerido: true, mensaje: "El mensaje es obligatorio." },
    privacidad: { check: true, mensaje: "Debes aceptar la política de privacidad de demostración." }
  };

  let valido = true;
  Object.entries(campos).forEach(([nombre, reglas]) => {
    const campo = formulario.elements[nombre];
    const error = formulario.querySelector(`[data-error="${nombre}"]`);
    let mensaje = "";
    const valor = campo.type === "checkbox" ? campo.checked : campo.value.trim();

    if (reglas.requerido && !valor) {
      mensaje = reglas.mensaje;
    } else if (reglas.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor))) {
      mensaje = reglas.mensaje;
    } else if (reglas.check && !campo.checked) {
      mensaje = reglas.mensaje;
    }

    if (error) {
      error.textContent = mensaje;
    }
    campo.classList.toggle("input-invalid", Boolean(mensaje));
    if (mensaje) {
      valido = false;
    }
  });
  return valido;
}

function iniciarContacto() {
  const formulario = document.querySelector("[data-contact-form]");
  const contador = document.querySelector("[data-char-count]");
  const area = document.querySelector("[data-count]");
  if (!formulario) {
    return;
  }
  const actualizarConteo = () => {
    if (contador && area) {
      contador.textContent = String(area.value.length);
    }
  };
  area?.addEventListener("input", actualizarConteo);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!validarContacto(formulario)) {
      mostrarAviso("Revisa los campos marcados.", "error");
      return;
    }
    formulario.reset();
    actualizarConteo();
    formulario.querySelectorAll(".input-invalid").forEach((campo) => campo.classList.remove("input-invalid"));
    formulario.querySelectorAll("[data-error]").forEach((nodo) => {
      nodo.textContent = "";
    });
    mostrarAviso("Mensaje registrado en esta demostración. No se envió a un servidor.", "success");
  });
}

async function iniciarAdmin() {
  const cuerpo = document.querySelector("[data-admin-body]");
  const grid = document.querySelector("[data-admin-grid]");
  const tabla = document.querySelector("[data-admin-table]");
  const vacio = document.querySelector("[data-empty]");
  const formulario = document.querySelector("[data-create-form]");
  const busqueda = document.querySelector("#admin-busqueda");
  const filtro = document.querySelector("#admin-categoria");
  const orden = document.querySelector("[data-admin-sort]");
  const estado = { pagina: 1, porPagina: 10, vista: "lista" };
  let idPendiente = "";
  let tituloPendiente = "";
  let ultimaEliminada = null;

  async function listaFiltrada() {
    const todas = await ConexionDigital.obtenerNoticias();
    return ordenarNoticias(ConexionDigital.filtrarNoticias(todas, {
      consulta: busqueda?.value || "",
      categoria: filtro?.value || ""
    }), orden?.value || "recientes");
  }

  async function pintarStats() {
    const todas = await ConexionDigital.obtenerNoticias();
    const cats = new Set(todas.map((noticia) => noticia.categoria));
    const stats = document.querySelector("[data-admin-stats]");
    if (!stats) {
      return;
    }
    stats.innerHTML = [
      ["Total", todas.length, "bi-file-text"],
      ["Categorías", cats.size, "bi-grid"],
      ["Publicadas", todas.length, "bi-check-circle"],
      ["Borradores", 0, "bi-journal"]
    ].map((item) => "<article class=\"stat-card\"><i class=\"bi " + item[2] + "\"></i><div><strong>" + item[1] + "</strong><span>" + item[0] + "</span></div></article>").join("");
  }

  async function pintar() {
    const noticias = await listaFiltrada();
    const totalPaginas = Math.max(1, Math.ceil(noticias.length / estado.porPagina));
    if (estado.pagina > totalPaginas) {
      estado.pagina = totalPaginas;
    }
    const inicio = (estado.pagina - 1) * estado.porPagina;
    const pagina = noticias.slice(inicio, inicio + estado.porPagina);
    const conteo = document.querySelector("[data-admin-count]");
    if (conteo) {
      conteo.textContent = noticias.length
        ? "Mostrando " + (noticias.length ? (inicio + 1) + "-" + (inicio + pagina.length) : 0) + " de " + noticias.length
        : "0 noticias";
    }
    await pintarStats();
    if (!noticias.length) {
      cuerpo.innerHTML = "";
      if (grid) {
        grid.innerHTML = "";
      }
      vacio.hidden = false;
    } else {
      vacio.hidden = true;
      cuerpo.innerHTML = pagina.map((noticia) => `
        <tr>
          <td>
            <div class="admin-news">
              <img src="${ConexionDigital.escapar(noticia.imagen)}" alt="${ConexionDigital.escapar(noticia.imagenAlt || noticia.titulo)}">
              <div>
                <strong>${ConexionDigital.escapar(noticia.titulo)}</strong>
                <p>${ConexionDigital.escapar(noticia.resumen)}</p>
              </div>
            </div>
          </td>
          <td><span class="${ConexionDigital.claseCategoria(noticia.categoria)}">${ConexionDigital.escapar(ConexionDigital.etiquetaCategoria(noticia.categoria))}</span></td>
          <td>${ConexionDigital.escapar(noticia.autor)}</td>
          <td><span class="status-dot">Publicada</span></td>
          <td><time datetime="${ConexionDigital.escapar(noticia.fecha)}">${ConexionDigital.formatearFecha(noticia.fecha)}</time></td>
          <td class="admin-actions">
            <a class="icon-action" href="${ConexionDigital.urlDetalle(noticia.id)}" aria-label="Ver noticia"><i class="bi bi-eye"></i></a>
            <button class="icon-action" type="button" data-bs-toggle="modal" data-bs-target="#modalEliminar" data-delete-id="${noticia.id}" data-delete-title="${ConexionDigital.escapar(noticia.titulo)}" aria-label="Eliminar"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join("");
      if (grid) {
        grid.innerHTML = pagina.map((noticia) => ConexionDigital.tarjetaArchivo(noticia, false)).join("");
      }
    }

    const paginacion = document.querySelector("[data-admin-pagination]");
    if (paginacion) {
      paginacion.hidden = noticias.length <= estado.porPagina;
      if (!paginacion.hidden) {
        const botones = ["<button class=\"page-btn\" type=\"button\" data-admin-page=\"" + (estado.pagina - 1) + "\" " + (estado.pagina === 1 ? "disabled" : "") + ">Anterior</button>"];
        for (let i = 1; i <= totalPaginas; i += 1) {
          botones.push("<button class=\"page-btn" + (i === estado.pagina ? " is-current" : "") + "\" type=\"button\" data-admin-page=\"" + i + "\">" + i + "</button>");
        }
        botones.push("<button class=\"page-btn\" type=\"button\" data-admin-page=\"" + (estado.pagina + 1) + "\" " + (estado.pagina === totalPaginas ? "disabled" : "") + ">Siguiente</button>");
        paginacion.innerHTML = botones.join("");
      }
    }
  }

  document.querySelector("[data-admin-filters]")?.addEventListener("input", () => {
    estado.pagina = 1;
    pintar();
  });
  document.querySelector("[data-admin-filters]")?.addEventListener("change", () => {
    estado.pagina = 1;
    pintar();
  });
  document.querySelector("[data-admin-clear]")?.addEventListener("click", () => {
    if (busqueda) {
      busqueda.value = "";
    }
    if (filtro) {
      filtro.value = "";
    }
    if (orden) {
      orden.value = "recientes";
    }
    estado.pagina = 1;
    pintar();
  });
  document.querySelectorAll("[data-admin-view]").forEach((boton) => {
    boton.addEventListener("click", () => {
      estado.vista = boton.dataset.adminView;
      document.querySelectorAll("[data-admin-view]").forEach((otro) => {
        otro.classList.toggle("is-current", otro === boton);
        otro.setAttribute("aria-pressed", String(otro === boton));
      });
      if (tabla) {
        tabla.hidden = estado.vista === "grid";
      }
      if (grid) {
        grid.hidden = estado.vista === "lista";
      }
    });
  });
  document.querySelector("[data-admin-pagination]")?.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-admin-page]");
    if (!boton || boton.disabled) {
      return;
    }
    estado.pagina = Number(boton.dataset.adminPage);
    pintar();
  });

  cuerpo?.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-delete-id]");
    if (!boton) {
      return;
    }
    idPendiente = boton.dataset.deleteId;
    tituloPendiente = boton.dataset.deleteTitle;
    const nombre = document.querySelector("[data-delete-name]");
    if (nombre) {
      nombre.textContent = tituloPendiente;
    }
  });

  document.querySelector("[data-confirm-delete]")?.addEventListener("click", async () => {
    if (!idPendiente) {
      return;
    }
    const todas = await ConexionDigital.obtenerNoticias();
    ultimaEliminada = todas.find((noticia) => noticia.id === idPendiente) || null;
    ConexionDigital.eliminarNoticia(idPendiente);
    idPendiente = "";
    await pintar();
    mostrarAviso("Noticia eliminada. Se ha eliminado correctamente.");
    const modal = window.bootstrap?.Modal.getInstance(document.getElementById("modalEliminar"));
    modal?.hide();
  });

  document.body.addEventListener("click", async (evento) => {
    if (!evento.target.closest("[data-undo-delete]") || !ultimaEliminada) {
      return;
    }
    ConexionDigital.restaurarNoticia(ultimaEliminada);
    ultimaEliminada = null;
    evento.target.closest(".toast-msg")?.remove();
    await pintar();
    mostrarAviso("La noticia se restauró en esta demostración.");
  });

  const campoFecha = formulario?.elements.fecha;
  if (campoFecha && !campoFecha.value) {
    campoFecha.value = new Date().toISOString().slice(0, 10);
  }

  formulario?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(formulario));
    if (!datos.titulo || !datos.categoria || !datos.autor || !datos.fecha || !datos.resumen || !datos.contenido) {
      mostrarAviso("Completa los campos obligatorios para crear la noticia.", "error");
      return;
    }
    const creada = ConexionDigital.crearNoticia(datos);
    formulario.reset();
    if (campoFecha) {
      campoFecha.value = new Date().toISOString().slice(0, 10);
    }
    await pintar();
    mostrarAviso("Se creó la noticia \"" + creada.titulo + "\".");
    const modal = window.bootstrap?.Modal.getInstance(document.getElementById("modalCrear"));
    modal?.hide();
  });

  await pintar();
}

document.addEventListener("DOMContentLoaded", async () => {
  marcarNavegacion();
  configurarMenu();
  fechaPortada();
  configurarBoletin();
  ConexionDigital.actualizarContadorFavoritos();
  document.querySelector("[data-login-demo]")?.addEventListener("click", () => {
    mostrarAviso("Inicio de sesi\u00f3n de demostraci\u00f3n. En esta fase no hay cuentas reales.");
  });

  const arranque = {
    inicio: iniciarInicio,
    noticias: iniciarListado,
    detalle: iniciarDetalle,
    favoritos: iniciarFavoritos,
    contacto: iniciarContacto,
    administrar: iniciarAdmin
  };

  await arranque[paginaActual]?.();
});
