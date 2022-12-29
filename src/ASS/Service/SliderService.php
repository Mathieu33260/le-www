<?php

namespace ASS\Service;

use Symfony\Component\HttpFoundation\Request;
use CAC\Component\ApiClient\ApiDataException;

class SliderService
{

    use \ASS\Controller\Traits\UserTrait;

    private $app;

    public function __construct($app)
    {
        $this->app = $app;
    }

    public function preview(Request $request)
    {
        $slides = [
            [
                'id' => 1,
                'name' => $request->query->get('name'),
                'mainTextMobile' => $request->query->get('mainTextMobile'),
                'url' => $request->query->get('url'),
                'imageUrl' => $request->query->get('imageUrl'),
                'imageTextUrl' => $request->query->get('imageTextUrl'),
                'imageUrlMobile' => $request->query->get('imageUrlMobile'),
                'imageTextUrlMobile' => $request->query->get('imageTextUrlMobile'),
                'template' => $request->query->get('template'),
                'imgPosition' => $request->query->get('imgPosition'),
                'opacity' => $request->query->get('opacity'),
                'secondaryText' => $request->query->get('secondaryText'),
                'styleLink' => $request->query->get('styleLink'),
                'terms' => $request->query->get('terms'),
                'textLink' => $request->query->get('textLink'),
            ]
        ];
        $slides[1] = $slides[0]; // Make the dot and terms visible TODO:fixme
        $slides[1]['id'] = 2;
        return $slides;
    }

    public function homepage()
    {
        return $this->app['apiclient.slide']->getSlidesContent(['onlyActive' => true, 'withAuctions'=>true]);
    }
}
