<?php declare(strict_types = 0);
/*
 * Widget HTML para dashboards de Zabbix 7.0.
 */

namespace Modules\HtmlWidget;

use Zabbix\Core\CWidget;

class Widget extends CWidget {

	public function getDefaultName(): string {
		return 'HTML';
	}
}
