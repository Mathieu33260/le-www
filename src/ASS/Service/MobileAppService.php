<?php
declare(strict_types=1);

namespace ASS\Service;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Predis\Client;

class MobileAppService
{
    const OAUTH_SWITCH_CLIENTID = 'http://switch.client.id';
    const WEBVIEW_TOKEN_LIFETIME = 1800; // 30 minutes. Short cache to avoid using expired or deleted token

    /**
     * @var string
     */
    private $apiBaseurl;

    /**
     * @var string
     */
    private $webviewClientId;

    /**
     * @var string
     */
    private $oauthClientSecret;

    /**
     * @var Predis\Client|null
     */
    private $predis;

    public function __construct(string $apiBaseurl, string $webviewClientId, string $oauthClientSecret, ?Client $predis)
    {
        $this->apiBaseurl = $apiBaseurl;
        $this->webviewClientId = $webviewClientId;
        $this->oauthClientSecret = $oauthClientSecret;
        $this->predis = $predis;
    }

    public function isApp(Request $request, Session $session = null): bool
    {
        if ($request->query->get('noapptheme')) {
            if ($session) {
                $session->remove('apptheme'); // Session will always be app
            }
            return false;
        }

        if ($request->query->get('apptheme') || $request->query->get('onlyview') || ($session && ($session->get('client_id') == 'ass-www-webview' || $session->has('apptheme')))) {
            if ($session) {
                $session->set('apptheme', true); // Session will always be app
            }
            return true;
        }

        return false;
    }

    public function getOauthTokenFromSwitch(string $mobileToken): ?array
    {
        $clientId = $this->webviewClientId;
        $grantType = self::OAUTH_SWITCH_CLIENTID;
        $cacheKey = $clientId . '_' . $grantType . '_' . $mobileToken;

        // Ask API a webview token and cache it
        $curlResult = $this->predis !== null ? $this->predis->get($cacheKey) : null;
        if ($curlResult === null) {
            $curlResult = $this->getOauthTokenFromSwitchApi($mobileToken);
            if ($this->predis !== null) {
                $this->predis->set($cacheKey, $curlResult, 'ex', self::WEBVIEW_TOKEN_LIFETIME); // Cache to avoid using expired or deleted token
            }
        }
        return json_decode($curlResult, true);
    }

    private function getOauthTokenFromSwitchApi(string $mobileToken): ?string
    {
        $tokenCurl = curl_init();
        $tokenCurlUrl = $this->apiBaseurl . "/oauth2/token";
        $tokenCurlVars = [
            'mobiletoken' => $mobileToken,
            'grant_type' => self::OAUTH_SWITCH_CLIENTID,
            'client_id' => $this->webviewClientId,
            'client_secret' => $this->oauthClientSecret
        ];
        curl_setopt($tokenCurl, CURLOPT_URL, $tokenCurlUrl);
        curl_setopt($tokenCurl, CURLOPT_POST, 1);
        curl_setopt($tokenCurl, CURLOPT_POSTFIELDS, $tokenCurlVars);  //Post Fields
        curl_setopt($tokenCurl, CURLOPT_RETURNTRANSFER, true);
        return curl_exec($tokenCurl);
    }
}
