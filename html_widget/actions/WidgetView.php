<?php declare(strict_types = 0);

namespace Modules\HtmlWidget\Actions;

use CControllerDashboardWidgetView;
use CControllerResponseData;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$this->setResponse(new CControllerResponseData([
			'name' => $this->getInput('name', $this->widget->getDefaultName()),
			'content' => $this->fields_values['content'],
			'user' => [
				'debug_mode' => $this->getDebugMode()
			]
		]));
	}
}
