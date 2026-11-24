<?php declare(strict_types = 0);
/*
 * Widget de cabecera para dashboards de Zabbix 7.0.
 */

namespace Modules\HeaderWidget;

use Zabbix\Core\CWidget;

class Widget extends CWidget {

	public const ALIGN_LEFT = 0;
	public const ALIGN_CENTER = 1;
	public const ALIGN_RIGHT = 2;

	public function getDefaultName(): string {
		return 'Cabecera';
	}
}
