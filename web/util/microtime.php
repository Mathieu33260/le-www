<?php

$config = include('../app/config/config.cache.php');

if(function_exists('newrelic_name_transaction')) {
    newrelic_set_appname($config['name'].'-'.$config['env'].';'.ini_get('newrelic.appname'));
    newrelic_name_transaction('/getMicrotime');
}

$r = [
    'serverUnixMicroTime' => round(microtime(true)*1000)
];

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

// like JsonResponse
echo json_encode($r, 15);