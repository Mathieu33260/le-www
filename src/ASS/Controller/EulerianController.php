<?php

namespace ASS\Controller;

use ASS\Trackers\EulerianTagBuilder;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class EulerianController extends BaseController
{
    /**
     * Ajax route to collect asynchronously Eulerian eData
     *
     * @param Request $request
     * @return bool|JsonResponse
     * @throws \Exception
     */
    public function getEdata(Request $request)
    {
        if ($request->isXmlHttpRequest()) {
            $track = $request->get('track');
            $user = $this->getLoggedInUser();
            if ($user) {
                $profileInfo = $this->getUserService()->getUserTrackingProfile(false, false);
                $optin = $profileInfo['optin'] ?? false;
                // Common data for EA collect
                $eData = [
                    // EA uid (unique identifier to
                    'uid' => $user['num'],
                    // Second user identifier (required for EA web tag), we can apply the same.
                    'email' => hash('sha256', $user['email']),
                    // User profiling
                    'profile' => $profileInfo['profile'] ?? '',
                    // Optin mailing
                    'optin-mail' => $optin ? 'OUI' : 'NON',
                    // default NON, it set to OUI only on bid/autobid tracking if user check SMS pushing.
                    'optin-sms' => 'NON',
                    // groupe url pour EA
                    'path' => 'login'
                ];

                switch ($track) {
                    case 'login':
                        $eData += [
                            'pagegroup' => 'Connexion',
                            'type-compte' => "mail",
                        ];
                        break;
                    /* @todo add here custom edata for specific tracker */
                    default:
                        break;
                }
                return new JsonResponse(EulerianTagBuilder::convertToSimpleArray($eData));
            }
        }
        return false;
    }
}
