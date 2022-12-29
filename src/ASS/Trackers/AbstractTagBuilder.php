<?php

namespace ASS\Trackers;

use ASS\Service\UserService;

abstract class AbstractTagBuilder
{
    protected const BUILDER_PREFIX = 'tagBuilder';

    /**
     * @var array
     */
    protected $config;

    /**
     * @var Twig_Environment
     */
    protected $twig;

    /**
     * @var UserService
     */
    protected $userService;

    /**
     * Data part of your datalayer repeated for all tags.
     *
     * @var array
     */
    protected $headers = [];

    /**
     * If enable Headers will be used to build a generic tag on each page.
     *
     * @var bool
     */
    protected $displayOnAllPage = true;

    /**
     * EulerianService constructor.
     * @param $config
     * @param \Twig_Environment $twig
     * @param UserService $userService
     */
    public function __construct($config, \Twig_Environment $twig, UserService $userService)
    {
        $this->config = $config;
        $this->twig = $twig;
        $this->userService = $userService;
    }

    /**
     * @return string
     */
    public static function getBuilderPrefix()
    {
        return self::BUILDER_PREFIX;
    }

    /**
     * @return UserService
     */
    public function getUserService()
    {
        return $this->userService;
    }

    /**
     * Build common headers for tag, headers are stored in instance to be
     * injected in final tag datalayer
     * You can override the method in your TagBuilder class
     *
     * @param callable|null $callbackBuilder
     */
    public function buildHeader(callable $callbackBuilder = null)
    {
        if ($callbackBuilder) {
            $headers = $callbackBuilder($this->config);
            $this->headers = $headers;
        }
    }

    /**
     * If enable Headers will be used to build a generic tag on each page.
     *
     * @return bool
     */
    public function isDisplayOnAllPage()
    {
        return $this->displayOnAllPage;
    }

    /**
     * Build datalayer for tag from $callbackBuilder closure
     *
     * @param callable|null $callbackBuilder
     * @return mixed
     */
    abstract public function buildTag(callable $callbackBuilder = null);

    /**
     * Key to retrieve tagBuilder in service container.
     * Key must begin with BUILDER_PREFIX to get automtically loaded by TrackerService
     *
     * @return string
     */
    abstract public static function getContainerKey();

    /**
     * Key to get retriveve config data for tagBuilder.
     *
     * @return string
     */
    abstract public static function getConfigKey();
}
