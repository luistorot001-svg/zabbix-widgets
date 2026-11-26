# Acceso directo a Graphs

Módulo para **Zabbix 7.0** que agrega la entrada **Graphs** al menú **Monitoring**, justo debajo de **Hosts**.

En Zabbix 7.0 la vista de gráficas no tiene entrada propia en el menú: solo se llega desde
**Monitoring › Hosts**, con el enlace *Graphs* de cada host. Este módulo pone esa misma vista a un clic.

```
Monitoring
├── Problems
├── Hosts
├── Graphs      ← nueva
├── Latest data
├── Maps
└── Discovery
```

Abre la vista nativa `zabbix.php?action=charts.view`. Ahí eliges uno o varios hosts en el filtro y Zabbix
recuerda la selección por usuario, así que la próxima vez se abre con los mismos hosts.

## Qué hace y qué no

- Solo agrega una entrada al menú. No crea páginas, no consulta la base de datos y no escribe nada.
- Respeta los roles: si el rol del usuario no tiene acceso a **Monitoring › Hosts**, la entrada no aparece
  (la vista de gráficas pide ese mismo permiso).
- El texto usa la traducción del idioma de cada usuario: en español aparece como **Gráficos**
  (debajo de **Equipos**).
- Al desactivar el módulo, la entrada desaparece.
- Cuando estás en la vista de gráficas, el menú sigue resaltando **Hosts**, igual que en Zabbix sin el
  módulo, porque Zabbix asigna esa vista a Hosts.

## Requisitos

- Zabbix 7.0 (frontend con `manifest_version` 2.0). No funciona en 6.0.

## Instalación

Comandos para un servidor con los paquetes oficiales de Zabbix en RHEL/CentOS, como root.

1. Descarga el repositorio y copia la carpeta del módulo a la carpeta de módulos del frontend:

   ```bash
   # Descarga el repositorio en /tmp
   cd /tmp && git clone https://github.com/luistorot001-svg/zabbix-widgets.git

   # Copia solo este módulo a la carpeta de módulos de Zabbix
   cp -r /tmp/zabbix-widgets/graphs_menu /usr/share/zabbix/modules/

   # Deja los archivos con el mismo dueño que el resto del frontend (en paquetes RHEL/CentOS es root)
   chown -R root:root /usr/share/zabbix/modules/graphs_menu

   # Comprueba que quedaron los tres archivos: manifest.json, Module.php y README.md
   ls -l /usr/share/zabbix/modules/graphs_menu
   ```

2. En Zabbix: **Administration › General › Modules › Scan directory**.
3. Busca **Acceso directo a Graphs**, márcalo y pulsa **Enable**.
4. Recarga la página: **Monitoring › Graphs** aparece debajo de Hosts.

No hace falta reiniciar Nginx, PHP-FPM ni el servidor de Zabbix.

## Desinstalar

1. **Administration › General › Modules**, marca **Acceso directo a Graphs** y pulsa **Disable**.
2. Si quieres borrar los archivos:

   ```bash
   rm -r /usr/share/zabbix/modules/graphs_menu
   ```

## Cómo funciona

`Module.php` usa la API de módulos de Zabbix 7.0: en `init()` toma el menú principal
(`APP::Component()->get('menu.main')`), busca **Monitoring** e inserta un `CMenuItem` con la acción
`charts.view` después de **Hosts** con `insertAfter()`. Lo probé contra las clases de menú del
código fuente de Zabbix 7.0 (rama `release/7.0`).
