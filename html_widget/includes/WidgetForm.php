<?php declare(strict_types = 0);

namespace Modules\HtmlWidget\Includes;

use Zabbix\Widgets\{
	CWidgetField,
	CWidgetForm
};
use Zabbix\Widgets\Fields\{
	CWidgetFieldColor,
	CWidgetFieldTextArea
};

class WidgetForm extends CWidgetForm {

	public function addFields(): self {
		return $this
			->addField(
				(new CWidgetFieldTextArea('content', 'Contenido HTML'))
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
			)
			->addField(
				(new CWidgetFieldColor('bg_color', 'Color de fondo'))->allowInherited()
			);
	}
}
