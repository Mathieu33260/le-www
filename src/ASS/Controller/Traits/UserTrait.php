<?php

namespace ASS\Controller\Traits;

trait UserTrait
{
    public function isAdmin()
    {
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $roles = $this->app['security']->getToken()->getAttribute('user')['roles'];
            return in_array("ROLE_ADMIN", $roles);
        }

        return false;
    }

    public function getIp()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
            //Is it a proxy address
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return $ip;
    }

    /**
     * @return string email or empty string
     */
    public function getCurrentUserEmail()
    {
        $return = '';
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $token = $this->app['security']->getToken();
            if ($token->hasAttribute('user')) {
                $user = $token->getAttribute('user');
                if (isset($user['email'])) {
                    $return = $user['email'];
                }
            }
        }

        return $return;
    }
}
