<?php
echo '     Generating Webpack Json manifest cache for PHP'.PHP_EOL;
$opt = getopt('p:');

$config = include($opt['p'].'/app/config/config.cache.php');

$modernManifestJson = [];
$legacyManifestJson = [];
$manifestJson = [];

if (file_exists($config['assets']['json_modern_manifest_path'])) {
    $modernJson = file_get_contents($config['assets']['json_modern_manifest_path']);
    $modernManifestJson = json_decode($modernJson, true);
}

if (file_exists($config['assets']['json_legacy_manifest_path'])) {
    $legacyJson = file_get_contents($config['assets']['json_legacy_manifest_path']);
    $legacyManifestJson = json_decode($legacyJson, true);
}

if (file_exists($config['assets']['json_manifest_css_path'])) {
    $json = file_get_contents($config['assets']['json_manifest_css_path']);
    $manifestJson = array_merge(json_decode($json, true), $modernManifestJson, $legacyManifestJson);
}

$cacheContent = ['assets'=>['manifest_content'=>$manifestJson]];

file_put_contents($opt['p'] . '/app/config/webpack.manifestjson.cache.php', '<?php return ' . var_export($cacheContent, true) . ';');

echo '     Done generating php manifest cache'.PHP_EOL;
