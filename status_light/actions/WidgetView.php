<?php declare(strict_types = 0);

namespace Modules\StatusLight\Actions;

use API,
	CArrayHelper,
	CControllerDashboardWidgetView,
	CControllerResponseData,
	CSettingsHelper,
	CUrl,
	CValueMapHelper,
	Manager;

use Modules\StatusLight\Widget;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$item = $this->getItem();
		$f = $this->fields_values;

		$output = [
			'name' => $this->getName($item),
			'user' => [
				'debug_mode' => $this->getDebugMode()
			]
		];

		if ($item === null) {
			$output['error'] = _('No permissions to referred object or it does not exist!');
			$this->setResponse(new CControllerResponseData($output));

			return;
		}

		$last = $this->getLastValue($item);
		$value = $last !== null ? (string) $last['value'] : null;
		$mapped = $value !== null ? CValueMapHelper::getMappedValue($item['value_type'], $value, $item['valuemap']) : false;

		$state = $this->getState($value, $mapped === false ? null : (string) $mapped,
			$last !== null ? (int) $last['clock'] : null
		);

		$show = array_flip($f['show']);

		$output['light'] = [
			'state' => $state,
			'color' => (string) ($f[$state.'_color'] ?? ''),
			'text_color' => (string) ($f['text_color'] ?? ''),
			'state_text' => array_key_exists(Widget::SHOW_STATE, $show) ? $f[$state.'_text'] : null,
			'value_text' => array_key_exists(Widget::SHOW_VALUE, $show) && $value !== null
				? $this->formatValue($item, $value, $mapped)
				: null,
			'time_text' => array_key_exists(Widget::SHOW_TIME, $show) && $last !== null
				? zbx_date2str(DATE_TIME_FORMAT_SECONDS, $last['clock'])
				: null,
			'style' => (int) $f['style'],
			'light_size' => (int) $f['light_size'],
			'text_size' => (int) $f['text_size'],
			'blink' => $state === Widget::STATE_DOWN && (int) $f['blink_down'] === 1,
			'url' => $this->getUrl($item)
		];

		$this->setResponse(new CControllerResponseData($output));
	}

	/**
	 * Busca el ítem configurado. Si hay "Override host", usa el ítem con la misma clave en ese host
	 * (igual que el widget oficial "Item value").
	 */
	private function getItem(): ?array {
		$resolve_macros = !$this->isTemplateDashboard() || $this->fields_values['override_hostid'];

		$options = [
			'output' => ['itemid', 'hostid', $resolve_macros ? 'name_resolved' : 'name', 'value_type', 'units'],
			'selectValueMap' => ['mappings'],
			'webitems' => true
		];

		if (!$this->isTemplateDashboard() && $this->fields_values['override_hostid']) {
			$src_items = API::Item()->get([
				'output' => ['key_'],
				'itemids' => $this->fields_values['itemid'],
				'webitems' => true
			]);

			if (!$src_items) {
				return null;
			}

			$options['hostids'] = $this->fields_values['override_hostid'];
			$options['filter']['key_'] = $src_items[0]['key_'];
		}
		else {
			$options['itemids'] = $this->fields_values['itemid'];
		}

		$items = API::Item()->get($options);

		if (!$items) {
			return null;
		}

		return $resolve_macros ? CArrayHelper::renameKeys($items[0], ['name_resolved' => 'name']) : $items[0];
	}

	/**
	 * Último valor del historial dentro del periodo "Max history display period" de la configuración.
	 */
	private function getLastValue(array $item): ?array {
		$period = timeUnitToSeconds(CSettingsHelper::get(CSettingsHelper::HISTORY_PERIOD));
		$history = Manager::History()->getLastValues([$item], 1, $period);

		return $history ? (reset($history)[0] ?? null) : null;
	}

	/**
	 * Decide el color. Orden: sin datos / dato viejo -> UP -> DOWN -> desconocido.
	 * Si "Valores DOWN" está vacío, todo lo que no sea UP es DOWN.
	 */
	private function getState(?string $value, ?string $mapped, ?int $clock): string {
		if ($value === null) {
			return Widget::STATE_UNKNOWN;
		}

		$nodata = (int) $this->fields_values['nodata_minutes'];

		if ($nodata > 0 && $clock !== null && time() - $clock > $nodata * 60) {
			return Widget::STATE_UNKNOWN;
		}

		$up = self::parseList($this->fields_values['up_values']);
		$down = self::parseList($this->fields_values['down_values']);

		if (self::matches($value, $mapped, $up)) {
			return Widget::STATE_UP;
		}

		if (!$down || self::matches($value, $mapped, $down)) {
			return Widget::STATE_DOWN;
		}

		return Widget::STATE_UNKNOWN;
	}

	private static function parseList(string $list): array {
		return array_values(array_filter(array_map('trim', explode(',', $list)), 'strlen'));
	}

	/**
	 * Compara el valor (o su texto de mapeo) contra la lista. Los números se comparan como número
	 * (1 = 1.0000) y el texto sin distinguir mayúsculas.
	 */
	private static function matches(string $value, ?string $mapped, array $list): bool {
		foreach ($list as $expected) {
			if (is_numeric($expected) && is_numeric($value) && (float) $expected == (float) $value) {
				return true;
			}

			if (mb_strtolower($expected) === mb_strtolower(trim($value))) {
				return true;
			}

			if ($mapped !== null && mb_strtolower($expected) === mb_strtolower(trim($mapped))) {
				return true;
			}
		}

		return false;
	}

	private function formatValue(array $item, string $value, $mapped): string {
		if ($mapped !== false) {
			return $mapped.' ('.$value.')';
		}

		if (in_array($item['value_type'], [ITEM_VALUE_TYPE_FLOAT, ITEM_VALUE_TYPE_UINT64])) {
			return convertUnits(['value' => $value, 'units' => $item['units']]);
		}

		return mb_strlen($value) > 50 ? mb_substr($value, 0, 50).'…' : $value;
	}

	private function getName(?array $item): string {
		if ($this->getInput('name', '') !== '') {
			return $this->getInput('name');
		}

		if ($item === null || ($this->isTemplateDashboard() && !$this->fields_values['override_hostid'])) {
			return $this->widget->getDefaultName();
		}

		$hosts = API::Host()->get([
			'output' => ['name'],
			'hostids' => [$item['hostid']]
		]);

		return $hosts ? $hosts[0]['name'].NAME_DELIMITER.$item['name'] : $item['name'];
	}

	private function getUrl(array $item): string {
		return (new CUrl('history.php'))
			->setArgument('action',
				in_array($item['value_type'], [ITEM_VALUE_TYPE_FLOAT, ITEM_VALUE_TYPE_UINT64])
					? HISTORY_GRAPH
					: HISTORY_VALUES
			)
			->setArgument('itemids[]', $item['itemid'])
			->getUrl();
	}
}
