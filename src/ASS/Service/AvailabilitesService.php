<?php

namespace ASS\Service;

use Symfony\Component\HttpFoundation\Request;
use CAC\Component\ApiClient\ApiDataException;

class AvailabilitesService
{

    use \ASS\Controller\Traits\UserTrait;

    private $app;

    public function __construct($app)
    {
        $this->app = $app;
    }

    /**
     * Check if this address has a data available
     * @param array $departureCities
     * @return boolean
     */
    public function calendarHasAvailable(array $departureCities)
    {
        $hasAvaialableDate = false;
        if (count($departureCities['availabilities']) > 0) {
            foreach ($departureCities['availabilities'] as $availabilitie) {
                if ($availabilitie['status'] != 'soldout') {
                    $hasAvaialableDate = true;
                    break;
                }
            }
        }
        return $hasAvaialableDate;
    }
}
