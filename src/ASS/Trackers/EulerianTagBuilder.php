<?php

namespace ASS\Trackers;

class EulerianTagBuilder extends AbstractTagBuilder
{
    private const TYPE_EULERIAN = 'eulerian';

    /**
     * (non-PHPdoc)
     * @see \ASS\Trackers\AbstractTagBuilder::buildTag()
     *
     * @param callable|null $callbackBuilder
     *
     * @return mixed|string
     * @throws \Twig_Error_Loader
     * @throws \Twig_Error_Runtime
     * @throws \Twig_Error_Syntax
     */
    public function buildTag(callable $callbackBuilder = null)
    {
        $mappingForIframeUrl = [
            'prdgroup' => 'prdg0',
            'prdname' => 'prdn0',
            'prdparam-prdparam' => 'prdp0d0',
            'prdgroup0' => 'prdg0',
            'prdname0' => 'prdn0',
            'prdgroup1' => 'prdg1',
            'prdname1' => 'prdn1',
            'prdgroup2' => 'prdg1',
            'prdname2' => 'prdn1',
        ];
        $EAData = [];
        // we merge custom data for page tag, if they are
        if ($callbackBuilder) {
            $EAData += $this->buildEAOptin();
            $EAData += $callbackBuilder($this->config);
        }
        // we merge with generic data for page tag.
        $EAData += $this->headers;

        $now = (new \DateTime())->getTimeStamp();
        $iframeUrl = '//' . $this->config['url'] . "/col2/-/$now.html?";

        // We apply specific key mapping to build parameters for iframe URL
        $EANames = array_keys($EAData);
        $EADataForIframe = [];
        foreach ($EANames as $EAName) {
            if (isset($mappingForIframeUrl[$EAName])) {
                if ($EAName === 'prdparam-prdparam') {
                    $EADataForIframe['prdp0k0'] = 'prdparam';
                }
                $EADataForIframe[$mappingForIframeUrl[$EAName]] = $EAData[$EAName];
            } else {
                $EADataForIframe[$EAName] = $EAData[$EAName];
            }
        }

        $iframeUrl .= http_build_query($EADataForIframe + [
            "url" => $this->config['baseUrl']
        ]);

        return $this->twig->render('include/trackers/eulerian.html.twig', [
            'EAData' => json_encode(self::convertToSimpleArray($EAData, [
                'prdref0' => 'prdref',
                'prdref1' => 'prdref',
                'prdref2' => 'prdref',
                'prdgroup0' => 'prdgroup',
                'prdgroup1' => 'prdgroup',
                'prdgroup2' => 'prdgroup',
            ])),
            'urlIframe' => $iframeUrl,
            'url' => $this->config['url'],
        ]);
    }

    /**
     * @return string
     */
    public static function getContainerKey()
    {
        return self::BUILDER_PREFIX . "." . self::TYPE_EULERIAN;
    }

    /**
     * @return string
     */
    public static function getConfigKey()
    {
        return self::TYPE_EULERIAN;
    }

    /**
     * To convert to Eulerian simple array format
     *
     * @param array $associativeArray
     * @param array $mapping : to subtitute key to another one
     *
     * @return array
     */
    public static function convertToSimpleArray($associativeArray, $mapping = [])
    {
        $simpleArray = [];
        foreach ($associativeArray as $key => $val) {
            $simpleArray[] = $mapping[$key] ?? $key;
            $simpleArray[] = $val;
        }
        return $simpleArray;
    }

    /**
     * Build EA Optin for web tags
     *
     * @return array
     * @throws \Exception
     */
    public function buildEAOptin()
    {
        $optin = $this->getUserService()->userHasSubscribe();
        if ($optin !== null) {
            return [
                'optin-mail' => $optin ? 'OUI' : 'NON',
                'optin-nl' => $optin ? 'OUI' : 'NON',
                'optin-sms' => 'NON',
            ];
        }
        return [];
    }
}
