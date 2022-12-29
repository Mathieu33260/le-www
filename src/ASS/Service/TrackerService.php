<?php

namespace ASS\Service;

use ASS\Trackers\AbstractTagBuilder;

class TrackerService
{
    /**
     * @var Twig_Environment
     */
    private $twig;

    /**
     * @var
     */
    private $trackers;

    /**
     * TrackerService constructor.
     * @param array $trackers
     * @param \Twig_Environment $twig
     */
    public function __construct(Array $trackers, \Twig_Environment $twig)
    {
        $this->trackers = $trackers;
        $this->twig = $twig;
    }

    /**
     * @param $tags
     */
    private function injectTags($tags)
    {
        $this->twig->addGlobal('injectTags', $tags);
    }

    /**
     * To call from controller to build trackers given as parameters
     *
     * @param array $trackers
     */
    public function buildTags(Array $trackers)
    {
        $tags = [];
        foreach ($trackers as $keyTracker => $callback) {
            if (isset($this->trackers[$keyTracker])) {
                /** @var AbstractTagBuilder */
                $tracker = $this->trackers[$keyTracker];
                $contentTag = $tracker->buildTag($callback);
                if ($contentTag !== "") {
                    $tags[] = $contentTag;
                }
            }
        }
        if (count($tags) > 0) {
            $this->injectTags($tags);
        }
    }

    /**
     * Method to call in a before middleware to inject tags on all pages.
     * You can disable this behavior for a specific tag overriding displayOnAllPage attribute.
     *
     * @param array|null $headers
     */
    public function buildAllTags(Array $headers = null)
    {
        $tags = [];
        foreach ($this->trackers as $keyTracker => $tracker) {
            /** @var AbstractTagBuilder */
            $tracker = $this->trackers[$keyTracker];
            if ($tracker->isDisplayOnAllPage()) {
                if (isset($headers[$keyTracker]) && is_callable($headers[$keyTracker])) {
                    $tracker->buildHeader($headers[$keyTracker]);
                }
                $contentTag = $tracker->buildTag();
                if ($contentTag !== "") {
                    $tags[] = $contentTag;
                }
            }
        }

        if (count($tags) > 0) {
            $this->injectTags($tags);
        }
    }

    public function removeTracker($key)
    {
        unset($this->trackers[$key]);
    }
}
