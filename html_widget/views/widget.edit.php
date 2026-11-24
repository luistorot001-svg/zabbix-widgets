<?php declare(strict_types = 0);
/**
 * Formulario del widget HTML.
 *
 * @var CView $this
 * @var array $data
 */

(new CWidgetFormView($data))
	->addField(
		(new CWidgetFieldTextAreaView($data['fields']['content']))->setAdaptiveWidth(ZBX_TEXTAREA_BIG_WIDTH)
	)
	->addField(
		new CWidgetFieldColorView($data['fields']['bg_color'])
	)
	->includeJsFile('widget.edit.js.php')
	->addJavaScript('widget_html_form.init();')
	->show();
