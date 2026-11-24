<?php declare(strict_types = 0);
/*
 * Widget HTML para Zabbix 7.0.
 * Basado en zabbix-widget-html de shrank (CC0 1.0).
 */

namespace Modules\HtmlWidget;

use Zabbix\Core\CWidget;

class Widget extends CWidget {

	public function getDefaultName(): string {
		return _('HTML');
	}
}
