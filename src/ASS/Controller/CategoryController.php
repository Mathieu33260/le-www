<?php

namespace ASS\Controller;

use ASS\Trackers\EulerianTagBuilder;
use Symfony\Component\HttpFoundation\Request;
use ASS\Service\UserService;
use ASS\Controller\BaseController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

class CategoryController extends BaseController
{
    /**
     * Show the actions by category.
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function auctions(Request $request)
    {
        // Get the name of the category asked.
        $sort = ($request->query->has('sort')) ? $request->query->get('sort'):'end-asc';
        $params = [];
        $params['tag'] = $request->attributes->get('name');
        if ($params['tag'] === 'sortie') {
            return $this->app->redirect($this->app['url_generator']->generate('category.name', ['name' => 'sorties']), 301);
        }
        if ($params['tag'] === 'hotel') {
            return $this->app->redirect($this->app['url_generator']->generate('category.name', ['name' => 'hotels']), 301);
        }
        if ($params['tag'] === 'voyage') {
            return $this->app->redirect($this->app['url_generator']->generate('category.name', ['name' => 'hotel+vol']), 301);
        }
        if ($params['tag'] === 'enfoires') {
            return $this->app->redirect($this->app['url_generator']->generate('landing.event', ['alias' => 'enfoires']), 301);
        }
        if ($params['tag'] === 'nouveautes' || $params['tag'] === 'top-des-ventes') {
            $sort = 'popularity';
        }
        if ($params['tag'] === 'ski') {
            // Get json config for define auctions without real time
            $query = $this->getDefaultClient()->getContentCached('/json/', [
                'name' => 'Produits physique - Ski'
            ]);
            $tagVars['auctionsWithoutRealTime'] = json_decode($query[0]['json'], true);
        }

        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        $a_userProducts = json_encode($userService->getUserProducts(true));

        $tag = $params['tag'];
        $twigView = 'list';
        if (strpos($tag, ',') !== false) {
            $tagVars['tagTitle'] = ' ';
            $tagVars['description'] = '';
            $tagVars['tagDesc'] = '';
            $tagVars['description_footer'] = '';
            $tagVars['urlImage'] = '';
            $tagVars['urlImageMetaOg'] = '';
        } else {
            $paramsApi['tagByName'] = $request->attributes->get('name');
            $paramsApi['fields'] = 'descriptions,template';
            $tagApi = $this->app['apiclient.default']->getContentCached('/tag', $paramsApi);

            $tagVars['tagTitle'] = $tagApi['title'];
            $tagVars['description'] = $tagApi['description'];
            $tagVars['tagDesc'] = ($tagApi['meta_description'] != '') ? $tagApi['meta_description'] : $tagApi['description'];
            $tagVars['description_footer'] = $tagApi['description_footer'];
            $tagVars['urlImage'] = $tagApi['urlImage'];
            $tagVars['urlImageMetaOg'] = $tagApi['urlImageMetaOg'];
            $tagVars['banner']['imageUrl'] = $tagApi['imageUrl'];
            $tagVars['banner']['imageUrlMobile'] = $tagApi['imageUrlMobile'];
            $tagVars['banner']['url'] = $tagApi['url'];
            $tagVars['banner']['urlWeb'] = $tagApi['urlWeb'];
            $tagVars['banner']['alt'] = $tagApi['alt'];
            $tagVars['banner']['altMobile'] = $tagApi['altMobile'];
            $tagVars['banner']['date'] = $tagApi['active_begin'];

            $tagVars['template'] = 'default';
            $tagVars['hideBreadcrumb'] = (bool)$tagApi['hideBreadcrumb'];
            $tagVars['containerFluid'] = (bool)$tagApi['containerFluid'];
            $tagVars['contentClass'] = $tagApi['contentClass'];
            $tagVars['canonicalUrl'] = $tagApi['canonicalUrl'];
            if ($tagApi['template'] !== 'default') {
                $twigView.= "_{$tagApi['template']}";
                $tagVars['template'] = $tagApi['template'];
            }
        }

        $isChristmasCategory = $request->attributes->get('_route') === 'christmas.category.name';

        // Build all web tags : automatically inject the tags in the footer template.
        $this->getTrackerService()->buildTags([
            // Eulerian Tag
            EulerianTagBuilder::getContainerKey() => function () use ($tag) {
                $additionalEAData = [
                    'pagegroup' => 'page categorie'
                ];
                // We need to retrieve 3 first auctions to follow user experience in EA category tracking.
                $auctions = $this->getAuctionService()->getSomeAuctionsWithTag($tag);
                // And we fill the datalayer with auction info.
                $pageEAData = [];
                foreach ($auctions as $k => $auction) {
                    $pageEAData["prdref$k"] = $auction['product_id'];
                    $pageEAData["prdgroup$k"] = $auction['category_code'];
                    $pageEAData["prdname$k"] = $auction['product_shortName'];
                }
                return $additionalEAData + $pageEAData;
            }
        ]);

        $dataView = [
            'week'              => AuctionController::$WEEK_DAYS,
            'title'             => "{$tagApi['title']} - Loisirs enchères",
            'tag'               => $tag,
            'tagName'           => $tagApi['name'],
            'userProducts'      => $a_userProducts,
            'filters'           => $this->getFilter($tagApi['id']),
            'headerPromo'       => true,
            'sort'              => $sort,
            'isChristmasCategory' => $isChristmasCategory,
            'stylesheets'       => [
                'style',
                'auctionsList',
            ],
        ];

        if ($isChristmasCategory) {
            $dataView['stylesheets'][] = 'boutiqueNoel';
        }

        return $this->app['twig']->render("auction/$twigView.twig", $dataView + $tagVars);
    }

    public function maps(Request $request)
    {
        $auctions = $this->app['apiclient.default']->get('/auction/?for=map')->getContent();

        // location
        $locations = [];
        $icons = [
            'vacances'      => 'assets/gfx/map/map-picto-vacances.png',
            'sport'         => 'assets/gfx/map/map-picto-sport.png',
            'sortie'        => 'assets/gfx/map/map-picto-sortie.png',
            'sejour'        => 'assets/gfx/map/map-picto-sejour.png',
            'nouveaute'     => 'assets/gfx/map/map-picto-nouveaute.png',
            'neige'         => 'assets/gfx/map/map-picto-neige.png',
            'insolite'      => 'assets/gfx/map/map-picto-insolite.png',
            'gastronomie'   => 'assets/gfx/map/map-picto-gastronomie.png',
            'insolite'      => 'assets/gfx/map/map-picto-insolite.png',
            'bienetre'      => 'assets/gfx/map/map-picto-bienetre.png',
            'default'       => 'assets/gfx/map/map-picto.png',
        ];
        foreach ($auctions as $auction) {
            switch ($auction['category_id']) {
                case 2:
                    $icon = $icons['sortie'];
                    break;
                case 3:
                    $icon = $icons['gastronomie'];
                    break;
                case 4:
                    $icon = $icons['bienetre'];
                    break;
                case 7:
                    $icon = $icons['sport'];
                    break;
                case 18:
                    $icon = $icons['neige'];
                    break;
                case 32:
                    $icon = $icons['vacances'];
                    break;
                case 29:
                    $icon = $icons['sejour'];
                    break;
                case 28:
                    $icon = $icons['nouveaute'];
                    break;
                default:
                    $icon = $icons['default'];
                    break;
            }
            $loc = explode(',', $auction['loc'][0]);
            $auction['image_small_url'] = $this->app['service.images']->transf($auction['image_url'], 'c_scale,h_245,w_400');
            $locations[] = [
                'lat' => floatval($loc[0]),
                'lng' => floatval($loc[1]),
                'icon'=>$icon,
                'name' => $auction['auction_name'],
                'id' => $auction['auction_id'],
                'img' => $this->app['service.images']->noprotocol($auction['image_small_url']),
                'img_large' => $this->app['service.images']->noprotocol($auction['image_url']),
            ];
        }

        $data = [
            'title'             => 'La carte aux enchères',
            'tagDesc'           => "trouvez vos loisirs à l'aide de notre carte intéractive.",
            'hideBreadcrumb'    => true,
            'locations'         => $locations,
            'icons'             => $icons,
            'stylesheets'       => [
                'style',
            ],
        ];
        return $this->app['twig']->render('auction/map.twig', $data);
    }

    public function getFilter($tagId)
    {
        $filterIds = $this->getDefaultClient()->getContentCached("/tag/$tagId/filter/");
        $filtersQuery = $this->getDefaultClient()->getContentCached('/filter/', ['ids' => $filterIds]);
        $filters = [];
        foreach ($filtersQuery as $filter) {
            $filters[$filter['category']][] = $filter;
        }
        return $filters;
    }
}
