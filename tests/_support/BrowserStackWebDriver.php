<?php
// @codingStandardsIgnoreStart
use Codeception\Module\WebDriver;

require 'vendor/autoload.php';

// here you can define custom actions
// all public methods declared in helper class will be available in $I

class BrowserStackWebDriver extends WebDriver
{
    private $bs_local;

    public function _initialize()
    {
        getenv('BROWSERSTACK_USERNAME') ? ($this->config["capabilities"]["browserstack.user"] = getenv('BROWSERSTACK_USERNAME')) : 0;
        getenv('BROWSERSTACK_ACCESS_KEY') ? ($this->config["capabilities"]["browserstack.key"] = getenv('BROWSERSTACK_ACCESS_KEY')) : 0;

        if (array_key_exists("browserstack.local", $this->config["capabilities"]) && $this->config["capabilities"]["browserstack.local"])
        {
            $bs_local_args = array("key" => $this->config["capabilities"]["browserstack.key"]);
            $this->bs_local = new BrowserStack\Local();
            $this->bs_local->start($bs_local_args);
        }

        parent::_initialize();
    }

    // HOOK: after suite
    public function _afterSuite()
    {
        parent::_afterSuite();
        if ($this->bs_local) {
            $this->bs_local->stop();
        }
        exec("kill -9 " . $this->bs_local->pid);
    }
}
// @codingStandardsIgnoreEnd