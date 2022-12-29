<?php

namespace ASS\Provider;

use ASS\Service\TrackerService;
use ASS\Trackers\AbstractTagBuilder;
use ASS\Trackers\EulerianTagBuilder;
use Silex\Application;
use Silex\ServiceProviderInterface;

class TrackerServiceProvider implements ServiceProviderInterface
{
    /**
     * Return from Service Container TagBuilders
     *
     * @param Application $app
     * @return array
     */
    private function getTrackersBuilder(Application $app)
    {
        $prefix = AbstractTagBuilder::getBuilderPrefix();
        $trackerKeys = array_filter($app->keys(), function ($key) use ($prefix) {
            return strpos($key, $prefix) !== false;
        });
        $trackers = [];
        foreach ($trackerKeys as $trackerKey) {
            $trackers[$trackerKey] = $app[$trackerKey];
        }
        return $trackers;
    }

    /**
     * @param Application $app
     */
    public function register(Application $app)
    {
        // Declare Eulerian Tracker.
        $app[EulerianTagBuilder::getContainerKey()] = $app->share(function () use ($app) {
            return new EulerianTagBuilder($app[EulerianTagBuilder::getConfigKey()] + [
                    'baseUrl' => $app['req']['baseUrl']
                ], $app['twig'], $app['service.user']);
        });

        /*
         * Define here new tracker extending AbstractTagBuilder class, the same way it's made for EA
         * Add New Tag Builder Here
         */

        $app['service.tracker'] = $app->share(function () use ($app) {
            $trackers = $this->getTrackersBuilder($app);
            return new TrackerService($trackers, $app['twig']);
        });
    }

    /**
     * @param Application $app
     *
     * (non-PHPdoc)
     * @see \Silex\ServiceProviderInterface::boot()
     */
    public function boot(Application $app)
    {
    }
}
