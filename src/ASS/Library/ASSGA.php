<?php

namespace ASS\Library;

use UnitedPrototype\GoogleAnalytics;

class ASSGA
{
    /** @var array
     * 'nameabtest' => [
            'key' => [
                'dev' => 'xxxx',
                'prod' => 'xxxx'
            ],
            'variation' => null, // null or 0 for use original variation
            'nbVariations' => 2,
            'apiVariation' => false, // define variation with API !! If true, change variation to null
            'active' => false, // For Javascript
            'automatic_launch' => false, // true : launch in all page, false : launch in controller
            'durationDays' => 90, // duration in number of days
        ],
    **/
    protected $config = [
    ];
    private $environnement;
    private $logger;
    private $app;

    public function __construct($app)
    {
        $this->app = $app;
        $this->environnement = $app['env'];
        // Reinit cookies, fix : if needed only
        if (isset($_COOKIE['__utmx']) || isset($_COOKIE['__utmxx'])) {
            setcookie("__utmx", '', 0, '/', '.loisirsencheres.com');
            setcookie("__utmxx", '', 0, '/', '.loisirsencheres.com');
        }

        $this->logger = $app['logger'];
        try {
            foreach ($this->config as $key => $config) {
                if ($config['automatic_launch']) {
                    $this->executeTest($key);
                }
            }
        } catch (\Exception $ex) {
            $this->logger->warning('GA exp ERROR : '.$ex->getMessage(), ['expKey'=>isset($key)?$key:null, 'stackTrace'=>$ex->getTraceAsString()]);
        }
    }

    /**
     * @param string $key
     * @return \UnitedPrototype\GoogleAnalytics\Experiment
     */
    public function getExperiment($key)
    {
        $experiment = new GoogleAnalytics\Experiment($this->environnement === 'prod' ? $this->config[$key]['key']['prod'] : $this->config[$key]['key']['dev']);
        return $experiment;
    }

    public function executeTest($key, $active = true)
    {
        if (!isset($this->config[$key])) {
            return $this;
        }
        try {
            if (isset($this->config[$key]['oldTest'])) {
                // Old abtest with GA
                $experiment = $this->getExperiment($key);
                $variation = $experiment->getChosenVariation(); // Check cookies
                if ($variation === null) {
                    if (!$this->config[$key]['apiVariation']) {
                        $variation = rand(1, $this->config[$key]['nbVariations']) - 1;
                        $this->app['logger']->debug('Chose ' . $key . ' GA variation to ' . ($variation));
                    } else {
                        $variation = $this->getVariation($key);
                    }
                    $experiment->setChosenVariation($variation); // Set cookies
                }
                $this->logger->debug('GA variation', ['key' => $key, 'variation' => $variation]);
                $this->config[$key]['variation'] = $variation;
                $this->config[$key]['id'] = $experiment->getId();
                $this->config[$key]['active'] = $active;
                unset($experiment);
            } else if ($this->config[$key]['variation'] === null) {
                // New abtest with optimize
                if (isset($_COOKIE[$key])) {
                    $variation = $_COOKIE[$key];
                    $this->config[$key]['variation'] = $variation;
                } elseif ($this->config[$key]['apiVariation']) {
                    $variation = rand(0, $this->config[$key]['nbVariations'] - 1);
                    $this->config[$key]['variation'] = $variation;
                }
            }
            $this->config[$key]['active'] = $active;
        } catch (\UnexpectedValueException $ex) {
            if ($this->environnement === 'prod') {
                $this->logger->warning($ex->getMessage());
            }
        }
        return $this;
    }

    public function getVariation($key)
    {
        return $this->config[$key]['variation'];
    }

    public function setVariation($key, $value)
    {
        $this->config[$key]['variation'] = $value;
        return $this;
    }

    public function getConfig($key = null)
    {
        return $key !== null ? $this->config[$key] : $this->config;
    }

    public function getHasActiveTest()
    {
        return !empty($this->config);
    }

    /**
     * @param string $key
     * @param boolean $init set the variation in cookie if true
     * @return int Chosen variation starting from 1
     */
    public function getOrInitOurVariation($key, $active = true)
    {
        $experiment = $this->getExperiment($key);
        $variation = $experiment->getChosenVariation(); // Check cookies
        $this->config[$key]['active'] = $active;
        if ($variation === null) {
            if (!$this->config[$key]['apiVariation']) {
                $variation = rand(1, $this->config[$key]['nbVariations']) - 1;
                $this->config[$key]['variation'] = $variation;
            } else {
                $variation = $this->getVariation($key);
            }
            $experiment->setChosenVariation($variation); // Set cookies
            $this->app['logger']->debug('Chose '.$key.' GA variation to '.($variation));
        } else {
            $this->logger->debug('Got '.$key.' GA variation = '.$variation);
        }
        return $variation;
    }
}
