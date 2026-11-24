<?php declare(strict_types = 0);
/**
 * Vista del widget HTML. El contenido se inserta tal cual, sin filtrar.
 *
 * @var CView $this
 * @var array $data
 */

$box = (new CDiv())
	->addClass('htmlw')
	->addItem(new CObject($data['html']));

if ($data['bg_color'] !== '') {
	$box->addStyle('background-color: #'.$data['bg_color'].';');
}

(new CWidgetView($data))
	->addItem($box)
	->show();
