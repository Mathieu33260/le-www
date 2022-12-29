<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class SurveyController extends BaseController
{

    public function personaHome(Request $request)
    {
        if ($request->get('ajax')=='getResults') {
            return $this->personaResults();
        }

        $userChoice = $this->isAuthenticated() ? $this->app['service.user']->getSettingValue($this->getLoggedInUser(), 'survey-persona') : '';

        return $this->app['twig']->render('content/profil-encherisseur.twig', [
            'userChoice' => $userChoice,
            'hideBreadcrumb' => true,
            'stylesheets' => [
                'style',
                'bidderProfiles',
            ],
        ]);
    }

    public function personaPost(Request $request)
    {
        if (!$this->getLoggedInUser()) {
            return new JsonResponse(['ok'=>0], 401);
        }

        $this->app['apiclient.user']->saveUserSetting($this->getLoggedInUser()['id'], 'survey-persona', $request->get('choice'));
        return new JsonResponse(['ok'=>1]);
    }

    private function personaResults()
    {
        $userChoice = $this->app['service.user']->getSettingValue($this->getLoggedInUser(), 'survey-persona');
        if (!$userChoice) {
            return new JsonResponse(['ok'=>0, 'message'=>'User needs to answer'], 403);
        }

        $stats = $this->app['apiclient.default']->get('usersetting/survey-persona?stats=1')->getContent();

        return new JsonResponse($stats);
    }
}
