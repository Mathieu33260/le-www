<?php

namespace ASS\Service;

class CaptchaService
{
    public function validateCaptcha($secret, $responseCaptcha)
    {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, "https://www.google.com/recaptcha/api/siteverify");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "secret=$secret&response=$responseCaptcha");

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $resp = curl_exec($ch);

        curl_close($ch);

        return $resp;
    }
}
