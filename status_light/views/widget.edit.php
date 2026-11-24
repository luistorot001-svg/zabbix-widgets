<?php declare(strict_types = 0);
/**
 * Formulario del widget Semáforo UP/DOWN.
 *
 * @var CView $this
 * @var array $data
 */

(new CWidgetFormView($data))
	->addField(
		(new CWidgetFieldMultiSelectItemView($data['fields']['itemid']))
			->setPopupParameter('value_types', [
				ITEM_VALUE_TYPE_FLOAT,
				ITEM_VALUE_TYPE_STR,
				ITEM_VALUE_TYPE_LOG,
				ITEM_VALUE_TYPE_UINT64,
				ITEM_VALUE_TYPE_TEXT
			])
	)
	->addField($data['templateid'] === null
		? new CWidgetFieldMultiSelectOverrideHostView($data['fields']['override_hostid'])
		: null
	)
	->addField(
		(new CWidgetFieldTextBoxView($data['fields']['up_values']))->setPlaceholder('1, up')
	)
	->addField(
		(new CWidgetFieldTextBoxView($data['fields']['down_values']))
			->setPlaceholder('vacío = todo lo que no sea UP')
	)
	->addField(
		new CWidgetFieldRadioButtonListView($data['fields']['style'])
	)
	->addField(
		(new CWidgetFieldIntegerBoxView($data['fields']['light_size']))->addRowClass('js-row-light-size')
	)
	->addField(
		new CWidgetFieldIntegerBoxView($data['fields']['text_size'])
	)
	->addField(
		(new CWidgetFieldCheckBoxListView($data['fields']['show']))->setColumns(3)
	)
	->addFieldset(
		(new CWidgetFormFieldsetCollapsibleView('Textos y colores'))
			->addField(
				new CWidgetFieldTextBoxView($data['fields']['up_text'])
			)
			->addField(
				new CWidgetFieldTextBoxView($data['fields']['down_text'])
			)
			->addField(
				new CWidgetFieldTextBoxView($data['fields']['unknown_text'])
			)
			->addField(
				new CWidgetFieldColorView($data['fields']['up_color'])
			)
			->addField(
				new CWidgetFieldColorView($data['fields']['down_color'])
			)
			->addField(
				new CWidgetFieldColorView($data['fields']['unknown_color'])
			)
			->addField(
				new CWidgetFieldColorView($data['fields']['text_color'])
			)
			->addField(
				new CWidgetFieldIntegerBoxView($data['fields']['nodata_minutes'])
			)
			->addField(
				new CWidgetFieldCheckBoxView($data['fields']['blink_down'])
			)
	)
	->includeJsFile('widget.edit.js.php')
	->addJavaScript('widget_status_light_form.init();')
	->show();
