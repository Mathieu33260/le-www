<?php

namespace ASS\Library;

class ASSImageService
{
    /**
     * @var bool : Does the browser support format ?
     */
    private $webpEnabled;

    public function __construct(bool $webpEnabled)
    {
        $this->webpEnabled = $webpEnabled;
    }

    public function noprotocol($input = '')
    {
        $output = is_string($input)? $input : ''; // Error free
        $output = preg_replace('/http:/', '', $output, 1);
        $output = preg_replace('/https:/', '', $output, 1);
        return $output;
    }

    public function cdnUrl($url = '')
    {
        if (strpos($url, '/static.loisirsencheres.com/') !== false) {
            return str_replace('/static.loisirsencheres.com/', '/d3q0z9xaynlrma.cloudfront.net/', $url);
        }
        if (strpos($url, '/res.cloudinary.com/') !== false) {
            return str_replace('/res.cloudinary.com/', '/img.loisirsencheres.fr/', $url);
        }
        if (strpos($url, '/d1rzpnuhmq7w9v.cloudfront.net/') !== false) {
            return str_replace('/d1rzpnuhmq7w9v.cloudfront.net/', '/img.loisirsencheres.fr/', $url);
        }

        // Change extension to webP if available
        return $this->transWebp($url);
    }

    /**
     * return bool : browser has webp or not
     */
    public function isWebpEnabled()
    {
        return $this->webpEnabled;
    }

    /**
     * Change image extenssion, webperformance. Some cases to take into account :
     * https://www.loisirsencheres.com/assets/img/blockApps/phone-ios.jpg?v=20180522
     * https://www.loisirsencheres.com/assets/img/blockApps/phone-ios.jpg.jpg
     * https://www.loisirsencheres.com/assets/img/blockApps/phone-ios.jpg
     * @param $url with a .jpg, .png, .jpeg
     * @return string url modified with .webp
     */
    public function transWebp($url)
    {
        if ($this->webpEnabled) {
            if (strpos($url, '/img.loisirsencheres.fr/') !== false) {
                return preg_replace('/(.*)(.jpg|.png|.jpeg)/', "$1.webp", $url, -1);
            }
        }
        return $url;
    }

    public function removeXlImg($images)
    {
        $return = [];
        foreach ($images as $img) {
            if (strpos($img, '1140x500') === false) {
                $return[] = $img;
            }
        }

        return $return;
    }

    public function removeV2Img($images)
    {
        $return = [];
        foreach ($images as $img) {
            if (strpos($img, '750x459') === false) {
                $return[] = $img;
            }
        }

        return $return;
    }

    public function biggest($images)
    {
        foreach ($images as $image) {
            if (strpos($image, '1140x500') !== false) {
                return $image;
            }
        }

        return $images[0];
    }

    /**
     * @param array $images
     * @return string one url
     */
    public function imgForList($images)
    {
        // Don't use XL image
        $images = $this->removeXlImg($images);
        // If there is a new format image return it otherwise return the first
        foreach ($images as $image) {
            if (strpos($image, '750x459') !== false) {
                return $image;
            }
        }

        return $images[0];
    }

    /**
     * Ask cloudinary to resize the image to improve page load time or transform in another ratio
     * Input examples :
     *  http://res.cloudinary.com/loisirs/image/upload/v1463153505/product/p1139_750x459_vue-jardin.jpg
     *  http://res.cloudinary.com/loisirs/image/upload/g_north_east,l_icon-vol/v1467641983/product/p1417_Orangerie_Lanniron_750x459_4.jpg
     * @param string $url
     * @param string $cloudinaryTransString example : "c_fit,w_640"
     * @return string
     */
    public function transf($url, $cloudinaryTransString)
    {
        if (strpos($url, 'cloudinary.com')!==false || strpos($url, 'd1rzpnuhmq7w9v.cloudfront.net')!==false || strpos($url, 'photos.loisirsencheres.fr')!==false || strpos($url, 'img.loisirsencheres.fr')!==false) {
            $pattern = '/(.*\/image\/upload.*)(v[0-9]{10}\/.*)/i';
            $replacement = '$1'.$cloudinaryTransString.'/$2';
            $url = preg_replace($pattern, $replacement, $url);
        }

        return $url;
    }
}
