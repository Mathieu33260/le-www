<?php

namespace ASS\Library;

use Wolfcast\BrowserDetection;

class Browser
{
    private $browser;
    /**
     * @var array
     * @see https://github.com/browser-update/browser-update/wiki/Details-on-configuration
     * The array key is the identifier of browser and the value is the minimal version of browser
     */
    private $browserUpdateCompatibility = [
        'i' => 11, // Internet Explorer
        'f' => 65, // Firefox
        'c' => 70, // Chrome
        's' => 12, // Safari
        'o' => 56, // Opera
        'o_a' => 45, // Opera (Android)
        'samsung' => 8.0, // Samsung Internet (Android)
    ];

    public function __construct()
    {
        $this->browser = new BrowserDetection();
    }

    public function getName()
    {
        return $this->browser->getName();
    }

    /**
     * get browser version
     * @param Boolean $intval
     * @return int|string
     */
    public function getVersion($intval = false)
    {
        $version = $this->browser->getVersion();
        return $intval ? intval($version) : $version;
    }

    /**
     * get require browser version. Is formated for browserUpdate.js
     * @return Array
     */
    public function getBrowserUpdateCompatibility()
    {
        return $this->browserUpdateCompatibility;
    }

    /**
     * indicates if the browser is compatible
     * @return Boolean
     */
    public function compatible()
    {
        $browserName = $this->getName();
        $browserVersion = $this->getVersion();

        if ($browserName === 'Chrome' && $browserVersion < $this->browserUpdateCompatibility['c']) {
            return false;
        }
        if ($browserName === 'Firefox' && $browserVersion < $this->browserUpdateCompatibility['f']) {
            return false;
        }
        if ($browserName === 'Internet Explorer' && $browserVersion < $this->browserUpdateCompatibility['i']) {
            return false;
        }
        if ($browserName === 'Safari' && $browserVersion < $this->browserUpdateCompatibility['s']) {
            return false;
        }
        if ($browserName === 'Opera Mobile' && $browserVersion < $this->browserUpdateCompatibility['o_a']) {
            return false;
        }
        if ($browserName === 'Samsung Internet' && $browserVersion < $this->browserUpdateCompatibility['samsung']) {
            return false;
        }
        if ($browserName === 'Opera' && $browserVersion < $this->browserUpdateCompatibility['o']) {
            return false;
        }

        return true;
    }
}
