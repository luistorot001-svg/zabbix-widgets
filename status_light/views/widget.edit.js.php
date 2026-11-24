<?php declare(strict_types = 0);
/**
 * Selectores de color y campos que dependen del estilo.
 *
 * @var CView $this
 */
?>

window.widget_status_light_form = new class {

	init() {
		this._form = document.getElementById('widget-dialogue-form');

		for (const colorpicker of this._form.querySelectorAll('.<?= ZBX_STYLE_COLOR_PICKER ?> input')) {
			$(colorpicker).colorpicker({
				appendTo: '.overlay-dialogue-body',
				use_default: false
			});
		}

		for (const radio of this._form.querySelectorAll('[name="style"]')) {
			radio.addEventListener('change', () => this.updateForm());
		}

		this.updateForm();
	}

	updateForm() {
		const style = this._form.querySelector('[name="style"]:checked');
		const is_circle = style !== null && style.value === '<?= Modules\StatusLight\Widget::STYLE_CIRCLE ?>';

		for (const element of this._form.querySelectorAll('.js-row-light-size')) {
			element.style.display = is_circle ? '' : 'none';
		}
	}
};
