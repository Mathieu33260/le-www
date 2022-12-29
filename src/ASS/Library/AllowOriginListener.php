<?php

namespace ASS\Library;

use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allow Origin Listener
 *
 * This Listener adds the Allow-Origin header to the Response. This allows other domains to connect
 * through the API.
 *
 * @todo Add domain configuration
 *
 * Please see https://gist.github.com/gunnarlium/5834023
 */
class AllowOriginListener implements EventSubscriberInterface
{
    public function onKernelRequest(GetResponseEvent $event)
    {
        if (HttpKernelInterface::MASTER_REQUEST !== $event->getRequestType()) {
            return;
        }
        $request = $event->getRequest();

        // skip if not a CORS request
        if (!$request->headers->has('Origin')) {
            return;
        }

        // perform preflight checks
        if ('OPTIONS' === $request->getMethod()) {
            $resp = new Response();
            $resp->headers->set('Access-Control-Request-Method', 'POST, GET, OPTIONS, DELETE');
            $resp->headers->set('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, allow-origin,content-type,x-gpsid,x-iphone-unique-device-identifier,x-mobile-apns-token,x-mobile-ga-cid,x-mobile-idfa,x-operating-system,x-system-version');
            $event->setResponse($resp);
            return;
        }
    }

    /**
     * Handle the Kernel Response event
     *
     * @param FilterResponseEvent $event
     */
    public function onKernelResponse(FilterResponseEvent $event)
    {
        if (HttpKernelInterface::SUB_REQUEST === $event->getRequestType()) {
            // When having a subrequest we don't care about the header
            return;
        }

        $request = $event->getRequest();

        // skip if not a CORS request
        if (!$request->headers->has('Origin') || $request->headers->get('Origin') !== 'http://localhost:8080') {
            return;
        }

        $response = $event->getResponse();
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:8080');
    }

    public static function getSubscribedEvents()
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10000],
            KernelEvents::RESPONSE  => ['onKernelResponse', -1024]
        ];
    }
}
