# zabbix-widgets

Módulos y widgets de frontend para **Zabbix 7.0 LTS**, libres para usar y adaptar.

| Carpeta | Tipo | Qué hace |
|---|---|---|
| [`gs_panel`](gs_panel/) | Módulo (página) | Página **Monitoring › Teléfonos** con el estado de teléfonos IP Grandstream: disponible, DND, registro SIP y problemas. Incluye el template de Zabbix que lo alimenta |
| [`html_widget`](html_widget/) | Widget de dashboard | Muestra contenido HTML propio dentro de un dashboard |

Cada carpeta tiene su propio README con requisitos, instalación y ajustes.

## Instalación general

1. Copia la carpeta del módulo a la carpeta de módulos del frontend. En los paquetes oficiales es
   `/usr/share/zabbix/modules/`.
2. En Zabbix: **Administration › General › Modules › Scan directory**.
3. Marca el módulo y pulsa **Enable**.

Los widgets aparecen después en la lista de tipos al agregar un widget a un dashboard.

## Compatibilidad

Hechos para Zabbix 7.0 (`manifest_version` 2.0). No funcionan en Zabbix 6.0. Otras versiones no están probadas.

## Licencia

MIT, ver [LICENSE](LICENSE). `html_widget` está basado en
[zabbix-widget-html](https://github.com/shrank/zabbix-widget-html) de shrank, publicado bajo CC0 1.0.

---

**English:** frontend modules and dashboard widgets for Zabbix 7.0 LTS. Each folder has its own README
(in Spanish). Install by copying the folder to `/usr/share/zabbix/modules/`, then
*Administration › General › Modules › Scan directory* and *Enable*. MIT licensed.
