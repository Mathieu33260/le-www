<?php

namespace ASS\Service;

use CAC\Component\ApiClient\ApiException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use CAC\Component\ApiClient\ApiDataException;
use Symfony\Component\Form\FormError;

class UserService
{

    use \ASS\Controller\Traits\UserTrait;

    private $app;
    private $user;

    public function __construct($app)
    {
        $this->app = $app;
    }

    /**
     * Returns an array containing the list of products the user's favorite
     * If user is not logged the return is an empty array
     * @param type $onlyId
     * @return type
     */
    public function getUserProducts($onlyId = false)
    {
        if (!$this->isAuthenticated()) {
            return [];
        }

        if (!isset($this->app['security']->getToken()->getAttribute('user')['userproducts'])) {
            $this->refreshUser($this->app['security']->getToken()->getUser());
        }

        $queryUserProducts = $this->app['security']->getToken()->getAttribute('user')['userproducts'];

        $a_userProducts = array_map(function ($userProduct) {
            return $userProduct['product_id'];
        }, $queryUserProducts);

        if ($onlyId) {
            return $a_userProducts;
        } elseif (!$onlyId) {
            if (empty($a_userProducts)) {
                return [];
            }
            $queryProducts = $this->app['apiclient.default']->get('/product/', [
                'byIds'         => 1,
                'withImages'    => 1,
                'pids'          => $a_userProducts
            ])->getContent();

            foreach ($queryUserProducts as $key => $userProduct) {
                foreach ($queryProducts as $rowProduct) {
                    if ($rowProduct['id'] == $userProduct['product_id']) {
                        $queryUserProducts[$key]['product'] = $rowProduct;
                        $queryUserProducts[$key]['images'][] = $rowProduct['images'][0];
                        break;
                    }
                }
            }

            $queryCheckAuctionOnline = $this->app['apiclient.default']->get('/auction/', ['checkOnline'=>true, 'pids' => $a_userProducts])->getContent();

            $queryUserProductsFinal = [];
            foreach ($queryUserProducts as $key => $value) {
                $queryUserProducts[$key]['checkOnlineAuction'] = $queryCheckAuctionOnline[$value['product_id']];
                if ($queryUserProducts[$key]['checkOnlineAuction']) {
                    // Push this product on top array
                    array_unshift($queryUserProductsFinal, $queryUserProducts[$key]);
                } else { // Push this product on bottom array
                    array_push($queryUserProductsFinal, $queryUserProducts[$key]);
                }
            }

            return $queryUserProductsFinal;
        }
    }

    /**
     * Check if current user is logged
     * @return boolean
     */
    public function isAuthenticated()
    {
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return true;
        }
        return false;
    }

    public function refreshUser($userId)
    {
        $user = $this->app['apiclient.default']->get("/user/$userId", ['withUserProducts' => 1, 'withUserProductsPending' => 1])->getContent();
        $this->app['security']->getToken()->setAttribute('user', $user);
    }

    public function getFirebaseToken($userId)
    {
        return $this->app['apiclient.default']->get("/user/$userId", ['firebaseUserToken' => 1])->getContent();
    }

    public function refreshUserSettings()
    {
        $app = $this->app;
        if ($app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $app['security']->getToken()->getUser()) {
            $userId = $app['security']->getToken()->getUser();

            // Put the utm_source of landing when the user signed up in session for later tracking
            if (is_numeric($userId)) {
                $usersettings = $this->app['apiclient.user']->getUserSettings($userId)->getContent();
                foreach ($usersettings as $value) {
                    if ($value['key'] == "utm_source") {
                        $app['session']->set('utm_source', $value['value']);
                    }
                    if ($value['key'] == "engine_optin_status") {
                        $app['session']->set('engine_optin_status', $value['value']);
                    }
                }
            }
        }
    }

    /**
     * Return tracking Profile for current connected user
     *
     * @param bool $userId
     * @param bool $onlyProfileStatus,  if false full payload with additional profile info will be returned
     *                                  (location, optin, accountType)
     * @return Array|string
     */
    public function getUserTrackingProfile($userId = false, $onlyProfileStatus = true)
    {
        if (!is_numeric($userId)) {
            $userId = $this->getLoggedInUserId();
        }

        if (is_numeric($userId)) {
            $payload = $this->app['apiclient.default']->get("/user/$userId", ['trackingProfile' => 1])->getContent();
            if ($onlyProfileStatus) {
                return $payload['profile'] ?? 'Visiteurs';
            }
            return $payload;
        }
        return $onlyProfileStatus ? 'Visiteurs' : null;
    }

    /**
     * @param array $user
     * @param string $key
     * @return string|null
     */
    public function getSettingValue(array $user, $key)
    {
        $value = null;
        try {
            $setting = $this->app['apiclient.user']->getUserSetting($user['id'], $key)->getContent();
            $value = $setting['value'];
        } catch (\Exception $e) {
            if ($e->getCode() !== 404) {
                throw $e;
            }
        }
        return $value;
    }

    /**
     * Processing registration data without symfony form
     * @param Request $request
     * @param Array $userSettings
     * @return this|Object|String
     */
    public function simpleRegister(Request $request, $userSettings = [])
    {
        // only show this page when not logged in
        if ($this->isAuthenticated()) {
            return $this->app->redirect($this->app['url_generator']->generate('user.profile'));
        }
        try {
            $data = $this->registerData($request, $request->request->all()+['user_settings' => $userSettings]);
            return $this->createUser($data, $request->isXmlHttpRequest());
        } catch (ApiDataException $e) {
            $errors = [];
            foreach ($e->getErrors() as $error) {
                $objectError = new FormError($this->app['translator']->trans("form.error{$error['code']}"));
                $errors[$error['field']] = $objectError->getMessage();
            }
            return $errors;
        } catch (\Exception $e) {
            $this->app['logger']->warning('Exception in UserService::register', ['exMessage'=>$e->getMessage()]);
            $this->app['session']->getFlashBag()->add('error', $e->getMessage());
        }
        return $this;
    }

    /**
     * Send the register data to API and define the success status
     * @param [type] $data
     * @param [type] $isXmlHttpRequest
     * @return void
     */
    public function createUser($data, $isXmlHttpRequest)
    {
        try {
            $result = $this->app['apiclient.user']->save($data);
        } catch (ApiException $e) {
            return new JsonResponse([
                'hasError' => true,
                'errors' => "Une erreur s'est produite. Vérifier vos données ou contactez-nous.",
            ]);
        }
        $this->user = $result->getContent();

        if (201 == $result->getStatusCode()) {
            $this->app['session']->set('email', $this->user['email']);
            $this->app['session']->set('user_id', $this->user['id']);
            $this->app['session']->getFlashBag()->add('trackRegister', 'yes');
            $this->app['session']->set('tokenSSO', $this->user['token']);
        }

        return $isXmlHttpRequest && $this->user['status'] === 'active' ? 'user.register.success.connected' : 'user.register.success';
    }

    /**
     * @param array $user
     * @param string $key
     * @param string $value
     */
    public function setSettingValue(array $user, $key, $value, $group = 'default')
    {
        if ($this->isAuthenticated()) {
            try {
                $url = sprintf('/user/%d/setting/', $user['id']);
                $this->app['apiclient.default']->post($url, [
                    'key'   => $key,
                    'value' => $value,
                    'group' => $group,
                ]);
                return $this;
            } catch (\Exception $e) {
                if ($e->getCode() !== 404) {
                    throw $e;
                }
            }
        }
        return $value;
    }

    /**
     * Defines or retrieves the variation of the abtest according to the key provided
     * @param array $user
     * @param type $keyAbtest
     * @return string
     */
    public function abtestVariante(array $user, $keyAbtest)
    {
        // Check if the user is currently in a variation
        $variation = $this->getSettingValue($user, $keyAbtest);
        if ($variation === null) {
            // Define paiement variante
            // user id is impair, variante 1 else user id is pair, variante 0
            $variation = ($user['id']%2 == 1) ? '1':'0';
            $this->setSettingValue($user, $keyAbtest, $variation);
        }
        return $variation;
    }

    /**
     * @param string $mobiletoken sharewire-andro-prd:xxxxxxxxxxxxxxxxxxxx (clientId:token)
     * @return string|null
     */
    public function getMobileTokenClientId($mobiletoken)
    {
        $tokarr = explode(':', $mobiletoken);

        return isset($tokarr[0])?$tokarr[0] : null;
    }

    /**
     * Encrypt a data
     * @param string $data
     * @return string
     */
    public function encryptUserData($data)
    {
        // AES-128-CBC => openssl_get_cipher_methods()
        return base64_encode(openssl_encrypt($data, 'AES-128-CBC', sha1("L'utilisateur n'est pas une licorne."), 0, 'loisirsenchères'));
    }

    public function getUser()
    {
        return $this->user;
    }

    /**
     * Decrypt a data
     * @param string $dataEncrypt
     * @return string
     */
    public function decryptUserData($dataEncrypt)
    {
        // AES-128-CBC => openssl_get_cipher_methods()
        return openssl_decrypt(base64_decode($dataEncrypt), 'AES-128-CBC', sha1("L'utilisateur n'est pas une licorne."), 0, 'loisirsenchères');
    }

    /**
     * Create data for user register
     * @param Request $request
     * @param Array $data
     * @return Array
     */
    private function registerData(Request $request, $data)
    {
        if ($this->app['session']->get('godfatherId')) {
            $data['godfatherId'] = $this->app['session']->get('godfatherId');
        }

        // Flag if the user wants the newsletter, subscribe him on account confirmation
        $subscribeNewsletter = isset($data['want_newsletter']) ? filter_var($data['want_newsletter'], FILTER_VALIDATE_BOOLEAN) : false;
        if ($subscribeNewsletter) {
            $this->app['session']->getFlashBag()->add('trackRegisterWithNewsletter', 'yes');
        }
        $data['user_settings'][] = ['key' => 'termsagree', 'value' => 1];
        $data['user_settings'][] = ['key' => 'registrationLandingPage', 'value'=>$this->app['session']->get('landingPage')];
        $data['user_settings'][] = ['key' => 'registrationLandingReferer', 'value'=>$this->app['session']->get('landingReferer')];
        if (!empty($this->app['session']->get('utm_campaign'))) {
            $data['user_settings'][] = ['key' => 'utm_source', 'value' => $this->app['session']->get('utm_source'), 'group' => 'referer'];
            $data['user_settings'][] = ['key' => 'utm_medium', 'value' => $this->app['session']->get('utm_medium'), 'group' => 'referer'];
            $data['user_settings'][] = ['key' => 'utm_campaign', 'value' => $this->app['session']->get('utm_campaign'), 'group' => 'referer'];
            $data['user_settings'][] = ['key' => 'utm_content', 'value' => $this->app['session']->get('utm_content'), 'group' => 'referer'];
        }
        if (isset($data['hasSurvey']) && $data['hasSurvey']) {
            $data['user_settings'][] = ['key' => 'tookSurvey', 'value' => 1];
            if (isset($data['favoriteRestaurant']) && $data['favoriteRestaurant'] != '') {
                $data['user_settings'][] = ['key' => 'favoriteRestaurant', 'value' => $data['favoriteRestaurant']];
            }
            if (isset($data['favoriteCountry']) && $data['favoriteCountry'] != '') {
                $data['user_settings'][] = ['key' => 'favoriteCountry', 'value' => $data['favoriteCountry']];
            }
        }

        if ($request->request->get('registrationReferer')) {
            $data['user_settings'][] = ['key'=>'registrationReferer', 'value'=>$request->request->get('registrationReferer')];
        }

        foreach (['screenWidth', 'screenHeight', 'registerBidInput', 'registerBidInputAuto', 'registerProductId', 'registerAuctionUuid'] as $key) {
            if ($request->request->get($key)) {
                $data['user_settings'][] = ['key'=>$key, 'value'=>$request->request->get($key)];
            }
        }
        if ($request->request->has('screenWidth')) {
            $data['user_settings'][] = ['key'=>'registrationWidth', 'value'=>$request->request->get('screenWidth')];
        }
        if ($request->request->has('screenHeight')) {
            $data['user_settings'][] = ['key'=>'registrationHeight', 'value'=>$request->request->get('screenHeight')];
        }

        // Register with social network
        if ($request->request->has('facebookId')) {
            $data['facebookId'] = $request->request->get('facebookId');
            $data['facebookHash'] = sha1($request->request->get('facebookId') . $this->app['facebook.hashPWD']);
        }
        if ($request->request->has('googleId')) {
            $data['googleId'] = $request->request->get('googleId');
            $data['googleHash'] = sha1($request->request->get('googleId') . $this->app['google.hashPWD']);
        }

        // registerAuctionEnd
        if ($request->request->get('registerAuctionEnd')) {
            $numberOfSeconds = $this->app['service.auction']->getSecondsLeft($request->request->get('registerAuctionEnd'));
            if ($numberOfSeconds>0) {
                $data['user_settings'][] = ['key'=>'auctionSecondsLeft', 'value'=>$numberOfSeconds];
            }
        }

        if (isset($data['zipcode'])) {
            $locationDatas = ['zipcode' => $data['zipcode'],'country' => $data['country']];
            $data['webLocation'] = $locationDatas;
        }

        return $data;
    }

    /**
     * Return current logged userId
     *
     * @return int|null
     */
    public function getLoggedInUserId()
    {
        if ($this->isAuthenticated() && !empty($this->app['security']->getToken()->getUser())) {
            return $this->app['security']->getToken()->getUser();
        }
        return null;
    }

    /**
     * Return current logged user
     *
     * @return array|null
     */
    public function getLoggedInUser()
    {
        if ($this->isAuthenticated() && !empty($this->app['security']->getToken()->getUser())) {
            return $this->app['security']->getToken()->getAttribute('user');
        }
        return null;
    }

    /**
     * Return user Option subcription
     * return null if user not connected otherwise boolean
     *
     * @return boolean|null
     * @throws \Exception
     */
    public function userHasSubscribe()
    {
        $user = $this->getLoggedInUser();
        if ($user) {
            return (isset($user['subscriptionState']) && $user['subscriptionState'] === 'opted_in');
        }
        return null;
    }
}
