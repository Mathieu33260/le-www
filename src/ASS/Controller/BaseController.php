<?php

namespace ASS\Controller;

use ASS\Api\ApiClient\DefaultClient;
use ASS\Service\ListingService;
use ASS\Service\TrackerService;
use Monolog\Logger;
use Silex\Application;
use Symfony\Component\Security\Core\Exception\AuthenticationCredentialsNotFoundException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpFoundation\Request;

abstract class BaseController
{
    /**
     * @var \Silex\Application
     */
    protected $app;

    public function __construct(Application $app = null)
    {
        $this->app = $app;
        $this->app['googleanalytics']; // init ga abtest
    }

    protected function reguiresAuthenticated()
    {
        if (!$this->isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException();
        }
        return true;
    }

    public function requireRole($roles = [], $msg = '')
    {
        if (!is_array($roles)) {
            $roles = array_map('trim', explode(',', $roles));
        }

        foreach ($roles as $role) {
            if ($this->app['security']->isGranted('ROLE_'.strtoupper($role))) {
                return true;
            }
        }

        $this->app['logger']->warning('Role required : '. implode(' or ', $roles));

        throw new AccessDeniedHttpException($msg);
    }

    /**
     * @param string $role
     * @return boolean
     */
    public function hasRole($role)
    {
        return $this->app['security']->isGranted('ROLE_'.strtoupper($role));
    }

     /**
     * Check if current user is logged
     * @return boolean
     */
    protected function isAuthenticated()
    {
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return true;
        }
        return false;
    }

    /**
     * @return array
     */
    protected function getLoggedInUser()
    {
        if (!$this->isAuthenticated()) {
            return [];
        }

        if (!empty($this->app['security']->getToken()->getAttribute('user'))) {
            return $this->app['security']->getToken()->getAttribute('user');
        }
    }

    protected function newRelicNoticeError($msg, \Exception $ex)
    {
        if (function_exists('newrelic_notice_error')) {
            newrelic_notice_error($msg, $ex);
        }
    }

    protected function setNewRelicTransName($name)
    {
        if (function_exists('newrelic_name_transaction')) {
            newrelic_name_transaction($name);
        }
    }

    protected function addNewRelicCustomParam($key, $data)
    {
        if (function_exists('newrelic_add_custom_parameter')) {
            newrelic_add_custom_parameter($key, $data);
        }
    }

    /**
     * @return DefaultClient
     */
    protected function getDefaultClient()
    {
        return $this->app['apiclient.default'];
    }

    /**
     * @return Logger
     */
    protected function getLogger()
    {
        return $this->app['logger'];
    }

    /**
     * @return \ASS\Service\AuctionService
     */
    protected function getAuctionService()
    {
        return $this->app['service.auction'];
    }

    /**
     * @return \ASS\Service\ReservationService
     */
    protected function getReservationService()
    {
        return $this->app['service.reservation'];
    }

    /**
     * @return \ASS\Service\UserService
     */
    protected function getUserService()
    {
        return $this->app['service.user'];
    }

    /**
     * @return \ASS\Service\FlowService
     */
    protected function getFlowService()
    {
        return $this->app['service.flow'];
    }

    /**
     * @return \ASS\Service\PaiementService
     */
    protected function getPaymentService()
    {
        return $this->app['service.paiement'];
    }

    /**
     * @return \ASS\Service\OrderService
     */
    protected function getOrderService()
    {
        return $this->app['service.order'];
    }

    /**
     * @return \ASS\Service\CaptchaService
     */
    protected function getCaptchaService()
    {
        return $this->app['service.captcha'];
    }

    /**
     * @return TrackerService
     */
    protected function getTrackerService()
    {
        return $this->app['service.tracker'];
    }

    /**
     * @return \ASS\Service\LandingpageService
     */
    protected function getLandingpageService()
    {
        return $this->app['service.landingpage'];
    }

    protected function isApp(Request $request)
    {
        return $this->app['service.mobileApp']->isApp($request, $this->app['session']);
    }

    /**
     * Current & effective client ID
     * @return string Description
     */
    protected function getEffectiveClientId()
    {
        if ($this->app['session']->has('payclid')) {
            return $this->app['session']->get('payclid');
        } elseif ($this->app['service.user']->getMobileTokenClientId($this->app['session']->get('mobiletoken'))) {
            return $this->app['service.user']->getMobileTokenClientId($this->app['session']->get('mobiletoken'));
        } elseif ($this->isApp($this->app['request'])) {
            return $this->app['api.client.oauth']['webviewClientId'];
        } else {
            return $this->app['api.client.oauth']['clientId'];
        }
    }

    /**
     * @return ListingService
     */
    protected function getListingService(): ListingService
    {
        return $this->app['service.listing'];
    }
}
