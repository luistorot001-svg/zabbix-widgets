<?php declare(strict_types = 0);
/*
 * Panel de teléfonos Grandstream · módulo de frontend para Zabbix 7.0.
 * Solo lectura: no escribe nada en Zabbix.
 */

namespace Modules\GsPanel;

use APP;
use CMenuItem;
use CWebUser;
use Zabbix\Core\CModule;

class Module extends CModule {

	public function init(): void {
		// Agrega "Teléfonos" al menú Monitoring. Al desactivar el módulo, el menú desaparece.
		// El nombre sigue el idioma del usuario: español si lo tiene en español, inglés en cualquier otro.
		$menu = APP::Component()->get('menu.main');
		$monitoring = $menu->find(_('Monitoring'));

		if ($monitoring !== null) {
			$monitoring->getSubmenu()->add(
				(new CMenuItem(self::titulo()))->setAction('gs.panel.view')
			);
		}
	}

	/**
	 * Nombre del menú y de la página según el idioma del usuario (CWebUser::getLang(): "es", "en"...).
	 */
	public static function titulo(): string {
		return CWebUser::getLang() === 'es' ? 'Teléfonos' : 'Phones';
	}
}
