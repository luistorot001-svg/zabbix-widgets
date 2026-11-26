<?php declare(strict_types = 0);
/*
 * Acceso directo a Graphs · módulo de frontend para Zabbix 7.0.
 *
 * Agrega la entrada "Graphs" al menú Monitoring, justo debajo de "Hosts".
 * Abre la vista nativa de gráficas (zabbix.php?action=charts.view), la misma que se abre
 * desde Monitoring › Hosts › columna "Graphs". No crea páginas ni escribe nada en Zabbix.
 */

namespace Modules\GraphsMenu;

use APP;
use CMenuItem;
use CRoleHelper;
use CWebUser;
use Zabbix\Core\CModule;

class Module extends CModule {

	public function init(): void {
		// La vista de gráficas exige el mismo permiso de rol que Monitoring › Hosts.
		if (!CWebUser::checkAccess(CRoleHelper::UI_MONITORING_HOSTS)) {
			return;
		}

		$monitoring = APP::Component()->get('menu.main')->find(_('Monitoring'));

		if ($monitoring === null) {
			return;
		}

		// _('Graphs') usa la traducción del idioma del usuario (en español: "Gráficos").
		// Si no existe "Hosts" en el submenú, insertAfter() la deja al final.
		$monitoring->getSubMenu()->insertAfter(_('Hosts'),
			(new CMenuItem(_('Graphs')))->setAction('charts.view')
		);
	}
}
