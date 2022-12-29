<?php
namespace ASS\Provider;

use ASS\Service\CaptchaService;
use ASS\Service\FlowService;
use ASS\Service\LandingpageService;
use ASS\Service\ListingService;
use ASS\Service\OrderService;
use ASS\Service\ReservationService;
use Silex\Application;
use Silex\ServiceProviderInterface;

use ASS\Service\UserService;
use ASS\Service\AuctionService;
use ASS\Service\PaiementService;
use ASS\Service\SliderService;
use ASS\Service\MobileAppService;
use ASS\Service\AvailabilitesService;
use ASS\Library\ResponseCacheEventSubscriber;

class ASSServiceProvider implements ServiceProviderInterface
{
    /**
     * (non-PHPdoc)
     * @see \Silex\ServiceProviderInterface::register()
     */
    public function register(Application $app)
    {
        $app['service.auction'] = $app->share(function () use ($app) {
            return new AuctionService($app);
        });
        $app['service.reservation'] = $app->share(function () use ($app) {
            return new ReservationService($app);
        });
        $app['service.user'] = $app->share(function () use ($app) {
            return new UserService($app);
        });
        $app['service.paiement'] = $app->share(function () use ($app) {
            return new PaiementService($app['apiclient.default'], $app);
        });
        $app['service.slider'] = $app->share(function () use ($app) {
            return new SliderService($app);
        });
        $app['service.mobileApp'] = $app->share(function () use ($app) {
            // Redis api-cache might not be available
            return new MobileAppService($app['api.baseurl'], $app['api.client.oauth']['webviewClientId'], $app['api.client.oauth']['webviewClientSecret'], $app['predis']['api-cache'] ?? null);
        });
        $app['service.availabilites'] = $app->share(function () use ($app) {
            return new AvailabilitesService($app);
        });
        $app['service.flow'] = $app->share(function () {
            return new FlowService();
        });
        $app['service.order'] = $app->share(function () use ($app) {
            return new OrderService($app['apiclient.default']);
        });
        $app['service.captcha'] = $app->share(function () use ($app) {
            return new CaptchaService();
        });
        $app['service.landingpage'] = $app->share(function () use ($app) {
            return new LandingpageService($app['apiclient.default'], $app['session']);
        });
        $app['service.listing'] = $app->share(function () {
            return new ListingService();
        });
    }

    /**
     * (non-PHPdoc)
     * @see \Silex\ServiceProviderInterface::boot()
     */
    public function boot(Application $app)
    {
        $app['dispatcher']->addSubscriber(new ResponseCacheEventSubscriber($app));
        $app['dispatcher']->addSubscriber(new \ASS\Library\AllowOriginListener($app));
    }
}
