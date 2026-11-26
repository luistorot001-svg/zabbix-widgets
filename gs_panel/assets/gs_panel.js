/* Panel de teléfonos Grandstream · lógica del panel (módulo Zabbix 7.0). Solo lectura. */
(function () {
  // ---------- Idioma (2.2.0) ----------
  // Zabbix 7.0 pone el idioma del usuario en <html lang="..."> (CWebUser::getLang(): "es", "en", "fr"...).
  // El panel está escrito en español; para cualquier otro idioma usa inglés.
  var ES = String(document.documentElement.lang || "en").slice(0, 2).toLowerCase() === "es";
  var LOCALE = ES ? "es-MX" : (document.documentElement.lang || "en");
  var EN = {
    // Página
    "Leyendo": "Loading", "Grupo": "Group", "Actualizar cada": "Refresh every", "Datos de Zabbix.": "Zabbix data.",
    "Resumen de teléfonos": "Phone summary", "Teléfonos": "Phones", "Disponibles": "Available", "Sin respuesta": "Not responding",
    "Sin registro": "Not registered", "Con DND": "DND on", "Con problemas": "With problems", "En mantenimiento": "In maintenance",
    "Limpiar filtros": "Clear filters", "Vista": "View", "Lista": "List", "Cuadrícula": "Grid", "Filtros de la lista": "List filters",
    "Extensión": "Extension", "Ej. 10": "e.g. 10", "Teléfono": "Phone", "Nombre": "Name", "Modelo": "Model", "Disponible": "Available",
    "Registrado": "Registered", "Dato que muestra esta columna": "Data shown in this column", "Filtro de la columna": "Column filter",
    "Qué significa cada color": "What each color means", "Disponible y registrado": "Available and registered",
    "Responde, con problema o sin registro": "Responding, with a problem or not registered", "Sin dato o en mantenimiento": "No data or in maintenance",
    "Ningún teléfono cumple estos filtros.": "No phones match these filters.", "Problemas": "Problems",
    "Cuentas SIP de este teléfono": "SIP accounts on this phone", "Problemas activos": "Active problems", "Red": "Network",
    "Latencia": "Latency", "Pérdida": "Loss", "Lectura": "Last reading", "Equipo": "Device", "N.º de parte": "Part number",
    // Severidades: los mismos nombres que usa Zabbix en inglés
    "Sin clasificar": "Not classified", "Información": "Information", "Aviso": "Warning", "Media": "Average", "Alta": "High", "Desastre": "Disaster",
    // Valores
    "Sí": "Yes", "Sin dato": "No data", "Activo": "On", "Sin cuenta": "No account", "Ninguno": "None",
    "Más de 150 ms": "Over 150 ms", "50 a 150 ms": "50 to 150 ms", "Menos de 50 ms": "Under 50 ms",
    "20 % o más": "20 % or more", "1 a 19 %": "1 to 19 %", "Ej. 192.168.1.": "e.g. 192.168.1.",
    "Servidor SIP": "SIP server", "Extensiones": "Extensions", "API web": "Web API", "Responde": "Responding", "Con error": "Error",
    "En vivo": "Live", "Sin lecturas": "No readings", "Registrada": "Registered", "No registrada": "Not registered",
    "servidor SIP sin dato": "SIP server unknown", "Este teléfono no tiene cuentas SIP descubiertas.": "No SIP accounts discovered on this phone.",
    "Sin problemas activos.": "No active problems.", "No responde": "Not responding", "En mantenimiento en Zabbix": "In maintenance in Zabbix",
    "Sin registro SIP": "SIP not registered", "Todos": "All", "Sin conexión": "Offline", "Abriendo las últimas lecturas…": "Loading the latest readings…",
    "la sesión de Zabbix terminó o el módulo no tiene permiso": "the Zabbix session ended or the module has no permission",
    // Frases con datos ({n}, {a}...)
    "hace {n} s": "{n} s ago", "hace {n} min": "{n} min ago", "hace {n} h": "{n} h ago", "hace {n} d": "{n} d ago",
    "Última lectura {h}": "Last reading {h}", "{a} de {b}": "{a} of {b}", "Cuenta {n}": "Account {n}", "desde {f}": "since {f}",
    "Con problema: {s}": "Problem: {s}", "{a} de {b} teléfonos": "{a} of {b} phones", "{n} teléfono": "{n} phone", "{n} teléfonos": "{n} phones",
    "Todos ({n})": "All ({n})", "Datos de Zabbix. Última lectura: {f}": "Zabbix data. Last reading: {f}",
    "No se pudo leer Zabbix: {e}. Recarga la página para volver a entrar.": "Could not read Zabbix: {e}. Reload the page to sign in again.",
    "No se pudo leer Zabbix: {e}. Se reintenta en un minuto; lo que ves es la última lectura.": "Could not read Zabbix: {e}. Retrying in a minute; you are seeing the last reading.",
    "Extensión {e}, ": "Extension {e}, "
  };
  function t(s) { return !ES && s !== null && s !== undefined && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s; }
  function tf(s, d) { return t(s).replace(/\{(\w+)\}/g, function (m, k) { return d[k]; }); }
  // Traduce el HTML fijo de la página (textos, placeholder, aria-label y title)
  function traducirDom(raiz) {
    if (ES || !raiz) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var v = n.nodeValue.trim(); if (v && EN[v]) n.nodeValue = n.nodeValue.replace(v, EN[v]); }
    Array.prototype.forEach.call(raiz.querySelectorAll("[placeholder],[aria-label],[title]"), function (e) {
      ["placeholder", "aria-label", "title"].forEach(function (a) { var v = e.getAttribute(a); if (v && EN[v]) e.setAttribute(a, EN[v]); });
    });
  }
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
        return x.peor < 0 ? ["Ninguno", "ok", "Ninguno"] : [x.p.problemas.length + " · " + t(SEV[x.peor]), SEV_TONO[x.peor], SEV[x.peor]]; },
      orden: ["Ninguno", "Desastre", "Alta", "Media", "Aviso", "Información", "Sin clasificar"] },
    { id: "rtt", nombre: "Latencia", f: function (x) {
        var v = valor(x.p, "icmppingsec[,10,,,,avg]"); if (v === null) return ["—", "neutro", "Sin dato"];
        var m = ms(v); return [m.toFixed(1) + " ms", m > 150 ? "critico" : m > 50 ? "aviso" : "ok", m > 150 ? "Más de 150 ms" : m > 50 ? "50 a 150 ms" : "Menos de 50 ms"]; },
      orden: ["Menos de 50 ms", "50 a 150 ms", "Más de 150 ms", "Sin dato"] },
    { id: "loss", nombre: "Pérdida", f: function (x) {
        var v = valor(x.p, "icmppingloss[,10]"); if (v === null) return ["—", "neutro", "Sin dato"];
        var n = Number(v); return [n.toFixed(0) + " %", n >= 20 ? "critico" : n > 0 ? "aviso" : "ok", n >= 20 ? "20 % o más" : n > 0 ? "1 a 19 %" : "0 %"]; },
      orden: ["0 %", "1 a 19 %", "20 % o más", "Sin dato"] },
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
  // pon, pildora y el traducen el texto si es una frase conocida; nombres, IPs y otros datos quedan igual
  function pon(n, v) { var s = (v === undefined || v === null || v === "") ? "—" : String(t(v)); if (n.textContent !== s) n.textContent = s; }
  function pildora(n, texto, tono) { texto = t(texto); if (n.textContent !== texto) n.textContent = texto; if (n.getAttribute("data-tono") !== tono) n.setAttribute("data-tono", tono); }
  function plano(s) { s = String(s || "").toLowerCase(); try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {} return s; }
  function aviso(m) { var a = $("aviso"); if (m) { a.textContent = m; a.hidden = false; } else { a.hidden = true; } }
  function hace(seg) {
    seg = Math.max(0, Math.round(seg));
    if (seg < 60) return tf("hace {n} s", { n: seg });
    if (seg < 3600) return tf("hace {n} min", { n: Math.round(seg / 60) });
    if (seg < 86400) return tf("hace {n} h", { n: Math.round(seg / 3600) });
    return tf("hace {n} d", { n: Math.round(seg / 86400) });
  }
  function fecha(ts) { try { return new Date(ts * 1000).toLocaleString(LOCALE, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return String(ts); } }

  // ---------- Datos ----------
  function leerZabbix() {
    return fetch(DATOS, { credentials: "same-origin", headers: { "Accept": "application/json" }, cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw { msg: "HTTP " + r.status };
        var tipo = r.headers.get("Content-Type") || "";
        if (tipo.indexOf("json") < 0) throw { sesion: true, msg: t("la sesión de Zabbix terminó o el módulo no tiene permiso") };
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
    datos.trig.forEach(function (tr) {
      (tr.hosts || []).forEach(function (h) { var p = porHost[h.hostid]; if (p) p.problemas.push({ nombre: tr.description, sev: Number(tr.priority), desde: Number(tr.lastchange) }); });
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
    // Última lectura: ping o el uptime del agente SNMP (este solo sirve para saber que el agente responde;
    // no es el tiempo encendido del teléfono, por eso el panel ya no lo muestra)
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
  function el(tag, cls, texto) { var n = document.createElement(tag); if (cls) n.className = cls; if (texto !== undefined) n.textContent = t(texto); return n; }
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
    var regTxt = x.v.reg === "No" ? t("No") + " · " + tf("{a} de {b}", { a: x.sinReg.length, b: x.cuentas.length }) : t(x.v.reg);
    pildora(r["c-reg"], regTxt, x.v.reg === "Sí" ? "ok" : x.v.reg === "No" ? "critico" : "neutro");
    pildora(r["c-var"], x.var[0], x.var[1]);
    pon(r["rot-var"], VAR.nombre);
    // Sin columna Lectura (1.1.0): solo se marca junto al nombre lo que no es normal
    var marca = p.mant ? t("En mantenimiento") : x.v.lect === "Vieja" ? tf("Última lectura {h}", { h: hace(x.edad) }) : x.v.lect === "Sin dato" ? t("Sin lecturas") : "";
    r.marca.hidden = !marca; pon(r.marca, marca);
    var lect = marca || t("En vivo");
    f.nodo.classList.toggle("vieja", x.v.lect === "Vieja" || x.v.disp === "No");
    f.nodo.classList.toggle("pausada", p.mant);
    f.cab.setAttribute("aria-label", (x.ext ? tf("Extensión {e}, ", { e: x.ext }) : "") + p.nombre + ". " + t("Disponible") + ": " + t(x.v.disp) + ". DND: " + t(x.v.dnd) + ". " + t("Registrado") + ": " + regTxt + ". " + t(VAR.nombre) + ": " + t(x.var[0]) + ". " + t("Lectura") + ": " + lect);

    lista(r.cuentas, x.cuentas.map(function (c) {
      var li = el("li");
      li.appendChild(el("span", "cta-ext", c.sip));
      var q = el("span", "cta-quien", c.nombre || tf("Cuenta {n}", { n: c.n }));
      q.appendChild(el("small", "", c.servidor || "servidor SIP sin dato"));
      li.appendChild(q);
      li.appendChild(c.reg === null ? pil("Sin dato", "neutro") : c.reg === 1 ? pil("Registrada", "ok") : pil("No registrada", "critico"));
      return li;
    }), "Este teléfono no tiene cuentas SIP descubiertas.");

    lista(r.problemas, p.problemas.map(function (pr) {
      var li = el("li");
      li.appendChild(pil(SEV[pr.sev], SEV_TONO[pr.sev]));
      li.appendChild(el("span", "cta-quien", pr.nombre));
      li.appendChild(el("span", "prob-hora", tf("desde {f}", { f: fecha(pr.desde) })));
      return li;
    }), "Sin problemas activos.");

    var rtt = valor(p, "icmppingsec[,10,,,,avg]"), loss = valor(p, "icmppingloss[,10]");
    pon(r["d-ping"], x.v.disp === "Sí" ? "Responde" : x.v.disp === "No" ? "No responde" : "Sin dato");
    pon(r["d-rtt"], rtt === null ? "" : (Number(rtt) * 1000).toFixed(1) + " ms");
    pon(r["d-loss"], loss === null ? "" : Number(loss).toFixed(0) + " %");
    pon(r["d-lectura"], p.mant ? t("En mantenimiento en Zabbix") : x.reloj ? fecha(x.reloj) + " (" + hace(x.edad) + ")" : t("Sin lecturas"));
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
      var tipo = b.getAttribute("data-t"), n = docs.filter(RAPIDO[tipo]).length;
      pon(b.querySelector("[data-n]"), docs.length ? n : "—");
      if (tipo !== "todos" && tipo !== "disp") { if (n) b.removeAttribute("data-cero"); else b.setAttribute("data-cero", ""); }
      if (tipo === "mant") b.hidden = !n && filtro.rapido !== "mant";
      b.setAttribute("aria-pressed", (tipo === "todos" ? !hayFiltro() : filtro.rapido === tipo) ? "true" : "false");
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
        var etiqueta = x.ext || x.p.nombre;
        pon(c.b, etiqueta);
        c.b.classList.toggle("largo", String(etiqueta).length > 6);
        if (c.b.getAttribute("data-tono") !== x.tono) c.b.setAttribute("data-tono", x.tono);
        var estado = t(x.p.mant ? "En mantenimiento" : x.v.disp === "No" ? "Sin respuesta" : x.v.disp === "Sin dato" ? "Sin dato" :
          x.v.reg === "No" ? "Sin registro SIP" : x.peor >= 2 ? tf("Con problema: {s}", { s: t(SEV[x.peor]) }) : "Disponible");
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
    pon($("cuenta"), hay ? tf("{a} de {b} teléfonos", { a: visibles, b: enG.length }) : tf(enG.length === 1 ? "{n} teléfono" : "{n} teléfonos", { n: enG.length }));
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
    var s = $("f-grupo"), ops = [["", tf("Todos ({n})", { n: docs.length })]].concat(nombres.map(function (g) { return [g, g + " (" + cuenta[g] + ")"]; }));
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
      var ops = [["", t("Todos")]].concat(base.filter(function (v) { return cuenta[v] || filtro[k] === v; }).map(function (v) { return [v, t(v) + " (" + (cuenta[v] || 0) + ")"]; }));
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
    if (VAR.texto) { $("f-vartxt").placeholder = t(VAR.texto); $("f-vartxt").classList.toggle("activo", !!filtro.var); }
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
      var tipo = b.getAttribute("data-t");
      if (tipo === "todos") { filtro = Object.assign({}, VACIO); limpiarCajas(); }
      else filtro.rapido = filtro.rapido === tipo ? "" : tipo;
      pintarTodo(ultimos);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".gsp .vista-btn"), function (b) {
    b.addEventListener("click", function () { ponerVista(b.getAttribute("data-vista")); });
  });
  VARS.forEach(function (o) { var op = document.createElement("option"); op.value = o.id; op.textContent = t(o.nombre); $("f-varcol").appendChild(op); });
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
      puente("En vivo", "ok", tf("Datos de Zabbix. Última lectura: {f}", { f: fecha(ultima) }));
    }).catch(function (e) {
      puente("Sin conexión", "critico");
      aviso(tf(e && e.sesion ? "No se pudo leer Zabbix: {e}. Recarga la página para volver a entrar." : "No se pudo leer Zabbix: {e}. Se reintenta en un minuto; lo que ves es la última lectura.", { e: e && e.msg ? e.msg : e }));
    }).then(function () { timer = setTimeout(ciclo, REFRESCO_S * 1000); });
  }

  traducirDom($("gsp"));
  traducirDom($("tpl-fila").content);
  puente("Leyendo", "neutro", "Abriendo las últimas lecturas…");
  ponerVista(VISTA);
  ciclo();
})();
