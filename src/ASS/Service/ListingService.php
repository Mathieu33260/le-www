<?php
declare(strict_types=1);

namespace ASS\Service;

class ListingService
{
    private const HEADER_LAT = 'x-beta-geo-lat';
    private const HEADER_LNG = 'x-beta-geo-lng';
    private const HEADER_KM_MAX = 'x-beta-km-max';

    private const PARAM_LAT = 'userLat';
    private const PARAM_LNG = 'userLng';
    private const PARAM_KM_MAX = 'kmMax';
    private const AVAILABLE_HEADERS = [
        self::HEADER_LAT,
        self::HEADER_LNG,
        self::HEADER_KM_MAX
    ];

    /**
     * Check request header to detect any beta features wanted.
     * If found add, the corresponding key to the payload
     * @param array $apiPayload
     * @param array $requestHeaders
     */
    public function addBetaFeatures(array &$apiPayload, array $requestHeaders): void
    {
        foreach (self::AVAILABLE_HEADERS as $availableHeader) {
            foreach ($requestHeaders as $requestHeaderName => $requestHeaderValue) {
                if ($requestHeaderName === $availableHeader) {
                    $apiPayload[$this->getParamNameForHeader($requestHeaderName)] = $requestHeaderValue[0];
                    break;
                }
            }
        }
    }

    /**
     * @param string $requestHeaderName
     * @return string
     */
    private function getParamNameForHeader(string $requestHeaderName): string
    {
        switch ($requestHeaderName) {
            case self::HEADER_LAT:
                return self::PARAM_LAT;
                break;
            case self::HEADER_LNG:
                return self::PARAM_LNG;
                break;
            case self::HEADER_KM_MAX:
                return self::PARAM_KM_MAX;
                break;
            default:
                return 'Cyka Blyat';
                break;
        }
    }
}
