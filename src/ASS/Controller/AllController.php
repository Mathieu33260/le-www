<?php

namespace ASS\Controller;

use ASS\Trackers\EulerianTagBuilder;
use Symfony\Component\HttpFoundation\Request;
use ASS\Service\UserService;

class AllController extends BaseController
{
    /**
     * Show the actions by category.
     * @param Request $request
     */
    public function auctions(Request $request)
    {
        /** @var UserService $userService */
        $userService = $this->app['service.user'];
        $a_userProducts = json_encode($userService->getUserProducts(true));
        $sort = ($request->query->has('sort')) ? $request->query->get('sort'):'end-asc';
        $picturesForAll = $this->app['apiclient.default']->getContentCached('/advert/', ['advertType' => 'all', 'method' => 'front']);

        $pictures['banner']['imageUrl'] = $picturesForAll['desktopUrl'];
        $pictures['banner']['imageUrlMobile'] = $picturesForAll['mobileUrl'];
        $pictures['banner']['url'] = $picturesForAll['url'];
        $pictures['banner']['urlWeb'] = $picturesForAll['urlWeb'];
        $pictures['banner']['alt'] = $picturesForAll['altText'];
        $pictures['banner']['altMobile'] = $picturesForAll['altTextMobile'];
        $pictures['banner']['date'] = $picturesForAll['activeBegin'] ?? '';

        // Build all web tags : automatically inject the tags in the footer template.
        $this->getTrackerService()->buildTags([
            // Eulerian Tag
            EulerianTagBuilder::getContainerKey() => function () {
                $additionalEAData = [
                    'pagegroup' => 'page all'
                ];
                // We need to retrieve 3 first auctions to follow user experience in EA category tracking.
                $auctions = $this->getAuctionService()->getSomeAuctionsWithTag();
                // And we fill the datalayer with auction info.
                $pageEAData = [];
                foreach ($auctions as $k => $auction) {
                    $pageEAData["prdref$k"] = $auction['product_id'];
                    $pageEAData["prdgroup$k"] = $auction['category_code'];
                }
                return $additionalEAData + $pageEAData;
            }
        ]);

        return $this->app['twig']->render(
            'auction/list.twig',
            [
                'week'              => AuctionController::$WEEK_DAYS,
                'title'             => "Toutes les enchères en cours",
                'tagTitle'          => 'Toutes les enchères',
                'tagDesc'           => 'Envie de faire une pause le temps d’un weekend, de déguster un menu gastronomique ou de profiter d’un spectacle inoubliable ? Loisirs Enchères déniche pour vous chaque jour des centaines de bons plans détente ou vacances. N’hésitez plus : enchérissez, gagnez, profitez!',
                'userProducts'      => $a_userProducts,
                'headerPromo'       => true,
                'sort'              => $sort,
                'filters'           => $this->app['service.auction']->productFiltersDefault(),
                'stylesheets'       => [
                    'style',
                    'auctionsList',
                ],
            ] + $pictures
        );
    }
}
