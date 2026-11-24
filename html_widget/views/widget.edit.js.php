<?php declare(strict_types = 0);
/**
 * Inicializa el selector de color del formulario.
 *
 * @var CView $this
 */
?>

window.widget_html_form = new class {

	init() {
		const form = document.getElementById('widget-dialogue-form');

		for (const colorpicker of form.querySelectorAll('.<?= ZBX_STYLE_COLOR_PICKER ?> input')) {
			$(colorpicker).colorpicker({
				appendTo: '.overlay-dialogue-body',
				use_default: true,
				onUpdate: window.setIndicatorColor
			});
		}
	}
};
