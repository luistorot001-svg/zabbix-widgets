# Cambios

## 2.1.0
- Colores según el tema de cada usuario: Blue, Dark, High-contrast light y High-contrast dark.
  Se leen del atributo `theme` que Zabbix 7.0 pone en la etiqueta `<html>`, y los colores base
  (fondo, superficie, líneas y texto) son los de cada tema de Zabbix. En alto contraste, las
  píldoras llevan borde para no depender solo del color.
- Tarjetas de resumen arriba: Teléfonos, Disponibles, Sin respuesta, Sin registro, Con DND,
  Con problemas y En mantenimiento (solo si hay). Al hacer clic filtran la lista y la cuadrícula;
  otro clic quita el filtro. "Teléfonos" limpia todos los filtros.
- Vista **Cuadrícula**: una casilla por teléfono con su extensión y un color (verde, ámbar,
  rojo o gris), ordenada por extensión. Al pasar el ratón muestra nombre y estado; al hacer clic
  abre ese teléfono en la lista. Cada navegador recuerda la vista elegida.
- La extensión ahora es su propia columna, con caja de búsqueda. "Teléfono" busca por nombre del
  host (o su IP, si el host se llama así) y nombre de la cuenta.
- Se quitó la columna IP. Ahora es una opción de la columna variable, con búsqueda por inicio
  (por ejemplo `172.17.69.`).
- Incluye 2.0.1: si el teléfono no da modelo o MAC por SNMP (GXV34xx), se usan los ítems
  `gs.web.model` y `gs.web.mac` del template.

## 2.0.0
- Adaptado a Zabbix 7.0: `manifest_version` 2.0, `Zabbix\Core\CModule`, página con `CHtmlPage`
  y `disableCsrfValidation()` (reemplaza a `disableSIDValidation()`, que ya no existe en 7.0).
- La consulta de hosts usa `selectHostGroups` (`selectGroups` está obsoleto en 7.0).
- Se incluye el template `Grandstream IP Phone by HTTP` v1.7.2 en `template/`.
- Primera versión pública.

## 1.2.0 (Zabbix 6.0)
- Columna final variable: Problemas, Latencia, Pérdida, Encendido, Firmware, Servidor SIP,
  Extensiones, MAC, N.º de parte o API web. Cada navegador recuerda la elección.
- Filtro por grupo de hosts (solo aparece si el usuario ve más de un grupo).

## 1.1.0 (Zabbix 6.0)
- Etiqueta bajo el nombre solo cuando algo no es normal: en mantenimiento, última lectura vieja o sin lecturas.
- Menú "Actualizar cada": 30 s, 1, 3, 5 y 10 min.
- Columnas Modelo (filtro por menú) e IP (filtro por inicio).

## 1.0.0 (Zabbix 6.0)
- Primera versión: página Monitoring > Teléfonos con estado por teléfono, filtros y detalle.
