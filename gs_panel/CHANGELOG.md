# Cambios

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
