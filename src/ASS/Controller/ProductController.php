<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use ASS\Service\UserService;
use ASS\Controller\BaseController;

class ProductController extends BaseController
{
    use Traits\UserTrait;

    public static $WEEK_DAYS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    /**
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function listProduct()
    {
        return $this->app->redirect(
            $this->app['url_generator']->generate('all.page'),
            301
        );
    }

    /**
     * @param $id
     * @param Request $request
     *
     * @return mixed
     */
    // TODO: Manage auctionId for show multiple products.
    public function auction($id, Request $request)
    {
        // Exlude some products, @todo use database. product.public data need to be verified
        if (!$this->isAuthenticated() && in_array($id, $this->app['product.exclude'])) {
            return $this->app->redirect($this->app['url_generator']->generate('homepage'), 301);
        }

        $errorVip = null;
        if ($request->query->has('errorVip')) {
            $errorVip = $request->get('errorVip');
        }

        if ($request->query->has('bodyOnly') && $request->get('bodyOnly')) {
            $product = $this->app['apiclient.product']->getProduct($id)->getContent();
            $ret = $product['description'] . '<br/>' . $product['goThere'] . '<br/>' . $product['moreInfo'];
            return $ret;
        }

        if ($request->isXmlHttpRequest()) {
            return $this->requestAjax($request, $id);
        }

        if (strpos($id, '&') !== false) {
            $id = explode("&", $id)[0]; // Fix for broken tracked link
        }

        return $this->getAuctionService()->showProductAuction($id, 'normal', null, $errorVip, $request->query->get('json'));
    }

    /**
      * Request ajax for product data
      * @param Request $request
      * @return JsonResponse
      */
    public function requestAjax(Request $request, $id)
    {
        try {
            $data = $request->query->get('data');
            $retour = [];
            switch ($data) {
                case 'hasCurrentBid':
                    $this->setNewRelicTransName('/product.ajax.hasCurrentBid');
                    $url = sprintf('/product/%d/auction/', $id);
                    $query = $this->app['apiclient.default']->get($url, ['activesOnly' => true])->getContent();
                    $retour['result'] = false;

                    if (isset($query['running'])) {
                        $retour['result'] = true;
                        $retour['reservePrice'] = $query['running']['reservePrice']/100;
                    } elseif (isset($query['next'])) {
                        $retour['result'] = true;
                        $retour['reservePrice'] = $query['next']['reservePrice']/100;
                    }
                    break;
                case 'availabilities':
                    $this->setNewRelicTransName('/product.ajax.availabilities');
                    $retour = $this->availabilities($request, $id);
                    break;
                default:
                    throw new \Exception("invalid data");
            }
            return new JsonResponse($retour);
        } catch (\Exception $e) {
            return new JsonResponse(['retour'=>$e->getMessage()]);
        }
    }

    /**
     * @param Request $request
     * @param $id
     * @return array
     */
    private function availabilities(Request $request, $id)
    {
        $departureCities = array();
        $product = $this->app['apiclient.default']->getContentCached("/product/$id");

        if ($request->query->has('onlyProductAvailability') || $product['bookable'] == '1') {
            if ($request->query->has('onlyProductAvailability')) {
                $data = [
                    'product'           => $id,
                    'departureCity'     => $request->get('departureCity'),
                    'orderBy'           => 'dateTrip',
                    'orderByDirection'  => 'ASC',
                    'fromNow'           => '1',
                ];

                if (!empty($request->get('reservationId'))) {
                    $data['reservationId'] = $request->get('reservationId');
                }

                $availabilities = $this->app['apiclient.availability']->getAvailabilities($data)->getContent();

                $hasAvailable = $this->app['service.availabilites']->calendarHasAvailable(['availabilities' => $availabilities]);

                return ['availabilities'=>$availabilities, 'hasAvailable' => $hasAvailable];
            } else {
                $departureCities = $this->app['apiclient.default']->get($product['_links']['departureCities'])->getContent();
                foreach ($departureCities as $key => $departureCitie) {
                    $params = [
                        'product' => $id,
                        'departureCity' => $departureCitie['id'],
                        'orderBy' => 'dateTrip',
                        'orderByDirection' => 'ASC',
                        'fromNow' => '1'
                    ];
                    if ($request->query->has('auction')) {
                        $params['auctionId'] = $request->get('auction');
                    }
                    if ($request->query->has('relativeToNbDay')) {
                        $params['relativeToNbDay'] = $request->get('relativeToNbDay');
                    }
                    if ($request->query->has('noSoldout')) {
                        $params['noSoldout'] = $request->get('noSoldout');
                    }
                    $availabilities = $this->app['apiclient.default']->getContentCached('/availability/', $params);
                    $departureCities[$key]['availabilities'] = array();
                    if (count($availabilities)) {
                        $departureCities[$key]['availabilities'] = $availabilities;
                    }
                    $departureCities[$key]['hasAvailable'] = $this->app['service.availabilites']->calendarHasAvailable($departureCities[$key]);
                }
                usort($departureCities, function ($a, $b) {
                    return count($a['availabilities']) > 0 ? -1 : 1;
                });
            }
        } else {
            $params = [
                'product' => $id,
                'orderBy' => 'dateTrip',
                'orderByDirection' => 'ASC',
                'fromNow' => '1',
            ];
            if ($request->query->has('auction')) {
                $params['auctionId'] = $request->get('auction');
            }
            if ($request->query->has('relativeToNbDay')) {
                $params['relativeToNbDay'] = $request->get('relativeToNbDay');
            }
            $departureCities[0]['name'] = '';
            $departureCities[0]['id'] = 1;
            $departureCities[0]['availabilities'] = $this->app['apiclient.default']->getContentCached('/availability/', $params);
            $departureCities[0]['hasAvailable'] = $this->app['service.availabilites']->calendarHasAvailable($departureCities[0]);
        }
        return ['departureCities' => $departureCities];
    }

    public function addComment($id, Request $request)
    {
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $userId = $this->app['security']->getToken()->getUser();
            $params['product'] = $id;
            $params['comment'] = $request->request->get('comment');
            $params['score'] = $request->request->get('score');
            $params['user'] = $userId;

            try {
                if (mb_strlen($params['comment']) > 1000) {
                    throw new \Exception("Number of characters exceeded");
                }
                $res = $this->app['apiclient.feedback']->save($params)->getContent();
            } catch (\Exception $ex) {
                return new Response(json_encode(['msg'=>$ex->getMessage()]), 400);
            }

            return new Response(json_encode(['msg'=>$res]), 200);
        } else {
            return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => 'unauthenticated')));
        }
    }

    /**
     * @param $id
     * @return string
     */
    public function refreshCrossSellingAuction(Request $request, $id)
    {
        $crossSellingAuctions = $this->app['service.auction']->getCrossSellingAuction($id, $request->query->has('limit') ? $request->query->get('limit') : null);
        $view = [];

        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $userId = $this->app['security']->getToken()->getUser();
            $userService->refreshUser($userId);
            $view['userProducts'] = json_encode($userService->getUserProducts(true));
        }

        $view['auctions'] = $crossSellingAuctions;

        return json_encode($view);
    }

    /**
     * Google did index the POST endpoint. TODO : check later if Google still tries to access this URL
     */
    public function fixGoogleAddComment($id)
    {
        return $this->app->redirect($this->app['url_generator']->generate('product.auction', ['id' => $id]), 301);
    }

    /**
     * Use postman to post test text
     * @return string
     */
    public function testMetaDesc(Request $request)
    {
        $text = $request->request->get('text');
        $length = $request->request->get('length', 250);

        return $this->app['service.auction']->getProductMetaDesc(['description' => $text], $length);
    }
}
