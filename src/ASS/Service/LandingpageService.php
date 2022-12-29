<?php

namespace ASS\Service;

use ASS\Api\ApiClient\DefaultClient;
use Symfony\Component\HttpFoundation\Session\Session;

class LandingpageService
{
    private $apiclientDefault;
    private $session;

    const URI_EVENT = 'evenement';

    public function __construct(DefaultClient $apiclientDefault, Session $session)
    {
        $this->apiclientDefault = $apiclientDefault;
        $this->session = $session;
    }

    public static function getUriType($type)
    {
        switch ($type) {
            case 'event':
                return self::URI_EVENT;
                break;
            default:
        }
    }

    public function getContentRegister($theme)
    {
        $params = [];
        $params['name'] = $theme === 'default' ? 'Pages acquisition - default' : 'Pages acquisition';

        $query = $this->apiclientDefault->getContentCached('/json/', $params);

        $contents = json_decode($query[0]['json']);

        if ($theme !== 'default' && !property_exists($contents, $theme)) {
            throw new \Exception("$theme does not exist");
        }

        $content = $theme !== 'default' ? $contents->{$theme} : $contents;

        // Redirect user after register
        if (isset($content->urlRedirect)) {
            $this->session->set('redirectAfterRegister', $content->urlRedirect);
        }

        return $content;
    }
}
