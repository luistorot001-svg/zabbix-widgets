/* Panel de teléfonos Grandstream · lógica del panel (módulo Zabbix 7.0). Solo lectura. */
(function () {
  // Los datos vienen de la acción gs.panel.data del módulo (API interna, permisos del usuario que mira).
  var DATOS = "zabbix.php?action=gs.panel.data";
  var OPC_REFRESCO = [30, 60, 180, 300, 600];     // opciones del menú "Actualizar cada"
  var REFRESCO_S = 60;                            // por defecto; cada navegador recuerda su elección
  try { var rg = Number(localStorage.getItem("gs_panel_refresco")); if (OPC_REFRESCO.indexOf(rg) >= 0) REFRESCO_S = rg; } catch (e) {}
  var VIEJA_S = 180;                              // lectura más vieja que esto = "Vieja"

  var SEV = ["Sin clasificar", "Información", "Aviso", "Media", "Alta", "Desastre"];
  var SEV_TONO = ["neutro", "neutro", "aviso", "aviso", "critico", "critico"];
  var COLS = {
    modelo: { sel: "f-modelo", base: null },
    disp: { sel: "f-disp", base: ["Sí", "No", "Sin dato"] },
    dnd: { sel: "f-dnd", base: ["Activo", "No", "Sin dato"] },
    reg: { sel: "f-reg", base: ["Sí", "No", "Sin cuenta", "Sin dato"] },
    var: { sel: "f-var", base: null }
  };

  // Columna variable (1.2.0): el encabezado elige qué dato del template se muestra.
  // Cada opción devuelve [texto de la celda, tono, grupo para el filtro].
  function ms(v) { return Number(v) * 1000; }
  function txt(key) { return function (x) { var v = valor(x.p, key); return v === null || v === "" ? ["—", "neutro", "Sin dato"] : [v, "neutro", v]; }; }
  var VARS = [
    { id: "prob", nombre: "Problemas", f: function (x) {
        return x.peor < 0 ? ["Ninguno", "ok", "Ninguno"] : [x.p.problemas.length + " · " + SEV[x.peor], SEV_TONO[x.peor], SEV[x.peor]]; },
      orden: ["Ninguno", "Desastre", "Alta", "Media", "Aviso", "Información", "Sin clasificar"] },
    { id: "rtt", nombre: "Latencia", f: function (x) {
        var v = valor(x.p, "icmppingsec[,10,,,,avg]"); if (v === null) return ["—", "neutro", "Sin dato"];
        var m = ms(v); return [m.toFixed(1) + " ms", m > 150 ? "critico" : m > 50 ? "aviso" : "ok", m > 150 ? "Más de 150 ms" : m > 50 ? "50 a 150 ms" : "Menos de 50 ms"]; },
      orden: ["Menos de 50 ms", "50 a 150 ms", "Más de 150 ms", "Sin dato"] },
    { id: "loss", nombre: "Pérdida", f: function (x) {
        var v = valor(x.p, "icmppingloss[,10]"); if (v === null) return ["—", "neutro", "Sin dato"];
        var n = Number(v); return [n.toFixed(0) + " %", n >= 20 ? "critico" : n > 0 ? "aviso" : "ok", n >= 20 ? "20 % o más" : n > 0 ? "1 a 19 %" : "0 %"]; },
      orden: ["0 %", "1 a 19 %", "20 % o más", "Sin dato"] },
    { id: "uptime", nombre: "Encendido", f: function (x) {
        var v = valor(x.p, "gs.snmp.uptime"); if (v === null) return ["—", "neutro", "Sin dato"];
        var n = Number(v); return [duracion(n), n < 600 ? "aviso" : "ok", n < 600 ? "Menos de 10 min" : n < 86400 ? "Menos de 1 día" : "1 día o más"]; },
      orden: ["Menos de 10 min", "Menos de 1 día", "1 día o más", "Sin dato"] },
    { id: "ip", nombre: "IP", texto: "Ej. 192.168.1.", f: function (x) { return x.p.ip ? [x.p.ip, "neutro", x.p.ip] : ["—", "neutro", "Sin dato"]; } },
    { id: "fw", nombre: "Firmware", f: txt("gs.inv.firmware") },
    { id: "sip", nombre: "Servidor SIP", f: function (x) {
        var s = x.cuentas.map(function (c) { return c.servidor; }).filter(Boolean);
        return s.length ? [s[0] + (s.length > 1 && s.some(function (v) { return v !== s[0]; }) ? " +" : ""), "neutro", s[0]] : ["—", "neutro", "Sin dato"]; } },
    { id: "ext", nombre: "Extensiones", f: txt("gs.accounts.extensions") },
    { id: "mac", nombre: "MAC", f: function (x) { var v = mac(x.p); return v ? [v, "neutro", v] : ["—", "neutro", "Sin dato"]; } },
    { id: "parte", nombre: "N.º de parte", f: txt("gs.inv.partnumber") },
    { id: "api", nombre: "API web", f: function (x) {
        var v = valor(x.p, "gs.cti.response"); if (v === null) return ["—", "neutro", "Sin dato"];
        return v === "success" ? ["Responde", "ok", "Responde"] : [String(v).split(":")[0], "critico", "Con error"]; },
      orden: ["Responde", "Con error", "Sin dato"] }
  ];
  var VAR = VARS[0];
  try { var gv = localStorage.getItem("gs_panel_columna"); VARS.forEach(function (o) { if (o.id === gv) VAR = o; }); } catch (e) {}
  var GRUPO = "";
  try { GRUPO = localStorage.getItem("gs_panel_grupo") || ""; } catch (e) {}
  var VISTA = "lista";
  try { if (localStorage.getItem("gs_panel_vista") === "cuadricula") VISTA = "cuadricula"; } catch (e) {}
  // Filtros: ext y texto son cajas de búsqueda; rapido lo ponen las tarjetas de resumen (2.1.0)
  var VACIO = { ext: "", texto: "", modelo: "", disp: "", dnd: "", reg: "", var: "", rapido: "" };
  var filtro = Object.assign({}, VACIO);
  var filas = {}, timer = null, ultima = 0, abiertos = {};

  function $(id) { return document.getElementById(id); }
  function pon(n, v) { var s = (v === undefined || v === null || v === "") ? "—" : String(v); if (n.textContent !== s) n.textContent = s; }
  function pildora(n, texto, t) { if (n.textContent !== texto) n.textContent = texto; if (n.getAttribute("data-tono") !== t) n.setAttribute("data-tono", t); }
  function plano(s) { s = String(s || "").toLowerCase(); try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {} return s; }
  function aviso(m) { var a = $("aviso"); if (m) { a.textContent = m; a.hidden = false; } else { a.hidden = true; } }
  function hace(seg) {
    seg = Math.max(0, Math.round(seg));
    if (seg < 60) return "hace " + seg + " s";
    if (seg < 3600) return "hace " + Math.round(seg / 60) + " min";
    if (seg < 86400) return "hace " + Math.round(seg / 3600) + " h";
    return "hace " + Math.round(seg / 86400) + " d";
  }
  function duracion(seg) {
    seg = Math.round(Number(seg) || 0);
    var d = Math.floor(seg / 86400), h = Math.floor(seg % 86400 / 3600), m = Math.floor(seg % 3600 / 60);
    return d ? d + " d " + h + " h" : h ? h + " h " + m + " min" : m + " min";
  }
  function fecha(ts) { try { return new Date(ts * 1000).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return String(ts); } }

  // ---------- Datos ----------
  function leerZabbix() {
    return fetch(DATOS, { credentials: "same-origin", headers: { "Accept": "application/json" }, cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw { msg: "HTTP " + r.status };
        var tipo = r.headers.get("Content-Type") || "";
        if (tipo.indexOf("json") < 0) throw { sesion: true, msg: "la sesión de Zabbix terminó o el módulo no tiene permiso" };
        return r.json();
      })
      .then(function (d) { if (d.error) throw { msg: d.error }; return d; });
  }

  // ---------- De Zabbix a una fila por teléfono ----------
  function armar(datos) {
    var porHost = {};
    datos.hosts.forEach(function (h) {
      var ip = "";
      (h.interfaces || []).forEach(function (i) { if (!ip || String(i.main) === "1") ip = String(i.useip) === "0" ? i.dns : i.ip; });
      porHost[h.hostid] = { id: h.hostid, nombre: h.name, ip: ip, mant: String(h.maintenance_status) === "1", grupos: (h.hostgroups || h.groups || []).map(function (g) { return g.name; }), it: {}, cuentas: {}, problemas: [] };
    });
    datos.items.forEach(function (it) {
      var p = porHost[it.hostid]; if (!p) return;
      var m = /^gs\.account\.(reg|server)\[(\d+)\]$/.exec(it.key_);
      if (m) {
        var c = p.cuentas[m[2]] || (p.cuentas[m[2]] = { n: Number(m[2]), sip: "", nombre: "", servidor: "", reg: null });
        if (m[1] === "reg") {
          var s = /\(([^)]*)\)/.exec(it.name); if (s) c.sip = s[1];
          var nm = /nombre (.*?)\.?\s*$/.exec(it.description || ""); if (nm && nm[1] && nm[1].indexOf("{#") < 0) c.nombre = nm[1];
          c.reg = Number(it.lastclock) > 0 ? Number(it.lastvalue) : null;
          c.clock = Number(it.lastclock);
        } else { c.servidor = it.lastvalue; }
        return;
      }
      p.it[it.key_] = { v: it.lastvalue, c: Number(it.lastclock) };
    });
    datos.trig.forEach(function (t) {
      (t.hosts || []).forEach(function (h) { var p = porHost[h.hostid]; if (p) p.problemas.push({ nombre: t.description, sev: Number(t.priority), desde: Number(t.lastchange) }); });
    });
    return Object.keys(porHost).map(function (k) { return estado(porHost[k], datos.ahora); });
  }

  function valor(p, key) { var x = p.it[key]; return (x && x.c > 0) ? x.v : null; }
  // Los GXV dejan sysName vacío: modelo y MAC caen al dato de la consulta web (gs.web.*).
  function modelo(p) { return valor(p, "gs.inv.model") || valor(p, "gs.web.model"); }
  function mac(p) { return valor(p, "gs.inv.mac") || valor(p, "gs.web.mac"); }

  function estado(p, ahora) {
    var cuentas = Object.keys(p.cuentas).map(function (k) { return p.cuentas[k]; }).filter(function (c) { return c.sip; }).sort(function (a, b) { return a.n - b.n; });
    var ping = valor(p, "icmpping[,3]"), dnd = valor(p, "gs.phone.dnd");
    var x = { id: p.id, p: p, cuentas: cuentas, v: {} };
    x.v.disp = ping === null ? "Sin dato" : Number(ping) === 1 ? "Sí" : "No";
    x.v.dnd = dnd === null ? "Sin dato" : Number(dnd) === 1 ? "Activo" : "No";
    var conDato = cuentas.filter(function (c) { return c.reg !== null; });
    var sinReg = conDato.filter(function (c) { return c.reg !== 1; });
    x.sinReg = sinReg;
    x.v.reg = !cuentas.length ? "Sin cuenta" : !conDato.length ? "Sin dato" : sinReg.length ? "No" : "Sí";
    p.problemas.sort(function (a, b) { return b.sev - a.sev || b.desde - a.desde; });
    x.peor = p.problemas.length ? p.problemas[0].sev : -1;
    var reloj = 0; ["icmpping[,3]", "gs.snmp.uptime"].forEach(function (k) { var i = p.it[k]; if (i && i.c > reloj) reloj = i.c; });
    x.reloj = reloj; x.edad = reloj ? ahora - reloj : null;
    x.v.lect = p.mant ? "En mantenimiento" : !reloj ? "Sin dato" : x.edad > VIEJA_S ? "Vieja" : "En vivo";
    x.v.modelo = modelo(p) || "Sin dato";
    // gravedad para ordenar: caído, luego peor problema, luego sin registro
    x.rango = (x.v.disp === "No" ? 100 : 0) + (x.peor + 1) * 10 + (x.v.reg === "No" ? 5 : 0);
    x.ext = cuentas.length ? cuentas[0].sip : "";
    x.busca = plano([p.nombre, p.ip].concat(cuentas.map(function (c) { return c.nombre; })).join(" "));
    x.exts = cuentas.map(function (c) { return String(c.sip); });
    // Color de la casilla en la cuadrícula
    x.tono = p.mant || x.v.disp === "Sin dato" ? "neutro" : x.v.disp === "No" ? "critico" : (x.v.reg === "No" || x.peor >= 2) ? "aviso" : x.v.reg === "Sí" ? "ok" : "neutro";
    return x;
  }

  // ---------- Pintar ----------
  function refs(nodo) { var r = {}; Array.prototype.forEach.call(nodo.querySelectorAll("[data-r]"), function (n) { r[n.getAttribute("data-r")] = n; }); return r; }

  function nuevaFila(id) {
    var nodo = $("tpl-fila").content.firstElementChild.cloneNode(true);
    var f = { id: id, nodo: nodo, r: refs(nodo), cab: nodo.querySelector(".fila-cab"), det: nodo.querySelector(".detalle") };
    f.cab.addEventListener("click", function () {
      var abrir = f.cab.getAttribute("aria-expanded") !== "true";
      f.cab.setAttribute("aria-expanded", abrir ? "true" : "false");
      f.det.hidden = !abrir;
      if (abrir) abiertos[id] = 1; else delete abiertos[id];
    });
    if (abiertos[id]) { f.cab.setAttribute("aria-expanded", "true"); f.det.hidden = false; }
    return f;
  }

  function lista(ul, elementos, vacio) {
    ul.textContent = "";
    if (!elementos.length) { var v = document.createElement("li"); v.className = "vacio"; v.textContent = vacio; ul.appendChild(v); return; }
    elementos.forEach(function (li) { ul.appendChild(li); });
  }
  function el(tag, cls, texto) { var n = document.createElement(tag); if (cls) n.className = cls; if (texto !== undefined) n.textContent = texto; return n; }
  function pil(texto, tono) { var n = el("span", "pildora"); pildora(n, texto, tono); return n; }

  function pintarFila(f, x) {
    var r = f.r, p = x.p;
    pon(r.ext, x.ext || "—");
    if (r.ext.title !== x.exts.join(", ")) r.ext.title = x.exts.join(", ");
    pon(r.nombre, p.nombre);
    r.mas.hidden = x.cuentas.length < 2; pon(r.mas, "+" + (x.cuentas.length - 1));
    pon(r["c-modelo"], x.v.modelo === "Sin dato" ? "" : x.v.modelo);
    pildora(r["c-disp"], x.v.disp, x.v.disp === "Sí" ? "ok" : x.v.disp === "No" ? "critico" : "neutro");
    pildora(r["c-dnd"], x.v.dnd, x.v.dnd === "Activo" ? "aviso" : x.v.dnd === "No" ? "ok" : "neutro");
    var regTxt = x.v.reg === "No" ? "No · " + x.sinReg.length + " de " + x.cuentas.length : x.v.reg;
    pildora(r["c-reg"], regTxt, x.v.reg === "Sí" ? "ok" : x.v.reg === "No" ? "critico" : "neutro");
    pildora(r["c-var"], x.var[0], x.var[1]);
    pon(r["rot-var"], VAR.nombre);
    // Sin columna Lectura (1.1.0): solo se marca junto al nombre lo que no es normal
    var marca = p.mant ? "En mantenimiento" : x.v.lect === "Vieja" ? "Última lectura " + hace(x.edad) : x.v.lect === "Sin dato" ? "Sin lecturas" : "";
    r.marca.hidden = !marca; pon(r.marca, marca);
    var lect = marca || "En vivo";
    f.nodo.classList.toggle("vieja", x.v.lect === "Vieja" || x.v.disp === "No");
    f.nodo.classList.toggle("pausada", p.mant);
    f.cab.setAttribute("aria-label", (x.ext ? "Extensión " + x.ext + ", " : "") + p.nombre + ". Disponible: " + x.v.disp + ". DND: " + x.v.dnd + ". Registrado: " + regTxt + ". " + VAR.nombre + ": " + x.var[0] + ". Lectura: " + lect);

    lista(r.cuentas, x.cuentas.map(function (c) {
      var li = el("li");
      li.appendChild(el("span", "cta-ext", c.sip));
      var q = el("span", "cta-quien", c.nombre || "Cuenta " + c.n);
      q.appendChild(el("small", "", c.servidor || "servidor SIP sin dato"));
      li.appendChild(q);
      li.appendChild(c.reg === null ? pil("Sin dato", "neutro") : c.reg === 1 ? pil("Registrada", "ok") : pil("No registrada", "critico"));
      return li;
    }), "Este teléfono no tiene cuentas SIP descubiertas.");

    lista(r.problemas, p.problemas.map(function (pr) {
      var li = el("li");
      li.appendChild(pil(SEV[pr.sev], SEV_TONO[pr.sev]));
      li.appendChild(el("span", "cta-quien", pr.nombre));
      li.appendChild(el("span", "prob-hora", "desde " + fecha(pr.desde)));
      return li;
    }), "Sin problemas activos.");

    var rtt = valor(p, "icmppingsec[,10,,,,avg]"), loss = valor(p, "icmppingloss[,10]"), up = valor(p, "gs.snmp.uptime");
    pon(r["d-ping"], x.v.disp === "Sí" ? "Responde" : x.v.disp === "No" ? "No responde" : "Sin dato");
    pon(r["d-rtt"], rtt === null ? "" : (Number(rtt) * 1000).toFixed(1) + " ms");
    pon(r["d-loss"], loss === null ? "" : Number(loss).toFixed(0) + " %");
    pon(r["d-uptime"], up === null ? "" : duracion(up));
    pon(r["d-lectura"], p.mant ? "En mantenimiento en Zabbix" : x.reloj ? fecha(x.reloj) + " (" + hace(x.edad) + ")" : "Sin lecturas");
    pon(r["d-modelo"], modelo(p));
    pon(r["d-firmware"], valor(p, "gs.inv.firmware"));
    pon(r["d-mac"], mac(p));
    pon(r["d-ip"], p.ip);
    pon(r["d-parte"], valor(p, "gs.inv.partnumber"));
  }

  function enGrupo(x) { return !GRUPO || x.p.grupos.indexOf(GRUPO) >= 0; }
  function pasa(x) {
    if (!enGrupo(x)) return false;
    if (filtro.ext) { var e = filtro.ext.trim(); if (e && !x.exts.some(function (s) { return s.indexOf(e) >= 0; })) return false; }
    if (filtro.texto && x.busca.indexOf(plano(filtro.texto)) < 0) return false;
    for (var k in COLS) {
      if (!filtro[k]) continue;
      if (k === "var" && VAR.texto) { if (String(x.var[2]).indexOf(filtro.var.trim()) !== 0) return false; }
      else if (x.v[k] !== filtro[k]) return false;
    }
    if (filtro.rapido && !RAPIDO[filtro.rapido](x)) return false;
    return true;
  }

  // Tarjetas de resumen (2.1.0): qué cuenta cada una y, al hacer clic, qué filtra
  var RAPIDO = {
    todos: function () { return true; },
    disp: function (x) { return x.v.disp === "Sí"; },
    caidos: function (x) { return x.v.disp === "No"; },
    noreg: function (x) { return x.v.reg === "No"; },
    dnd: function (x) { return x.v.dnd === "Activo"; },
    prob: function (x) { return x.peor >= 0; },
    mant: function (x) { return x.p.mant; }
  };
  var tarjetas = Array.prototype.slice.call(document.querySelectorAll("#tarjetas .tarjeta"));

  function pintarTarjetas(docs) {
    tarjetas.forEach(function (b) {
      var t = b.getAttribute("data-t"), n = docs.filter(RAPIDO[t]).length;
      pon(b.querySelector("[data-n]"), docs.length ? n : "—");
      if (t !== "todos" && t !== "disp") { if (n) b.removeAttribute("data-cero"); else b.setAttribute("data-cero", ""); }
      if (t === "mant") b.hidden = !n && filtro.rapido !== "mant";
      b.setAttribute("aria-pressed", (t === "todos" ? !hayFiltro() : filtro.rapido === t) ? "true" : "false");
    });
  }

  function hayFiltro() { return Object.keys(VACIO).some(function (k) { return filtro[k]; }); }

  // Cuadrícula (2.1.0): una casilla por teléfono con su extensión, ordenada por extensión
  var casillas = {};
  function pintarCuadricula(docs) {
    var ul = $("cuadricula"), vistos = {};
    docs.slice().sort(function (a, b) { return String(a.ext || "~" + a.p.nombre).localeCompare(String(b.ext || "~" + b.p.nombre), "es", { numeric: true }); })
      .forEach(function (x) {
        vistos[x.id] = 1;
        var c = casillas[x.id];
        if (!c) {
          c = casillas[x.id] = { li: el("li"), b: el("button", "casilla") };
          c.b.type = "button";
          c.li.appendChild(c.b);
          c.b.addEventListener("click", function () { irAFila(x.id); });
        }
        var t = x.ext || x.p.nombre;
        pon(c.b, t);
        c.b.classList.toggle("largo", String(t).length > 6);
        if (c.b.getAttribute("data-tono") !== x.tono) c.b.setAttribute("data-tono", x.tono);
        var estado = x.p.mant ? "En mantenimiento" : x.v.disp === "No" ? "Sin respuesta" : x.v.disp === "Sin dato" ? "Sin dato" :
          x.v.reg === "No" ? "Sin registro SIP" : x.peor >= 2 ? "Con problema: " + SEV[x.peor] : "Disponible";
        var tip = (x.exts.length ? x.exts.join(", ") + " · " : "") + x.p.nombre + " · " + estado;
        if (c.b.title !== tip) { c.b.title = tip; c.b.setAttribute("aria-label", tip); }
        c.li.hidden = !pasa(x);
        ul.appendChild(c.li);
      });
    Object.keys(casillas).forEach(function (id) { if (!vistos[id]) { casillas[id].li.remove(); delete casillas[id]; } });
  }

  // Clic en una casilla: pasa a la lista con ese teléfono abierto
  function irAFila(id) {
    abiertos[id] = 1;
    var f = filas[id];
    if (f) { f.cab.setAttribute("aria-expanded", "true"); f.det.hidden = false; }
    ponerVista("lista");
    if (f && f.nodo.hidden) { filtro = Object.assign({}, VACIO); limpiarCajas(); pintarTodo(ultimos); }
    if (f) { f.nodo.scrollIntoView({ block: "center" }); f.cab.focus({ preventScroll: true }); }
  }

  function ponerVista(v) {
    VISTA = v;
    try { localStorage.setItem("gs_panel_vista", v); } catch (e) {}
    $("vista-lista").hidden = v !== "lista";
    $("vista-cuadricula").hidden = v !== "cuadricula";
    Array.prototype.forEach.call(document.querySelectorAll(".gsp .vista-btn"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-vista") === v ? "true" : "false"); });
    pintarTodo(ultimos);
  }

  function limpiarCajas() { $("f-ext").value = ""; $("f-buscar").value = ""; $("f-vartxt").value = ""; }

  var ultimos = [];
  function pintarTodo(docs) {
    ultimos = docs;
    docs.forEach(function (x) { x.var = VAR.f(x); x.v.var = x.var[2]; });
    actualizarGrupos(docs);
    docs.sort(function (a, b) { return b.rango - a.rango || String(a.ext).localeCompare(String(b.ext), "es", { numeric: true }) || a.p.nombre.localeCompare(b.p.nombre, "es"); });
    var ul = $("lista"), vistos = {}, visibles = 0;
    docs.forEach(function (x) {
      vistos[x.id] = 1;
      var f = filas[x.id] || (filas[x.id] = nuevaFila(x.id));
      pintarFila(f, x);
      var ok = pasa(x); f.nodo.hidden = !ok; if (ok) visibles++;
      ul.appendChild(f.nodo);
    });
    Object.keys(filas).forEach(function (id) { if (!vistos[id]) { filas[id].nodo.remove(); delete filas[id]; } });
    if (VISTA === "cuadricula") pintarCuadricula(docs);
    $("vacio").hidden = visibles > 0 || !docs.length;
    var hay = hayFiltro();
    $("limpiar").hidden = !hay;
    var enG = docs.filter(enGrupo);
    pon($("cuenta"), hay ? visibles + " de " + enG.length + " teléfonos" : enG.length + (enG.length === 1 ? " teléfono" : " teléfonos"));
    pintarTarjetas(enG);
    actualizarOpciones();
  }

  // Filtro por grupo (1.2.0): solo aparece si el usuario ve teléfonos de más de un grupo
  function actualizarGrupos(docs) {
    var cuenta = {};
    docs.forEach(function (x) { x.p.grupos.forEach(function (g) { cuenta[g] = (cuenta[g] || 0) + 1; }); });
    var nombres = Object.keys(cuenta).sort(function (a, b) { return a.localeCompare(b, "es", { numeric: true }); });
    if (GRUPO && !cuenta[GRUPO]) GRUPO = "";
    $("caja-grupo").hidden = nombres.length < 2;
    var s = $("f-grupo"), ops = [["", "Todos (" + docs.length + ")"]].concat(nombres.map(function (g) { return [g, g + " (" + cuenta[g] + ")"]; }));
    var firma = ops.map(function (o) { return o[1]; }).join("|");
    if (s.getAttribute("data-firma") !== firma) {
      s.textContent = "";
      ops.forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; s.appendChild(op); });
      s.setAttribute("data-firma", firma);
    }
    s.value = GRUPO;
    s.classList.toggle("activo", !!GRUPO);
  }

  function actualizarOpciones() {
    Object.keys(COLS).forEach(function (k) {
      var col = COLS[k], s = $(col.sel), cuenta = {};
      ultimos.filter(enGrupo).forEach(function (x) { cuenta[x.v[k]] = (cuenta[x.v[k]] || 0) + 1; });
      var base = (k === "var" ? VAR.orden : col.base) || Object.keys(cuenta).sort(function (a, b) { return a === "Sin dato" ? 1 : b === "Sin dato" ? -1 : a.localeCompare(b, "es", { numeric: true }); });
      var ops = [["", "Todos"]].concat(base.filter(function (v) { return cuenta[v] || filtro[k] === v; }).map(function (v) { return [v, v + " (" + (cuenta[v] || 0) + ")"]; }));
      var firma = ops.map(function (o) { return o[1]; }).join("|");
      if (s.getAttribute("data-firma") !== firma) {
        s.textContent = "";
        ops.forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; s.appendChild(op); });
        s.setAttribute("data-firma", firma);
      }
      s.value = filtro[k];
      s.classList.toggle("activo", !!filtro[k]);
    });
    $("f-ext").classList.toggle("activo", !!filtro.ext);
    $("f-buscar").classList.toggle("activo", !!filtro.texto);
    // Columna variable de texto (IP): caja de búsqueda en lugar de menú
    $("f-var").hidden = !!VAR.texto;
    $("f-vartxt").hidden = !VAR.texto;
    if (VAR.texto) { $("f-vartxt").placeholder = VAR.texto; $("f-vartxt").classList.toggle("activo", !!filtro.var); }
  }

  Object.keys(COLS).forEach(function (k) {
    $(COLS[k].sel).addEventListener("change", function (e) { filtro[k] = e.target.value; pintarTodo(ultimos); });
  });
  $("f-ext").addEventListener("input", function (e) { filtro.ext = e.target.value; pintarTodo(ultimos); });
  $("f-buscar").addEventListener("input", function (e) { filtro.texto = e.target.value; pintarTodo(ultimos); });
  $("f-vartxt").addEventListener("input", function (e) { filtro.var = e.target.value; pintarTodo(ultimos); });
  $("limpiar").addEventListener("click", function () { filtro = Object.assign({}, VACIO); limpiarCajas(); pintarTodo(ultimos); });
  tarjetas.forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-t");
      if (t === "todos") { filtro = Object.assign({}, VACIO); limpiarCajas(); }
      else filtro.rapido = filtro.rapido === t ? "" : t;
      pintarTodo(ultimos);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".gsp .vista-btn"), function (b) {
    b.addEventListener("click", function () { ponerVista(b.getAttribute("data-vista")); });
  });
  VARS.forEach(function (o) { var op = document.createElement("option"); op.value = o.id; op.textContent = o.nombre; $("f-varcol").appendChild(op); });
  $("f-varcol").value = VAR.id;
  $("f-varcol").addEventListener("change", function (e) {
    VARS.forEach(function (o) { if (o.id === e.target.value) VAR = o; });
    filtro.var = "";
    $("f-vartxt").value = "";
    try { localStorage.setItem("gs_panel_columna", VAR.id); } catch (er) {}
    pintarTodo(ultimos);
  });
  $("f-grupo").addEventListener("change", function (e) {
    GRUPO = e.target.value;
    try { localStorage.setItem("gs_panel_grupo", GRUPO); } catch (er) {}
    pintarTodo(ultimos);
  });
  $("f-refresco").value = String(REFRESCO_S);
  $("f-refresco").addEventListener("change", function (e) {
    REFRESCO_S = Number(e.target.value);
    try { localStorage.setItem("gs_panel_refresco", String(REFRESCO_S)); } catch (er) {}
    ciclo();
  });

  // ---------- Ciclo ----------
  function puente(texto, tono, nota) { pildora($("puente-estado"), texto, tono); if (nota) pon($("puente-nota"), nota); }

  function ciclo() {
    clearTimeout(timer);
    leerZabbix().then(function (datos) {
      ultima = datos.ahora;
      aviso(null);
      pintarTodo(armar(datos));
      puente("En vivo", "ok", "Datos de Zabbix. Última lectura: " + fecha(ultima));
    }).catch(function (e) {
      puente("Sin conexión", "critico");
      aviso("No se pudo leer Zabbix: " + (e && e.msg ? e.msg : e) + (e && e.sesion ? ". Recarga la página para volver a entrar." : ". Se reintenta en un minuto; lo que ves es la última lectura."));
    }).then(function () { timer = setTimeout(ciclo, REFRESCO_S * 1000); });
  }

  puente("Leyendo", "neutro", "Abriendo las últimas lecturas…");
  ponerVista(VISTA);
  ciclo();
})();
