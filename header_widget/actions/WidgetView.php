<?php declare(strict_types = 0);

namespace Modules\HeaderWidget\Actions;

use CControllerDashboardWidgetView;
use CControllerResponseData;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$this->setResponse(new CControllerResponseData([
			'name' => $this->getInput('name', $this->widget->getDefaultName()),
			'header' => [
				'title' => $this->fields_values['title'],
				'subtitle' => $this->fields_values['subtitle'],
				'logo_url' => trim($this->fields_values['logo_url']),
				'align' => (int) $this->fields_values['align'],
				'title_size' => (int) $this->fields_values['title_size'],
				'title_bold' => (int) $this->fields_values['title_bold'] === 1,
				'bg_color' => $this->fields_values['bg_color'],
				'text_color' => $this->fields_values['text_color']
			],
			'user' => [
				'debug_mode' => $this->getDebugMode()
			]
		]));
	}
}
