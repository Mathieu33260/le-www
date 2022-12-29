<?php

namespace ASS\Library;

use Symfony\Component\Routing\Generator\UrlGenerator;

class ASSUrlGenerator extends UrlGenerator
{
    private $session;

    /**
     * API call /category/?id-by-tags=1
     * @var string
     */
    private $catIdByTag = '{
        "hotels": 1,
        "vacances_ski": 18,
        "sorties": 2,
        "vacances": 17,
        "gastronomie": 3,
        "bien-etre": 4,
        "spectacles": 16,
        "petit": 9,
        "ateliers": 6,
        "Sud-Est": 10,
        "Sud-Ouest": 11,
        "Nord-Est": 12,
        "Nord-Ouest": 13,
        "Ile-de-France": 14,
        "cadeau-homme-femme": 19,
        "cadeau-enfant": 20,
        "cadeau-couples": 21,
        "cadeau-famille": 22,
        "cadeau-gastronomie": 23,
        "cadeau-bien-etre": 8,
        "cadeau-pas-cher": 24,
        "cadeau-sport": 25,
        "cadeau-evasion": 26,
        "cadeau-original": 27,
        "cadeau-atelier": 48,
        "cadeau-box": 47
    }';

    /** List paths available in webview **/
    private $uriAvailableForApp = [
        'user.profile',
        'user.changePassword',
        'user.avantages',
        'product.auction',
        'product.parrainage',
        'user.email',
        'faq',
        'faq.section',
        'centre-aide',
        'centre-aide.categorie',
        'centre-aide.articles',
    ];

    /** paths to deeplink **/
    private $deeplink = [
        // User
        'user.login' => 'comloisirsencheres://login',
        'user.profile' => 'comloisirsencheres://webview-sso/?url=user/profile',
        'user.register' => 'comloisirsencheres://registration',
        'user_logout' => 'comloisirsencheres://logout',
        'user.purchase' => 'comloisirsencheres://myAuctions/paid',
        'user.auctions' => 'comloisirsencheres://myAuctions/won',

        // Global
        'homepage' => 'comloisirsencheres://home',
        'all.page' => 'comloisirsencheres://all',
        'auctions.map' => 'comloisirsencheres://map',
    ];

    public function generate($name, $parameters = array(), $referenceType = self::ABSOLUTE_PATH)
    {
        $url = parent::generate($name, $parameters, $referenceType);

        // @Todo use MobileAppService::isApp
        if (($this->session && $this->session->get('client_id') == 'ass-www-webview') || $name == 'content.app' || $this->session->has('apptheme')) {
            if ($name === 'christmas.category.name') {
                $name = $parameters['name'];
                $cats = json_decode($this->catIdByTag, true);
                if (!empty($cats[$name])) {
                    $id = $cats[$name];
                    $url = 'comloisirsencheres://category/'.$id;
                }
            }
        }
        
        return $url;
    }

    public function setSession($session)
    {
        $this->session = $session;
    }

    /**
     * Check if param is accessible by app
     * @param string $uriBind
     * @return boolean
     */
    public function isAvailableForApp($uriBind)
    {
        return in_array($uriBind, $this->uriAvailableForApp);
    }

    /**
     * Return this deeplink for a specific uri
     * @param string $uriBind
     * @return string or false
     */
    public function getDeeplink($uriBind)
    {
        return isset($this->deeplink[$uriBind]) ? $this->deeplink[$uriBind]:false;
    }

    /**
     * Return all deeplinks
     * @return array
     */
    public function getDeeplinks()
    {
        return $this->deeplink;
    }
}
