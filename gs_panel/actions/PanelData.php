<?php declare(strict_types = 0);
/*
 * Datos del panel en JSON. Usa la API interna con los permisos del usuario que está viendo:
 * cada usuario solo recibe los hosts que puede ver. Solo lectura (get).
 */

namespace Modules\GsPanel\Actions;

use API;
use CController;
use CControllerResponseData;
use CControllerResponseFatal;
use CWebUser;

class PanelData extends CController {

	// Ajustes (cambiarlos aquí y subir la versión en manifest.json)
	private const TEMPLATE = 'Grandstream IP Phone by HTTP';
	private const GRUPO = '';  // nombre de grupo de hosts; vacío = todos los que el usuario puede ver

	protected function init() {
		$this->disableCsrfValidation();
	}

	protected function checkInput() {
		$ret = $this->validateInput([]);

		if (!$ret) {
			$this->setResponse(new CControllerResponseFatal());
		}

		return $ret;
	}

	protected function checkPermissions() {
		return $this->getUserType() >= USER_TYPE_ZABBIX_USER;
	}

	protected function doAction() {
		$out = ['ahora' => time(), 'hosts' => [], 'items' => [], 'trig' => [], 'error' => ''];

		$templates = API::Template()->get([
			'output' => ['templateid'],
			'filter' => ['host' => [self::TEMPLATE]]
		]);

		if (!$templates) {
			$out['error'] = self::es()
				? 'Tu usuario no ve el template "'.self::TEMPLATE.'" o no existe.'
				: 'Your user cannot see the template "'.self::TEMPLATE.'" or it does not exist.';
			return $this->responder($out);
		}

		$host_params = [
			'output' => ['hostid', 'name', 'host', 'maintenance_status'],
			'selectHostGroups' => ['groupid', 'name'],
			'selectInterfaces' => ['ip', 'dns', 'useip', 'main', 'type'],
			'templateids' => [$templates[0]['templateid']],
			'monitored_hosts' => true
		];

		if (self::GRUPO !== '') {
			$groups = API::HostGroup()->get([
				'output' => ['groupid'],
				'filter' => ['name' => [self::GRUPO]]
			]);

			if (!$groups) {
				$out['error'] = self::es()
					? 'No existe el grupo "'.self::GRUPO.'" o tu usuario no lo ve.'
					: 'The host group "'.self::GRUPO.'" does not exist or your user cannot see it.';
				return $this->responder($out);
			}

			$host_params['groupids'] = [$groups[0]['groupid']];
		}

		$out['hosts'] = API::Host()->get($host_params);
		$hostids = array_column($out['hosts'], 'hostid');

		if ($hostids) {
			$out['items'] = API::Item()->get([
				'output' => ['hostid', 'key_', 'name', 'description', 'lastvalue', 'lastclock'],
				'hostids' => $hostids,
				'monitored' => true,
				'search' => ['key_' => ['icmpping', 'gs.']],
				'startSearch' => true,
				'searchByAny' => true
			]);

			$out['trig'] = API::Trigger()->get([
				'output' => ['triggerid', 'description', 'priority', 'lastchange'],
				'selectHosts' => ['hostid'],
				'hostids' => $hostids,
				'filter' => ['value' => TRIGGER_VALUE_TRUE],
				'monitored' => true,
				'skipDependent' => true,
				'expandDescription' => true
			]);
		}

		return $this->responder($out);
	}

	private static function es(): bool {
		return CWebUser::getLang() === 'es';
	}

	private function responder(array $out) {
		$this->setResponse(new CControllerResponseData(['main_block' => json_encode($out)]));
	}
}
