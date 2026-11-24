# Widget HTML

Widget de dashboard para **Zabbix 7.0** que muestra el HTML que escribas: títulos, avisos,
enlaces, logotipos o cualquier bloque de texto con formato.

Basado en [zabbix-widget-html](https://github.com/shrank/zabbix-widget-html) de shrank (CC0 1.0),
adaptado a Zabbix 7.0 y revisado contra el código fuente de esa versión.

## Instalar

1. Copia la carpeta `html_widget` a `/usr/share/zabbix/modules/`:
   ```
   cp -r html_widget /usr/share/zabbix/modules/
   ```
2. En Zabbix: **Administration › General › Modules › Scan directory**.
3. Marca "HTML" y pulsa **Enable**.

## Usar

En un dashboard: **Edit dashboard › Add widget › Type: HTML** y escribe el contenido en
**HTML content**. Ejemplo:

```html
<div style="text-align:center;padding:12px">
  <h2 style="margin:0">Centro de monitoreo</h2>
  <p style="margin:4px 0 0">Guardia: ext. 100</p>
</div>
```

## Límites

- Hasta **2048 caracteres** por widget: es el tamaño del campo donde Zabbix 7.0 guarda los valores
  de los widgets (`widget_field.value_str`).
- Pensado para HTML y CSS. No está probado con JavaScript.

## Seguridad

El contenido se muestra **tal cual, sin filtrar**. Cualquiera que pueda editar el dashboard puede
insertar HTML que verán todos los que lo abran. Úsalo en dashboards que solo editen personas de confianza.

## Archivos

| Archivo | Qué es |
|---|---|
| `manifest.json` | Datos del widget |
| `Widget.php` | Clase del widget (nombre por defecto) |
| `includes/WidgetForm.php` | Campo "HTML content" del formulario |
| `actions/WidgetView.php` | Pasa el contenido a la vista |
| `views/widget.edit.php` | Formulario de edición |
| `views/widget.view.php` | Muestra el contenido |
