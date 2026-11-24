<?php declare(strict_types = 0);
/**
 * Vista del widget de cabecera. Todo el texto se escapa (no admite HTML).
 *
 * @var CView $this
 * @var array $data
 */

use Modules\HeaderWidget\Widget;

$h = $data['header'];

$align_class = [
	Widget::ALIGN_LEFT => 'hw-left',
	Widget::ALIGN_CENTER => 'hw-center',
	Widget::ALIGN_RIGHT => 'hw-right'
][$h['align']] ?? 'hw-left';

$texts = (new CDiv())
	->addClass('hw-texts')
	->addItem(
		(new CDiv($h['title']))
			->addClass('hw-title')
			->addClass($h['title_bold'] ? 'hw-bold' : null)
			->addStyle('font-size: '.$h['title_size'].'px;')
	);

if ($h['subtitle'] !== '') {
	$texts->addItem((new CDiv($h['subtitle']))->addClass('hw-subtitle'));
}

$body = (new CDiv())->addClass('hw')->addClass($align_class);

if ($h['logo_url'] !== '') {
	$body->addItem(
		(new CTag('img', false))
			->addClass('hw-logo')
			->setAttribute('src', $h['logo_url'])
			->setAttribute('alt', '')
	);
}

$body->addItem($texts);

if ($h['bg_color'] !== '') {
	$body->addStyle('background-color: #'.$h['bg_color'].';');
}

if ($h['text_color'] !== '') {
	$body->addStyle('color: #'.$h['text_color'].';');
}

(new CWidgetView($data))
	->addItem($body)
	->show();
