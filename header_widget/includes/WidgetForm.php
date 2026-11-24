<?php declare(strict_types = 0);

namespace Modules\HeaderWidget\Includes;

use CHtmlUrlValidator;
use Modules\HeaderWidget\Widget;
use Zabbix\Widgets\{
	CWidgetField,
	CWidgetForm
};
use Zabbix\Widgets\Fields\{
	CWidgetFieldCheckBox,
	CWidgetFieldColor,
	CWidgetFieldIntegerBox,
	CWidgetFieldRadioButtonList,
	CWidgetFieldTextBox
};

class WidgetForm extends CWidgetForm {

	public function validate(bool $strict = false): array {
		$errors = parent::validate($strict);

		if ($errors) {
			return $errors;
		}

		$logo = trim((string) $this->getFieldValue('logo_url'));

		if ($logo !== '' && !CHtmlUrlValidator::validate($logo, ['allow_user_macro' => false])) {
			$errors[] = 'URL del logotipo: la dirección no es válida.';
		}

		return $errors;
	}

	public function addFields(): self {
		return $this
			->addField(
				(new CWidgetFieldTextBox('title', 'Título'))
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
			)
			->addField(
				new CWidgetFieldTextBox('subtitle', 'Subtítulo')
			)
			->addField(
				new CWidgetFieldTextBox('logo_url', 'URL del logotipo')
			)
			->addField(
				(new CWidgetFieldRadioButtonList('align', 'Alineación', [
					Widget::ALIGN_LEFT => 'Izquierda',
					Widget::ALIGN_CENTER => 'Centro',
					Widget::ALIGN_RIGHT => 'Derecha'
				]))->setDefault(Widget::ALIGN_LEFT)
			)
			->addField(
				(new CWidgetFieldIntegerBox('title_size', 'Tamaño del título (px)', 10, 96))->setDefault(28)
			)
			->addField(
				(new CWidgetFieldCheckBox('title_bold', 'Título en negrita'))->setDefault(1)
			)
			->addField(
				(new CWidgetFieldColor('bg_color', 'Color de fondo'))->allowInherited()
			)
			->addField(
				(new CWidgetFieldColor('text_color', 'Color del texto'))->allowInherited()
			);
	}
}
