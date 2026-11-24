<?php declare(strict_types = 0);

namespace Modules\StatusLight\Includes;

use Modules\StatusLight\Widget;
use Zabbix\Widgets\{
	CWidgetField,
	CWidgetForm
};
use Zabbix\Widgets\Fields\{
	CWidgetFieldCheckBox,
	CWidgetFieldCheckBoxList,
	CWidgetFieldColor,
	CWidgetFieldIntegerBox,
	CWidgetFieldMultiSelectItem,
	CWidgetFieldMultiSelectOverrideHost,
	CWidgetFieldRadioButtonList,
	CWidgetFieldTextBox
};

class WidgetForm extends CWidgetForm {

	public function validate(bool $strict = false): array {
		$errors = parent::validate($strict);

		if ($errors) {
			return $errors;
		}

		if (trim((string) $this->getFieldValue('up_values')) === '') {
			$errors[] = 'Valores UP: escribe al menos un valor (por ejemplo 1).';
		}

		return $errors;
	}

	public function addFields(): self {
		return $this
			->addField(
				(new CWidgetFieldMultiSelectItem('itemid', 'Ítem'))
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
					->setMultiple(false)
			)
			->addField(
				new CWidgetFieldMultiSelectOverrideHost()
			)
			->addField(
				(new CWidgetFieldTextBox('up_values', 'Valores UP'))
					->setDefault('1')
					->setFlags(CWidgetField::FLAG_LABEL_ASTERISK)
			)
			->addField(
				new CWidgetFieldTextBox('down_values', 'Valores DOWN')
			)
			->addField(
				(new CWidgetFieldRadioButtonList('style', 'Estilo', [
					Widget::STYLE_FILL => 'Fondo completo',
					Widget::STYLE_CIRCLE => 'Círculo'
				]))->setDefault(Widget::STYLE_FILL)
			)
			->addField(
				(new CWidgetFieldIntegerBox('light_size', 'Tamaño del círculo (%)', 10, 100))->setDefault(70)
			)
			->addField(
				(new CWidgetFieldIntegerBox('text_size', 'Tamaño del texto (%)', 5, 100))->setDefault(35)
			)
			->addField(
				(new CWidgetFieldCheckBoxList('show', 'Mostrar', [
					Widget::SHOW_STATE => 'Estado',
					Widget::SHOW_VALUE => 'Valor',
					Widget::SHOW_TIME => 'Hora del dato'
				]))->setDefault([Widget::SHOW_STATE])
			)
			->addField(
				(new CWidgetFieldTextBox('up_text', 'Texto UP'))->setDefault('UP')
			)
			->addField(
				(new CWidgetFieldTextBox('down_text', 'Texto DOWN'))->setDefault('DOWN')
			)
			->addField(
				(new CWidgetFieldTextBox('unknown_text', 'Texto sin datos'))->setDefault('SIN DATOS')
			)
			->addField(
				(new CWidgetFieldColor('up_color', 'Color UP'))->setDefault('1E9E4A')
			)
			->addField(
				(new CWidgetFieldColor('down_color', 'Color DOWN'))->setDefault('D32F2F')
			)
			->addField(
				(new CWidgetFieldColor('unknown_color', 'Color sin datos'))->setDefault('7F8C8D')
			)
			->addField(
				(new CWidgetFieldColor('text_color', 'Color del texto'))->setDefault('FFFFFF')
			)
			->addField(
				(new CWidgetFieldIntegerBox('nodata_minutes', 'Sin datos después de (min)', 0, 10080))->setDefault(0)
			)
			->addField(
				new CWidgetFieldCheckBox('blink_down', 'Parpadear en DOWN')
			);
	}
}
