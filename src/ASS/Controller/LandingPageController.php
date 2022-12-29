<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class LandingPageController extends BaseController
{
    public function clubmed(Request $request)
    {
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $data = [];
            $user = $this->getUserService()->getLoggedInUser();
            $userIsRegisterClubmed = $this->getUserService()->getSettingValue($user, 'registerClubmed') !== null;

            $data['goto'] = $userIsRegisterClubmed ? $this->app['url_generator']->generate('product.auction', [ 'id' => '8065' ]) : $this->app['url_generator']->generate('clubmed');

            if ($request->isXmlHttpRequest()) {
                return new JsonResponse($data);
            }
            return $this->app->redirect(
                $this->app['url_generator']->generate('product.auction', [ 'id' => '8065' ]),
                Response::HTTP_MOVED_PERMANENTLY
            );
        }

        $this->app['session']->set('redirectAfterRegister', '/club-med');

        return $this->app['twig']->render('landingPage/clubmed.twig', [
            'stylesheets' => [
                'clubmed',
            ],
            'bodyclass' => 'fullpage',
            'notUseProximaNova' => true,
            'notSearchBar' => true,
            'hideGototop' => true,
            'hideBreadcrumb' => true,
            'hideNavbar' => true,
            'headerHideSearchBar' => true,
            'headerHideClaim' => true,
            'headerHideRegisterButton' => true,
            'headerHideFaq' => true,
            'headerHideUser' => true,
            'hideFooter' => true,
            'hideAppBanner' => true,
            'notNeedLoader' => true,
            'checkboxes' => [
                [
                    'label' => "Je souhaite recevoir les actualités Club Med (informations produits et offres promotionnelles)",
                    'value' => 0,
                    'name' => "want_newsletter_clubmed",
                    'toggle' => "Ces données sont destinées à Club Med SAS afin de gérer votre demande et optimiser ses services et outils ainsi que pour adresser à nos clients des offres commerciales et mettre en œuvre des opérations promotionnelles adaptées à vos centres d’intérêt et besoins spécifiques sauf opposition de leur part. Club Med ne communiquera vos données à des partenaires commerciaux. Club Med pourra mettra en œuvre des opérations promotionnelles adaptées à vos centres d’intérêt et besoins spécifiques, réalisées sur la base d’opérations de profilage, Club Med ne sera amené à partager vos données avec des prestataires tiers que pour déterminer votre profil et vos préférence avec une précision accrue et ainsi vous envoyer des offres promotionnelles plus pertinentes. Pour plus de précisions sur les traitements que nous réalisons sur vos données personnelles, les durées de conservation que nous leur appliquons, les modalités d'exercice de vos droits auprès de nos services et vos droits de recours, veuillez consulter notre politique de confidentialité : https://www.clubmed.fr/l/protection-donnees",
                ]
            ],
            'userSettings' => [
                'registerClubmed' => [
                    'value' => '1',
                    'group' => 'register',
                ]
            ],
        ]);
    }

    public function enfoires(Request $request)
    {
        return $this->app->redirect(
            $this->app['url_generator']->generate('landing.event', [ 'alias' => 'enfoires' ]),
            Response::HTTP_MOVED_PERMANENTLY
        );
    }

    public function enfoiresConfirm(Request $request)
    {
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app['service.redirect']->redirectOr404();
        }

        return $this->app['twig']->render('landingPage/enfoiresConfirm.twig', [
            'stylesheets' => [
                'enfoires',
            ],
            'bodyclass' => 'fullpage',
            'notUseProximaNova' => true,
            'notSearchBar' => true,
            'hideGototop' => true,
            'hideBreadcrumb' => true,
            'hideNavbar' => true,
            'headerHideSearchBar' => true,
            'headerHideClaim' => true,
            'headerHideRegisterButton' => true,
            'headerHideFaq' => true,
            'headerHideUser' => true,
            'hideFooter' => true,
            'notNeedLoader' => true,
        ]);
    }

    public function landingPage(Request $request, $name)
    {
        if ($name === 'hunkemoller') {
            $params = array();
            $params['tag'] = 'bienvenue';

            $auctions = $this->app['apiclient.search']->getRunningAuctionsContent($params);

            foreach ($auctions as $k => $auction) {
                $auctions[$k] = array_merge($auctions[$k], $this->app['service.auction']->enrichAuction($auction));
            }

            return $this->app['twig']->render('landingPage/hunkemoller.twig', array('auctions' => $auctions, 'tag' => 'bienvenue'));
        }

        $params = [
            "promoValue" => $request->query->get('value')?:'5',
            "promoCode" => $request->get('code')?:'HAPPY5',
        ];
        if ($name === 'jeu-concours-crete-2017') {
            return $this->app['twig']->render('landingPage/jeu-concours-crete-2017.twig', array('hideBreadcrumb'=> true));
        }

        if ($name === 'bienvenue-affilae') {
            return $this->app['twig']->render('landingPage/bienvenue-affilae.twig', [
                "hideBreadcrumb" => 1,
            ]);
        }

        if ($name == "bonjour" || $name == 'bienvenue') {
            if ($name == 'bienvenue') {
                $params['canonicalUrl'] = $this->app['url_generator']->generate('landing.page', ['name'=>'bonjour']);
            }

            return $this->app['twig']->render('landingPage/bonjour.twig', $params);
        }

        if ($name === 'obiz') {
            return $this->app['twig']->render('landingPage/obiz.twig', $params);
        }

        return new Response($this->app['twig']->render('404.twig'), 404);
    }

    public function evenement(Request $request, $alias)
    {
        if ($alias) {
            $template = 'multiple-tags';

            $landingPage = $this->app['apiclient.default']->get('/landingpage/', ['alias' => $alias, 'formated' => 1, 'tagId' => 1])->getContent();

            if (!$landingPage) {
                return new Response($this->app['twig']->render('404.twig'), 404);
            }

            if (!$landingPage['published']) {
                return $this->app->redirect($this->app['url_generator']->generate('homepage'), 301);
            }

            $params['hideBreadcrumb'] = true;
            $params['hideNavbar'] = true;
            $params['hideFooter'] = true;
            $params['landingPage'] = $landingPage;

            return $this->app['twig']->render("landingPage/$template.twig", $params);
        }

        return new Response($this->app['twig']->render('404.twig'), 404);
    }

    public function solidary(Request $request, $alias)
    {
        switch ($alias) {
            case 'kimpembe-football-les-virades-de-l-espoir':
                return $this->app['twig']->render('landingPage/solidaire.twig', [
                    'bodyclass' => 'fullpage',
                ]);
            break;
            default:
                return new Response($this->app['twig']->render('404.twig'), 404);
        }
    }
}
