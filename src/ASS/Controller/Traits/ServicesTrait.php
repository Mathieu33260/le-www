<?php

namespace ASS\Controller\Traits;

trait ServicesTrait
{
    /**
     * @return \Psr\Log\LoggerInterface
     */
    public function getLogger()
    {
        return $this->app['logger'];
    }

    /**
     * @return \ASS\Service\AuctionService
     */
    public function getAuctionService()
    {
        return $this->app['service.auction'];
    }

    /**
     * @return \ASS\Service\ReservationService
     */
    public function getReservationService()
    {
        return $this->app['service.reservation'];
    }
}
