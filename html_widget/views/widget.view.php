<?php declare(strict_types = 0);
/**
 * Vista del widget HTML. El contenido se inserta tal cual, sin filtrar.
 *
 * @var CView $this
 * @var array $data
 */

(new CWidgetView($data))
	->addItem(new CObject($data['content']))
	->show();
