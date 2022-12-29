<?php

namespace ASS\Controller;

use ASS\Form\UnsubscribeType;
use Symfony\Component\Form\Form;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use ASS\Controller\BaseController;
use CAC\Component\ApiClient\ApiException;

class NewsletterController extends BaseController
{
    use Traits\UserTrait;

    /**
     * $request->isXmlHttpRequest()
     */
    public function subscribe(Request $request)
    {
        try {
            if ($request->get('email')) {
                $this->getDefaultClient()->post("/newsletter/", ['email' => $request->get('email'), 'subscribe' => 1]);
                $this->getUserService()->refreshUserSettings(); // Update caching in session
                return new JsonResponse(['confirmed' => 1]);
            }

            return new JsonResponse([], 400);
        } catch (\Exception $e) {
            $this->getLogger()->error($e->getMessage());
            return new JsonResponse([
                'confirmed' => 0,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ], 404);
        }
    }

    public function preUnsubscribe()
    {
        $this->app['session']->getFlashBag()->add('error', "Afin de vous desinscrire de la newsletter merci d'utiliser le lien de desinscription d'une newsletter plus récente ou de contacter directement le service client à l'adresse suivante : info@loisirsencheres.com.");
        $url = $this->app['url_generator']->generate('homepage');
        return $this->app->redirect($url);
    }

    public function unsubscribe(Request $request)
    {
        if ($request->get('uniqueId')) {
            return $this->app['twig']->render('newsletter/unsubscribe.twig', ['avis' => $request->get('avis'), 'uniqueId' => $request->get('uniqueId')]);
        }
        $url = $this->app['url_generator']->generate('homepage');
        return $this->app->redirect($url);
    }

    public function confirmUnsubscribe(Request $request)
    {
        if ($request->get('uniqueId')) {
            switch ($request->get('frequency')) {
                case 'week':
                    try {
                        $this->getDefaultClient()->post('/mailing/', ['week' => 1, 'uniqueId' => $request->get('uniqueId')]);
                    } catch (\Exception $ex) {
                        $this->getLogger()->error("Couldn't unsubscribe user with uniqueId {$request->get('uniqueId')} : {$ex->getMessage()}");
                    }
                    break;
                case 'month':
                    try {
                        $this->getDefaultClient()->post('/mailing/', ['month' => 1, 'uniqueId' => $request->get('uniqueId')]);
                    } catch (\Exception $ex) {
                        $this->getLogger()->error("Couldn't unsubscribe user with uniqueId {$request->get('uniqueId')} : {$ex->getMessage()}");
                    }
                    break;
                case 'unsubscribe':
                    try {
                        $this->getDefaultClient()->post('/mailing/', ['unsubscribe' => 1, 'uniqueId' => $request->get('uniqueId')]);
                    } catch (\Exception $ex) {
                        $this->getLogger()->error("Couldn't unsubscribe user with uniqueId {$request->get('uniqueId')} : {$ex->getMessage()}");
                    }
                    break;
                default:
                    break;
            }

            return $this->app['twig']->render('newsletter/confirm-unsubscribe.twig', ['frequency' => $request->get('frequency'),'avis' => $request->get('avis'), 'uniqueId' => $request->get('uniqueId')]);
        }

        $url = $this->app['url_generator']->generate('homepage');
        return $this->app->redirect($url);
    }

    public function indesirable(Request $request)
    {
        $this->app['session']->getFlashBag()->add('error', "Afin de vous desinscrire de la newsletter merci d'utiliser le lien de desinscription d'une newsletter plus récente ou de contacter directement le service client à l'adresse suivante : info@loisirsencheres.com.");
        $url = $this->app['url_generator']->generate('homepage');
        return $this->app->redirect($url);
    }

    public function subscribeFromEmail(Request $request)
    {
        if ($request->query->get('user_email')) {
            try {
                $this->getDefaultClient()->post('/newsletter/', ['email' => $request->get('user_email'), 'subscribe' => 1]);
                $this->app['service.user']->refreshUserSettings(); // Update caching in session
                return $this->app->redirect($this->app['url_generator']->generate('homepage'));
            } catch (ApiException $e) {
                $this->app['logger']->error($e->getMessage());
                return new Response($this->app['twig']->render('404.twig'), 404);
            }
        }
        return new Response($this->app['twig']->render('404.twig'), 404);
    }
}
