<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use ASS\Controller\BaseController;
use ASS\Service\UserService;

class GeolocController extends BaseController
{
    /**
     * @param Request
     * @param string $city
     */
    public function city(Request $request, $city)
    {
        $checkCity = $this->getDefaultClient()->getContentCached('/bigcity/', ['checkcity' => $city]);
        if ($request->isXmlHttpRequest()) {
            return new JsonResponse($checkCity);
        }

        /** @var ASS\Service\UserService $userService */
        $userService = $this->app['service.user'];
        $a_userProducts = json_encode($userService->getUserProducts(true));
        $sort = ($request->query->has('sort')) ? $request->query->get('sort'):'end-asc';

        $auctionTemplate = $this->app['twig']->render('auction/list/auctions.twig');

        $filters = $this->app['service.auction']->productCityFiltersDefault();

        return $this->app['twig']->render("geoloc/city.html.twig", [
            'auctionTemplate' => addslashes(str_replace(array('<br>','<br />',"\n","\r",'  ' ), array('','','','',''), trim($auctionTemplate))),
            'userProducts'    => $a_userProducts,
            'week'            => AuctionController::$WEEK_DAYS,
            'city'            => $checkCity,
            'filters'         => $filters,
            'sort'            => $sort,
            'stylesheets'     => [
                'style',
                'auctionsList',
            ],
        ]);
    }

    /**
     * @param Request
     */
    public function cities(Request $request)
    {
        $bigCities = $this->getDefaultClient()->getContentCached('/bigcity/', ['list' => 1]);

        return $this->app['twig']->render("geoloc/cities.html.twig", [
            'bigCities'    => $bigCities,
            'stylesheets'       => [
                'style',
                'city',
            ],
        ]);
    }
}
