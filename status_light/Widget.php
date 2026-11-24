<?php declare(strict_types = 0);
/*
 * Widget "Semáforo UP/DOWN" para dashboards de Zabbix 7.0.
 */

namespace Modules\StatusLight;

use Zabbix\Core\CWidget;

class Widget extends CWidget {

	// Estados posibles del semáforo.
	public const STATE_UP = 'up';
	public const STATE_DOWN = 'down';
	public const STATE_UNKNOWN = 'unknown';

	// Estilo de dibujo.
	public const STYLE_FILL = 0;
	public const STYLE_CIRCLE = 1;

	// Qué mostrar dentro del indicador.
	public const SHOW_STATE = 0;
	public const SHOW_VALUE = 1;
	public const SHOW_TIME = 2;

	public function getDefaultName(): string {
		return 'Semáforo UP/DOWN';
	}
}
