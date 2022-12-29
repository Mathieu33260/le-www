<?php

namespace ASS\Controller;

use ASS\Form\VipConfirmationType;
use ASS\Trackers\EulerianTagBuilder;
use CAC\Component\ApiClient\ApiCustomException;
use CAC\Component\ApiClient\ApiException;
use Symfony\Component\Form\Form;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use ASS\Service\UserService;

class AuctionController extends BaseController
{
    use Traits\UserTrait;
    use Traits\PerfTrait;

    public static $WEEK_DAYS = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    public function doDeposit($id, Request $request)
    {
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }
        $errors = null;
        $dataview = [];
        $userId = $this->app['security']->getToken()->getUser();
        if ($request->isMethod('POST')) {
            if (strpos($request->get('method'), 'savedCard') !== false) {
                // Fake : This doesn't do a real deposit to etransaction at the moment. TODO: implement
                $params = [
                    'cardToUse' => explode('-', $request->get('method'))[1],
                    'auction' => $id,
                    'method' => $request->get('method'),
                    'user' => $userId,
                ];
                $deposit = $this->app['apiclient.default']->post('/ipn/doDeposit', $params)->getContent();
                $this->app['apiclient.default']->put("/deposit/".$deposit['id'], ['status' => 'processing']);
                return $this->app['twig']->render('auction/deposittransaction.twig', ['success' => true]);
            }

            try {
                $params = [
                    'auction' => $id,
                    'method' => $request->get('method'),
                    'user' => $userId,
                    'saveCard' => 0,
                ];
                if ($request->request->has('saveCard') && $request->request->get('saveCard')) {
                    $params += [
                        'saveCardName' => $request->request->get('saveCardName')
                    ];
                    $params['saveCard'] = 1;
                }
                $formElems = $this->app['apiclient.default']->post('/ipn/doDeposit', $params)->getContent();
                return $this->app['twig']->render(
                    'payment/etransRedirect.twig',
                    [
                        "etransLink"            => $this->app['etrans.iframe.url'],
                        "etransFormElements"    => $formElems,
                    ]
                );
            } catch (\Exception $ex) {
                $errors = $ex->getMessage();
            }
        } else {
            $dataview['auction'] = $this->app['apiclient.auction']->getAuctionContent($id);
            $dataview['product'] = $this->app['apiclient.default']->getContentCached($dataview['auction']['_links']['product'].'?cdn=1');
        }

        $dataview['user'] = $this->app['apiclient.user']->getUser($userId)->getContent();
        $cards = $this->app['apiclient.default']->get($dataview['user']['_links']['creditcards'], [])->getContent();
        $now = new \DateTime();

        $dataview['validCards'] = array_filter($cards, function ($elem) use ($now) {
            $ok = false;
            // Must be a card for deposit.
            if ($elem['active']) {
                // Check fields validity
                if ($elem['expiredate'] != null && $elem['cvv'] != null && $elem['porteur'] != null) {
                    // Check expire date
                    $expireDate = new \DateTime($elem['expiredate']);
                    if ($now < $expireDate) {
                        $ok = true;
                    }
                }
            }
            return $ok;
        });

        return $this->app['twig']->render('auction/deposit.twig', $dataview);
    }

    public function mobileSearch(Request $request)
    {
        $auctionTemplate = $this->app['twig']->render('auction/list/auctions.twig');
        $view = [];
        if ($request->request->has('q')) {
            $term = $request->get('q');

            if (empty($term)) {
                $this->app['session']->getFlashBag()->add('error', 'Veuillez saisir un terme de recheche.');
                return $this->app['twig']->render('mobiletab/search.twig');
            }

            try {
                $params['searchTerms'] = $term;
                $auctions = $this->app['apiclient.search']->getRunningAuctionsContent($params);
            } catch (ApiException $e) {
                $this->app['logger']->error($e->getMessage());
                $this->app['session']->getFlashBag()->add('error', 'Une erreur s\'est produite lors de votre recherche');
                return $this->app['twig']->render('mobiletab/search.twig');
            }

            foreach ($auctions as $k => $auction) {
                $auctions[$k] = array_merge($auctions[$k], $this->app['service.auction']->enrichAuction($auction));
            }
            foreach ($auctions as &$auction) {
                $now = new \DateTime();
                $end = new \DateTime($auction['auction_end']);
                $diff = $now->diff($end);
                $minutes = $diff->days * 24 * 60;
                $minutes += $diff->h * 60;
                $minutes += $diff->i;
                if ($minutes == 0) {
                    $auction['timelefttext']= "Moins d'une minute!";
                } else {
                    $auction['timelefttext']= sprintf("Plus que %d minutes!", $minutes);
                }
            }

            $view['auctions'] = $auctions;
            $view['term'] = $term;

            return $this->app['twig']->render('mobiletab/search.twig', $view);
        }

        return $this->app['twig']->render('mobiletab/search.twig');
    }

    public function christmasGiftCardLanding()
    {
        $userService = $this->app['service.user'];
        if ($userService->isAuthenticated()) {
             return $this->app->redirect($this->app['url_generator']->generate('user.giftcard'));
        }
        return $this->app['twig']->render('christmas/giftcardlanding.twig', [
            'stylesheets' => [
                'style',
                'giftCard',
            ],
        ]);
    }

    public function christmasChoice()
    {
        return $this->app['twig']->render('christmas/choice.twig', [
            'stylesheets' => [
                'style',
                'giftCard',
            ],
        ]);
    }

    public function christmasGiftCard(Request $request)
    {
        $giftCardStyle = [
            1 => '//img.loisirsencheres.fr/loisirs/image/upload/v1514906599/ressource/style-carte-cadeau-07.png',
            2 => '//img.loisirsencheres.fr/loisirs/image/upload/v1514906599/ressource/style-carte-cadeau-10.png',
            3 => '//img.loisirsencheres.fr/loisirs/image/upload/v1514906599/ressource/style-carte-cadeau-08.png',
            4 => '//img.loisirsencheres.fr/loisirs/image/upload/v1514906599/ressource/style-carte-cadeau-09.png',
        ];

        if ($request->isMethod('POST')) {
            // Fill necessary block
            $value = $request->get('giftCard');
            $giftcardStyle = 'http:'.$giftCardStyle[$request->get('giftCardStyle')];
            $from = $request->get('fromUsername');
            $to = $request->get('to');
            $action = $request->request->has('preview') ? 'preview' : 'submit';
            $message = $request->get('message');
            $sendToMe = $request->get('sendToMe') == 'on';
            $sendTo = $request->get('forMailInput');
            $data = [
                "originalAmount" => $value,
                "photo" => $giftcardStyle,
                "text" => $message,
                "photo" => $giftcardStyle,
                "username" => $to,
                "fromUsername" => $from,
                "sendToMe" => $sendToMe,
                "sendTo" => $sendTo,
                "user" => $this->app['security']->getToken()->getUser()
            ];
            try {
                if ($action == 'preview') {
                    $res = $this->app['apiclient.finance']->getGiftcard('preview', true, $data)->getContent();
                    return new Response($res, 200, array('content-type' => 'application/pdf'));
                } else {
                    if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                        $this->app['session']->set('giftcard', $request->request);
                        return $this->app->redirect($this->app['url_generator']->generate('user.login', array('back'=>$request->getRequestUri())));
                    }
                    // Create the payment, we'll use it later
                    $payment = $this->app['apiclient.finance']->createGiftcardPayment($data)->getContent();
                    return $this->app->redirect($this->app['url_generator']->generate('paiement.gateway', ['id' => $payment['id'], 'productType' => 'giftcard']));
                }
            } catch (\Exception $e) {
                $this->app['session']->getFlashBag()->add('error', $e->getMessage());
            }
        }

        $oldData = $this->app['session']->get('giftcard');
        $this->app['session']->set('giftcard', null);

        return $this->app['twig']->render('content/purchases/giftCard.twig', [
            'giftCardsStyle'    => $giftCardStyle,
            'oldData'           => $oldData,
            'useTwitterShare'   => true,
            'stylesheets' => [
                'style',
                'giftCard',
            ],
        ]);
    }

    public function giftcardChoice()
    {
        return $this->app['twig']->render('christmas/choice.twig');
    }

    public function giftcardLanding()
    {
        return $this->app['twig']->render('christmas/giftcardlanding.twig');
    }

    /**
     * Ajax
     */
    public function bid(Request $request, $id)
    {
        $error = '';
        $message = '';

        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $userId = $this->app['security']->getToken()->getUser();
            try {
                $user = $this->app['apiclient.user']->getUser($userId)->getContent();
            } catch (AccessDeniedHttpException $e) {
                $this->app['logger']->warning('AccessDeniedHttpException when trying to get user details', [
                    'userIdAsked' => $userId,
                    'exMessage' => $e->getMessage(),
                    'apiResponse' => $e->getPrevious()->getResponse()->getBody()->getContents(),
                ]);
                return new JsonResponse(['error'=>'unauthenticated']);
            }
            // clear phone
            $userPhone = trim($user['telephone']);
            if (strlen($userPhone) > 10) {
                $userPhone = substr($userPhone, strlen($userPhone)-10, 10);
            }
            $isValidMobile = (strlen($userPhone) == 10 && (strpos($userPhone, '06') === 0 || strpos($userPhone, '07') === 0));
            $phone = trim($request->request->get('phone'));
            $isAutoBid = intval($request->request->get('isAutoBid'));

            // Update phone number only if mobile phone.
            if ($phone != '') {
                $isValidMobile = (strlen($phone) == 10 && (strpos($phone, '06') === 0 || strpos($phone, '07') === 0));
                if ($isValidMobile) {
                    $user['telephone'] = $phone;
                    $this->app['apiclient.user']->save($user, $userId);
                    $this->app['service.user']->refreshUser($userId);
                }
            }

            // Update send sms if exists.
            if ($isValidMobile) {
                $sms = $request->request->get('sms') == 'true' ? 1 : 0;
                $this->app['apiclient.user']->updateSms($userId, $id, $sms);
            }

            $bid = intval($request->request->get('bid')) * 100; // In cents
            $bidSettings = (array) $request->get('abtests');

            if ($bid > 0) {
                try {
                    if ($isAutoBid) {
                        $data = $this->app['apiclient.default']->post("auction/$id/autobid/", ['amount'=>$bid, 'settings' => $bidSettings])->getContent();
                    } else {
                        $data = $this->app['apiclient.auction']->bid($id, $bid, [
                            'settings' => $bidSettings,
                            'feeConfirmed' => $request->request->get('prebid') == true ? 0:1,
                        ])->getContent();
                    }

                    if ('complete' !== $data['status'] && 'accepted' !== $data['status']) {
                        $error = $data['status'];
                    } else {
                        $bidReturn = $data;
                    }
                } catch (ApiCustomException $e) {
                    $error = $e->getInternCode();
                    $message = $e->getMessage();
                } catch (ApiException $e) {
                    if (substr($e->getMessage(), 0, 19) == "Le montant de votre") {
                        $error = $e->getMessage();
                    } elseif (strpos($e->getMessage(), 'Une erreur est survenue')) {
                        $error = 'ipblocked';
                    } elseif (strpos($e->getMessage(), 'mais vous pouvez retenter votre chance avec une enchère inférieure.')) {
                        $error = 'overMaxDelta';
                    } elseif (strpos($e->getMessage(), 'mais vous pouvez retenter votre chance avec une enchère supérieure')) {
                        $error = 'underMinDelta';
                    } elseif (strpos($e->getMessage(), 'actuellement de façon limité')) {
                        $error = 'readonly';
                    } elseif ($e->getMessage() == 'Vous ne pouvez pas encore être en tête sur plus de trois enchères à la fois.') {
                        $error = 'maxLeader';
                    } else {
                        $error = $e->getMessage();
                    }
                } catch (\CAC\Component\ApiClient\ApiDataException $e) {
                    $error = 'Une erreur est survenue.';
                } catch (AccessDeniedHttpException $e) {
                    $error = 'unauthenticated';
                } catch (\Exception $e) {
                    $error = $e->getMessage();
                }
            } else {
                $error = "Votre mise n'a pas été prise en compte. Si le problème persiste, contactez-nous.";
            }
        } else {
            $error = 'Vous devez être connecté pour enchérir.';
        }

        if ($request->isXmlHttpRequest()) {
            if ($error !== '') {
                return new JsonResponse(['error'=>$error, 'message' => $message]);
            }
            $profileInfo = $this->getUserService()->getUserTrackingProfile(false, false);
            $optin = $profileInfo['optin'] ?? '';
            return new JsonResponse([
                'bid' => $bidReturn,
                'eulerian' => [
                    'uid' => $user['num'],
                    'leadNumber' => hash('sha256', $user['email']),
                    'profile' => $profileInfo['profile'] ?? '',
                    'mail' => $optin,
                    'sms' => ($request->request->get('sms') == 'true'),
                    'estimate' => 1,
                    // EA need a unique devis ref to identify conversion coming from bid
                    'ref' => sha1($user['num']."bid".time()),
                ]
            ]);
        } else {
            if ('unauthenticated' == $error) {
                return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => 'unauthenticated')));
            }

            if ('' != $error) {
                $this->app['session']->getFlashBag()->add('error', $error);
            }

            return $this->app->redirect($this->app['url_generator']->generate('auction.detail', array('id' => $id)));
        }
    }

    public function availability(Request $request, $id)
    {
        $auction = $this->app['apiclient.auction']->getAuction($id)->getContent();
        $product = $this->app['apiclient.default']->get($auction['_links']['product'].'?cdn=1')->getContent();
        setcookie("showAuctionAvailability", '1');
        return $this->app['service.auction']->showProductAuction($product['id'], 'availability', $id);
    }

    public function detailAuction(Request $request, $id, $title = '')
    {
        // Fix robot that are still scrolling /auction/vipconfirmation?auctionid=57009
        if ($id == 'vipconfirmation' && $request->query->get('auctionid')) {
            $id = $request->query->get('auctionid');
        }
        $auction = $this->app['apiclient.auction']->getAuction($id)->getContent();

        $today = new \DateTime();
        $auctionStart = strtotime(date($auction['start']));
        $auctionEnd = strtotime(date($auction['end']));

        $isRunning = $auctionStart <= $today->getTimestamp() && $today->getTimestamp() < ($auctionEnd-1);

        // Let ProductController handles running auctions
        if ($isRunning) {
            return $this->app->redirect($this->app['url_generator']->generate('product.auction', ['id' => $auction['product']]), 302);
        }

        // automatically redirect to correct url if title does not match
        if (sanitize_string_with_dashes(null, $auction['name']) != $title) {
            return $this->app->redirect($this->app['url_generator']->generate(
                'auction.detail.title',
                [
                    'id' => $id,
                    'title' => sanitize_string_with_dashes(null, $auction['name']),
                    'star' => $request->get('star')
                ]
            ), 301);
        }

        $product = $this->app['apiclient.default']->get($auction['_links']['product'].'?cdn=1')->getContent();
        return $this->app['service.auction']->showProductAuction($product['id'], 'normal', $id, null, $request->query->get('json'));
    }

    public function winnerShare(Request $request, $title, $auctionId16)
    {
        $auctionId = base_convert($auctionId16, 16, 10);
        $auction = $this->app['apiclient.auction']->getAuction($auctionId)->getContent();

        $today = new \DateTime();
        $auctionStart = strtotime(date($auction['start']));
        $auctionEnd = strtotime(date($auction['end']));

        $isRunning = $auctionStart <= $today->getTimestamp() && $today->getTimestamp() < ($auctionEnd-1);

        // Let ProductController handles running auctions
        if ($isRunning) {
            return $this->app->redirect($this->app['url_generator']->generate('product.auction', ['id' => $auction['product']]), 302);
        }

        $product = $this->app['apiclient.default']->get($auction['_links']['product'].'?cdn=1')->getContent();
        return $this->app['service.auction']->showProductAuction($product['id'], 'winnerShare', $auctionId);
    }

    public function home(Request $request)
    {
        if ($request->query->has('previewslide')) {
            $slides = $this->app['service.slider']->preview($request);
        } else {
            $slides = $this->app['service.slider']->homepage($request);
        }

        $homeImg = $this->getDefaultClient()->getContentCached('/advert/', ['advertType' => 'home', 'method' => 'front']);

        $home1 = null;
        $home2 = null;
        $home3 = null;
        $home4 = null;

        foreach ($homeImg as $img) {
            if ($img['advertType'] == 'HOME_01') {
                $home1 = $img;
            } elseif ($img['advertType'] == 'HOME_02') {
                $home2 = $img;
            } elseif ($img['advertType'] == 'HOME_03') {
                $home3 = $img;
            } elseif ($img['advertType'] == 'HOME_04') {
                $home4 = $img;
            }
        }

        $dataview = [
            'stylesheets' => [ // Key is the version file and value is the relative path
                'style',
                'auctionsList',
                'homepage',
            ],
            'week'          => self::$WEEK_DAYS,
            'slides'        => $slides,
            'showapps'      => true,
            'isHomepage'    => true,
            'bodyclass'     => 'fullpage',
            'promotions' => [
                'home01' => $home1,
                'home02' => $home2,
                'home03' => $home3,
                'home04' => $home4,
            ],
        ];

        $a_userProducts = json_encode($this->app['service.user']->getUserProducts(true));
        $dataview['userProducts'] = $a_userProducts;

        $this->app['response.nostore'] = true;

        // Custom EA tag for Homepage
        $this->getTrackerService()->buildTags([
            // Eulerian Tag
            EulerianTagBuilder::getContainerKey() => function () {
                return [
                    'pagegroup' => 'Homepage',
                    'path' => 'Homepage',
                ];
            }
        ]);

        return $this->app['twig']->render('homepage.twig', $dataview);
    }

    /**
     * Show active auction in format json or html AJAX refresh
     * @param Request $request
     * @param $format
     * @return string
     */
    public function activeAuctions(Request $request)
    {
        // requests & queries
        $firstpage = $request->query->get('firstpage');
        $limit     = $request->query->get('limit');
        $tag       = $request->query->get('tag');
        $params = $view = [];
        /** @var UserService $userService */
        $userService = $this->app['service.user'];

        if ($limit != "") {
            $params['limit'] = $limit;
        }
        if ($tag != "") {
            $params['tag'] = strpos($tag, ',') === false ? $tag : explode(',', $tag);
        }
        if ($firstpage != "") {
            $params['firstpage'] = true;
        }
        if ($request->query->get('searchTerms')) {
            $params['searchTerms'] = $request->query->get('searchTerms');
        }
        if ($request->query->has('regions')) {
            $params['filters']['regions'] = $request->query->get('regions');
        }
        if ($request->query->has('person')) {
            $params['filters']['nbPerson'] = $request->query->get('person');
        }
        if ($request->query->has('transport')) {
            $params['filters']['transport'] = $request->query->get('transport');
        }
        if ($request->query->has('clustName')) {
            $params['geoloc'] = true;
            $params['clustName'] = $request->query->get('clustName');
        }
        if ($request->query->has('offset')) {
            $params['offset'] = $request->query->get('offset');
        }
        if ($request->query->has('nbNight')) {
            $params['filters']['nbNight'] = [];
            foreach ($request->query->get('nbNight') as $nbNight) {
                if ($nbNight == '0') {
                    $params['filters']['nbNight'][] = [
                        'min' => 0,
                        'max' => 0,
                    ];
                } elseif ($nbNight == '1') {
                    $params['filters']['nbNight'][] = [
                        'min' => 1,
                        'max' => 3,
                    ];
                } elseif ($nbNight == '2') {
                    $params['filters']['nbNight'][] = ['min'=> '4'];
                }
            }
        }
        if ($request->query->has('other')) {
            foreach ($request->query->get('other') as $other) {
                if ($other === 'etranger') {
                    $params['filters']['showEtranger'] = 1;
                }
            }
        }
        if ($request->query->has('sort')) {
            $a_sort = explode('-', $request->query->get('sort'));
            $params['orderClauseWanted'] = $a_sort[0];
            if (isset($a_sort[1])) {
                $params['orderDirectionWanted'] = strtoupper($a_sort[1]);
            } else {
                $params['orderDirectionWanted'] = 'DESC';
            }
        }
        $params['activeAuctions'] = 1;
        $params['departement'] = $request->get('departement');
        $params['region'] = $request->get('region');
        $params['notStarted'] = $request->get('upcoming');

        // Beta listing features
        $this->getListingService()->addBetaFeatures($params, $request->headers->all());

        $auctionlist = [];
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $auctions = $this->app['apiclient.search']->getRunningAuctions($params)->getContent();
        } else {
            $auctions = $this->app['apiclient.search']->getRunningAuctionsContent($params);
        }

        $params['tag'] = 'carroussel';

        // Prevent errors if API returns an erro message
        if (is_array($auctions) && count($auctions) > 0) {
            foreach ($auctions as $k => $auction) {
                $auctions[$k] = array_merge($auctions[$k], $this->app['service.auction']->enrichAuction($auction));
                // Generate IMG
                $imageMax = $this->app['service.images']->noprotocol($this->app['service.images']->imgForList($auctions[$k]['images']));
                $imageMin = $this->app['service.images']->transf($imageMax, 'c_fit,w_470');
                $auctions[$k]['imageMax'] = $imageMax;
                $auctions[$k]['imageMin'] = $imageMin;
                $auctions[$k]['inactive'] = false;
            }
            $auctionlist = $auctions;
        }

        $view['userProducts'] = $userService->getUserProducts(true);
        $view['list'] = 'All';
        $view['countAuctions'] = count($auctionlist);
        $view['auctions'] = $auctionlist;

        return new JsonResponse($view);
    }

    public function activeHomeAuctions(Request $request)
    {
        $auctionlist = $return = [];
        /** @var UserService $userService */
        $userService = $this->app['service.user'];

        $params = ['limit' => $request->query->get('limit'), 'hasBidFirst' => 1, 'reservePriceNotPassedFirst' => 1];

        if ($request->query->has('tag')) {
            $params['tag'] = $request->query->get('tag');
            if ($params['tag'] === 'top-des-ventes') {
                $params['orderClauseWanted'] = 'popularity';
            }
        }

        // Les enchères qui vont se terminer
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $auctionlist = $this->app['apiclient.search']->getRunningAuctions($params)->getContent();
        } else {
            $auctionlist = $this->app['apiclient.search']->getRunningAuctionsContent($params);
        }


        $return['auctions'] = $auctionlist;
        $return['userProducts'] = $userService->getUserProducts(true);

        return new JsonResponse($return);
    }

    public function getAuctionsNew(Request $request)
    {
        // On récupère les nouvelles auctions
        $params['tag'] = "nouveautes";
        $params['groupByWanted'] = 'merchant';
        $params['limit'] = $request->query->get('limit', 12);
        $params['hasBidFirst'] = 1;
        $params['reservePriceNotPassedFirst'] = 1;
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $auctionsNew = $this->app['apiclient.search']->getRunningAuctions($params)->getContent();
        } else {
            $auctionsNew = $this->app['apiclient.search']->getRunningAuctionsContent($params);
        }

        if (is_array($auctionsNew)) {
            foreach ($auctionsNew as $k => $auction) {
                $auctionsNew[$k] = array_merge($auctionsNew[$k], $this->app['service.auction']->enrichAuction($auction, 'isNewAuction'));
            }
        }

        $return['auctions'] = $auctionsNew;

        return new JsonResponse($return);
    }

    public function getAuctionsGeoloc(Request $request)
    {
        $params['geoloc'] = 1;
        $params['limit'] = $request->query->get('limit');
        $params['clustName'] = $request->query->get('clustName');
        $params['type'] = $request->query->get('type');
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $auctionsGeoloc = $this->app['apiclient.search']->getRunningAuctions($params)->getContent();
        } else {
            $auctionsGeoloc = $this->app['apiclient.search']->getRunningAuctionsContent($params);
        }

        usort($auctionsGeoloc, array($this, "sortArrayByAuctionsEnded"));
        $auctionsGeoloc = array_slice($auctionsGeoloc, 0, 8);

        $return['auctions'] = $auctionsGeoloc;

        return new JsonResponse($return);
    }

    public function mobileVipConfirmation(Request $request, $id)
    {
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }

        $userId = $this->app['security']->getToken()->getUser();
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();
        $userGroups = $this->app['apiclient.default']->get($user['_links']['groups'])->getContent();

        $auction = $this->app['apiclient.auction']->getAuction($id)->getContent();
        $auctionGroups = $this->app['apiclient.default']->get($auction['_links']['groups'])->getContent();
        // First check if the user isn't already in the group
        $auctionGroupIds = array_map(function ($elem) {
            return $elem['id'];
        }, $auctionGroups);

        $userGroupIds = array_map(function ($elem) {
            return $elem['id'];
        }, $userGroups);

        $common = array_intersect($auctionGroupIds, $userGroupIds);
        if (count($common) != 0) {
            return $this->app['twig']->render('content/mobileInfoPage.twig', [
                'title' => 'Erreur',
                'text' => 'Vous êtes déjà dans ce groupe',
                'link' => 'product/'.$auction['product'],
                'linkText' => 'Revenir à l\'enchère.'
            ]);
        }

        /** @var Form $vipConfirmationType */
        $vipConfirmationType = $this->app['form.factory']->create(new VipConfirmationType());
        $vipConfirmationType->handleRequest($request);
        $error = null;
        if ($vipConfirmationType->isValid()) {
            $data = $vipConfirmationType->getData();
            $code = $data['code'];
            $validatedGroup = false;
            foreach ($auctionGroups as $auctionGroup) {
                if ($code == $auctionGroup['code']) {
                    // Add group to user
                    try {
                        $this->app['apiclient.group']->addUsers(['userId' => $userId, 'code' => $code], $auctionGroup['id']);
                        $validatedGroup = true;
                        break;
                    } catch (\Exception $ex) {
                        $error = $ex->getMessage();
                        return $this->app['twig']->render('content/mobileInfoPage.twig', [
                            'title' => 'Erreur',
                            'text' => $error,
                            'link' => 'product/'.$auction['product'],
                            'linkText' => 'Revenir à l\'enchère.'
                        ]);
                    }
                }
            }

            if (!$validatedGroup) {
                $error = 'Code incorrect';
            } else {
                return $this->app['twig']->render('content/mobileInfoPage.twig', [
                    'title' => 'Félicitation, vous avez desormais accès à l\'enchère privée !',
                    'link' => 'product/'.$auction['product'],
                    'linkText' => 'Revenir à l\'enchère.'
                ]);
            }
        }

        return $this->app['twig']->render(
            'auction/vip-confirmation.twig',
            [
                'form' => $vipConfirmationType->createView(),
                'error' => $error
            ]
        );
    }

    /**
     * Is used with usort in getAuctionsNew()
     * @param type $a
     * @param type $b
     * @return int
     */
    private function sortArrayByAuctionsEnded($a, $b)
    {
        if ($a['auction_end'] == $b['auction_end']) {
            return 0;
        }
        return ($a['auction_end'] < $b['auction_end']) ? -1 : 1;
    }

    public function vipConfirmation(Request $request, $id)
    {
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }

        $auction = $this->app['apiclient.auction']->getAuction($id)->getContent();
        $userId = $this->app['security']->getToken()->getUser();
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();

        $auctionGroups = $this->app['apiclient.default']->get($auction['_links']['groups'])->getContent();

        $userGroups = $this->app['apiclient.default']->get($user['_links']['groups'])->getContent();

        // First check if the user isn't already in the group
        $auctionGroupIds = array_map(function ($elem) {
            return $elem['id'];
        }, $auctionGroups);

        $userGroupIds = array_map(function ($elem) {
            return $elem['id'];
        }, $userGroups);

        $common = array_intersect($auctionGroupIds, $userGroupIds);
        if (count($common) != 0) {
            $error = 'Vous pouvez déjà enchérir sur cette enchère';
            return $this->app['service.auction']->showProductAuction($request->get('pid'), 'normal', null, $error);
        }

        $code = $request->request->get('code');
        $error = null;
        if ($code == '') {
            $error = "Veuillez saisir un code";
        }

        $validatedGroup = false;
        foreach ($auctionGroups as $auctionGroup) {
            if ($code == $auctionGroup['code']) {
                // Add group to user
                try {
                    $this->app['apiclient.group']->addUsers(['userId' => $user['id'], 'code' => $code], $auctionGroup['id']);
                    $validatedGroup = true;
                    break;
                } catch (\Exception $ex) {
                    $error = $ex->getMessage();
                }
            }
        }

        if (!$validatedGroup) {
            $error = 'Code incorrect';
        }

        return $this->app->redirect($this->app['url_generator']->generate('product.auction', ['id' => $request->get('pid'), 'errorVip' => $error]));
    }

    public function depositTransaction($id, $state, Request $request)
    {
        if ($request->isXmlHttpRequest()) {
            return $this->app['apiclient.default']->get("/deposit/$id")->getContent()['status'];
        }

        $success = false;

        if ($state == 'success' || $state == 'processing') {
            $success = true;
            $this->app['apiclient.default']->put("/deposit/$id", ['status' => 'processing']);
        } else {
            $this->app['apiclient.default']->put("/deposit/$id", ['status' => 'failed']);
        }

        return $this->app['twig']->render('auction/deposittransaction.twig', ['success' => $success]);
    }
}
