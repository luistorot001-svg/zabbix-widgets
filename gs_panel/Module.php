<?php declare(strict_types = 0);
/*
 * Panel de teléfonos Grandstream · módulo de frontend para Zabbix 7.0.
 * Solo lectura: no escribe nada en Zabbix.
 */

namespace Modules\GsPanel;

use APP;
use CMenuItem;
use Zabbix\Core\CModule;

class Module extends CModule {

	public function init(): void {
		// Agrega "Teléfonos" al menú Monitoring. Al desactivar el módulo, el menú desaparece.
		$menu = APP::Component()->get('menu.main');
		$monitoring = $menu->find(_('Monitoring'));

		if ($monitoring !== null) {
			$monitoring->getSubmenu()->add(
				(new CMenuItem('Teléfonos'))->setAction('gs.panel.view')
			);
		}
	}
}
