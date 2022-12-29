<?php

namespace ASS\Controller\Admin;

use ASS\Controller\BaseController;

/**
 * For all admin access
 * Class ContentController
 * @package ASS\Controller\Admin
 */
class ContentController extends BaseController
{
    public function content($name)
    {
        $userid = $this->app['security']->getToken()->getUser();
        $user = $this->app['apiclient.user']->getUser($userid)->getContent();
        if ((in_array('ROLE_ADMIN', $user['roles'])) || count($user['roles']) > 1) {
            switch ($name) {
                case "book":
                    return $this->app['twig']->render('user/reserverForm.twig', ['bookInfo' => "https://i.skyrock.net/6981/32736981/pics/1333702786_small.jpg", "error" => "", "success" => ""]);
                break;
                default:
                    return $this->app['service.redirect']->redirectOr404();
                break;
            }
        } else {
            return $this->app['service.redirect']->redirectOr404();
        }
    }
}
