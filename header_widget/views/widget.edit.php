<?php declare(strict_types = 0);
/**
 * Formulario del widget de cabecera.
 *
 * @var CView $this
 * @var array $data
 */

(new CWidgetFormView($data))
	->addField(
		new CWidgetFieldTextBoxView($data['fields']['title'])
	)
	->addField(
		new CWidgetFieldTextBoxView($data['fields']['subtitle'])
	)
	->addField(
		(new CWidgetFieldTextBoxView($data['fields']['logo_url']))->setPlaceholder('https://… o imgs/logo.png')
	)
	->addField(
		new CWidgetFieldRadioButtonListView($data['fields']['align'])
	)
	->addField(
		new CWidgetFieldIntegerBoxView($data['fields']['title_size'])
	)
	->addField(
		new CWidgetFieldCheckBoxView($data['fields']['title_bold'])
	)
	->addField(
		new CWidgetFieldColorView($data['fields']['bg_color'])
	)
	->addField(
		new CWidgetFieldColorView($data['fields']['text_color'])
	)
	->includeJsFile('widget.edit.js.php')
	->addJavaScript('widget_header_form.init();')
	->show();
