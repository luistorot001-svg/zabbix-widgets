# Template "Grandstream IP Phone by HTTP" (Zabbix 7.0)

Template que necesita el panel `gs_panel`. Consulta los teléfonos Grandstream directamente, sin depender
de la central telefónica:

- **SNMP v2c**: encendido y reinicios, registro por cuenta SIP, DND, firmware, número de parte, modelo y MAC.
- **Consulta web** (item Script, cada `{$GS.INTERVAL}`, 6 h por defecto): detecta la familia (GXP, GRP o GXV),
  descubre las cuentas y lee servidor SIP, Feature Key Sync, QoS (DSCP de SIP y RTP), códecs y, en GXV, volúmenes.
- **Ping** (requiere `fping` en el server o proxy): disponibilidad, pérdida y latencia.

Probado por su autor en GXP2130, GXP2135, GRP2613 y GXV3450. En GXP, el QoS RTP no está validado.

## Importar

1. En Zabbix: **Data collection › Templates › Import** y elige `grandstream_ip_phone_by_http.yaml`.
2. Revisa las macros del template (abajo), sobre todo la comunidad SNMP y las contraseñas.
3. Agrega a cada teléfono una interfaz **SNMP v2c** y una **Agent** o cualquiera con su IP, y enlázale el template.

## En el teléfono

- SNMP habilitado, con la misma comunidad que `{$SNMP_COMMUNITY}`.
- Remote Control (en GRP: *Network Settings › Advanced Settings*): **Action URI Support** activado,
  **Popup Window Support** desactivado y la IP del server o proxy de Zabbix en **Allowed IP List**.

## Macros principales

| Macro | Por defecto | Qué es |
|---|---|---|
| `{$SNMP_COMMUNITY}` | `public` | Comunidad SNMP. **Cámbiala** por la de tu red |
| `{$GS.PASSCODE:"GXP"}`, `{$GS.PASSCODE:"GRP"}`, `{$GS.PASSCODE:"GXV"}` | vacías (secretas) | Contraseña de admin por familia |
| `{$GS.PASSCODE}` | vacía (secreta) | Contraseña de respaldo si la de la familia está vacía |
| `{$GS.WEBAPI.USER}` | `admin` | Usuario web del teléfono |
| `{$GS.INTERVAL}` | `6h` | Frecuencia de la consulta web |
| `{$GS.DND.MAX}` | `2h` | Tiempo con DND activo antes de avisar |
| `{$GS.ICMP.LOSS.WARN}` / `{$GS.ICMP.RTT.WARN}` | `20` / `0.15` | Umbrales de pérdida (%) y latencia (s) |

Cada macro trae su descripción dentro del template.

## Importante

- El teléfono admite **una sola sesión web**: cada consulta web saca a quien esté en su página. Por eso la consulta es poco frecuente.
- Si la contraseña es incorrecta, el teléfono bloquea al admin tras varios intentos. Con las contraseñas vacías, el template no intenta iniciar sesión.
- Las llamadas en curso no se monitorean.
