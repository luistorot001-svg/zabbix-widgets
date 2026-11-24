<?php declare(strict_types = 0);

namespace Modules\HtmlWidget\Actions;

use CControllerDashboardWidgetView;
use CControllerResponseData;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$this->setResponse(new CControllerResponseData([
			'name' => $this->getInput('name', $this->widget->getDefaultName()),
			'html' => (string) $this->fields_values['content'],
			'bg_color' => (string) ($this->fields_values['bg_color'] ?? ''),
			'user' => [
				'debug_mode' => $this->getDebugMode()
			]
		]));
	}
}
