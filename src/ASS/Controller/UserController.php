<?php

namespace ASS\Controller;

use ASS\Form\MailType;
use ASS\Form\PasswordType;
use ASS\Form\PreferencesType;
use ASS\Service\ProductService;
use ASS\Trackers\EulerianTagBuilder;
use Symfony\Component\Form\Form;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use CAC\Component\ApiClient\ApiException;
use CAC\Component\ApiClient\ApiDataException;
use ASS\Form\ProfileType;
use Symfony\Component\Form\FormError;
use Symfony\Component\HttpFoundation\JsonResponse;
use ASS\Service\UserService;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use ASS\Exception\NotActionException;

class UserController extends BaseController
{
    use Traits\UserTrait;
    use Traits\ServicesTrait;

    /**
     * @var array months
     */
    private $months = array();

    private $user;

    public function __construct($app)
    {
        parent::__construct($app);
        $this->months = [
            '01' => 'Janvier',
            '02' => 'Février',
            '03' => 'Mars',
            '04' => 'Avril',
            '05' => 'Mai',
            '06' => 'Juin',
            '07' => 'Juillet',
            '08' => 'Août',
            '09' => 'Septembre',
            '10' => 'Octobre',
            '11' => 'Novembre',
            '12' => 'Décembre',
        ];
    }

    public function wishlist(Request $request, $cryptdata)
    {
        // Show an user wishlist
        $userId = $this->app['service.user']->decryptUserData($cryptdata);

        if (!$userId) {
            return $this->app->redirect('wishlist');
        }

        // get data user
        $queryUser = $this->app['apiclient.default']->get("/user/$userId", ['withUserProducts' => 1])->getContent();
        $dataView = ['queryUser' => $queryUser];

        if ($request->isXmlHttpRequest()) {
            try {
                $queryUserProductsFinal = [];
                // get id products
                $a_userProducts = array_map(function ($userProduct) {
                    return $userProduct['product_id'];
                }, $queryUser['userproducts']);

                if (!empty($a_userProducts)) {
                    // get data products
                    $queryProducts = $this->app['apiclient.default']->get('/product/', [
                        'byIds'         => 1,
                        'withImages'    => 1,
                        'pids'          => $a_userProducts
                    ])->getContent();

                    // get other informations product
                    foreach ($queryUser['userproducts'] as $key => $userProduct) {
                        foreach ($queryProducts as $rowProduct) {
                            if ($rowProduct['id'] == $userProduct['product_id']) {
                                $queryUser['userproducts'][$key]['product'] = $rowProduct;
                                $queryUser['userproducts'][$key]['images'][] = $rowProduct['images'][0];
                                break;
                            }
                        }
                    }

                    // Change order product
                    $queryCheckAuctionOnline = $this->app['apiclient.default']->get('/auction/', ['checkOnline'=>true, 'pids' => $a_userProducts])->getContent();
                    foreach ($queryUser['userproducts'] as $key => $value) {
                        $queryUser['userproducts'][$key]['checkOnlineAuction'] = $queryCheckAuctionOnline[$value['product_id']];
                        if ($queryUser['userproducts'][$key]['checkOnlineAuction']) {
                            // Push this product on top array
                            array_unshift($queryUserProductsFinal, $queryUser['userproducts'][$key]);
                        } else { // Push this product on bottom array
                            array_push($queryUserProductsFinal, $queryUser['userproducts'][$key]);
                        }
                    }
                    return new JsonResponse([
                        'products'    => $queryUserProductsFinal
                    ]);
                }
            } catch (\Exception $e) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['retour'=>$e->getMessage()]);
                }
                $this->app['session']->getFlashBag()->add('error', $e->getMessage());
            }
        }

        unset($dataView['queryUser']['userproducts']);

        $dataView['cryptdata'] = $cryptdata;
        $dataView['hideBreadcrumb'] = true;
        $dataView['stylesheets'] = [
            'style',
        ];

        return $this->app['twig']->render('user/wishlist.twig', $dataView);
    }

    public function addCreditCard(Request $request, $userId, $onlyEtransForm = false)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $userAttrs = $this->app['security']->getToken()->getAttribute('user');
        if ($userId != $userAttrs['id'] && $userId != $userAttrs['num']) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }

        if ($request->isMethod('POST') || $onlyEtransForm) {
            try {
                $params = [
                    'method' => $request->request->get('method'),
                    'user' => $userAttrs['id'],
                ];
                $params['name'] = $request->get('saveCardName') ? $request->get('saveCardName') : "{$userAttrs['firstName']} {$userAttrs['lastName']}";

                $formElems = $this->app['apiclient.default']->post('/ipn/saveCard', $params)->getContent();
                return $this->app['twig']->render(
                    'payment/etransRedirect.twig',
                    [
                        "etransLink"            => $this->app['etrans.iframe.url'],
                        "etransFormElements"    => $formElems,
                    ]
                );
            } catch (\Exception $ex) {
                $this->app['logger']->error('addCreditCard '.$ex->getMessage(), ['exception' => $ex]);
                $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
            }
        }

        return $this->app['twig']->render('user/addCard.twig');
    }

    public function giftcard(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $dataView = [
            'hideBreadcrumb' => true,
            'hideRechercheMobile' => true
        ];

        $this->getUser();

        // Cartes cadeaux crédité
        $dataView['giftcards'] = $this->app['apiclient.default']->get($this->user['_links']['giftcards'])->getContent();
        // Cartes cadeaux acheté
        $dataView['giftedcards'] = $this->app['apiclient.default']->get("{$this->user['_links']['giftedcards']}&fromSponsorchip=0")->getContent();
        // Cartes cadeaux créé mais non payé
        $dataView['giftedcardsCreation'] = $this->app['apiclient.default']->get("user/{$this->user['id']}/giftcardpayment/")->getContent();

        return $this->app['twig']->render('user/giftcard.twig', $dataView);
    }

    public function showGiftcard(Request $request, $giftcardId)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $giftcardData = $this->app['apiclient.finance']->getGiftcard($giftcardId)->getContent();
        $tokenUserId = $this->app['security']->getToken()->getUser();

        // Check if this is the user's giftcard.
        if ($tokenUserId == $giftcardData['ownerId'] || $tokenUserId == $giftcardData['creatorId']) {
            $giftcard = $this->app['apiclient.finance']->getGiftcard($giftcardId, true)->getContent();
            return new Response($giftcard, 200, array('content-type' => 'application/pdf'));
        } else {
            return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => 'unauthorized')));
        }
    }

    public function resendGiftcard(Request $request, $giftcardId)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        // Check if this is the user's giftcard.
        try {
            $this->app['apiclient.finance']->getGiftcard($giftcardId, false, ['action' => 'resend'])->getContent();
            $this->app['session']->getFlashBag()->add('success', 'La carte cadeau a été renvoyé à son destinataire.');
            return $this->app->redirect($this->app['url_generator']->generate('user.purchase'));
        } catch (\Exception $e) {
            $this->app['session']->getFlashBag()->add('error', $e->getMessage());
        }
    }

    public function invoiceGiftcard(Request $request, $giftcardId)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        // Check if this is the user's giftcard.
        try {
            $invoice = $this->app['apiclient.default']->get("/giftcard/$giftcardId", ['action'=> 'getInvoice'])->getContent();
            return new Response($invoice, 200, array('content-type' => 'application/pdf'));
        } catch (\Exception $e) {
            $this->app['session']->getFlashBag()->add('error', $e->getMessage());
        }
    }

    public function purchases(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }
        $userId = $this->app['security']->getToken()->getUser();
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();
        $giftedcards = $this->app['apiclient.default']->get($user['_links']['giftedcards'])->getContent();
        foreach ($giftedcards as &$giftedcard) {
            $giftedcard['owner'] = $giftedcard['_links']['owner'] == null ? null : $this->app['apiclient.default']->get($giftedcard['_links']['owner'])->getContent();
        }

        $data = $this->app['apiclient.default']->get("/user/$userId/auction/", ['forUserAuctions' => 1])->getContent();
        if ($request->isMethod('POST')) {
            $giftedcardId = $request->get('giftcardId');
            $email = $request->get('email');
            if (!$email || !$giftedcardId) {
                $this->app['session']->getFlashBag()->add('error', 'Il manque des informations pour effectuer votre demande.');
                return $this->app['twig']->render('user/purchases.twig', $data+['giftedcards' => $giftedcards]);
            }
            $this->app['apiclient.finance']->getGiftcard($giftedcardId, false, ['action' => 'resend','email'=>$email])->getContent();
            $this->app['session']->getFlashBag()->add('success', 'La carte cadeau a été renvoyé à son destinataire.');
        }

        return $this->app['twig']->render('user/purchases.twig', $data+['hideBreadcrumb' => true, 'giftedcards' => $giftedcards]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function loginGoogle(Request $request)
    {
        try {
            if (!$request->request->has('oauth_token')) {
                throw new \Exception("oauth_token is not defined");
            }
            $oAuthToken = $request->request->get('oauth_token');
            $data = [
                'oauth_token' => $oAuthToken,
                'client_id' => $this->app['api.client.oauth']['clientId'],
                'client_secret' => $this->app['api.client.oauth']['clientSecret'],
                'redirect_uri' => '/user/login/google',
                'grant_type' => 'https://google.com',
                'godfatherId' => $this->app['session']->get('godfatherId'),
                'newAppFlow' => true,
            ];

            $data['user_settings'] = [
                ['key' => 'termsagree', 'value' => 1],
                ['key' => 'registrationLandingPage', 'value' => $this->app['session']->get('landingPage')],
                ['key' => 'registrationLandingReferer', 'value' => $this->app['session']->get('landingReferer')]
            ];
            if (!empty($this->app['session']->get('utm_campaign'))) {
                $data['user_settings'][] = [
                    'key' => 'utm_source',
                    'value' => $this->app['session']->get('utm_source'),
                    'group' => 'referer'
                ];
                $data['user_settings'][] = [
                    'key' => 'utm_medium',
                    'value' => $this->app['session']->get('utm_medium'),
                    'group' => 'referer'
                ];
                $data['user_settings'][] = [
                    'key' => 'utm_campaign',
                    'value' => $this->app['session']->get('utm_campaign'),
                    'group' => 'referer'
                ];
                $data['user_settings'][] = [
                    'key' => 'utm_content',
                    'value' => $this->app['session']->get('utm_content'),
                    'group' => 'referer'
                ];
            }

            if ($request->request->get('registrationReferer')) {
                $data['user_settings'][] = [
                    'key' => 'registrationReferer',
                    'value' => $request->request->get('registrationReferer')
                ];
            }

            $result = $this->getDefaultClient()->post('/oauth2/token', $data)->getContent();
            if (isset($result['user'])) {
                // custom data for eulerian
                $edata = $this->collectDataForEulerian($result['user']);

                // User is already register
                return new JsonResponse($result['user'] + $edata);
            }
            // Register in 2 steps
            return new JsonResponse($result);
        } catch (ApiDataException $ex) {
            $errors = $ex->getErrors();
            $errorMess = "Erreur lors de l'inscription: ";
            foreach ($errors as &$error) {
                $errorMess .= $this->app['translator']->trans('form.error'.$error['code']) . "<br />";
            }
            $errorMess = rtrim($errorMess, '<br />');
            if ($request->isXmlHttpRequest() && $errorMess != '') {
                return new JsonResponse($errorMess, 400);
            } else {
                return $this->app->redirect($this->app['url_generator']->generate('user.login'), 302);
            }
        } catch (\Exception $ex) {
            $return = [
                'error' => true,
                'message' => $ex->getMessage(),
                'code' => $ex->getCode()
            ];
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse($return, 400);
            } else {
                return $this->app->redirect($this->app['url_generator']->generate('user.login'), 302);
            }
        }
    }

    /**
     * Perform a User login by Facebook
     * @param Request $request
     * @return JsonResponse
     */
    public function loginFacebook(Request $request)
    {
        try {
            if (!$request->request->has('oauth_token')) {
                throw new \Exception("oauth_token is not defined");
            }
            $oauth_token = $request->request->get('oauth_token');
            $data = [
                'oauth_token' => $oauth_token,
                'client_id' => $this->app['api.client.oauth']['clientId'],
                'client_secret' => $this->app['api.client.oauth']['clientSecret'],
                'redirect_uri' => '/user/login/facebook',
                'grant_type' => 'http://www.facebook.com',
                'godfatherId' => $this->app['session']->get('godfatherId'),
                'newAppFlow' => true,
            ];

            if ($request->request->has('missingEmail')) {
                if ($request->get('missingEmail') !== '') {
                    $data['missingEmail'] = $request->get('missingEmail');
                } else {
                    if ($request->isXmlHttpRequest()) {
                        return new JsonResponse("Veuillez renseigner une valeur", 400);
                    }
                }
            }

            $data['user_settings'] = [
                ['key' => 'termsagree', 'value' => 1],
                ['key' => 'registrationLandingPage', 'value' => $this->app['session']->get('landingPage')],
                ['key' => 'registrationLandingReferer', 'value' => $this->app['session']->get('landingReferer')]
            ];
            if (!empty($this->app['session']->get('utm_campaign'))) {
                $data['user_settings'][] = [
                    'key' => 'utm_source',
                    'value' => $this->app['session']->get('utm_source'),
                    'group' => 'referer'
                ];
                $data['user_settings'][] = [
                    'key' => 'utm_medium',
                    'value' => $this->app['session']->get('utm_medium'),
                    'group' => 'referer'
                ];
                $data['user_settings'][] = [
                    'key' => 'utm_campaign',
                    'value' => $this->app['session']->get('utm_campaign'),
                    'group' => 'referer'
                ];
                $data['user_settings'][] = [
                    'key' => 'utm_content',
                    'value' => $this->app['session']->get('utm_content'),
                    'group' => 'referer'
                ];
            }

            if ($request->request->get('registrationReferer')) {
                $data['user_settings'][] = [
                    'key' => 'registrationReferer',
                    'value' => $request->request->get('registrationReferer')
                ];
            }

            if ($request->request->has('screenWidth')) {
                $data['user_settings'][] = [
                    'key' => 'registrationWidth',
                    'value' => $request->request->get('screenWidth')
                ];
            }

            if ($request->request->has('screenHeight')) {
                $data['user_settings'][] = [
                    'key' => 'registrationHeight',
                    'value' => $request->request->get('screenHeight')
                ];
            }

            $result = $this->app['apiclient.default']->post('/oauth2/token', $data)->getContent();
            if (isset($result['user'])) {
                // custom data for eulerian
                $edata = $this->collectDataForEulerian($result['user']);
                // User is already register
                return new JsonResponse($result['user'] + $edata);
            }
            // Register in 2 steps
            return new JsonResponse($result);
        } catch (ApiDataException $ex) {
            $errors = $ex->getErrors();
            $errorMess = "Erreur lors de l'inscription: ";
            foreach ($errors as &$error) {
                $errorMess .= $this->app['translator']->trans('form.error'.$error['code']) . "<br />";
            }
            $errorMess = rtrim($errorMess, '<br />');
            if ($request->isXmlHttpRequest() && $errorMess != '') {
                return new JsonResponse($errorMess, 400);
            } else {
                return $this->app->redirect($this->app['url_generator']->generate('user.login'), 302);
            }
        } catch (ApiException $ex) {
            $return = [
                'error'=>true,
                'message'=>  $ex->getMessage(),
                'code'=>$ex->getCode()
            ];
            if ($ex->getMessage() !== "facebook.no_email_found") {
                $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
            }
            $this->getLogger()->warn('FB login ApiException '.$ex->getMessage(), ['exception'=>$ex]);
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse($return, 400);
            } else {
                return $this->app->redirect($this->app['url_generator']->generate('user.login'), 302);
            }
        } catch (\Exception $ex) {
            $return = [
                'error'=>true,
                'message'=>  $ex->getMessage(),
                'code'=>$ex->getCode()
            ];

            $this->getLogger()->warn('FB login Exception '.$ex->getMessage(), ['exception'=>$ex]);
            if ($request->isXmlHttpRequest()) {
                return new JsonResponse($return, 400);
            } else {
                return $this->app->redirect($this->app['url_generator']->generate('user.login'), 302);
            }
        }
    }
    /**
     * Perform a User login
     * @param Request $request
     */
    public function login(Request $request)
    {
        if ($request->isXmlHttpRequest()) {
            $lastError = $this->app['security.last_error']($request);
            if (!empty($lastError)) {
                return new JsonResponse([
                    'error' => $this->app['translator']->trans($lastError),
                ]);
            }
            return new JsonResponse([
                'error' => false,
            ]);
        }

        // only show this page when not logged in
        if ($this->app['service.user']->isAuthenticated()) {
            return $this->app->redirect($this->app['url_generator']->generate('user.profile'));
        }

        if ($this->app['session']->has('oauth_refresh_failed')) {
            $this->app['logger']->error('Could not refresh Oauth. '.$this->app['session']->get('oauth_refresh_failed'));
            $this->app['session']->getFlashBag()->add('error', 'Vous avez été déconnecté, vous pouvez essayer de vous réidentifier');
            $this->app['session']->remove('oauth_refresh_failed');
        }

        return $this->app['twig']->render(
            'user/login.twig',
            array(
                'error' => $this->app['security.last_error']($request),
                'referer' => $request->query->get('back'),
                'last_username' => $this->app['session']->get('_security.last_username'),
                'email' => $this->app['session']->get('email'),
                'hideBreadcrumb' => true,
                'stylesheets' => [
                    'style',
                ],
            )
        );
    }

    /**
     * Register a new user
     * @param Request $request
     * @return RedirectResponse|JsonResponse
     */
    public function register(Request $request, ?string $themes = 'default')
    {
        if (!$this->app['readonly']) {
            if ($request->isMethod('GET')) {
                if ($this->app['service.user']->isAuthenticated()) {
                    if ($request->isXmlHttpRequest()) {
                        return new JsonResponse(['error' => true, 'url' => $request->headers->get('referer')]);
                    }
                    return $this->app->redirect($this->app['url_generator']->generate('homepage'));
                }
                $this->app['session']->set('redirectAfterRegister', $request->headers->get('referer'));
            }

            // Easybid
            $screenWidth = (int) $request->get('screenWidth');
            $easybidVariation = $screenWidth > 1 && $screenWidth <= 769 ? '2':'1';

            $userSettings = [];
            $userSettings[] = ['key' => 'easybid', 'value' => $easybidVariation];
            if ($request->get('want_newsletter_enfoires')) {
                // Register enfoires pages
                $userSettings[] = [
                    'key' => 'newsletter_enfoires',
                    'value' => $request->get('want_newsletter_enfoires'),
                    'group' => 'mail'
                ];
            }
            if ($request->get('want_newsletter_clubmed')) {
                // Register club-med pages
                $userSettings[] = [
                    'key' => 'want_newsletter_clubmed',
                    'value' => $request->get('want_newsletter_clubmed') === 'true' ? '1' : '0',
                    'group' => 'mail'
                ];
            }
            if ($request->request->has('settings')) {
                $settings = \is_string($request->get('settings')) ? json_decode($request->request->get('settings')) : $request->request->get('settings');
                foreach ($settings as $key => $settings) {
                    $data = ['key' => $key];
                    if (is_string($settings)) {
                        $data['value'] = $settings;
                    } else {
                        $data['value'] = $settings->value;
                        $data['group'] = $settings->group;
                    }

                    $userSettings[] = $data;
                }
            }

            $userService = $this->getUserService();

            $res = $request->query->has('rawdata') ? $userService->simpleRegister($request, $userSettings) : null;

            if ($request->query->has('gfid') || $this->app['session']->get('godfatherId')) {
                if ($request->query->has('gfid')) {
                    $gfid = $request->query->get('gfid');
                } elseif ($this->app['session']->get('godfatherId')) {
                    $gfid = $this->app['session']->get('godfatherId');
                }

                $data['godfather'] = $this->app['apiclient.user']->getUser($gfid)->getContent();
            }

            if ($res !== null) {
                if (\is_array($res)) {
                    // An error generated
                    return new JsonResponse([
                        'hasError' => true,
                        'errors' => $res,
                    ]);
                } elseif (is_string($res)) {
                    $user_id = $this->app['session']->get('user_id');

                    if ($request->isXmlHttpRequest() && ($res === 'user.register.success.connected' || $res === 'user.register.success' || $easybidVariation === '2')) {
                        $userData = $userService->getUser();
                        $redirect = $easybidVariation === '2' ? $this->loginAfterRegister($request) : $this->redirectAfterRegister();
                        $return = [
                            'redirect' => $redirect,
                            'success' => true,
                            'leadNumber' => sha1($userData['email']),
                            'title' => "Vous êtes inscrit !",
                        ];

                        if ($easybidVariation === '2') {
                            $this->app['session']->getFlashBag()->add('trackConfirm', 'yes');
                            $this->app['session']->getFlashBag()->add('success_easybid', [
                                'email'                         => $userData['email'],
                                'trackRegisterWithNewsletter'   => $request->get('want_newsletter') == 'true' ? 1 : 0,
                                'redirect'                      => $redirect,
                                'text'                          => "Un email a été envoyé à {$userData['email']}, merci de consulter votre boite mail pour confirmer votre inscription. Pensez à vérifier vos spams, on ne sait jamais."
                            ]);
                            $return['success_easybid'] = true;
                            $return['result'] = "Félicitations vous êtes inscrit, connexion en cours...";
                        } else {
                            $this->app['session']->getFlashBag()->add('resendEmailConfirmation', $userData['email']);
                            $return['uid'] = $userData['num'];
                            $return['profile'] = $this->getUserService()->getUserTrackingProfile(false, false);
                            $return['nl'] = $request->get('newsletter') == 'true' ? 1 : 0;
                            $return['result'] = "Félicitations vous êtes inscrit, redirection en cours...";
                        }
                        return new JsonResponse($return);
                    }

                    if ($easybidVariation === '2') {
                        $this->ssoLogin(['token' => $this->app['session']->get('tokenSSO'), 'id' => $user_id]);
                    }
                    return $this->app->redirect($this->app['url_generator']->generate($res));
                }

                return $res;
            }

            $data['bodyclass'] = 'fullpage';
            $data['themes'] = $themes;
            try {
                $data['contents'] = $this->getLandingpageService()->getContentRegister($themes);
            } catch (\Exception $e) {
                return new Response($this->app['twig']->render('404.twig'), 404);
            }

            // canonical
            if ($themes !== 'default') {
                $data['canonicalPage'] = $this->app['url_generator']->generate('user.register');
            }

            // stylesheets
            $data['stylesheets'] = [
                'style',
                'auctionsList',
                'register',
            ];

            return $this->app['twig']->render('user/register.twig', $data);
        } else {
            $this->app['session']->getFlashBag()->add('error', 'Le site fonctionne actuellement de façon limité. Nous serons de retour prochainement.');
            return $this->app->redirect($this->app['url_generator']->generate('homepage'));
        }
    }

    private function loginAfterRegister(Request $request)
    {
        $userId = $this->app['session']->get('user_id');
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();
        $registerRedirect = $this->redirectAfterRegister();
        if ($this->ssoLogin($user)) {
            if ($registerRedirect != null) {
                return $registerRedirect;
            }
            if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                return $this->app['url_generator']->generate('homepage');
            } else {
                // Always redirect to user login page
                return $this->app['url_generator']->generate('user.login');
            }
        }
    }

    private function redirectAfterRegister()
    {
        $url = $this->app['session']->get('redirectAfterRegister');
        return $url ?? '/';
    }

    public function registerSuccess()
    {
        return $this->app['twig']->render(
            'user/register-success.twig',
            array(
                'email' => $this->app['session']->get('email', $this->app['translator']->trans('your email address')),
                'refer' => $this->app['session']->get('utm_source'),
            )
        );
    }

    public function resetPassword(Request $request, $userId)
    {
        $errors = array();
        $message = $error = '';
        $noForm = false;

        if ($request->isMethod('GET')) {
            $data['getValidationResetPassword'] = 'true';

            if ($request->query->has('code')) {
                $data['token'] = $request->query->get('code');
            }

            $validationResetPassword = $this->app['apiclient.default']->get("/user/$userId/password/", $data)->getContent();

            if (empty($validationResetPassword)) {
                $noForm = true;
            }
        }

        if ($request->isMethod('POST')) {
            if (trim($request->request->get('password')) == '') {
                $errors[] = $this->app['translator']->trans('Password is required');
            }
            if ($request->request->get('password') != $request->request->get('password_check')) {
                $errors[] = $this->app['translator']->trans('Your passwords do not match');
            }

            if (count($errors) == 0) {
                try {
                    if ($request->query->has('v')) {
                        $result = $this->app['apiclient.user']->updatePassword($userId, $request->request->get('password'), $request->request->get('code'), $request->query->get('v'));
                    } else {
                        $result = $this->app['apiclient.user']->updatePassword($userId, $request->request->get('password'), $request->request->get('code'));
                    }
                    $message = $this->app['translator']->trans('Your password has been reset, you can now').' <a href="'.$this->app['url_generator']->generate('user.login').'">' . $this->app['translator']->trans('log in') . '</a> ' . $this->app['translator']->trans('with your new password');
                } catch (\Exception $e) {
                    $errors[] = $this->app['translator']->trans('Could not change password... Make sure you copied the link from the email exactly!');
                }
            }

            if (count($errors) > 0) {
                $error = "<h4>".$this->app['translator']->trans('Unable to change password')."</h4>";
                $error .= implode('<br/>', $errors);
            }
        }

        return $this->app['twig']->render(
            'user/reset-password.twig',
            array(
                'error' => $error,
                'message' => $message,
                'code' => $request->get('code'),
                'noForm' => $noForm,
            )
        );
    }

    public function resetEmail(Request $request)
    {
        if ($request->query->has('code') && $request->query->has('verif')) {
            $token = $request->query->get('code');
            $data['verif'] = $request->query->get('verif');
        }

        $validationEmail = $this->app['apiclient.default']->put("/mail/$token?fromToken=1&resetEmail=1", $data)->getContent();
        if (!$validationEmail) {
            $this->app['session']->getFlashBag()->add('error', 'Ce lien est incorrecte ou expiré');
            return $this->app->redirect($this->app['url_generator']->generate('homepage'));
        } else {
            $this->app['session']->getFlashBag()->add('success', "Vous pouvez désormais utiliser {$validationEmail['value']} pour créer un compte");

            return $this->app->redirect($this->app['url_generator']->generate('user.register'));
        }
    }

    /**
     * For app
     * @param Request $request
     * @return type
     */
    public function lostPasswordApp(Request $request)
    {
        $data = $this->lostPasswordTreatment($request);
        if (!is_array($data)) {
            return $data;
        }
        return $this->app['twig']->render('user/lost-passwordApp.twig', $data);
    }

    public function lostPassword(Request $request)
    {
        // only show this page when not logged in
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.profile'));
        }
        $data = $this->lostPasswordTreatment($request);
        if ($request->isXmlHttpRequest()) {
            return new JsonResponse($data);
        }
        $data['hideBreadcrumb'] = true;
        $data['stylesheets'] = [
            'style',
        ];
        return $this->app['twig']->render('user/lost-password.twig', $data);
    }

    private function lostPasswordTreatment(Request $request)
    {
        $result = ['email' => $request->request->get('email')];

        // only show this page when not logged in
        if ($this->app['service.user']->isAuthenticated()) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }

        if ($request->isMethod('POST')) {
            try {
                $this->app['apiclient.user']->forgetPassword($request->request->get('email'));
                $result['message'] = $this->app['translator']->trans('A link has been sent');
            } catch (ApiDataException $e) {
                $err = $e->getErrors();
                $result['error'] = $this->app['translator']->trans($err[0][0]);
            }
        }

        return $result;
    }

    /**
     * Add new email
     * @param Request $request
     * @return array|bool|JsonResponse|RedirectResponse
     */
    public function changeEmail(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $message = '';
        $error = '';

        $userId = $this->app['security']->getToken()->getUser();
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();

        if ($request->isXmlHttpRequest() && $request->isMethod('POST')) {
            $response = new JsonResponse();
            try {
                if ($request->request->get('change') && $request->request->get('email')) {
                    $this->app['apiclient.user']->insertMail($userId, [
                        'change' => $request->request->get('change'),
                        'mail' => $request->request->get('email'),
                    ])->getContent();
                    return $response;
                }
            } catch (ApiDataException $e) {
                $errors = $e->getErrors();
                $response = [];
                foreach ($errors as $error) {
                    $response['code'] = $error['code'];
                    $response['message'] = $this->app['translator']->trans('form.error' . $error['code']);
                }
                return new JsonResponse($response, 418);
            } catch (\Exception $ex) {
                $response->setStatusCode(500, $ex->getMessage());
                return $response;
            }
        }

        /** @var Form $form */
        $form = $this->app['form.factory']->create(new MailType(), $user);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $data = $form->getNormData();
            $dataMail = $request->get('mail');
            try {
                $dataForm = [
                    'mail' => $data['email'],
                    'change' => 0,
                ];
                if (isset($dataMail['productId'])) {
                    $dataForm['productId'] = $dataMail['productId'];
                }
                if (isset($dataMail['isApp'])) {
                    $dataForm['isApp'] = $dataMail['isApp'];
                }

                $this->app['apiclient.user']->insertMail($userId, $dataForm)->getContent();
                if ($request->isXmlHttpRequest()) {
                    return $this->app['twig']->render('modals/content/registerConfirm.twig', [
                        'email' => $data['email'],
                        'trackRegisterWithNewsletter' => 0,
                        'hideTitle' => true
                    ]);
                } else {
                    $this->app['session']->getFlashBag()->add('success', 'Nous avons envoyé un email de confirmation dans la boîte mail ' . $data['email'] . '. Veuillez maintenant confirmer en cliquant sur le lien envoyé. Pensez à regarder dans vos spams !');
                }
            } catch (ApiDataException $e) {
                $errors = $e->getErrors();
                foreach ($errors as $error) {
                    $form->get($error['field'])->addError(new FormError($this->app['translator']->trans('form.error' . $error['code'])));
                }
            } catch (ApiException $e) {
                $this->app['session']->getFlashBag()->add('error', $e->getMessage());
            }
        }

        $userEmails = $this->app['apiclient.user']->getUserValidationEmails($userId)->getContent();
        // Put current email in first position
        if (count($userEmails) > 1) {
            foreach ($userEmails as $k => $userEmail) {
                if ($userEmail['value'] == $user['email']) {
                    if ($k == 0) {
                        break; // Already in first pos
                    }
                    $temp = $userEmails[0];
                    $userEmails[0] = $userEmail;
                    $userEmails[$k] = $temp;
                }
            }
        }
        if ($request->isXmlHttpRequest()) {
            $this->app['session']->set('redirectAfterRegister', $request->headers->get('referer'));
            return $this->app['twig']->render('form/changeEmail.twig', [
                'emailForm'             => $form->createView(),
                'labelClass'            => 'sr-only',
                'submitLabel'           => "Renvoyer l'e-mail de confirmation",
                'submitClass'           => 'btn btn-primary btn-block',
                'inputContainerClass'   => 'form-group',
                'submitContainerClass'  => 'form-group',
                'placeholder'           => 'Votre nouvelle adresse email',
                'action'                => 'user.email'
            ]);
        } else {
            return $this->app['twig']->render(
                'user/change-email.twig',
                array(
                    'message' => $message,
                    'error' => $error,
                    'email' => $user['email'],
                    'emails' => $userEmails,
                    'emailForm' => $form->createView(),
                    'hideBreadcrumb' => true,
                )
            );
        }
    }

    /**
     * Send confirmation email
     * @param Request $request
     */
    public function sendEmailConfirmation(Request $request, $emailId)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        try {
            $this->app['apiclient.user']->updateMail($emailId);
            $this->app['session']->getFlashBag()->add('success', 'Votre mail de confirmation a bien été envoyé, merci de vérifier vos spams.');
        } catch (\Exception $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
            return $this->app->redirect($this->app['url_generator']->generate('user.profile'));
        }


        return $this->app->redirect($this->app['url_generator']->generate('user.email'));
    }

    /**
     * create godfather link
     */
    public function parrainagelink(Request $request)
    {
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }
        $this->getUser();

        if ($this->user['godfatherLink'] == null) {
            $this->user = $this->app['apiclient.user']->saveGodfatherLink($this->user['id'])->getContent();
            $this->app['service.user']->refreshUser($this->user['id']);
        }

        return $this->user['godfatherLink'];
    }

    public function profile(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $this->user = $this->getUser();

        if ($request->isXmlHttpRequest()) {
            $this->setNewRelicTransName('user.profile.ajax');
            return $this->ajax($request);
        }

        $dataView = [
            'hideBreadcrumb' => true,
            'hideRechercheMobile' => true,
            'stylesheets' => [
                'style',
                'user/profile'
            ],
        ];

        $userLocation = $this->app['apiclient.default']->get($this->user['_links']['location'])->getContent();
        if (count($userLocation) > 0) {
            $this->user['street'] = $userLocation['street'];
            $this->user['housenumber'] = $userLocation['housenumber'];
            $this->user['zipcode'] = $userLocation['zipcode'];
            $this->user['city'] = $userLocation['city'];
            $this->user['country'] = $userLocation['country'];
        }

        $form = $this->app['form.factory']->create(new ProfileType(), $this->user);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $data = $form->getNormData();
            $noError = true;
            try {
                if ($data['birthday'] === null) {
                    $ex = new ApiDataException();
                    $ex->setErrors([['field'=>'birthday', 'code'=>1005]]);
                    throw $ex;
                }
                $userDatas = [
                    'firstName' => $data['firstName'],
                    'lastName' => $data['lastName'],
                    'gender' => $data['gender'],
                    'birthday' => $data['birthday'],
                    'telephone' => $data['telephone'],
                    'showZipcode' => $data['showZipcode']
                ];

                $result = $this->app['apiclient.user']->save($userDatas, $this->user['id']);
                $this->app['service.user']->refreshUser($this->user['id']);
                // update / insert user location
            } catch (ApiDataException $e) {
                $noError = false;
                $errors = $e->getErrors();
                foreach ($errors as $error) {
                    $form->get($error['field'])->addError(new FormError($this->app['translator']->trans('form.error'.$error['code'])));
                }
            }

            $locationDatas = [
                'street' => $data['street'],
                'housenumber' => ($data['housenumber'] == null)? " " :$data['housenumber'] ,
                'zipcode' => $data['zipcode'],
                'city' => $data['city'],
                'country' => $data['country']
            ];

            try {
                if (isset($userLocation['id'])) {
                    $this->app['apiclient.location']->save($locationDatas, $userLocation['id']);
                } else {
                    $this->app['apiclient.user']->insertLocation($this->user['id'], $locationDatas);
                }
            } catch (ApiDataException $e) {
                $noError = false;
                $errors = $e->getErrors();
                foreach ($errors as $error) {
                    $form->get($error['field'])->addError(new FormError($this->app['translator']->trans('location.form.error'.$error['code'])));
                }
            }
            if ($noError) {
                $this->app['session']->getFlashBag()->add('success', $this->app['translator']->trans('Your changes have been saved'));
            }
        }

        $dataView['profileForm'] = $form->createView();

        $emailSettings = $this->app['apiclient.user']->getUserSettings($this->user['id'])->getContent();
        $defaults = [
            'mail_settings' => [
                'email_allow_auction_overbid',
            ]
        ];
        $dataView['allowOverbid'] = 1;
        foreach ($emailSettings as $setting) {
            if ('emailing' == $setting['group'] && 0 === intval($setting['value'])) {
                unset($defaults['mail_settings'][array_search($setting['key'], $defaults['mail_settings'])]);
            }
            if ('engine_optin_status' == $setting['key'] && 1 === intval($setting['value'])) {
                $defaults['mail_settings'][] = 'engine_optin_status';
            }
            if ('email_allow_auction_overbid' == $setting['key'] && 1 === intval($setting['value'])) {
                $defaults['mail_settings'][] = 'email_allow_auction_overbid';
            }
            if ('email_allow_auction_overbid' == $setting['key'] && 0 === intval($setting['value'])) {
                $dataView['allowOverbid'] = 0;
            }
        }

        $preferencesForm = $this->app['form.factory']->create(new PreferencesType(), $defaults);
        $dataView['preferencesForm'] = $preferencesForm->createView();

        $creditcards = $this->app['apiclient.default']->get($this->user['_links']['creditcards'], ['valid' => 1,'active' => 1])->getContent();
        $dataView['creditcards'] = $creditcards;

        if ($this->isApp($request) && $this->app['session']->get('mobiletoken') != 'android-app2') {
            $payments = $this->app['apiclient.default']->get("/user/". $this->user['id'] ."/auction/", ['forUserAuctions' => 1, 'withoutFilter' => 1])->getContent();

            $dataView['bookableVouchers'] = array_filter($payments, function ($elem) {
                $bookableVouchers = $this->getAuctionService()->getCheckoutFlow($elem['flow'])['bookableVouchers'];
                if ($bookableVouchers && $elem['voucherId'] !== null && $elem['voucherId'] !== '') {
                    return $elem;
                }
            });
        }

        // Eulerian Tag
        $this->getTrackerService()->buildTags([
            EulerianTagBuilder::getContainerKey() => function () use ($userLocation) {
                $zipCode = 'N/A';
                if (count($userLocation) > 0) {
                    $zipCode = $userLocation['zipcode'];
                }
                $additionalEAData = [
                    'pagegroup' => 'page mon compte',
                    'code-postal' => $zipCode
                ];
                return $additionalEAData;
            }
        ]);

        return $this->app['twig']->render('user/profile.twig', $dataView);
    }

    public function avantages(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $user = $this->getUser();
        $userId = $this->user['id'];
        $dataView = ['hideBreadcrumb' => true];

        if ($request->isMethod('POST') && $request->request->has('giftcardcode')) {
            $giftcardcode = htmlspecialchars($request->request->get('giftcardcode'));
            // Check if Giftcard exist
            try {
                $back = $this->app['apiclient.finance']->addGiftcardToUser($userId, ['giftcardcode' => $giftcardcode])->getContent();
                $user = $this->user = $this->app['apiclient.user']->getUser($userId)->getContent();
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['type'=>'success', 'message'=>  "Votre code a bien été pris en compte et votre cagnotte est désormais de ".($back['amount_left']/100)."€ ! Rendez-vous sur '<a href=\"{$this->app['url_generator']->generate('user.avantages')}\">Mes avantages</a>'"]);
                } else {
                    $this->app['session']->getFlashBag()->add('success', 'Carte cadeau rajoutée avec succès');
                }
            } catch (\Exception $ex) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['type'=>'danger', 'message'=>  $ex->getMessage()], 418);
                } else {
                    $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                }
            }
        }

        $giftcards = $this->app['apiclient.default']->get($user['_links']['giftcards'])->getContent();
        $promocodes = $this->app['apiclient.user']->getUserPromocodes($userId)->getContent();

        $available = 0;

        foreach ($giftcards as $key => $giftcard) {
            $giftcards[$key]['debit'] = $this->app['apiclient.default']->get($giftcard['_links']['debits'])->getContent();
            if (new \DateTime($giftcard['expire_date']) > new \DateTime()) {
                $available+= $giftcard['amount_left'];
            }
            $solde = $giftcard['original_amount'];
            foreach ($giftcards[$key]['debit'] as $keyDebit => $debit) {
                $giftcards[$key]['debit'][$keyDebit]['solde_before'] = $solde;
                $giftcards[$key]['debit'][$keyDebit]['solde_after'] = $solde - $debit['amount'];
                $solde -= $debit['amount'];
            }
        }

        $dataView['giftcards'] = $giftcards;
        $dataView['promocodes'] = $promocodes;
        $dataView['available'] = $available;

        return $this->app['twig']->render('user/avantages.twig', $dataView);
    }

    public function favorites(Request $request)
    {
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $user = $this->getUser();
        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        $limit = 3;
        if ($request->isXmlHttpRequest()) {
            try {
                if ($request->request->get('action')) {
                    // like/unlike product on favorite
                    $this->app['apiclient.default']->post("/userproduct/", [
                        'user'      => $user['id'],
                        'product'   => $request->request->get('pid'),
                        'action'    => $request->request->get('action')
                    ])->getContent();
                    // Update session
                    $this->app['service.user']->refreshUser($user['id']);

                    $a_userProducts = json_encode($userService->getUserProducts(true));

                    //Eulerian data
                    $profileInfo = $this->getUserService()->getUserTrackingProfile(false, false);
                    $optin = $profileInfo['optin'] ?? false;
                    $eData = [
                        // EA need a unique devis ref to identify conversion coming from favorite
                        'ref' => sha1($user['num']."favori".time()),
                        'leadNumber' => hash('sha256', $user['email']),
                        'uid' => $user['num'],
                        'profile' => $profileInfo['profile'] ?? '',
                        'nl' => $optin,
                    ];

                    return new JsonResponse(['retour'=>true, 'userProducts'=>  $a_userProducts] + $eData);
                } elseif ($request->query->get('userproduct')) {
                    $queryUserProducts = $userService->getUserProducts();
                    return new JsonResponse([
                        'products'    => $queryUserProducts
                    ]);
                } elseif ($request->query->has('type') && $request->query->get('type') === 'auctions') {
                    $a_userProducts = $userService->getUserProducts(true);
                    $auctionsSuggestions = $this->getUserSuggestions($a_userProducts, $limit);
                    foreach ($auctionsSuggestions as $k => $auction) {
                        // Generate IMG
                        $imageMax = $this->app['service.images']->noprotocol($this->app['service.images']->imgForList($auctionsSuggestions[$k]['images']));
                        $imageMin = $this->app['service.images']->transf($imageMax, 'c_fit,w_470');
                        $auctionsSuggestions[$k]['imageMax'] = $imageMax;
                        $auctionsSuggestions[$k]['imageMin'] = $imageMin;
                    }
                    return new JsonResponse([
                        'auctions'              => $auctionsSuggestions,
                        'num_rows'              => count($auctionsSuggestions),
                        'list'                  => 'Favorites suggestion',
                        'userProducts'          => json_encode($a_userProducts),
                    ]);
                }
            } catch (\Exception $e) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['retour'=>$e->getMessage()]);
                } else {
                    $this->app['session']->getFlashBag()->add('error', $e->getMessage());
                }
            }
        }

        // get user suggestion userproduct/?getSuggestion=1&user=3
        $a_userProducts = $userService->getUserProducts(true);
        $auctionsSuggestions = $this->getUserSuggestions($a_userProducts, $limit); // Todo remove

        $dataView = [
            'hideBreadcrumb'        => true,
            'auctionsSuggestions'   => $auctionsSuggestions,
            'limit'                 => $limit,
            'userProducts'          => json_encode($a_userProducts),
            'wishListId'          => $this->app['service.user']->encryptUserData($user['id'])
        ];

        $this->app['response.nostore'] = true;

        return $this->app['twig']->render('user/favorites.twig', $dataView);
    }

    public function appData()
    {
        $this->setNewRelicTransName('user.appdata');

        $response = [];

        if ($this->isAuthenticated()) {
            /** @var UserService $userService */
            $userService = $this->app['service.user'];
            $userProducts = json_encode($userService->getUserProducts(true));

            $this->getUser();

            $response['products'] = $userProducts;
            $response['num'] = $this->user['num'];
            $response['userHash'] = $this->user['userHash'];
            $response['firstName'] = $this->user['firstName'];
            $response['firebaseToken'] = $this->app['session']->get('firebaseToken');
            $response['auctionsPending'] = ''; // for init vuex user data. See userInfos in \assets\js\firebase\firebase.jss
            $response['phone'] = strpos($this->user['telephone'], '0033') === 0 ? str_replace('0033', '0', $this->user['telephone']) : $this->user['telephone'];
            $response['email'] = $this->user['email'];
        }

        return new JsonResponse($response);
    }

    private function ajax(Request $request)
    {
        try {
            $response = [];
            if ($request->request->has('phone') && !$request->request->has('code')) {
                // form validation "validationPhone"
                $this->setNewRelicTransName('user.profile.ajax.phone');
                $this->app['apiclient.default']->post("user/{$this->user['id']}/phonevalidation/", ['telephone'=>$request->request->get('phone')]);
                $viewFormValidationPhoneCode = $this->app['twig']->render('form/validationPhoneCode.twig');
                $response['error'] = false;
                $response['formValidationPhoneCode'] = $viewFormValidationPhoneCode;
            } elseif ($request->request->has('phone') && $request->request->has('code')) {
                // form validation "validationPhoneCode"
                $this->setNewRelicTransName('user.profile.ajax.phoneCode');
                $this->app['apiclient.default']->post("user/{$this->user['id']}/phonevalidation/", ['telephone'=>$request->request->get('phone'),'code'=>trim($request->request->get('code'))]);
                $response['error'] = false;
            } elseif ($request->query->has('phoneValidate')) {
                $this->setNewRelicTransName('user.profile.ajax.phoneValidate');
                if ($this->app['session']->get('phoneValidate') === true) {
                    $response['error'] = false;
                    $response['isValide'] = true;
                } else {
                    $query = $this->app['apiclient.default']->get("user/{$this->user['id']}/phonevalidation/", ['status'=>'validated'])->getContent();
                    $result = !empty($query);
                    $this->app['session']->set('phoneValidate', $result);
                    $response['error'] = false;
                    $response['isValide'] = $result;
                }
            }

            if ($request->query->has('refresh')) {
                $this->app['service.user']->refreshUser($this->user['id']);
                $this->user = $this->app['apiclient.user']->saveGodfatherLink($this->user['id'])->getContent();
                $response = $this->user;
            }
            if ($request->query->has('abtest')) {
                $variation = 0;
                $abtestname = $request->query->get('abtest');
                $this->app['googleanalytics']->executeTest($abtestname);
                // Catch variation value (0 OR 1)
                $variation = $this->app['googleanalytics']->getVariation($abtestname);
                $this->app['service.user']->setSettingValue($this->user, $abtestname, $variation, 'abtest');
                $response[$abtestname] = $variation;
            }
            return new JsonResponse($response);
        } catch (NotActionException $ex) {
            $this->addNewRelicCustomParam('requestContent', $request);
            $this->newRelicNoticeError($ex->getMessage(), $ex);
            $return = [
                'error'     => true,
                'message'   => $ex->getMessage(),
            ];

            return new JsonResponse($return, 404);
        } catch (\Exception $ex) {
            $return = [
                'error'=>true,
                'message'=>  $ex->getMessage(),
                'code'=>$ex->getCode(),
                'formValidationPhoneCode' => $viewFormValidationPhoneCode = $this->app['twig']->render('form/validationPhoneCode.twig')
            ];

            return new JsonResponse($return, 418);
        }
    }

    private function getUserSuggestions($a_userProducts, $limit)
    {
        $auctionsSuggestions = $this->app['apiclient.default']->get('/userproduct/', [
            'getSuggestion' => true,
            'user'          => $this->user['id'],
            'excludeIds'    => $a_userProducts,
            'limit'         => $limit
        ])->getContent();
        foreach ($auctionsSuggestions as $k => $auction) {
            $auctionsSuggestions[$k] = array_merge($auctionsSuggestions[$k], $this->getAuctionService()->enrichAuction($auction));
        }
        return $auctionsSuggestions;
    }

    public function parrainage(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $user = $this->getUser();
        $userId = $this->user['id'];
        $dataView = ['hideBreadcrumb' => true];

        // add godchild
        if ($request->request->has('parrainage')) {
            $data = $request->request->get('parrainage');
            if ($data['godson'] != '') {
                try {
                    $result = $this->app['apiclient.default']->post("/user/$userId/godchild/", [
                        'email'     => explode(',', $data['godson']),
                        'text'      => nl2br($data['message']),
                        'firstName' => $data['firstName'],
                        'lastName'  => $data['lastName']
                    ])->getContent();
                    if ($request->request->get('ajax')) {
                        return new Response($result);
                    }
                    $this->app['session']->getFlashBag()->add('success', "Votre message a bien été envoyé");
                } catch (\Exception $e) {
                    if ($request->request->get('ajax')) {
                        return new Response($e->getMessage());
                    } else {
                        $this->app['session']->getFlashBag()->add('error', $e->getMessage());
                    }
                }
            }
        }

        if (!isset($data['firstName'])) {
            $data['firstName'] = $user['firstName'];
        }
        if (!isset($data['lastName'])) {
            $data['lastName'] = $user['lastName'];
        }

        $formParrainage = $this->app['form.factory']->create(new \ASS\Form\ParrainageType(), $data);
        $dataView['parrainageForm'] = $formParrainage->createView();

        $godchilds = $this->app['apiclient.user']->getGodchilds($userId)->getContent();
        $dataView['godchilds'] = $godchilds;

        $userLocation = $user["id_location"]? $this->app['apiclient.default']->get(sprintf('/user/%d/location/', $user['id']))->getContent() : [];
        $user = $this->user = array_merge($user, $userLocation);

        $dataView['user'] = $user;
        $dataView['useTwitterShare'] = true;

        return $this->app['twig']->render('user/parrainage.twig', $dataView);
    }

    public function changePassword(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $passwordForm = $this->app['form.factory']->create(new PasswordType());
        $passwordForm->handleRequest($request);
        if ($passwordForm->isValid()) {
            $passwordDatas = $passwordForm->getNormData();
            if ($passwordDatas['checkPassword'] != $passwordDatas['password']) {
                $passwordForm->get('checkPassword')->addError(new FormError($this->app['translator']->trans('form.error1200')));
            } else {
                try {
                    $this->getUser();
                    $userId = $this->user['id'];

                    $this->app['apiclient.user']->authenticate(
                        $this->app['security']->getToken()->getAttribute('user')['email'],
                        $passwordDatas['oldPassword'],
                        $this->app['api.client.oauth']['clientId'],
                        $this->app['api.client.oauth']['clientSecret'],
                        $this->app['api.client.oauth']['redirectUri']
                    )->getContent();

                    $this->app['apiclient.user']->updatePassword($userId, $passwordDatas['password']);
                    $this->app['session']->getFlashBag()->add('success', $this->app['translator']->trans('Your password has been changed'));
                } catch (\Exception $e) {
                    $passwordForm->get('oldPassword')->addError(new FormError($this->app['translator']->trans('form.error1201')));
                } catch (ApiDataException $e) {
                    $errors = $e->getErrors();
                    foreach ($errors as $error) {
                        $passwordForm->get($error['field'])->addError(new FormError($this->app['translator']->trans('form.error'.$error['code'])));
                    }
                }
            }
        }

        $dataView = [
            'hideBreadcrumb' => true,
            'passwordForm'   => $passwordForm->createView(),
        ];

        return $this->app['twig']->render('user/changepassword.twig', $dataView);
    }

    public function deleteCreditCard(Request $request, $id)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        try {
            $this->app['apiclient.finance']->deleteCreditCard($id);
            $this->app['session']->getFlashBag()->add('success', "Carte supprimée avec succès");
        } catch (ApiException $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
        }

        return $this->app->redirect($this->app['url_generator']->generate('user.profile'));
    }

    /**
     * Show auction for user.
     * @return int
     */
    public function auctions(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        if (!isset($this->app['security']->getToken()->getAttribute('user')['userHash'])) {
            $this->app['service.user']->refreshUser($this->app['security']->getToken()->getUser());
        }

        $userId = $this->app['security']->getToken()->getUser();
        /** @var UserService $userService */
        $UserService = $this->app['service.user'];
        $a_userProducts = json_encode($UserService->getUserProducts(true));

        if ($request->isXmlHttpRequest()) {
            try {
                if ($request->query->has('action') && $request->query->get('action') === 'current') {
                    $auctions = $this->app['apiclient.default']->get("/user/$userId/auction/", ['status' => 'current','combine' => true])->getContent();
                    foreach ($auctions as $key => $auction) {
                        unset($auctions[$key]['auction_created']);
                        unset($auctions[$key]['auction_id']);
                        unset($auctions[$key]['auction_status']);
                        unset($auctions[$key]['auction_updated']);
                        unset($auctions[$key]['bid_amount']);
                        unset($auctions[$key]['images']);
                        unset($auctions[$key]['payment_url']);
                        unset($auctions[$key]['product_name']);
                        unset($auctions[$key]['product_shortLoc']);
                        unset($auctions[$key]['tags']);
                    }
                    $this->app['session']->set('userActiveAuctions', $auctions);
                    $data = ['auctions' => $auctions, 'nb' => count($auctions)];
                } else {
                    $data = $this->app['apiclient.default']->get("/user/$userId/auction/", ['forUserAuctions' => 1])->getContent();
                    foreach ($data['actualAuctions'] as $key => $row) {
                        $data['actualAuctions'][$key]['auction_id'] = $row['id'];
                        $data['actualAuctions'][$key]['uuid'] = $row['auction_uuid'];
                        $data['actualAuctions'][$key]['bid_amount'] = $row['actual_bid'];
                        $data['actualAuctions'][$key]['images'][] = $row['product_image'];
                        $data['actualAuctions'][$key]['endAuction'] = (object) [];
                        $data['actualAuctions'][$key]['lead'] = ($data['actualAuctions'][$key]['actual_bid'] === $data['actualAuctions'][$key]['user_bid'] ? true:false);
                        unset($data['actualAuctions'][$key]['auction_uuid']);
                        unset($data['actualAuctions'][$key]['product_image']);
                        unset($data['actualAuctions'][$key]['actual_bid']);
                        unset($data['actualAuctions'][$key]['id']);
                        // Generate IMG
                        $imageMax = $this->app['service.images']->noprotocol($this->app['service.images']->imgForList($data['actualAuctions'][$key]['images']));
                        $imageMin = $this->app['service.images']->transf($imageMax, 'c_fit,w_470');
                        $data['actualAuctions'][$key]['imageMax'] = $imageMax;
                        $data['actualAuctions'][$key]['imageMin'] = $imageMin;
                    }
                    $data['auctions'] = $data['actualAuctions'];
                    unset($data['actualAuctions']);
                    $data['a_userProducts'] = $a_userProducts;
                }
                if (isset($data['actualAuctions'])) {
                    $data['auctions'] = $data['actualAuctions'];
                    unset($data['actualAuctions']);
                }
                $data['a_userProducts'] = $a_userProducts;

                return new JsonResponse($data);
            } catch (\Exception $e) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['retour'=>$e->getMessage(), $e->getLine()]);
                } else {
                    $this->app['session']->getFlashBag()->add('error', $e->getMessage());
                }
            }
        }

        // Update nb notifications
        $this->app['service.user']->refreshUser($userId);

        $auctionTemplate = $this->app['twig']->render('auction/list/auctionsSlide.twig', ['withStatus'=>1]);
        /*  array(4
            auctionsPending =>  array(1)
            auctionsComplete    =>  array()
            auctionsArchived    =>  array()
            actualAuctions  =>  array()
            )*/
        $data = $this->app['apiclient.default']->get("/user/$userId/auction/", ['forUserAuctions' => 1])->getContent();

        return $this->app['twig']->render('user/auctions.twig', [
            'hideBreadcrumb'            => true,
            'auctionTemplate'           => addslashes(str_replace(array('<br>','<br />',"\n","\r",'  ' ), array('','','','',''), trim($auctionTemplate))),
            'userProducts'              => $a_userProducts,
            'auctionsPending'           => $data['auctionsPending'],
        ]);
    }

    /**
     * Confirm an User account
     * @param Request $request
     * @param integer $userId
     */
    public function confirm(Request $request, $userId)
    {
        $code = $request->query->get('code');
        try {
            $isFromKimpembeRegister = $request->get('utm_campaign') === 'email_confirmation_foot';
            $isFromEnfoiresRegister = $request->get('utm_content') === 'CRM_Email_Transactionnal_confirmation_enfoires';
            $isFromClubmedRegister = $request->get('utm_content') === 'CRM_Email_Transactionnal_confirmation_clubmed';
            $user = $this->app['apiclient.user']->confirm($userId, $code, $request->query->get('mail'))->getContent();
            if (!isset($user['status']) || 'active' !== $user['status']) {
                throw new ApiException('Could not confirm your account');
            }

            $usersettings = $this->app['apiclient.default']->get($user['_links']['settings'])->getContent();
            $settingKey = array_search('easybid', array_column($usersettings, 'key'));
            $easyBidRegister = $settingKey !== false && $usersettings[$settingKey]['value'] == '2';

            // Check redirect to product
            $re = '/(product\/)([0-9]+)/';
            $str = $this->app['session']->get('redirectAfterRegister');
            preg_match_all($re, $str, $matches, PREG_SET_ORDER, 0);
            $wantCookie = '';
            if (!empty($matches)) {
                $wantCookie = 'want-bid-'.$matches[0][2];
            }

            if ($request->query->get('change') === '1') {
                // Message de confirmation quand un membre confirme son changement d'email
                $this->app['session']->getFlashBag()->add('success', 'Your email has been changed. You must use to connect');
            } else {
                // Confirmation du mail après inscription
                if (!$isFromKimpembeRegister && !$isFromEnfoiresRegister && $isFromClubmedRegister && ($wantCookie == '' || ($wantCookie != '' && !$request->cookies->has($wantCookie)))) {
                    $this->app['session']->getFlashBag()->add('success_title', 'Congratulations');
                    $this->app['session']->getFlashBag()->add('success', 'You can now login with your credentials Quick');
                }
                if (!$easyBidRegister) {
                    $this->app['session']->getFlashBag()->add('trackConfirm', 'yes');
                }
            }

            foreach ($usersettings as $value) {
                if ($value['key'] == "utm_source") {
                    $this->app['session']->set('utm_source', $value['value']);
                }
                // Email is valid we subscribe to the news if user ticked the box
                if (($value['key'] === "newsletter") && $value["value"] == 1) {
                    $this->getDefaultClient()->post('/newsletter/', ['subscribe' => 1, 'email' => $user['email']]);
                }
                // add msg for person who have a promocode when subscribe
                if ($value['key'] ==  'registrationLandingPage') {
                    if ((strpos($value['value'], '/bienvenue') !== false)) {
                        $this->app['session']->getFlashBag()->add('success_landingpage', 'Retrouvez votre bon cadeau de bienvenue de 5 euros sur votre profil à la rubrique "Mes avantages".');
                    }
                }
                //registrationReferer
                if ($value['key'] == "registrationReferer") {
                    if ($value['value']) {
                        // Security check
                        $hostname = parse_url($value['value'], PHP_URL_HOST);
                        if (strstr($hostname, 'loisirsencheres.com') !== false || strstr($hostname, '.loisirsentest.com') !== false) {
                            $this->app['session']->set('login_target_path', $value['value']);
                        }
                    }
                }
            }

            $this->app['session']->set('email', $user['email']);
            $this->app['session']->set('leadId', crc32($user['email']));
            $this->app['session']->set('trackingUId', $user['trackingUId']);
            // Check if the user is connected.
            if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                // On regénère les données de sécurité de l'utilisateur avec son nouvel email
                $this->app['service.user']->refreshUser($userId);
            } else {
                $this->ssoLogin($user);
            }
            if ($isFromKimpembeRegister) {
                // ByPass wanted redirect to go to kimpembe landing page
                return $this->app->redirect($this->app['url_generator']->generate('landing.solidary', ['alias' => 'kimpembe-football-les-virades-de-l-espoir']).'#registerStatus');
            }
            if ($isFromEnfoiresRegister) {
                // ByPass wanted redirect to go to Enfoires landing page Confirm
                return $this->app->redirect($this->app['url_generator']->generate('enfoires.confirm'));
            }
            $registerRedirect = $this->app['session']->get('redirectAfterRegister');
            if ($registerRedirect != null) {
                return $this->app->redirect($registerRedirect);
            }
        } catch (ApiException $e) {
            // Confirm failed set flash message and redirect to user login
            $this->app['session']->getFlashBag()->add('error', 'Nous n\'avons pas pu confirmer votre email. Si vous rencontrez de nouveau des problèmes, n\'hésitez pas à nous contacter via info@loisirsencheres.com.');
        } catch (ApiDataException $e) {
            // Confirm failed set flash message and redirect to user login
            $this->app['session']->getFlashBag()->add('error', 'Nous n\'avons pas pu confirmer votre email. Si vous rencontrez de nouveau des problèmes, n\'hésitez pas à nous contacter via info@loisirsencheres.com.');
        }
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect(
                $this->app['url_generator']->generate('homepage')
            );
        } else {
            // Always redirect to user login page
            return $this->app->redirect(
                $this->app['url_generator']->generate('user.login')
            );
        }
    }

    public function confirmMobile(Request $request, $userId)
    {
        $code = $request->query->get('code');
        $email = $request->query->get('mail');
        $productId = $request->query->get('productId');
        try {
            $result = $this->app['apiclient.user']->confirm($userId, $code, $email)->getContent();
            if (!isset($result['status']) || 'active' !== $result['status']) {
                throw new ApiException('Could not confirm your account');
            }
            if ($this->authenticated($request)) {
                $this->app['service.user']->refreshUser($userId);
            }
        } catch (ApiException $e) {
            $this->app['session']->getFlashBag()->add('error', 'Nous n\'avons pas pu confirmer votre email. Si vous rencontrez de nouveau des problèmes, n\'hésitez pas à nous contacter via info@loisirsencheres.com.');
        }
        return $this->app['twig']->render('landingPage/confirmEmail.twig', [
            'productId' => $productId,
            'userId' => $userId,
        ]);
    }

    private function ssoLogin(array $user)
    {
        // User is not connected, connect him if the ssotoken stored in the session is the same as the user token
        $request = $this->app['request'];
        $ssoToken = null;
        if ($request) {
            /** @var Request $request */
            $request = $this->app['request'];
            $ssoToken = $request->get('ssoToken');
        }
        if ($ssoToken === null) {
            $ssoToken = $this->app['session']->get('tokenSSO');
        }


        if ($ssoToken != null && $ssoToken == $user['token']) {
            $tokenCurl = curl_init();
            $tokenCurlUrl = $this->app['api.baseurl']."/oauth2/token";
            $tokenCurlVars = [
                'user_id' => $user['id'],
                'usertoken' => $ssoToken,
                'grant_type' => 'http://usertoken',
                'client_id' => $this->app['api.client.oauth']['clientId'],
                'client_secret' => $this->app['api.client.oauth']['clientSecret']
            ];
            curl_setopt($tokenCurl, CURLOPT_URL, $tokenCurlUrl);
            curl_setopt($tokenCurl, CURLOPT_POST, 1);
            curl_setopt($tokenCurl, CURLOPT_POSTFIELDS, $tokenCurlVars);  //Post Fields
            curl_setopt($tokenCurl, CURLOPT_RETURNTRANSFER, true);
            $result = json_decode(curl_exec($tokenCurl), true);
            if (!empty($result['user'])) {
                $token = new UsernamePasswordToken(
                    "" . $result['user']['id'],
                    null,
                    'user',
                    $result['user']['roles']
                );

                $token->setAttributes(array());
                $token->setAttribute('access_token', $result['access_token']);
                $token->setAttribute('refresh_token', $result['refresh_token']);
                $token->setAttribute('expires', time() + $result['expires_in']);
                if (!empty($result['user'])) {
                    $token->setAttribute('user', $result['user']);
                }

                $this->app['security']->setToken($token);
                $this->app['session']->set('client_id', $result['client_id']);
                return true;
            }
        }
    }

    public function sendConfirmMail(Request $request)
    {
        if ($request->isXmlHttpRequest() && $this->authenticated($request)) {
            if ($request->isMethod('POST')) {
                $response = new JsonResponse();

                $data = ['email' => $request->request->get('email')];

                try {
                    $this->app['apiclient.mail']->save($data);
                } catch (\Exception $ex) {
                    $response->setStatusCode(500, $ex->getMessage());
                }
                return $response;
            }

            $userId = $this->app['security']->getToken()->getUser();
            $user = $this->app['apiclient.user']->getUser($userId)->getContent();
            $data = ['email' => $user['email']];
            if ($request->query->has('productId')) {
                $data['productId'] = $request->query->get('productId');
            }
            if ($request->query->has('isApp')) {
                $data['isApp'] = $request->query->get('isApp');
            }
            $this->app['apiclient.mail']->save($data);
            return $this->app['twig']->render('modals/content/registerConfirm.twig', [
                'email' => $user['email'],
                'trackRegisterWithNewsletter' => 0,
                'hideTitle' => true
            ]);
        } else {
            // Non authenticated user
            /** @var Form $mailForm */
            $mailForm = $this->app['form.factory']->create(new MailType());
            $mailForm->handleRequest($request);
            if ($mailForm->isValid()) {
                $mail = $mailForm->getData()['email'];
                try {
                    $data = ['email' => $mail];
                    $this->app['apiclient.mail']->save($data);
                    $this->app['session']->getFlashBag()->add('success', 'Nous vous avons envoyé un email de confirmation à l\'adresse que vous avez specifiée. Si vous ne le trouvez pas, merci de regarder dans votre dossier spams/courriers indésirables');
                    return $this->app->redirect($this->app['url_generator']->generate('homepage'));
                } catch (ApiException $e) {
                    $this->app['session']->getFlashBag()->add('error', $e->getMessage());
                    return $this->app->redirect($this->app['url_generator']->generate('homepage'));
                }
            }
            return $this->app['twig']->render(
                'user/confirm-mail.twig',
                array('mailForm' => $mailForm->createView())
            );
        }
    }

    /**
     * Get voucher
     * @param $userId
     * @param $voucherId
     */
    public function voucher($userId, $voucherId)
    {
        // Check if the user is connected.
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $tokenUserId = $this->app['security']->getToken()->getUser();

            // Check if this is the user's voucher.
            if ($tokenUserId == $userId) {
                $voucher = $this->app['apiclient.finance']->getVoucher($voucherId, true)->getContent();
                return new Response($voucher, 200, array('content-type' => 'application/pdf'));
            } else {
                $error = 'unauthorized';
            }
        } else {
            $error = 'unauthenticated';
        }

        // Redirect if error.
        if ($error != '') {
            return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => $error)));
        }
    }

    public function updateVoucherGift(Request $request, $userId, $voucherId)
    {
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        try {
            $tokenUserId = $this->app['security']->getToken()->getUser();
            if ($tokenUserId == $userId) {
                if ($request->getMethod() == 'POST') {
                    $data['updateForGift'] = true;
                    if ($request->request->has('giftFirstname')) {
                        $data['giftFirstname'] = $request->request->get('giftFirstname');
                    }
                    if ($request->request->has('giftLastname')) {
                        $data['giftLastname'] = $request->request->get('giftLastname');
                    }
                    if ($request->request->has('fromText')) {
                        $data['fromText'] = $request->request->get('fromText');
                    }
                    if ($request->request->has('giftText')) {
                        $data['giftText'] = $request->request->get('giftText');
                    }

                    $this->app['apiclient.voucher']->updateVoucher($voucherId, $data)->getContent();
                    $voucher = $this->app['apiclient.finance']->getVoucher($voucherId, true)->getContent();

                    return new Response($voucher, 200, array('content-type' => 'application/pdf'));
                } else {
                    return $this->app['twig']->render('user/customVoucher.twig');
                }
            } else {
                return $this->app->redirect(
                    $this->app['url_generator']->generate('user.login')
                );
            }
        } catch (\Exception $ex) {
            return $ex->getMessage();
        }
    }

    /**
     * Get invoice
     * @param Request $request
     * @param $userId
     * @param $invoiceId
     */
    public function invoice(Request $request, $userId, $invoiceId)
    {
        $error = '';

        // Check if the user is connected.
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $tokenUserId = $this->app['security']->getToken()->getUser();

            // Check if this is the user's invoice.
            if ($tokenUserId == $userId) {
                $invoice = $this->app['apiclient.finance']->getInvoice($invoiceId, true)->getContent();
                return new Response($invoice, 200, array('content-type' => 'application/pdf'));
            } else {
                $error = 'unauthorised';
            }
        } else {
            $error = 'unauthenticated';
        }

        // Redirect if error.
        if ($error != '') {
            return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => $error)));
        }
    }

    public function updateSettingMail(Request $request)
    {
        $id =  $request->query->get('id');
        $setting = $request->query->get('setting');

        if ($request->query->get('checked') == "true") {
            $newValue = 1;
        } else {
            $newValue = 0;
        }
        try {
            if ($setting !== "engine_optin_status") {
                $settingUpdated = $this->app['apiclient.user']->saveUserSetting($id, $setting, $newValue, 'emailing');
            } else {
                $user = $this->app['apiclient.user']->getUser($id)->getContent();

                if ($newValue === 1) {
                    $result = $this->getDefaultClient()->post('/newsletter/', ['subscribe' => 1, 'email'=> $user['email']]);
                } else {
                    $result = $this->getDefaultClient()->post('/newsletter/', ['unsubscribe' => 1, 'email'=> $user['email']]);
                }
                if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $this->app['security']->getToken()->getUser()) {
                    $user = $this->app['security']->getToken()->getAttribute('user');
                    $user['preferences']['isOptin'] = $newValue === 1;
                    $this->app['security']->getToken()->setAttribute('user', $user);
                }
                $this->app['service.user']->refreshUserSettings();
                return json_encode($result);
            }
            $this->app['service.user']->refreshUserSettings();
            return json_encode($settingUpdated);
        } catch (\Exception $e) {
            throw new ApiException('Error updating setting mail :'.$e->getMessage());
        }
    }

    public function bookVoucher(Request $request, $voucherId, $userId)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $voucher = $this->app['apiclient.finance']->getVoucher($voucherId)->getContent();
        if ($voucher['dateBooked'] != null) {
            $this->app['session']->getFlashBag()->add('error', "Vous avez déjà reservé auprès de notre partenaire.");
            if ($this->app['service.mobileApp']->isApp($request, $this->app['session'])) {
                $deeplink = $this->app['url_generator']->getDeeplink('user.purchase');
                return $this->app->redirect($deeplink);
            } else {
                return $this->app->redirect($this->app['url_generator']->generate('user.purchase'));
            }
        }

        // @todo don't fetch product description for example
        $auction = $this->app['apiclient.default']->get($voucher['_links']['auction'])->getContent();
        $product = $this->app['apiclient.default']->get($auction['_links']['product'])->getContent();
        $checkoutFlow = $this->getAuctionService()->getCheckoutFlow($product['flow']);
        $checkoutFlow['hasSeclectableDate'] = true;
        $params = [];
        $params['checkoutFlow'] = $checkoutFlow;

        // Redirect to dedicated reservation
        if ($checkoutFlow['hasReservation']) {
            $reservation = $this->app['apiclient.default']->get($voucher['_links']['auction'] .'?reservationInfo=1')->getContent();
            return $this->app->redirect($this->app['url_generator']->generate('reservation.complete', array('resId' => $reservation['id'],'token' => $reservation['token'])));
        }

        if ($product['bookLink'] == null && $product['flow'] != 'en_book_form_calendar') {
            $this->app['session']->getFlashBag()->add('error', "Nous ne disposons pas d'information de reservation pour ce produit");
            return $this->app->redirect(
                $this->app['url_generator']->generate('all.page')
            );
        }

        if ($product['bookable']) {
            $departureCities = $this->app['apiclient.default']->get($product['_links']['departureCities'])->getContent();
            foreach ($departureCities as $key => $departureCitie) {
                $availabilities = $this->app['apiclient.availability']->getAvailabilities([
                    'product'           => $product['id'],
                    'departureCity'     => $departureCitie['id'],
                    'orderBy'           => 'dateTrip',
                    'orderByDirection'  => 'ASC',
                ])->getContent();

                $newAvailabilities = array();
                foreach ($availabilities as $availabilitie) {
                    $dateTrip = new \DateTime($availabilitie['dateTrip']);
                    $newAvailabilities[$dateTrip->format('j')] = $availabilitie;
                }

                $availabilities = $newAvailabilities;
                unset($newAvailabilities);

                $departureCities[$key]['availabilities'] = $availabilities;
                $departureCities[$key]['hasAvailable'] = $this->app['service.availabilites']->calendarHasAvailable($departureCities[$key]);
            }
        }

        if ($product['flow'] == "en_book_form_calendar") {
            if ($voucher['bookingInformation'] != null) {
                $this->app['session']->getFlashBag()->add('error', "La réservation est en attente.");
                if ($this->app['service.mobileApp']->isApp($request, $this->app['session'])) {
                    $deeplink = $this->app['url_generator']->getDeeplink('user.purchase');
                    return $this->app->redirect($deeplink);
                } else {
                    return $this->app->redirect($this->app['url_generator']->generate('user.purchase'));
                }
            }
            $this->app['logger']->warning("POST_RESA Flow email enter");
            $errors = [];
            $error = "";
            $success = "";
            if ($request->isMethod('POST')) {
                $this->app['logger']->warning("POST_RESA Enter");
                $reqFields = [
                    'civilite0' => 'Civilité non remplie ou invalide',
                    'lastName0' => 'Nom non rempli ou invalide',
                    'firstName0' => 'Prénom non rempli ou invalide',
                    'birthDate0' => 'Date de naissance non remplie ou invalide',
                    'bookDate' => 'Date de réservation non remplie ou invalide',
                    'phoneNumber' => 'Numéro de téléphone non rempli ou invalide',
                    'userMail' => 'Mail non rempli ou invalide',
                ];
                foreach ($reqFields as $field => $message) {
                    if (!$request->request->has($field) || $request->get($field) == '') {
                        $errors[] = $message;
                    }
                }

                if (count($errors) == 0) {
                    $user = $this->app['apiclient.user']->getUser($userId)->getContent();
                    $auctionStr = $voucher['_links']['auction'];
                    $auction = explode('/', $auctionStr);
                    $payments = $this->app['apiclient.finance']->getPayments(['query'=>1, 'user' => $userId])->getContent();
                    foreach ($payments as $payment) {
                        if ($payment['auctionId'] == $auction[2]) {
                            $dateWin = substr($payment['created'], 0, 10);
                        }
                    }
                    if ($product['bookMail']) {
                        $to  = explode(",", $product['bookMail']);
                        array_push($to, "reservation@loisirsencheres.com");
                        $this->app['logger']->warning("POST_RESA Adding bookMail");
                    } else {
                        $to = "reservation@loisirsencheres.com";
                    }
                    $this->app['logger']->warning("POST_RESA Mail configuration");
                    $replyTo = array($request->get('userMail'));
                    $from    = array('contact@loisirsencheres.com' => "Réservation Loisirs Enchères");
                    $subject = $product['id'].' - '.$user['lastName'].' - '.$product['shortName'];

                    for ($i = 0; $i < $product['nbPassenger']; $i++) {
                        if ($request->request->has('lastName'. $i)) {
                            $request->request->set('lastName'.$i, strtoupper($request->request->get('lastName'.$i)));
                            $request->request->set('firstName'.$i, ucfirst(strtolower($request->request->get('firstName'.$i))));
                        }
                    }

                    $bodyContent = $request->request->all()+['voucherCode' => $voucher['code'], 'dateAuctionWin' => $dateWin, 'nbMax' => $product['nbPassenger'],'userId' => $user['id'], 'productCode' => $product['id'], 'productName' => $product['name']];
                    $body = $this->app['twig']->render('user/bookMailEN.twig', $bodyContent);
                    // Create the message
                    try {
                        $this->app['logger']->warning("POST_RESA Email settings");
                        $message = \Swift_Message::newInstance()
                            ->setSubject($subject)
                            ->setFrom($from)
                            ->setTo($to)
                            ->setReplyTo($replyTo)
                            ->setBody($body)
                            ->setContentType('text/html');
                        $result = $this->app['mailer']->send($message);
                    } catch (\Swift_RfcComplianceException $e) {
                        $this->app['logger']->warning("POST_RESA Catch invalid email adress");
                        $errors[] = $this->app['translator']->trans('Invalid email address');
                        $result = false;
                    } catch (\Exception $e) {
                        $this->app['logger']->warning("POST_RESA Catch mail Exception");
                        $this->app['logger']->error($e);
                        $result = false;
                    }
                    if ($result) {
                        $this->app['logger']->warning("POST_RESA Message sent");
                        $success = $this->app['translator']->trans('Thank you, your message has been sent');
                        $this->app['session']->getFlashBag()->add('success', $success);
                        // Update voucher
                        $this->app['apiclient.voucher']->updateVoucher($voucherId, ['bookingInformation' => $bodyContent]);
                        if ($this->app['service.mobileApp']->isApp($request, $this->app['session'])) {
                            $deeplink = $this->app['url_generator']->getDeeplink('user.purchase');
                            return $this->app->redirect($deeplink);
                        } else {
                            return $this->app->redirect($this->app['url_generator']->generate('user.purchase'));
                        }
                    } else {
                        $this->app['logger']->warning("POST_RESA Error Mail not send");
                        $errors[] = $this->app['translator']->trans('Could not send email');
                    }
                }
            }
            // simple error reporting...
            if (count($errors) > 0) {
                $error = "<h4>" . $this->app['translator']->trans('Mail not send') . "</h4>";
                $error .= implode('<br/>', $errors);
            }
            $params['error'] = $error;
            $params['success'] = $success;
            $params['bookInfo'] = $product['bookInfoUrl'];
            $params['nbPassenger'] = $product['nbPassenger'] !== null ? $product['nbPassenger'] : 0;
            $params['hasAvailabilities'] = true;
            $departureCities[0]['name'] = '';
            $departureCities[0]['id'] = 1;
            $availabilityParams = [
                'product' => $product['id'],
                'orderBy' => 'dateTrip',
                'orderByDirection' => 'ASC',
                'fromNow' => '1',
            ];
            if (isset($auction['id'])) {
                $availabilityParams['auctionId'] = $auction['id'];
                $availabilityParams['relativeToNbDay'] = true;
            }
            $departureCities[0]['availabilities'] = $this->app['apiclient.default']->getContentCached('/availability/', $availabilityParams);
            $departureCities[0]['hasAvailable'] = $this->app['service.availabilites']->calendarHasAvailable($departureCities[0]);
            $params['departureCities'] = $departureCities;
            $params['product'] = $product;
            $params['productDescription'] = $product['description'];

            return $this->app['twig']->render('user/reserverFormEN.twig', $params);
        }

        if ($product['bookLink'] == "Fanny") {
            if ($voucher['bookingInformation'] != null) {
                $this->app['session']->getFlashBag()->add('error', "La réservation est en attente.");
                return $this->app->redirect(
                    $this->app['url_generator']->generate('user.purchase')
                );
            }
            $errors = [];
            $error = "";
            $success = "";
            if ($request->isMethod('POST')) {
                // Every field should be filled
                $reqFields = [
                    'civilite1' => 'Civilité du passager 1 non rempli ou invalide',
                    'name1' => 'Nom du passager 1 non rempli ou invalide',
                    'firstName1' => 'Prénom du passager 1 non rempli ou invalide',
                    'birthday1' => 'Date de naissance du passager 1 non rempli ou invalide',
                    'birthcity1' => 'Ville de naissance du passager 1 non rempli ou invalide',
                    'civilite2' => 'Civilité du passager 2 non rempli ou invalide',
                    'name2' => 'Nom du passager 2 non rempli ou invalide',
                    'firstName2' => 'Prénom du passager 2 non rempli ou invalide',
                    'birthday2' => 'Date de naissance du passager 2 non rempli ou invalide',
                    'birthcity2' => 'Ville de naissance du passager 2 non rempli ou invalide',
                    'departureCity' => 'Ville de départ non rempli ou invalide',
                    'departureDate' => 'Date de départ non rempli ou invalide',
                    'phoneNumber' => 'Numéro de téléphone non rempli ou invalide',
                    'userMail' => 'Mail non rempli ou invalide',
                ];
                foreach ($reqFields as $field => $message) {
                    if (!$request->request->has($field) || $request->get($field) == '') {
                        $errors[] = $message;
                    }
                }
                if (count($errors) == 0) {
                    $user = $this->app['apiclient.user']->getUser($userId)->getContent();
                    $to      = array('voyage@loisirsencheres.com' => 'Loisirs Encheres');
                    $replyTo = array($user['email']);
                    $from    = array('contact@loisirsencheres.com' => $request->request->get('name'));
                    $subject = 'Reservation pour '.$product['name'].' - '.$user['firstName'].' '.$user['lastName'];

                    $bodyContent = $request->request->all()+['voucherCode' => $voucher['code'],'userId' => $user['id'], 'productCode' => $product['id']];
                    $body= $this->app['twig']->render('user/bookMail.twig', $bodyContent);
                    // Create the message
                    try {
                        $message = \Swift_Message::newInstance()
                            ->setSubject($subject)
                            ->setFrom($from)
                            ->setCc(['cecile@loisirsencheres.com'])
                            ->setTo($to)
                            ->setReplyTo($replyTo)
                            ->setBody($body)
                        ;
                        $result = $this->app['mailer']->send($message);
                    } catch (\Swift_RfcComplianceException $e) {
                        $errors[] = $this->app['translator']->trans('Invalid email address');
                        $result = false;
                    } catch (\Exception $e) {
                        $this->app['logger']->error($e);
                        $result = false;
                    }
                    if ($result) {
                        $success = $this->app['translator']->trans('Thank you, your message has been sent');
                        $this->app['session']->getFlashBag()->add('success', $success);
                        // Update voucher
                        $this->app['apiclient.voucher']->updateVoucher($voucherId, ['bookingInformation' => $bodyContent]);
                        return $this->app->redirect($this->app['url_generator']->generate('user.auctions'));
                    } else {
                        $errors[] = $this->app['translator']->trans('Could not send email');
                    }
                }
            }
            // simple error reporting...
            if (count($errors) > 0) {
                $error = "<h4>" . $this->app['translator']->trans('Mail not send') . "</h4>";
                $error .= implode('<br/>', $errors);
            }
            $params['error'] = $error;
            $params['success'] = $success;
            $params['bookInfo'] = $product['bookInfoUrl'];

            if ($product['bookable']) {
                $params += [
                    'departureCities' => $departureCities,
                    'departureCitiesJson' => json_encode($departureCities),
                ];
            }

            return $this->app['twig']->render('user/reserverForm.twig', $params);
        }

        $data = [
            'bookLink' => $product['bookLink']
        ];

        return $this->app['twig']->render('user/reserver.twig', $data);
    }

    public function reuseEmail(Request $request)
    {
        // only show this page when not logged in
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        $userId = $this->app['security']->getToken()->getUser();
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();

        $userEmails = $this->app['apiclient.user']->getUserValidationEmails($userId)->getContent();

        $mailToRestore = $request->get('email');
        $found = false;
        $foundEmail = null;
        foreach ($userEmails as $userEmail) {
            if ($userEmail['value'] == $mailToRestore) {
                $found = true;
                $foundEmail = $userEmail;
                break;
            }
        }

        if (!$found) {
            $this->app['session']->getFlashBag()->add('error', 'Vous ne possédez pas cet email.');
            return $this->app->redirect($this->app['url_generator']->generate('user.email'));
        }

        if ($foundEmail['confirm_date'] == null) {
            $this->app['session']->getFlashBag()->add('error', 'Cet email n\'a pas été validé. Veuillez regarder dans votre boîte mail.');
            return $this->app->redirect($this->app['url_generator']->generate('user.email'));
        }

        try {
            $this->app['apiclient.user']->insertMail($userId, array('mail'=>$mailToRestore, 'change' => true))->getContent();
            $this->app['service.user']->refreshUser($userId);
            $this->app['session']->getFlashBag()->add('success', 'Votre email a bien été mise à jour !');
        } catch (\Exception $e) {
            $this->app['session']->getFlashBag()->add('error', $e->getMessage());
        }

        return $this->app->redirect($this->app['url_generator']->generate('user.email'));
    }

    public function addCreditCardTransaction(Request $request, $userId, $state)
    {
        return $this->app['twig']->render('auction/deposittransaction.twig', ['success' => $state == 'success']);
    }

    public function optinUser($userId, Request $request)
    {
        try {
            $user = $this->app['apiclient.default']->get("/user/$userId")->getContent();
            if ($user['token'] != $request->get('token')) {
                throw new \InvalidArgumentException("Token invalide");
            }

            $this->getDefaultClient()->post('/newsletter/', ['email' => $user['email'], 'subscribe' => 1]);
            $this->app['session']->getFlashBag()->add('success', "Vous recevrez désormais nos bons plans.<br/>Bonne navigation et bonne chance pour vos enchères !");
            return $this->app->redirect($this->app['url_generator']->generate('homepage'));
        } catch (\Exception $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
            return $this->app->redirect($this->app['url_generator']->generate('homepage'));
        }
    }

    /** PRIVATE FUNCTION **/
    protected function authenticated($request)
    {
        // only show this page when not logged in
        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        if (!$userService->isAuthenticated()) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login', array('back'=>$request->getRequestUri())));
        }
        return true;
    }

    /**
     * @return array logged in User
     */
    protected function getUser()
    {
        $userId = $this->app['security']->getToken()->getUser();
        $this->user = $this->app['apiclient.user']->getUser($userId)->getContent();
        return $this->user;
    }

    /**
     * Collect eulerian edata for connexion tracking
     *
     * @param $user
     * @return array
     * @throws \Exception
     */
    private function collectDataForEulerian($user)
    {
        $profileInfo = $this->getUserService()->getUserTrackingProfile($user['id'], false);
        $optin = $profileInfo['optin'] ?? false;
        return $user + [
                'leadNumber' => hash('sha256', $user['email']),
                'profile' => $profileInfo['profile'] ?? 'Visiteurs',
                'nl' => $optin,
            ];
    }

    public function getAbTestVariation(Request $request, ?string $abTestName = null)
    {
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        return $this->app->json($this->getDefaultClient()->get("/user/{$this->getLoggedInUser()['id']}/setting/$abTestName", ['forAbTest' => 1, 'nbVariation' => 2, ])->getContent());
    }

    public function auctionTracking(Request $request)
    {
        $authenticated = $this->authenticated($request);
        if ($authenticated !== true) {
            return $authenticated;
        }

        return $this->app->json($this->getDefaultClient()->post("/userauctiontracking/", ['key' => $request->get('key'), 'value' => $request->get('value'), 'user' => $this->getLoggedInUser()['id'], 'auction' => $request->get('auction')])->getContent());
    }
}
