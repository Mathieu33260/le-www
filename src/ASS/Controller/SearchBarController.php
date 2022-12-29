<?php

namespace ASS\Controller;

use ASS\Trackers\EulerianTagBuilder;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use ASS\Controller\BaseController;
use Symfony\Component\HttpFoundation\Response;

class SearchBarController extends BaseController
{

    public function getSuggestions(Request $request)
    {
        $tags = $this->app['apiclient.tag']->getTags()->getContent();
        $shortlocs = $this->app['apiclient.default']->getContentCached('/product/?suggestion=1');
        $bigcities = $this->getDefaultClient()->getContentCached('/bigcity/', ['suggestion' => 1]);
        $suggestion = ['tags' => $tags, 'shortLocs' => $shortlocs, 'bigcities' => $bigcities];

        return new JsonResponse($suggestion, 200);
    }

    public function getProducts(Request $request)
    {
        $bigcities = $this->getDefaultClient()->getContentCached('/bigcity/', ['suggestion' => 1]);
        $term = '';
        if ($request->query->has('q')) {
            $term = ucfirst(strtolower(remove_accents($request->query->get('q'))));

            if (in_array($term, $bigcities)) {
                return $this->app->redirect($this->app['url_generator']->generate('geoloc.city', ['city' => strtolower($term)]));
            }
        } else {
            return $this->app->redirect($this->app['url_generator']->generate('all.page'));
        }

        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        $a_userProducts = json_encode($userService->getUserProducts(true));

        $output = $this->app['twig']->render('auction/list.twig', [
            'week'              => AuctionController::$WEEK_DAYS,
            'tagTitle'          => '',
            'tagDesc'           => '',
            'searchTerm'        => $term,
            'noMap'             => true,
            'userProducts'      => $a_userProducts,
            'listName'          => 'Recherche',
            'filters'           => $this->app['service.auction']->productFiltersDefault(),
            'noSort'            => true,
        ]);
        return $output;
    }
}
