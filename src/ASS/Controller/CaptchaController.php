<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use ASS\Controller\BaseController;

class CaptchaController extends BaseController
{
    /**
     * @param Request $request
     * @return bool
     */
    public function validate(Request $request)
    {
        if ($request->isXmlHttpRequest()) {
            $captcha = $request->request->get('recaptchaResponse');

            $resp = json_decode($this->getCaptchaService()->validateCaptcha($this->app['recaptcha']['secret'], $captcha), true);

            return $resp['success'] === true;
        }
        return false;
    }
}
