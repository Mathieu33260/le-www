<?php

namespace ASS\Service;

use ASS\Api\ApiClient\DefaultClient;
use ASS\Controller\AuctionController;
use ASS\Controller\Traits\UserTrait;
use ASS\Trackers\EulerianTagBuilder;

class AuctionService
{

    use UserTrait;

    private $app;
    private $userLogged = false;

    /**
     * AbTest name on auction view
     * @var string
     */
    private $abTestOnAuctionView = null;

    /**
     * Optional callable function that acts as a condition for AbTest
     * @var callable
     */
    private $abTestOnAuctionViewEnable = null;

    /** @var TrackerService */
    private $trackerService;

    /** @var DefaultClient */
    private $client;

    public function __construct($app)
    {
        $this->app = $app;
        $this->userLogged = $this->app['security']->isGranted('IS_AUTHENTICATED_FULLY');
        $this->client = $this->app['apiclient.default'];
        $this->trackerService = $this->app['service.tracker'];
    }

    /**
     * Load your GA abtest Key before calling showProductAuction
     * Then the GA variation value will be available in 'abTestVariation' twig variable
     * in auction/detail.twig template.
     * You can use second parameter to enable AbTest on specific product conditions
     *
     * @param String $abTestKey
     * @param callable(array $dataView):boolean $abTestEnable
     *        closure to enable abTest on specific conditions
     */
    public function loadAbTestOnAuctionView(String $abTestKey, callable $abTestEnable = null): void
    {
        $this->abTestOnAuctionView = $abTestKey;
        $this->abTestOnAuctionViewEnable = $abTestEnable;
    }

    public static function getSecondsLeft($auctionEnd)
    {
        $today = new \DateTime();

        // Show time before countdown.
        $auctionEndEpoch = strtotime(date($auctionEnd));
        $numberOfSeconds = $auctionEndEpoch - $today->getTimestamp() - 1;
        return $numberOfSeconds;
    }

    public static function enrichAuction($auction, $addClass = null)
    {
        $more = [];

        // Show time before countdown.
        $numberOfSeconds = self::getSecondsLeft($auction['auction_end']);
        $numberOfSeconds = $numberOfSeconds > 0 ? $numberOfSeconds : 1;

        $hours = floor($numberOfSeconds / 3600);
        $minutes = floor(($numberOfSeconds - ($hours * 3600)) / 60);
        $seconds = floor($numberOfSeconds - ($hours * 3600) - ($minutes * 60));
        $more['hours'] = $hours < 10 ? '0'.$hours : $hours;
        $more['minutes'] = $minutes < 10 ? '0'.$minutes : $minutes;
        $more['seconds'] = $seconds < 10 ? '0'.$seconds : $seconds;

        if ($addClass != null) {
            $more['addClass'] = $addClass;
        }

        return $more;
    }

    public function getCrossSellingAuction($productId, ?int $limit)
    {
        $params = ['crossSelling' => 1 , 'productId' => $productId];

        if ($limit) {
            $params['limit'] = $limit;
        }

        $crossSellingAuctions = $this->app['apiclient.search']->getRunningAuctionsContent($params); // Force cache for logged in users

        foreach ($crossSellingAuctions as $k => $auctionCrossSell) {
            $crossSellingAuctions[$k] = array_merge($crossSellingAuctions[$k], $this->enrichAuction($auctionCrossSell, 'crossAuction'));
        }

        return $crossSellingAuctions;
    }

    public function showProductAuction($id, $for = 'normal', $auctionId = null, $errorVip = null, $json = false)
    {
        $dataView = [
            'onlytabs'              => $this->app['request']->query->get('onlytabs')? intval($this->app['request']->query->get('onlytabs')):0,
            'onlyview'              => $this->app['request']->query->get('onlyview') || ($this->isApp() && !$this->app['request']->query->get('onlytabs'))?1:0,
            'newProductId'          => null,
            'userHash'              => '',
            'refer'                 => '',
            'bids'                  => [],
            'userAutoBids'          => [],
            'smsData'               => [],
            'userVouchers'          => [],
            'reservePricePassed'    => false,
            'isPrivate'             => false,
            'groupMessage'          => null,
            'bigimage'              => null,
            'userid'                => 0,
            'winnerShare'           => 0,
            'winner'                => [],
            'canAccess'             => true,
            'errorVip'              => $errorVip,
            'hasNextAuction'        => false,
        ];

        $dataView['useCrossSelling'] = !$dataView['onlyview'] && $for !== 'availability' && $auctionId === null ? true : false;

        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        $userId = null;
        if ($this->userLogged) {
            $userId = $this->app['security']->getToken()->getUser();
            $dataView['userid'] = $userId;
            $userService->refreshUser($dataView['userid']);
            $userToken = $this->app['security']->getToken();
            $a_user = $userToken->getAttribute('user');
        }

        // Do not support 1.4 <= apps < 1.5 anymore
        if ($dataView['onlytabs'] == 1) {
            return $this->app['twig']->render('auction/appOutOfDate.twig');
        }

        if ($for == 'winnerShare') {
            $dataView['winnerShare'] = 1;
            $for = 'normal';
        }

        // get product
        $data = $this->app['apiclient.default']->getContentCached('/product/'.$id, ['webAuction' => 1]);
        $product = $data['product'];
        if ($product['crossSelling_id']) {
            $dataView['isWithPayCrossSelling'] = $this->app['apiclient.default']->getContentCached('/crossselling/' . $product['crossSelling_id'])['isWithPay'];
        }

        // format html link
        $pattern = "~(href=\"(http|https):(?!\\/\\/(?:www\\.)?loisirsencheres\\.com)[^\"]*\")~is";
        $replace = "$1 target=\"_blank\" rel=\"nofollow\"";
        $product['description'] = preg_replace($pattern, $replace, $product['description']);
        $product['goThere'] = preg_replace($pattern, $replace, $product['goThere']);
        $product['moreInfo'] = preg_replace($pattern, $replace, $product['moreInfo']);
        $dataView['schema']['product'] = ($product['shortPrice'] !== null && $product['shortPrice'] !== '')?true:false;
        $dataView['feedbackStatus'] = $data['feedbackStatus'];

        if ($auctionId) {
            $dataAuction = $this->app['apiclient.default']->getContentCached('/auction/'.$auctionId, ['with'=>'agreement,groups,autobidStatus,minibidStatus,maxbidStatus']);
            $isASpecificAuction = true;
        } else {
            $isASpecificAuction = false;
            $dataAuction = $this->app['apiclient.default']->getContentCached('/product/'.$id.'/auction/onlyOneForWeb');
            // No auction yet for this product
            if (empty($dataAuction['auction'])) {
                $dataAuction['auction'] = [];
                $dataAuction['groups'] = [];
                $dataAuction['agreement'] = [];
            }
        }

        // get auction settings
        $settingsAuctionId = null;
        if ($auctionId) {
            $settingsAuctionId = $auctionId;
        } else {
            if (array_key_exists('id', $dataAuction['auction'])) {
                $settingsAuctionId = $dataAuction['auction']['id'];
            }
        }
        if ($settingsAuctionId) {
            $uri = "/auction/$settingsAuctionId/setting/?forWeb=1";
            $settings = $this->app['apiclient.default']->getContentCached($uri);
            $dataAuction['auction'] = array_merge($dataAuction['auction'], $settings['auction']);
            $dataAuction['quickOverbidData'] = $settings['quickOverbidData'];
        }

        $auction = $dataAuction['auction'];

        // Get dataview of the next auction
        $dataView = $this->getNextAuctionDataView($dataView, $id, $userId, $auction);

        $isRunning = $this->isRunning($auction);
        $isFinished = $this->isFinished($auction);

        if ($this->userLogged && $for === 'normal') {
            if ($auctionId === null) {
                $userproductspending = isset($a_user['userproductspending']) ? $a_user['userproductspending'] : [];
                if (isset($userproductspending[$id])) {
                    $auctions = $this->app['apiclient.default']->get("/user/{$dataView['userid']}/auction/", ['forUserAuctions' => 1, 'status' => 'pending'])->getContent();
                    foreach ($auctions['auctionsPending'] as $row) {
                        if ($row['product_id'] == $id) {
                            $url = $this->app['url_generator']->generate('auction.detail.title', ['id' => $row['auctionId'], 'title' => sanitize_string_with_dashes(null, $row['name'])]);
                            if (!$dataView['onlytabs'] && !$dataView['onlyview']) {
                                return $this->app->redirect($url);
                            } else {
                                $dataView['redirect'] = "comloisirsencheres://auction/{$row['auctionId']}";
                                $auctionId = $row['auctionId']; // Fix the data
                                $dataAuction = $this->app['apiclient.default']->getContentCached('/auction/' . $auctionId, ['with' => 'agreement,groups,autobidStatus,minibidStatus,maxbidStatus']);
                                $auction = $dataAuction['auction']; // Fix the data
                                $isRunning = $this->isRunning($auction); // Fix the data
                            }
                        }
                    }
                }
            }

            /*if ($isRunning && $product['category'] === 'TO') {
                // Abtest chooseDate
                $chooseDateVariation = intval($this->app['apiclient.default']->get("/user/{$dataView['userid']}/setting/chooseDate?forAbTest=1&nbVariation=2")->getContent()) - 1;
                $dataView['chooseDateVariation'] = $this->app['googleanalytics']->setVariation('chooseDate', $chooseDateVariation)->getOrInitOurVariation('chooseDate');
            }*/
        }

        $dataView['isPlanned'] = $dataView['hasNextAuction'] && !$isRunning && empty($auctionId);
        $id = empty($auction['product']) ? $id : $auction['product']; // In case $id was SKU

        if (!$auction && $for == 'normal') {
            $this->app['session']->getFlashBag()->add('error', 'Aucune enchère pour cette offre');
            return $this->app->redirect($this->app['url_generator']->generate('all.page'));
        }

        if ($auction) {
            $auctionId = $auction['id'];
            $bids = [];
            if ($for !== 'availability') {
                $dataView['newProductId'] = $this->getNewProductId($auction, $product);
                if (!$isASpecificAuction && $for === 'normal' && $dataView['newProductId']) {
                    // Redirect to the new product
                    return $this->app->redirect($this->app['url_generator']->generate('product.auction', ['id' => $dataView['newProductId']]), 301);
                }
                $auction['reduction'] = null;
                if ($auction['status'] == 'complete') {
                    $bids = $this->app['apiclient.default']->getContentCached(sprintf('/auction/%d/bid/', $auctionId), ['query' => '1']);
                    $dataView['winner'] = $this->getWinner($bids);
                    $dataView['bids'] = $bids;
                    $auction['reduction'] = $this->getReduction($product, $dataView['winner']);
                    if ($dataView['winnerShare']) {
                        $this->app['session']->set('godfatherId', $dataView['winner']['id']);
                    }
                }
            }
        } elseif ($for == 'admin' || $for == 'print') {
            $now = new \DateTime();
            $end = clone $now;
            $end->modify('+ 24 hours');
            $auction = [
                'id' => 0,
                'uuid' => 'noop',
                'cost' => -100,
                'hasReservePrice' => $product['reservePrice']?true:false,
                'name' => $product['name'],
                'start' => $now->format(\DateTime::ISO8601),
                'end' => $end->format(\DateTime::ISO8601),
                'status' => 'planned',
            ];
            $bids = [];
        }

        // user datas
        $nbCommentsAuthorized = 0;
        if ($this->userLogged) {
            $dataView['userid'] = isset($userToken) ? $userToken->getUser() : $this->app['security']->getToken()->getUser();
            $dataView['userHash'] = $a_user['userHash'];

            $dataView = $dataView + $this->smsAlertData(isset($a_user)?$a_user:null, $auctionId);
            $dataView['userVouchers'] = $this->app['apiclient.voucher']->getVouchers(['user' => $dataView['userid'], 'product' => $product['id'], 'withRefundStatus' => true])->getContent();
            if (count($dataView['userVouchers'])) {
                foreach ($dataView['userVouchers'] as $voucher) {
                    if (!$voucher['isRefunded']) {
                        $nbCommentsAuthorized++;
                    }
                }
            }

            // get current user autobid
            if ($for == 'admin' || $for == 'print') {
                $userAutoBids = [];
            } else {
                $userAutoBids = $this->app['apiclient.default']->get("auction/$auctionId/autobid/", ['user' => $dataView['userid'], 'status' => 'accepted'])->getContent();
            }
        }

        if (count($dataAuction['groups']) > 0 && $isRunning) {
            $dataView['isPrivate'] = true;
            if ((!$dataView['onlytabs'] ||! $dataView['onlyview']) && $this->isApp()) {
                $dataView['onlyview'] = 1;
            }
            if (!$this->userLogged) {
                $dataView['canAccess'] = true;
            } else {
                $dataView['groupMessage'] = $dataAuction['groups'][0]['accessMessage'];
                $groupids = array_map(function ($elem) {
                    return $elem['id'];
                }, $dataAuction['groups']);
                $userGroups = $this->app['apiclient.default']->get("/user/{$a_user['id']}/group/")->getContent();
                $userGroupIds = array_map(function ($elem) {
                    return $elem['id'];
                }, $userGroups);
                $common = array_intersect($groupids, $userGroupIds);
                if (count($common) == 0) {
                    $dataView['canAccess'] = false;
                }
            }
        }

        // images
        $dataView['images'] = $data['images'];
        if (empty($dataView['images'][0])) {
            $this->app['logger']->warning('No image for product id:'.$id);
        } else {
            $dataView['bigimage'] = $dataView['images'][0]; // select big image
        }
        $dataView['hasYoutube'] = in_array('video', array_column($dataView['images'], 'type'));

        $this->app['response.nostore'] = true;

        // overBid
        $overBidVariation = 2; // 1 (Valeur direct) or 2 (Surenchère) - Winner
        if ($isRunning) {
            if ($userService->isAuthenticated()) {
                $userService->setSettingValue($a_user, 'overBid', $overBidVariation, 'default');
            }
        }

        $dataView['overBidVariation'] = $overBidVariation;
        $dataView['quickOverbidData'] = isset($dataAuction['quickOverbidData']) && $isRunning ? $dataAuction['quickOverbidData'] : [];
        $dataView['userProducts'] = json_encode($userService->getUserProducts(true));
        $dataView['checkoutFlow'] = $this->getCheckoutFlow($product['flow']);
        $dataView['checkoutFlow']['hasSeclectableDate'] = false;
        $dataView['auction'] = $auction;
        $dataView['product'] = $product;
        $dataView['isRunning'] = $isRunning;
        $dataView['userAutoBids'] = $this->userLogged ? $userAutoBids : [];
        $dataView['metaDesc'] = $product['metaDesc'] !== null && $product['metaDesc'] !== '' ? $product['metaDesc'] : $this->getProductMetaDesc($product, 155);
        $dataView['metaDescFb'] = $product['metaDesc'] !== null && $product['metaDesc'] !== '' ? $product['metaDesc'] : $this->getProductMetaDesc($product, 260);
        $dataView['tags'] = $data['tags'];
        $dataView['limitPerPerson'] = $dataAuction['agreement'] ? $dataAuction['agreement']['limitPerPerson'] : null;
        $dataView['isFinished'] = $isFinished;
        $dataView['phoneMandatory'] = in_array($product['id'], [345, 352]);
        $dataView['location'] = (!isset($data['location']['lat']) || !isset($data['location']['lng'])) ? null:$data['location'];
        $dataView['logo'] = $data['logo'];
        $dataView['merchant'] = $data['merchant'];
        $dataView['week'] = AuctionController::$WEEK_DAYS;
        $dataView['feedbacks'] = $data['feedbacks']['feedbacks'];
        $dataView['feedbackInfo'] = [
            'avg'                   => $data['feedbacks']['avg'],
            'nb'                    => $data['feedbacks']['nb'],
            'nbCommentsAuthorized'  => $nbCommentsAuthorized
        ];

        if ($for !== 'availability') {
            if (!empty($auction['reservePrice']) && count($bids)) {
                $dataView['reservePricePassed'] = ($bids[0]['amount'] / $auction['reservePrice']) >= 1;
                if ($auction['status'] == 'complete') {
                    $dataView['winner']['reservePricePassed'] = $dataView['reservePricePassed'];
                }
            }

            // Show time before countdown.
            $today           = new \DateTime();
            $auctionEnd      = strtotime(date($auction['end']));
            $numberOfSeconds = $auctionEnd - $today->getTimestamp() - 1;
            $hours   = floor($numberOfSeconds / 3600);
            $minutes = floor(($numberOfSeconds - ($hours * 3600)) / 60);
            $seconds = floor($numberOfSeconds - ($hours * 3600) - ($minutes * 60));
            $dataView['hours'] = $hours < 10 ? '0'.$hours : $hours;
            $dataView['minutes'] = $minutes < 10 ? '0'.$minutes : $minutes;
            $dataView['seconds'] = $seconds < 10 ? '0'.$seconds : $seconds;
            $dataView['limitPerPersonStatus'] = $this->getLimitPerPersonStatus($dataAuction['agreement'], $dataView['userVouchers']);
        }

        if ($this->userLogged) {
            if ($for === 'availability' || ($auction && $auction['status'] == 'complete' && (isset($bids[0]) && $bids[0]['userId'] == $a_user['id']))) {
                $dataView['forPayment'] = true;
                $dataView['payment'] = null;
                $userAuctions = $this->app['apiclient.default']->get("/user/{$dataView['userid']}/auction/", ['forUserAuctions' => 1])->getContent();
                $find = false;
                foreach ($userAuctions as $auctions) {
                    foreach ($auctions as $auction) {
                        if ($auction['id'] == $auctionId) {
                            $find = true;
                            $dataView['payment'] = [
                                'id' => $auction['id'],
                                'verification_token' => $auction['verification_token'],
                                'amount' => $auction['amount'],
                            ];
                            $dataView['winner']['paymentLinkMobile'] = $auction['paymentLinkMobile'];
                            $dataView['winner']['paymentLink'] = $auction['paymentLink'];
                            $dataView['winner']['auction']['payment'] = $auction['id'];
                            $dataView['winner']['auction']['status'] = $auction['status'];

                            break 2;
                        }
                    }
                }
                if (!$find) {
                    $dataView['winner']['auction']['status'] = 'failed';
                }
            }
        }

        $dataView['for'] = $for;
        $dataView['masterTagId'] = $data['masterTag'];
        if (!$json && $this->app['googleanalytics'] && $this->abTestOnAuctionView) {
            $enableCallbackFunction = $this->abTestOnAuctionViewEnable;
            if ($enableCallbackFunction === null || $enableCallbackFunction($dataView)) {
                if ($this->userLogged) {
                    $user = $this->app['security']->getToken()->getAttribute('user');
                    $abTestVariation = $this->app['service.user']->getSettingValue($user, $this->abTestOnAuctionView);
                    // If user logged we try to retrieve GA variation from userSettings
                    if ($abTestVariation) {
                        $dataView['abTestVariation'] = $abTestVariation;
                    } else {
                        // if not found we call GA and store it in userSettings
                        $dataView['abTestVariation'] = $this->app['googleanalytics']->getOrInitOurVariation($this->abTestOnAuctionView);
                        $this->app['service.user']->setSettingValue(
                            $user,
                            $this->abTestOnAuctionView,
                            $dataView['abTestVariation'],
                            'abtest'
                        );
                    }
                } else {
                    $dataView['abTestVariation'] = $this->app['googleanalytics']->getOrInitOurVariation($this->abTestOnAuctionView);
                }
            }
        }
        $dataView['encartBidmodule'] = $data['advertBidmodule'];

        // Eulerian Tag
        $this->trackerService->buildTags([
            EulerianTagBuilder::getContainerKey() => function () use ($dataView) {
                $additionalEAData = [
                    'pagegroup' => 'page produit'
                ];
                return $additionalEAData + [
                    'prdref' => $dataView['product']['id'],
                    'prdgroup' => $dataView['product']['category'],
                    'prdname' => $dataView['product']['name'],
                ];
            }
        ]);

        $dataOut = $dataView + $this->getPrintData($id, $for);

        if (in_array('no-banner', $data['tags'])) {
            $dataOut['isBannerDisplayed'] = false;
        } else {
            $now = date('Y-m-d H:i:s');
            $dataOut['isBannerDisplayed'] = $data['product']['category'] === 'TO' && ($now > '2018-09-13 00:00:01' && '2018-09-16 23:23:59' > $now);
            //$dataOut['isBannerDisplayed'] = !empty(array_intersect($data['tags'], ['sejour', 'hotels', 'vacances', 'weekend', 'camping', 'hotel+vol', 'toussaint', 'marrakech', 'europe', 'sejours']));
        }

        if (!$json) {
            // Define path href for btn 'Voir toute les enchères'
            $dataOut['seeAllPath'] = $this->seeAllPath($dataOut['tags'], isset($data['masterTag']['name']) ? $data['masterTag']['name'] : '');

            $dataOut['stylesheets'] = [
                'style',
                'product',
                'auctionsList',
            ];

            return $for == 'print' ? $this->app['twig']->render('auction/print.twig', $dataOut) : $this->app['twig']->render('auction/detail.twig', $dataOut + [
                'useTwitterShare' => true,
            ]);
        } else {
            return new \Symfony\Component\HttpFoundation\JsonResponse($dataOut);
        }
    }

    /**
     * Define the link for btn See all auctions
     * @param array $tags
     * @param string $masterTag
     * @return mixed
     */
    private function seeAllPath(array $tags, string $masterTag)
    {
        $hasEnfoiresTag = in_array('enfoires', $tags);
        if ($hasEnfoiresTag) {
            return $this->app['url_generator']->generate('landing.event', ['alias' => 'enfoires']);
        }

        if (isset($_SERVER['HTTP_REFERER'])) {
            /** @var String $leIsReferer - The refere is LE domaine **/
            $leIsReferer = strpos($_SERVER['HTTP_REFERER'], $this->app['cdn-www.host']) !== false;
            if ($leIsReferer) {
                $path = explode($this->app['cdn-www.host'], $_SERVER['HTTP_REFERER'])[1];
                preg_match_all('/(\/)(.*)(\/)([a-z0-9-+_]+)/m', $path, $aUrl, PREG_SET_ORDER, 0);
                if (!empty($aUrl) && $aUrl[0][2] === 'ville') {
                    return $this->app['url_generator']->generate('geoloc.city', [
                        'city' => $aUrl[0][4],
                    ]);
                }
            }
        }
        if (!empty($masterTag)) {
            // Find tag master
            return $this->app['url_generator']->generate('category.name', [
                'name' => $masterTag,
            ]);
        }

        return $this->app['url_generator']->generate('all.page');
    }

    private function getPrintData($productId, $for)
    {
        if ($for == 'print') {
            return [
                'availabilitiesHTML' => $this->app['apiclient.default']->get("product/$productId/availability/", ['render'=>1,'format'=>'html'])->getContent()
            ];
        }

        return [];
    }

    /**
     *
     * @return int|null
     */
    private function getNewProductId($auction, $product)
    {
        // Fetch running or next auction in case the product was renewed
        if (strtotime(date($auction['end']))<time()-2) {
            if ($product['sku']) {
                $activeAuctions2 = $this->app['apiclient.default']->getContentCached('/product/'.$product['sku'].'/auction/', ['activesOnly' => true]);
                $activeAuction2 = null;
                if (isset($activeAuctions2['running']) || isset($activeAuctions2['next'])) {
                    $activeAuction2 = isset($activeAuctions2['running'])?$activeAuctions2['running']:$activeAuctions2['next'];
                }
                if ($activeAuction2 && $activeAuction2['id'] !== $auction['id']) {
                    return $activeAuction2['product_id'];
                }
            }
        }
    }

    private function getWinner(array $bids)
    {
        foreach ($bids as $bid) {
            if ($bid['status'] === 'won' || $bid['status'] === 'lealoo') {
                $query = $this->app['apiclient.default']->get('/user/'.$bid['userId'])->getContent();
                $winner['userHash'] = $query['userHash'];
                $winner['bid'] = $bid;
                $winner['name'] = $bid['fullName'];
                $winner['auction']['amount'] = $bid['amount'];
                $winner['winningBidDate'] = date_format(date_create($bid['created']['date']), 'Y-m-d H:i:s');
                $winner['user'] = ['userHash' => $bid['userHash'], 'name' => $bid['fullName'], 'id' => $bid['status'] === 'lealoo' ? '' : $query['id']];
                if ($bid['status'] === 'lealoo') {
                    $winner['looser'] = [
                        'id' => $query['id'],
                        'name' => $bid['fullName']
                    ];
                }

                return $winner;
            }
        }
        return [];
    }

    private function getReduction($product, $winner)
    {
        $onlyPrice = $product['publicPrice'];
        if ($onlyPrice !== null && !empty($winner['bid'])) {
            return $onlyPrice-$winner['bid']['amount']/100;
        } else {
            return null;
        }
    }

    private function getLimitPerPersonStatus($agreement, $userVouchers)
    {
        $limitPerPersonStatus = 0; // 0: no problem, 1: limit reached but the merchant allow gifts (warn the user), 2: limit reached and the merchant does not allow gifts or it was already gifted to many times (do not allow bids)
        $notRefundedVoucher = array_filter($userVouchers, function ($voucher) {
            return !$voucher['isRefunded'];
        });
        if ($agreement != null && $agreement['limitPerPerson'] != null) {
            $limit = $agreement['limitPerPerson'];
            if (count($notRefundedVoucher) >= $limit) {
                $limitPerPersonStatus = 2;
                if ($agreement['canBeGifted']) {
                    $limitPerPersonStatus = 1;
                    if ($agreement['giftNumber'] != null) {
                        $limit += $agreement['giftNumber'];
                        if (count($notRefundedVoucher) >= $limit) {
                            $limitPerPersonStatus = 2;
                        }
                    }
                }
            }
        }
        return $limitPerPersonStatus;
    }

    /**
     * @return boolean
     */
    private function isRunning(array $auction)
    {
        $isRunning = false;
        $now = new \DateTime();
        $nowIso = $now->format(\DateTime::ISO8601);
        if ($auction && $auction['status'] == 'planned' && $auction['start']<$nowIso) {
            $isRunning = true;
        } elseif (!$auction) {
            $this->app['logger']->info('isRunning no auction');
        } else {
            $afterNowIso = $now->add(new \DateInterval('PT5M'))->format(\DateTime::ISO8601);
            $beforeIso = $now->sub(new \DateInterval('P1D'))->format(\DateTime::ISO8601);

            // Finished not long time ago or in the futur
            if ($auction['end'] > $beforeIso) {
                $this->app['logger']->info('isRunning=false', [
                    'auctionId' => $auction['id'],
                    'auctionUuid' => $auction['uuid'],
                    'product' => $auction['product'],
                    'status' => $auction['status'],
                    'start' => $auction['start'],
                    'end' => $auction['end'],
                    'now' => $nowIso,
                    'a' => ($auction['end']<$nowIso?'isFinished':($auction['end']>$nowIso?'notFinished':'finishing')),
                    'b' => $auction['start']<$afterNowIso?'isWillStart':'notWontStart',
                ]);
            }
        }

        return $isRunning;
    }

    /**
     * @return boolean
     */
    private function isFinished(array $auction)
    {
        $isFinished = false;
        $now = new \DateTime();
        if (!empty($auction)) {
            if (array_key_exists('status', $auction) && $auction['status'] !== 'planned' || $auction['end'] < $now->format(\DateTime::ISO8601)) {
                $isFinished = true;
            }
        }
        return $isFinished;
    }

    /**
     * @return array
     */
    public function smsAlertData(array $user, $auctionId)
    {
        if (!$user) {
            return;
        }
        $userCanBeAlerted = true; // false beweent 20h and 8h
        // Check if the phone exists and valid.
        $hadUserMobilePhone = (
            is_numeric($user['telephone'])
            && strlen($user['telephone']) == 10
            && (strpos($user['telephone'], '06') === 0 || strpos($user['telephone'], '07') === 0)
        );
        // Check if the user checked sms alert on the auction.
        $alertUserPhone = false;
        $alertsUserPhone = $this->app['apiclient.user']->getSms($user['id'], ['auction_id'=>$auctionId])->getContent();
        for ($index = 0; $index < sizeof($alertsUserPhone); $index++) {
            if ($alertsUserPhone[$index]['auction_id'] == $auctionId && $alertsUserPhone[$index]['active'] == 1) {
                $alertUserPhone = true;
            }
        }
        return [
            'hadUserMobilePhone' => $hadUserMobilePhone,
            'userCanBeAlerted' => $userCanBeAlerted,
            'alertUserPhone' => $alertUserPhone,
        ];
    }

    public function getProductMetaDesc($product, $length = 250)
    {
        $desc = $product['description'];

        // HTML cleaning
        $desc = str_replace("\r", ' ', $desc);
        $desc = str_replace("\n", ' ', $desc);
        $desc = str_replace("&nbsp;", ' ', $desc);
        $desc = strip_tags($desc);

        // Find beginning
        $start = mb_strpos($desc, '“');
        if ($start === false) {
            $start = mb_strpos($desc, '"');
        }
        if ($start !== false) {
            $desc = mb_substr($desc, $start);
        }

        $desc = trim($desc);

        // Max lenght, try not to cut off a word
        if (mb_strlen($desc) > $length) {
            $desc = mb_substr($desc, 0, mb_strpos($desc, ' ', $length-4));
        }

        return $desc;
    }

    /**
     * Default filters to show
     * @return type
     */
    public function productFiltersDefault()
    {
        return [
            'nbpersonne' => [
                [
                    'wording' => '1 personne',
                    'legend'  => false,
                    'value'   => '1',
                    'id'      => 1,
                    'name'    => 'person',
                    'category'=> 'nbpersonne',
                ],
                [
                    'wording' => '2 personnes',
                    'legend'  => false,
                    'value'   => '2',
                    'id'      => 3,
                    'name'    => 'person',
                    'category'=> 'nbpersonne',
                ],
                [
                    'wording' => '3 personnes ou plus',
                    'legend'  => false,
                    'value'   => '3+',
                    'id'      => 3,
                    'name'    => 'person',
                    'category'=> 'nbpersonne',
                ],
            ],
            'nbnight' => [
                [
                    'wording' => 'Activités',
                    'legend'  => false,
                    'value'   => '0',
                    'id'      => 5,
                    'name'    => 'nbNight',
                    'category'=> 'nbnight',
                ],
                [
                    'wording' => 'Courts séjours (1 à 3 nuits)',
                    'legend'  => false,
                    'value'   => '1',
                    'id'      => 6,
                    'name'    => 'nbNight',
                    'category'=> 'nbnight',
                ],
                [
                    'wording' => 'Vacances (4 nuits ou plus)',
                    'legend'  => false,
                    'value'   => '2',
                    'id'      => 7,
                    'name'    => 'nbNight',
                    'category'=> 'nbnight',
                ]
            ],
            'places' => [
                [
                    'wording' => 'France',
                    'legend'  =>  '1',
                    'value'   => '',
                    'id'      => 8,
                    'name'    => 'fr',
                    'category'=> 'places'
                ],
                [
                    'wording' => 'Étranger',
                    'legend'  => true,
                    'value'   => 'etranger',
                    'id'      => 9,
                    'name'    => 'other',
                    'category'=> 'places'
                ]
            ]
        ];
    }

    /**
     * City filters to show
     * @return type
     */
    public function productCityFiltersDefault()
    {
        return [
            'nbpersonne' => [
                [
                    'wording' => '1 personne',
                    'legend'  => false,
                    'value'   => '1',
                    'id'      => 1,
                    'name'    => 'person',
                    'category'=> 'nbpersonne',
                ],
                [
                    'wording' => '2 personnes',
                    'value'   => '2',
                    'id'      => 2,
                    'legend'  => false,
                    'name'    => '2persons',
                    'category'=> 'nbpersonne',
                ],
                [
                    'wording' => '3 personnes ou plus',
                    'legend'  => false,
                    'value'   => '3+',
                    'id'      => 3,
                    'name'    => '3persons+',
                    'category'=> 'nbpersonne',
                ],
            ],
            'nbnight' => [
                [
                    'wording' => 'Activités',
                    'legend'  => false,
                    'value'   => '0',
                    'id'      => 5,
                    'name'    => 'nbNight',
                    'category'=> 'nbnight',
                ],
                [
                    'wording' => 'Courts séjours (1 à 3 nuits)',
                    'legend'  => false,
                    'value'   => '1',
                    'id'      => 6,
                    'name'    => 'nbNight',
                    'category'=> 'nbnight',
                ],
                [
                    'wording' => 'Vacances (4 nuits ou plus)',
                    'legend'  => false,
                    'value'   => '2',
                    'id'      => 7,
                    'name'    => 'nbNight',
                    'category'=> 'nbnight',
                ]
            ],
        ];
    }

    /**
     * @param string $productFlow
     * @return array
     */
    public function getCheckoutFlow($productFlow)
    {
        $flows = $this->app['apiclient.default']->getContentCached('/product/?listFlows=1');
        $result = $flows['classic']+$flows['classic']['web_'];
        if (isset($flows[$productFlow])) {
            $result = $flows[$productFlow]+$flows[$productFlow]['web_'];
        }
        unset($result['web_']);
        return $result;
    }

    private function isApp()
    {
        return $this->app['service.mobileApp']->isApp($this->app['request'], $this->app['session']);
    }

    private function isThereANextAuction($productId)
    {
        $url = sprintf('/product/%d/auction/', $productId);
        $query = $this->app['apiclient.default']->get($url, ['activesOnly' => true])->getContent();
        return isset($query['next']);
    }

    /**
     * Search for some auctions sample for tagging purpose or what else
     *
     * @param bool $tag
     * @param int $limit
     * @return mixed
     */
    public function getSomeAuctionsWithTag($tag = false, $limit = 3)
    {
        $params = [
            'limit' => $limit,
            'orderClauseWanted' => 'end',
            'orderDirectionWanted' => 'asc',
            'withCategoryCode' => true
        ];
        if ($tag) {
            $params['tag'] = $tag;
        }
        return $this->app['apiclient.search']->getRunningAuctionsContent($params);
    }

    /**
     * Return data view of the next auction
     *
     * @param array $dataView
     * @param int $productId
     * @param int $userId
     * @param array $auction
     * @return array
     */
    private function getNextAuctionDataView(array $dataView, int $productId, ?int $userId, array $auction): array
    {
        if (!isset($auction['id'])) {
            return $dataView;
        }

        $dataView['nbUsersHaveNotificationNextAuction'] = 0;
        $dataView['hasNextAuction'] = false;
        if ($this->isThereANextAuction($productId)) {
            $dataView['hasNextAuction'] = true;

            // Cached on API side
            $nbUserSubscribed = $this->client->get('/auction/' . $auction['id'], ['getNbAlarm' => 1])->getContent();

            $dataView['nbUsersHaveNotificationNextAuction'] = $nbUserSubscribed;
        }

        return $dataView;
    }
}
