<?php

/**
 * Minimal app for webprofiler
 * Does not use ASS-SDK Oauth and does not pollute logs
 */

require_once __DIR__ . '/../../vendor/autoload.php';
$app = new Silex\Application();

// Load configuration files.. Overwriting default config values of Base Service Providers
$app->register(new Igorw\Silex\ConfigServiceProvider(__DIR__ . "/../../app/config/config.cache.php"));
$app->register(new Silex\Provider\UrlGeneratorServiceProvider());
$app->register(new Silex\Provider\TwigServiceProvider());
$app->register(new Silex\Provider\ServiceControllerServiceProvider()); // Usefull in prod too for using controoller as services
$app->register(new Silex\Provider\HttpFragmentServiceProvider()); // Required with Symfony 2.8 to get the web profiler
$app->register(new Silex\Provider\WebProfilerServiceProvider(), array(
    'profiler.cache_dir' => $app['cache.dir'].'/profiler',
    'profiler.mount_prefix' => '/_profiler', // this is the default
));

$app->run();
