# Panel de teléfonos Grandstream

Módulo de frontend para **Zabbix 7.0** que agrega la página **Monitoring › Teléfonos** con el estado
de los teléfonos IP Grandstream:

- **Tarjetas de resumen**: teléfonos, disponibles, sin respuesta, sin registro, con DND, con
  problemas y en mantenimiento. Al hacer clic en una, se filtra la vista.
- **Vista Lista**: una fila por teléfono con Extensión, Teléfono, Modelo, Disponible, DND,
  Registrado y una columna a elegir (problemas, IP, latencia, pérdida, firmware, servidor SIP,
  etc.). Cada columna tiene su filtro, y al hacer clic en una fila se abre el detalle (cuentas SIP,
  problemas activos, red y equipo).
- **Vista Cuadrícula**: una casilla por teléfono con su extensión y un color, pensada para una
  pantalla de monitoreo. Verde = disponible y registrado; ámbar = responde pero tiene un problema
  (Aviso o más grave) o una cuenta sin registro; rojo = no responde a ping; gris = sin dato o en
  mantenimiento.
- Filtro por grupo de hosts y actualización automática (de 30 s a 10 min).
- Se adapta al tema de cada usuario (Blue, Dark y los dos de alto contraste).
- Sigue el idioma de cada usuario: español si lo tiene en español, inglés en cualquier otro. Los
  nombres de hosts, cuentas y problemas se ven tal como están en Zabbix.

- **Solo lectura.** Usa la API interna de Zabbix con los permisos del usuario que lo mira:
  cada usuario ve solo los hosts de sus grupos.
- No cambia la configuración de Zabbix ni del servidor web.

## Requisitos

- Zabbix 7.0.
- Hosts con el template **`Grandstream IP Phone by HTTP`**, incluido en [`template/`](template/)
  (ver su README para importarlo). Si usas otro template, debe tener estos ítems; su nombre se
  cambia en `actions/PanelData.php`, constante `TEMPLATE`:

| Clave del ítem | Para qué la usa el panel |
|---|---|
| `icmpping[,3]` | Disponible (1 = responde) |
| `icmppingsec[,10,,,,avg]` | Latencia |
| `icmppingloss[,10]` | Pérdida |
| `gs.phone.dnd` | DND (1 = activo) |
| `gs.account.reg[N]` | Registro de la cuenta SIP N (1 = registrada). La extensión va entre paréntesis en el nombre del ítem |
| `gs.account.server[N]` | Servidor SIP de la cuenta N |
| `gs.accounts.extensions` | Extensiones |
| `gs.snmp.uptime` | Solo para saber cuándo fue la última lectura (es el uptime del agente SNMP, no del teléfono, así que no se muestra) |
| `gs.cti.response` | API web |
| `gs.inv.model`, `gs.inv.firmware`, `gs.inv.mac`, `gs.inv.partnumber` | Datos del equipo |
| `gs.web.model`, `gs.web.mac` (opcionales) | Respaldo de modelo y MAC cuando `sysName` viene vacío (GXV34xx) |

Si falta alguno, esa columna o dato aparece como "Sin dato"; el resto funciona.

## Instalar

1. Copia la carpeta `gs_panel` a la carpeta de módulos del frontend. En los paquetes oficiales es
   `/usr/share/zabbix/modules/`:
   ```
   cp -r gs_panel /usr/share/zabbix/modules/
   ```
2. En Zabbix: **Administration › General › Modules › Scan directory**.
3. Busca "Panel de teléfonos Grandstream", márcalo y pulsa **Enable**.
4. Abre **Monitoring › Teléfonos**.

## Actualizar desde una versión anterior

1. Borra la carpeta vieja y copia la nueva (así no quedan archivos que ya no se usan):
   ```
   rm -rf /usr/share/zabbix/modules/gs_panel
   cp -r gs_panel /usr/share/zabbix/modules/
   ```
2. En Zabbix: **Administration › General › Modules › Scan directory**. El módulo sigue habilitado.
3. Recarga **Monitoring › Teléfonos** con Ctrl+F5.

## Ajustes

Arriba de `actions/PanelData.php`:

- `TEMPLATE`: nombre del template que deben tener los teléfonos.
- `GRUPO`: limita el panel a un grupo de hosts. Vacío = todos los que el usuario puede ver.

## Permisos para otros usuarios

El usuario necesita permiso de lectura sobre el grupo de hosts de los teléfonos y que su rol tenga
el módulo permitido (**Users › User roles › Access to UI elements / modules**).

## Desactivar o quitar

**Administration › General › Modules**, marca el módulo y pulsa **Disable**: el menú "Teléfonos"
desaparece. Para quitarlo del todo, desactívalo y borra la carpeta `modules/gs_panel`.

## Privacidad

La página carga las fuentes Comfortaa, JetBrains Mono y Poppins desde Google Fonts. Si tu red no
sale a internet, el panel funciona igual con las fuentes del sistema.

## Archivos

| Archivo | Qué es |
|---|---|
| `manifest.json` | Datos del módulo y versión |
| `Module.php` | Agrega "Teléfonos" al menú Monitoring |
| `actions/PanelView.php` | La página |
| `actions/PanelData.php` | Datos en JSON (`zabbix.php?action=gs.panel.data`) y ajustes |
| `views/` | Vistas de las dos acciones |
| `assets/` | HTML, CSS y JavaScript del panel |
