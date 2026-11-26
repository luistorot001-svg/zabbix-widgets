<?php declare(strict_types = 0);
/*
 * Página del panel. Solo muestra la vista; los datos los pide la página a gs.panel.data.
 */

namespace Modules\GsPanel\Actions;

use CController;
use CControllerResponseData;
use CControllerResponseFatal;
use Modules\GsPanel\Module;

class PanelView extends CController {

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
		$response = new CControllerResponseData([
			'module_dir' => dirname(__DIR__)
		]);
		$response->setTitle(Module::titulo());
		$this->setResponse($response);
	}
}
