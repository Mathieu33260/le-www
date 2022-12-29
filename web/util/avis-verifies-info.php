<?php

$config = include('../app/config/config.cache.php');

if(function_exists('newrelic_name_transaction')) {
    newrelic_set_appname($config['name'].'-'.$config['env'].';'.ini_get('newrelic.appname'));
    newrelic_name_transaction('/avis-verifies-info');
}

$avStr = file_get_contents('http://cl.avis-verifies.com/fr/cache/d/7/0/d70df594-0a4f-1214-9d62-8c50762d182b/AWS/d70df594-0a4f-1214-9d62-8c50762d182b_infosite.txt');
$avArr = explode(';', $avStr);
$avData = json_encode(['nb'=>$avArr[0], 'avg'=>$avArr[1]], true);

header('Content-Type: application/json');
header('Cache-Control: max-age=300, public');

echo $avData;