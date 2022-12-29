<?php
echo '     Generating php config file'.PHP_EOL;
require_once __DIR__ . '/../../vendor/autoload.php';
$opt = getopt('p:');
$configDriver = new Igorw\Silex\YamlConfigDriver();
$files = [$opt['p'].'/app/config/config.yml',$opt['p'].'/app/config/security.yml'];
$config = [];
foreach ($files as $file) {
    if (!file_exists($file)) {
        throw new \Exception('Config file doesn\'t exist');
    }
    $config = array_replace_recursive($config, $configDriver->load($file));
}
file_put_contents($opt['p'] . '/app/config/config.cache.php', '<?php return ' . var_export($config, true) . ';');
echo '     Done generating php config file'.PHP_EOL;
