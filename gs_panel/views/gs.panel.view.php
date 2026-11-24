<?php declare(strict_types = 0);
/*
 * Vista del panel de teléfonos. Arma la página con los archivos de assets/.
 *
 * @var CView $this
 * @var array $data
 */

$assets = $data['module_dir'].'/assets/';

$html =
	'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700'.
		'&family=JetBrains+Mono:wght@500;600&family=Poppins:wght@400;500;600&display=swap">'.
	'<style>'.file_get_contents($assets.'gs_panel.css').'</style>'.
	'<div class="gsp" id="gsp">'.file_get_contents($assets.'gs_panel.body.html').'</div>'.
	'<script>'.file_get_contents($assets.'gs_panel.js').'</script>';

(new CHtmlPage())
	->setTitle('Teléfonos')
	->addItem(new CObject($html))
	->show();
