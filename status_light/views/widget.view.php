<?php declare(strict_types = 0);
/**
 * Vista del widget Semáforo UP/DOWN. Todo el texto se escapa (no admite HTML).
 *
 * @var CView $this
 * @var array $data
 */

use Modules\StatusLight\Widget;

if (array_key_exists('error', $data)) {
	$body = (new CTableInfo())->setNoDataMessage($data['error']);
}
else {
	$l = $data['light'];

	$texts = (new CDiv())->addClass('sl-texts');

	if ($l['state_text'] !== null && $l['state_text'] !== '') {
		$texts->addItem((new CDiv($l['state_text']))->addClass('sl-state'));
	}

	if ($l['value_text'] !== null) {
		$texts->addItem((new CDiv($l['value_text']))->addClass('sl-value'));
	}

	if ($l['time_text'] !== null) {
		$texts->addItem((new CDiv($l['time_text']))->addClass('sl-time'));
	}

	$body = (new CLink(null, $l['url']))
		->addClass('sl')
		->addClass('sl-'.$l['state'])
		->addClass($l['style'] == Widget::STYLE_CIRCLE ? 'sl-circle' : 'sl-fill')
		->addClass($l['blink'] ? 'sl-blink' : null)
		->addStyle('--sl-text-size: '.$l['text_size'].';')
		->addStyle('--sl-light-size: '.$l['light_size'].';');

	if ($l['color'] !== '') {
		$body->addStyle('--sl-color: #'.$l['color'].';');
	}

	if ($l['text_color'] !== '') {
		$body->addStyle('--sl-text-color: #'.$l['text_color'].';');
	}

	if ($l['style'] == Widget::STYLE_CIRCLE) {
		$body->addItem((new CDiv())->addClass('sl-lamp'));
	}

	$body->addItem($texts);
}

(new CWidgetView($data))
	->addItem($body)
	->show();
