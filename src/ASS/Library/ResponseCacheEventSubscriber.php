<?php

namespace ASS\Library;

use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ResponseCacheEventSubscriber implements EventSubscriberInterface
{
    private $app;

    public function __construct(\Silex\Application $app)
    {
        $this->app = $app;
    }

    /**
     * Add Caching headers
     *
     * @param FilterResponseEvent $event
     */
    public function onResponse(FilterResponseEvent $event)
    {
        $request = $event->getRequest();

        if (!$request->isMethod('GET')) {
            return;
        }

        $response = $event->getResponse();

        $this->defineCacheControl($response);
    }

    /**
     * Tweak response header for HTTP cache based on controllers directives
     */
    private function defineCacheControl(Response $response)
    {
        if (isset($this->app['response.maxage'])) {
            $maxAge = $this->app['response.maxage'];
            $response->headers->set('cache-control', 'max-age='.$maxAge);
        }
        if (isset($this->app['response.nostore'])) {
            $response->headers->set('cache-control', 'private, max-age=0, no-cache, no-store');
        }
    }

    /**
     * (non-PHPdoc)
     * @see \Symfony\Component\EventDispatcher\EventSubscriberInterface::getSubscribedEvents()
     */
    public static function getSubscribedEvents()
    {
        return array(
            KernelEvents::RESPONSE => 'onResponse'
        );
    }
}
