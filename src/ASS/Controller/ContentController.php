<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use ASS\Controller\BaseController;

/**
 * Is a service too, TODO remove ControllerProviderInterface
 */
class ContentController extends BaseController
{

    public function deeplinking(Request $request)
    {
        $redirectLink = $request->query->has('redirect') ? urlencode($request->query->get('redirect')) : null;
        $categorieRedirectLink = urlencode('comloisirsencheres://category/1');
        return $this->app['twig']->render('content/deepLinking.twig', [
            'redirectLink' => $redirectLink,
            'categorieRedirectLink' => $categorieRedirectLink
        ]);
    }

    public function deepRedirect($url)
    {
        $url = urldecode($url);
        header('Location: '.$url);
        die();
    }

    public function offer(Request $request)
    {
        /** @var \ASS\Api\ApiClient\ProductClient $productClient */
        $productClient = $this->app['apiclient.product'];

        $products = $productClient->getProductsWithoutAuctions();

        usort($products, function ($a, $b) {
            if ($a['id'] == $b['id']) {
                return 0;
            }
            return ($a['id'] > $b['id']) ? -1 : 1;
        });

        return $this->app['twig']->render('content/offer.twig', [
            'products' => $products,
            'hideBreadcrumb' => true,
        ]);
    }

    public function appMobile(Request $request)
    {
        return $this->showContent($request, 'app-mobile');
    }

    public function showAppContent(Request $request, $page)
    {
        return $this->showContent($request, $page, true);
    }

    public function wishlist(Request $request)
    {
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $res = $this->app['service.user']->simpleRegister($request);
            if (is_object($res) && get_class($res) == "Symfony\Component\Form\Form") {
                $params['registerForm'] = $res->createView();
            } elseif ($res === 'user.register.success') {
                return $this->app->redirect($this->app['url_generator']->generate('user.register.success'), 302);
            }
        }

        $params['hideBreadcrumb'] = true;
        $params['stylesheets'] = [ // Key is the version file and value is the relative path
            'style',
            'content',
        ];

        return $this->app['twig']->render('content/wishlist.twig', $params);
    }

    /**
     * Show a static content page
     * @param string $page
     */
    public function showContent(Request $request, $page, $forceApp = false)
    {
        $success = $error = '';
        $params = $errors = [];

        // Apply app layout if needed
        if ($forceApp) {
            $params['forceApp'] = true;
        }

        if ($page == 'faq' || $page == 'mobile-faq') {
            return $this->app->redirect($this->app['url_generator']->generate('faq'), 301);
        }

        // Redirect for SEO
        if ($page == 'app-mobile' && $request->get('_route') !== 'app.mobile') {
            return $this->app->redirect($this->app['url_generator']->generate('app.mobile'));
        }

        if ($page == 'about') {
            return $this->app->redirect($this->app['url_generator']->generate('homepage'));
        }
        if ($page == 'profil-encherisseur') {
            return $this->app->redirect($this->app['url_generator']->generate('survey.personaHome'));
        }

        if ($page == 'cpv') {
            return $this->app->redirect($this->app['url_generator']->generate('content.page', ['page'=>"cgu"]).'#cpv', 301);
        }

        if ($page === 'merchant' || $page === 'merchant-thank-you') {
            return $this->app->redirect($this->app['lepro.url'], 301);
        }

        if ($page == 'style') {
            if ($this->isAuthenticated() && $this->requireRole(['admin', 'HELPLINE', 'PRODUCT', 'PHOTO', 'STATS', 'SLIDE', 'SALES'], 'Accès refusé.')) {
                // Authorized access to users who have the role of 'admin', 'HELPLINE', 'PRODUCT', 'PHOTO', 'STATS', 'SLIDE', 'SALES'
                $params['hideBreadcrumb'] = true;
                $params['stylesheets'] = [ // Key is the version file and value is the relative path
                    'style',
                    'content',
                ];
                return $this->app['twig']->render('content/style.twig', $params);
            } else {
                return $this->app['service.redirect']->redirectOr404();
            }
        }

        if ($page == 'topweekpayers') {
            return $this->app->redirect($this->app['url_generator']->generate('content.topweekpayers'), 301);
        }

        // contact page thingies...
        if ('contact' == $page || 'mobile-contact' == $page) {
            $params['num'] = null;
            if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                $userId = $this->app['security']->getToken()->getUser();
                $user = $this->app['apiclient.user']->getUser($userId)->getContent();
                $params['name'] = $user['firstName'].' '.$user['lastName'];
                $params['email'] = $user['email'];
                $params['num'] = $user['num'];
            }
            if ($request->isMethod('POST')) {
                $to      = array($this->app['emails']['info'] => 'Loisirs Encheres');
                $replyTo = array($request->request->get('email'));
                $date = new \DateTime();

                $body     = '';

                if ($params['num'] != null) {
                    $body .= "Num member : ".number_format($params['num'], 0, ',', ' ').PHP_EOL;
                }

                if ('contact' == $page) {
                    $from    = array('contact@loisirsencheres.com' => $request->request->get('name') . ' sur Loisirsencheres');
                    $subject = 'Demande sur Loisirsencheres du '.$date->format('d/m').' à '.$date->format('H:i').' - ' . $request->request->get('request');
                } elseif ('mobile-contact' == $page) {
                    $to      = array($this->app['emails']['app'] => 'Loisirs Encheres');
                    $from    = array('contact@loisirsencheres.com' => $request->request->get('name') . ' sur Loisirsencheres');
                    $subject = 'Remarque sur app Loisirs Enchères du '.$date->format('d/m').' à '.$date->format('H:i').' - ' . $request->request->get('request');
                } else {
                    $to      = array($this->app['emails']['commercial'] => 'Loisirs Encheres');
                    $from    = array('contact@loisirsencheres.com' => $request->request->get('name'));
                    $subject = 'Devenir partenaire de Loisirs Encheres.com - '.$date->format('mdHi').'';
                    $body    .= 'Catégorie : ' . $request->request->get('request')."\n\n";
                }

                $body .= $request->request->get('message')."\n";
                $body .= "\n\n".'------'."\n";
                $body .= $this->app['translator']->trans('Name') . ' : ' . $request->request->get('name')."\n";
                $body .= $this->app['translator']->trans('Email') . ' : ' . $request->request->get('email')."\n";
                if ($request->request->get('departement')) {
                    $body .= 'Département : ' . $request->request->get('departement')."\n";
                }
                if ($request->request->get('company')) {
                    $body .= 'Company : ' . $request->request->get('company')."\n";
                }
                if ($request->request->get('tel')) {
                    $body .= 'Tel : ' . $request->request->get('tel')."\n";
                }
                $body .= 'Numéro de membre : '. $this->app['security']->getToken()->getUser()."\n";
                if ($request->request->get('browserInfo')) {
                    $body .= 'Info technique : '. $request->request->get('browserInfo');
                }
                // Create the message
                try {
                    $message = \Swift_Message::newInstance()
                        ->setSubject($subject)
                        ->setFrom($from)
                        ->setTo($to)
                        ->setReplyTo($replyTo)
                        ->setBody($body)
                    ;
                    $result = $this->app['mailer']->send($message);
                } catch (\Swift_RfcComplianceException $e) {
                    $errors[] = $this->app['translator']->trans('Invalid email address');
                    $result = false;
                } catch (\Exception $e) {
                    $this->app['logger']->error($e);
                    $result = false;
                }

                if ($result == 1) {
                    $success = $this->app['translator']->trans('Thank you, your message has been sent');
                } else {
                    $errors[] = $this->app['translator']->trans('Could not send email');
                }
            }

            // simple error reporting...
            if (count($errors) > 0) {
                $error = "<h4>" . $this->app['translator']->trans('Mail not send') . "</h4>";
                $error .= implode('<br/>', $errors);
            }

            $params = array_merge($params, $request->request->all());
            $params['error'] = $error;
            $params['success'] = $success;
        }

        $params['hideBreadcrumb'] = true;

        $params['stylesheets'] = [ // Key is the version file and value is the relative path
            'style',
            'content',
        ];

        try {
            return $this->app['twig']->render(
                sprintf('content/%s.twig', $page),
                $params
            );
        } catch (\Twig_Error_Loader $e) {
            return $this->app['service.redirect']->redirectOr404();
        }
    }

    public function sdbx2016()
    {
        return $this->app['twig']->render('content/sdbx2016.twig');
    }

    public function topweekpayers()
    {
        $topWeekPayers = $this->app['apiclient.user']->getTopWeekBidder('topWeekPayers');
        return $this->app['twig']->render('content/topweekpayers.twig', [
            'topWeekPayers' => $topWeekPayers,
            'stylesheets' => [ // Key is the version file and value is the relative path
                'style',
                'content',
            ],
        ]);
    }

    public function enveloppecadeau(Request $request)
    {
        return $this->showContent($request, 'enveloppe-cadeau');
    }

    public function recrutement(Request $request)
    {
        if ($request->isMethod('POST')) {
            if ($request->isXmlHttpRequest()) {
                $errors = [];

                $reqFields = [
                    'email' => 'Email manquant',
                    'firstLastName' => 'Nom et prénom manquant',
                    'jobName' => 'Veuillez selectionner un poste',
                    'message' => 'Message manquant',
                ];

                foreach ($reqFields as $field => $message) {
                    if (!$request->request->has($field) || $request->get($field) == '') {
                        $errors[] = $message;
                    }
                }

                if (count($errors) == 0) {
                    $to      = ['job@loisirsencheres.com' => 'Loisirs Encheres'];
                    $replyTo = [$request->request->get('email')];
                    $date = new \DateTime();
                    $from    = ['contact@loisirsencheres.com' => $request->request->get('firstLastName') . ' sur Loisirsencheres'];
                    $subject = "Candidature de {$request->get('firstLastName')} pour le poste {$request->get('jobName')} du {$date->format('d/m')} à {$date->format('H:i')}";
                    $body     = '';

                    $body .= "Nom : {$request->get('firstLastName')}\n";
                    $body .= "Poste : {$request->get('jobName')}\n";
                    $body .= "Message : {$request->get('message')}\n";
                    $body .= "Email : {$request->get('email')}\n";

                    // Create the message
                    try {
                        $message = \Swift_Message::newInstance()
                            ->setSubject($subject)
                            ->setFrom($from)
                            ->setTo($to)
                            ->setReplyTo($replyTo)
                            ->setBody($body);

                        $result = $this->app['mailer']->send($message);
                    } catch (\Swift_RfcComplianceException $e) {
                        $errors[] = $this->app['translator']->trans('Invalid email address');
                        $result = false;
                    } catch (\Exception $e) {
                        $this->app['logger']->error($e);
                        $result = false;
                    }
                    if ($result != 1) {
                        $errors[] = $this->app['translator']->trans('Could not send email');
                    }
                }

                if ($errors) {
                    return new JsonResponse(['errors'=>$errors], 400);
                }

                return new JsonResponse(['ok'=>1]);
            }
        }

        return $this->app['twig']->render('content/recrutement.twig', [
            'stylesheets' => [
                'style',
            ],
        ]);
    }

    public function apropos()
    {
        $params['hideBreadcrumb'] = true;
        $params['stylesheets'] = [ // Key is the version file and value is the relative path
            'style',
            'content',
        ];
        return $this->app['twig']->render('content/about.twig', $params);
    }

    public function listeassurances()
    {
        return $this->app['twig']->render('paiement/assurances_liste.twig');
    }

    public function christmaspage()
    {
        return $this->app['twig']->render('content/idees-cadeau-noel.twig', [
            'nocontainer'    => true,
            'onlyview'       => $this->app['request']->query->get('onlyview')? 1 : 0,
            'stylesheets' => [
                'style',
                'boutiqueNoel',
            ],
        ]);
    }
    public function techAction(Request $request)
    {
        $counter = $this->app['session']->get('sessionCounter', 0);

        if (!$request->get('doNotIncrement')) {
            $counter++;
            $this->app['session']->set('sessionCounter', $counter);
        }

        if ($request->isXmlHttpRequest()) {
            return new JsonResponse(['sessionCounter'=>$counter]);
        }

        return $this->app['twig']->render('content/tech.twig', [
            'sessionCounter' => $counter
        ]);
    }

    public function experiment(Request $request)
    {
        try {
            $variation = 0;
            $name = $request->query->get('name');
            $this->app['googleanalytics']->executeTest($name);
            $variation = $this->app['googleanalytics']->getVariation($name);
            return new JsonResponse(['variation' => $variation]);
        } catch (\Exception $e) {
            $this->app['logger']->error($e);
            return new JsonResponse(['variation' => 0]);
        }
    }

    public function iosAssociation()
    {
        if ($this->app['env'] === 'prod') {
            $filename = 'apple-app-site-association';
        } else {
            $filename = 'apple-app-site-association-dev';
        }
        $jsonContent = $this->app['twig']->render($filename);
        return new Response($jsonContent, 200, ['content-type' => 'application/json']);
    }

    public function androidAssociation()
    {
        if ($this->app['env'] === 'prod') {
            $filename = 'assetlinks.json';
        } else {
            $filename = 'assetlinks-dev.json';
        }
        $jsonContent = $this->app['twig']->render('.well-known/'.$filename);
        return new Response($jsonContent, 200, ['content-type' => 'application/json']);
    }
}
