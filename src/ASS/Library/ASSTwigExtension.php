<?php

namespace ASS\Library;

use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Request;
use ASS\Service\MobileAppService;
use ASS\Library\Browser;
use ASS\Service\LandingpageService;

class ASSTwigExtension extends \Twig_Extension
{
    private $imageService;

    private $cdnUrl;

    /** @var Array config */
    private $eulerianConfig;

    /** @var Session */
    private $session;

    /** @var MobileAppService */
    private $mobileAppService;

    /** @var array Cache JSON parsed file in current query */
    private $manifestJson;

    public function __construct(ASSImageService $imageService, $cdnUrl, Session $session, MobileAppService $mobileAppService, $manifestJson, $eulerianConfig)
    {
        $this->imageService = $imageService;
        $this->cdnUrl = $cdnUrl;
        $this->session = $session;
        $this->mobileAppService = $mobileAppService;
        $this->manifestJson = $manifestJson;
        $this->eulerianConfig = $eulerianConfig;
    }

    public function getName()
    {
        return "ass";
    }

    public function getFilters()
    {
        return array(
            "noprotocol"        => new \Twig_Filter_Method($this, "noprotocol"),
            "md5"               => new \Twig_Filter_Method($this, "md5Filter"),
            "cdnUrl"            => new \Twig_Filter_Method($this, "cdnUrl"),
            "removeXlImg"   => new \Twig_Filter_Method($this, "removeXlImg"),
            "removeV2Img"   => new \Twig_Filter_Method($this, "removeV2Img"),
            "biggest"       => new \Twig_Filter_Method($this, "biggest"),
            "imgForList"      => new \Twig_Filter_Method($this, "imgForList"),
            "transf"       => new \Twig_Filter_Method($this, "transf"),
            "responsiveCost" => new \Twig_Filter_Method($this, "responsiveCost"),
            "shortpriceoverride" => new \Twig_Filter_Method($this, "shortPriceOverride"),
            'baseConvert' => new \Twig_Filter_Method($this, 'baseConvert'),
            'youtubeParser' => new \Twig_Filter_Method($this, 'youtubeParser'),
            'deeplink' => new \Twig_Filter_Method($this, 'deeplink'),
            'removeAccent' => new \Twig_Filter_Method($this, 'removeAccent'),
        );
    }

    public function getGlobals()
    {
        return [
            'assetCdn' => '//'.$this->cdnUrl,
            'eulerianUrl' => '//'.$this->eulerianConfig['url'],
            'eulerianSite' => $this->eulerianConfig['site'],
        ];
    }

    public function noprotocol($input = '')
    {
        return $this->imageService->noprotocol($input);
    }

    public function md5Filter($input = '')
    {
        $input = is_string($input)? $input : ''; // Error free

        return md5($input);
    }

    public function cdnUrl($url = '')
    {
        return $this->imageService->cdnUrl($url);
    }

    public function removeXlImg($images)
    {
        return $this->imageService->removeXlImg($images);
    }

    public function removeV2Img($images)
    {
        return $this->imageService->removeV2Img($images);
    }

    public function biggest($images)
    {
        return $this->imageService->biggest($images);
    }

    /**
     * @param array $images
     * @return string one url
     */
    public function imgForList($images)
    {
        return $this->imageService->imgForList($images);
    }

    /**
     * Ask cloudinary to resize the image to improve page load time or transform in another ratio
     * @param string $url
     * @param string $cloudinaryTransString example : "c_fit,w_640"
     * @return string
     */
    public function transf($url, $cloudinaryTransString)
    {
        return $this->imageService->transf($url, $cloudinaryTransString);
    }

    /*
     * Add cost auction for responsive
     */
    public function responsiveCost($productDescription, $auctionCost, $product)
    {
        $costTxt = '
            <br/>
            <div style="color: #fff;background-color: #4dade2;font-size: 18px;padding: 8px;border-radius: 3px;" class="popup-info-bidder-status" data-value="Frais s\'ajoutant au montant de l\'enchère lors du paiement. Ils permettent de nous rémunérer et vous proposer toujours plus d\'offres.">
                Frais de dossier : ' . $auctionCost/100 . ' €
            </div>';
        if ($product['cgvUrl']) {
            $costTxt .= '<br />Consulter les <a href="'.$product['cgvUrl'].'" target="_blank">CGV pour cette offre</a>';
        }
        $productDescription = preg_replace('/(^.+euros.+\n)/', '$1 '.$costTxt."<br/>\n", $productDescription);
        // inject cost if not present
        if (strstr($productDescription, 'Frais de dossier') === false) {
            $productDescription = $costTxt . $productDescription;
        }
        return $productDescription;
    }

    public function shortPriceOverride($productDescription, $product, $onlytabs)
    {
        if ($product['shortPrice'] != null) {
            $classcss = '';
            if ($onlytabs) {
                $classcss = ' class="text-info"';
            }
            $productDescription = "<b$classcss>".$product['shortPrice'].'</b><br/>'.$productDescription;
        }

        return $productDescription;
    }

    public function baseConvert($number, $frombase, $tobase)
    {
        return base_convert($number, $frombase, $tobase);
    }

    public function youtubeParser($str)
    {
        $re = '/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/';
        preg_match_all($re, $str, $matches);
        return $matches[7][0];
    }

    public function getFunctions()
    {
        return [
            new \Twig_SimpleFunction('isApp', [$this, 'isApp']),
            new \Twig_SimpleFunction('asset', [$this, 'asset']),
            new \Twig_SimpleFunction('showAndroidBanner', [$this, 'showAndroidBanner']),
            new \Twig_SimpleFunction('isIE', [$this, 'isIE']),
            new \Twig_SimpleFunction('isEdge', [$this, 'isEdge']),
            new \Twig_SimpleFunction('landingpageUri', [$this, 'landingpageUri']),
            new \Twig_SimpleFunction('browsersRequire', [$this, 'browsersRequire']),
            new \Twig_SimpleFunction('browserCompatible', [$this, 'browserCompatible']),
        ];
    }

    public function asset($fileName)
    {
        // Asset found
        if (isset($this->manifestJson[$fileName])) {
            return '//'.$this->cdnUrl.$this->manifestJson[$fileName];
        } else {
            return '//'.$this->cdnUrl.'/'.$fileName;
        }
    }

    public function isApp(Request $request)
    {
        return $this->mobileAppService->isApp($request, $this->session);
    }

    public function showAndroidBanner(Request $request) : bool
    {
        if (stripos($request->headers->get('user-agent'), 'android') !== false) {
            if (!$request->cookies->has('sb-installed') && !$request->cookies->has('sb-closed')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Indicated if user agent is IE 11
     * @param Request $request
     * @return bool
     */
    public function isIE(Request $request) : bool
    {
        return strpos($request->headers->get('user-agent'), 'Trident/7.0; rv:11.0') !== false;
    }

    /**
     * Indicated if user agent is Edge
     * @param Request $request
     * @return bool
     */
    public function isEdge(Request $request) : bool
    {
        return strpos($request->headers->get('user-agent'), 'Edge') !== false;
    }

    public function landingpageUri($type)
    {
        return LandingpageService::getUriType($type);
    }

    /**
     * Replace url with deeplink
     *
     * @param $url
     *
     * @return string
     */
    public function deeplink($url)
    {
        $queryArr = [];
        parse_str($_SERVER['QUERY_STRING'], $queryArr);
        if (array_key_exists('onlyview', $queryArr)) {
            return "comloisirsencheres:/$url";
        } else {
            return $url;
        }
    }

    /**
     * Replace accent caracters to no accent caracters
     * @param string $word
     * @return string
     */
    public function removeAccent($word)
    {
        return strtr(utf8_decode($word), utf8_decode('àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ'), 'aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY');
    }

    /**
     * Return browser minimal version
     * @return array
     */
    public function browsersRequire()
    {
        $browser = new Browser();
        return $browser->getBrowserUpdateCompatibility();
    }

    /**
     * indicates if the browser is compatible
     * @return bool
     */
    public function browserCompatible()
    {
        $browser = new Browser();
        return $browser->compatible();
    }
}
