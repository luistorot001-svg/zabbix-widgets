# Widget de cabecera

Widget de dashboard para **Zabbix 7.0** que pone una cabecera arriba del dashboard: título, subtítulo
opcional y logotipo opcional, con colores, alineación y tamaño configurables.

A diferencia del [widget HTML](../html_widget/), aquí no se escribe código: todo se llena en el formulario
y el texto se muestra escapado, así que es seguro aunque otras personas editen el dashboard.

## Instalar

1. Copia la carpeta `header_widget` a `/usr/share/zabbix/modules/`:
   ```
   cp -r header_widget /usr/share/zabbix/modules/
   ```
2. En Zabbix: **Administration › General › Modules › Scan directory**.
3. Marca "Cabecera" y pulsa **Enable**.

## Usar

En un dashboard: **Edit dashboard › Add widget › Type: Cabecera**. Se crea de lado a lado (72 columnas) y
2 filas de alto; puedes cambiar el tamaño arrastrando la esquina.

| Campo | Qué hace |
|---|---|
| Título | Texto principal (obligatorio) |
| Subtítulo | Segunda línea, más pequeña |
| URL del logotipo | Imagen a la izquierda del título (`https://…` o una ruta del propio Zabbix, p. ej. `imgs/logo.png`) |
| Alineación | Izquierda, centro o derecha |
| Tamaño del título (px) | De 10 a 96, por defecto 28 |
| Título en negrita | Activado por defecto |
| Color de fondo / Color del texto | Vacío = colores del tema de Zabbix |

Consejo: en el formulario del widget desmarca **Show header** para que no aparezca la barra con el nombre del widget encima de la cabecera.

## Archivos

| Archivo | Qué es |
|---|---|
| `manifest.json` | Datos del widget, tamaño por defecto y archivos JS/CSS |
| `Widget.php` | Clase del widget y constantes de alineación |
| `includes/WidgetForm.php` | Campos del formulario y validación del logotipo |
| `actions/WidgetView.php` | Pasa la configuración a la vista |
| `views/widget.edit.php`, `views/widget.edit.js.php` | Formulario de edición y selectores de color |
| `views/widget.view.php` | Arma la cabecera |
| `assets/js/class.widget.js` | Quita el relleno para que el color de fondo cubra todo el widget |
| `assets/css/widget.css` | Estilos de la cabecera |
