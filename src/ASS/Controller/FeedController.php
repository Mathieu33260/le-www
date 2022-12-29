<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGenerator;

class FeedController extends BaseController
{

    public function channable(Request $request)
    {
        $data = $this->getProducts(['withProductTags' => true]);
        foreach ($data as $key => $value) {
            if (count($value['images']) > 5) {
                $data[$key]['images'] = array_slice($data[$key]['images'], count($value['images'])-6);
            }
        }
        $output = $this->app['twig']->render('feed/channable.xml.twig', array('auctions' => $data));

        return $this->sendToView($output);
    }

    public function sitemap(Request $request)
    {
        return $this->sitemapEntity($request);
    }

    public function sitemapEntity(Request $request, $entity = null)
    {
        $dataView = [];
        switch ($entity) {
            case 'tags':
                $dataView['tags'] = $this->app['apiclient.tag']->getTagsContent(['query' => 1, 'private' => 0]);
                break;
            case 'auctions':
                $dataView['auctions'] = $this->getProducts();
                break;
            case 'cities':
                $dataView['cities'] = $this->getDefaultClient()->getContentCached('/bigcity');
                break;
            case 'landingpages':
                $dataView['landingpages'] = $this->getDefaultClient()->getContentCached('/landingpage', [
                    'published' => '1',
                ]);
                break;
            default:
                $dataView['basic'] = true;
        }

        $output = $this->app['twig']->render('feed/sitemap.xml.twig', $dataView);

        return $this->sendToView($output);
    }

    public function criteo(Request $request)
    {
        $output = $this->app['twig']->render('feed/criteo.xml.twig', ['auctions' => $this->getProducts(['withProductTags' => true])]);

        return $this->sendToView($output);
    }

    public function facebook(Request $request)
    {
        $output = $this->app['twig']->render('feed/facebook.xml.twig', [
            'auctions' => $this->getProducts(['withProductTags' => true]),
            'baseUrl' => $this->app['req']['baseUrl'],
        ]);

        return $this->sendToView($output);
    }

    public function google(Request $request)
    {
        $products = [];
        $auctions = $this->getProducts(['withProductTags' => true]);
        $baseUrl = $this->app['req']['baseUrl'];

        foreach ($auctions as $auction) {
            $products[] = [
                "ID" => $auction['auction_product_id'],
                "ID2" => ($auction['product_shortName'] != '') ? $auction['product_shortName'] : $auction['product_name'],
                "Final URL" => $baseUrl.'/product/'.$auction['auction_product_id'],
                "Image URL" => $auction['images'][0],
                "Custom parameter" => '{_city}='.$auction['location_city'],
                "Price" => 1,
                "Item category" => $auction['category_code'],
                "Item adresse" => $auction['location_housenumber']." ".$auction['location_street']." "
                    .$auction['location_zipcode']." ".$auction['location_city'].","
                    .$auction['location_country'].",".$auction['location_lat'].",".$auction['location_lng']
            ];
        }

        $output = $this->app['twig']->render('feed/google.csv.twig', [
            'products' => $products,
            'baseUrl' => $this->app['req']['baseUrl'],
        ]);

        // We clean line endings for code style purpose
        $output = str_replace(["\n", "\r\n"], '', $output);
        // We replace CSV format line ending to real carriage return
        $output = str_replace('RETURN', "\r\n", $output);

        return $this->sendToView($output, 'text/csv');
    }

    public function fidme(Request $request)
    {
        $auctions = $this->getProducts(['withProductTags' => true]);
        $products = [];

        /* @var $imageService \ASS\Library\ASSImageService */
        $imageService = $this->app['service.images'];

        foreach ($auctions as $auction) {
            $product = [
                'productId' => $auction['auction_product_id'],
                'name' => $auction['product_name'],
                'shortName' => $auction['product_shortName'],
                'shortLoc' => $auction['product_shortloc'],
                'ribbon' => $auction['ribbon'],
                'shortPrice' => $auction['product_shortprice'],
                'location' => [
                    'street' => $auction['location_street'],
                    'housenumber' => $auction['location_housenumber'],
                    'zipcode' => $auction['location_zipcode'],
                    'country' => $auction['location_country'],
                    'lat' => $auction['location_lat'],
                    'lng' => $auction['location_lng']
                ],
                'tags' => (isset($auction['tags']))?$auction['tags']:'',
                'mainTag' => (isset($auction['tags']))?$auction['tags'][0]:'',
                'mainUrl' => $this->app['url_generator']->generate('product.auction', ['id' => $auction['auction_product_id']], UrlGenerator::ABSOLUTE_URL),
                'detailsUrl' => $this->app['url_generator']->generate('product.auction', ['id' => $auction['auction_product_id'], 'onlytabs' => 2], UrlGenerator::ABSOLUTE_URL),
                'productHtmlLink' => $this->app['url_generator']->generate('product.auction', ['id' => $auction['auction_product_id'], 'bodyOnly' => 1], UrlGenerator::ABSOLUTE_URL),
            ];

            $product['images'] = [];
            foreach ($imageService->removeXlImg($auction['images']) as $image) {
                $product['images'][] = $imageService->cdnUrl($image);
            }

            $image1 = $imageService->imgForList($auction['images']);
            $product['image1'] = $imageService->cdnUrl($image1);
            $product['image1_thumbnail'] = $imageService->cdnUrl($imageService->transf($image1, 'c_fit,w_270'));

            $products[] = $product;
        }

        // For debug
        if ($request->get('raw')) {
            $products = $auctions;
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse($products);
    }

    /**
     * Sending view
     * @param object $output
     * @param string $contentType
     * @param array $additionalHeaders
     * @return Response
     */
    private function sendToView($output, $contentType = 'application/xml')
    {
        return new Response($output, 200, ['content-type' => $contentType]);
    }

    /**
     * retrieves current auction
     * @return array
     */
    private function getProducts($options = [])
    {
        $params = array_merge($options, [
            'status' => 'planned',
            'withProductDesc' => 1,
            'withLocation' => 1,
            'withMerchant' => 1,
            'withCategoryCode' => 1,
        ]);

        $auctions = $this->app['apiclient.search']->getRunningAuctionsContent($params);

        if (sizeof($auctions) > 0) {
            foreach ($auctions as $k => $auction) {
                $auctions[$k] = array_merge($auctions[$k], $this->app['service.auction']->enrichAuction($auction));
                $auctions[$k]['location_country'] = \Locale::getDisplayRegion('-'.$auction['location_country'], 'fr');
            }
        }

        return $auctions;
    }

    public function siteMapHtml()
    {
        $tags = $this->app['apiclient.tag']->getTagsContent(['query'=>1, 'private'=>0]);

        $auctions = $this->app['apiclient.search']->getRunningAuctions([
            'status' => 'planned'
        ])->getContent();

        return $this->app['twig']->render('content/sitemap.html.twig', [
            'tags' => $tags,
            'auctions' => $auctions,
            'hideBreadcrumb' => true,
            'stylesheets' => [
                'style',
                'content',
            ],
        ]);
    }

    public function dartagnan()
    {
        $onlineProducts = $this->getProducts(
            [
                'withProductDesc' => 0,
                'withLocation' => 0,
                'withMerchant' => 0,
                'withCategoryCode' => 0,
                'withSectorInfos' => 1
            ]
        );

        $products = array_map(function ($product) {
            return [
                'product_id' => $product['product_id'],
                'product_category' => $product['category_code'],
                'auction_image' => $product['images'][0],
                'auction_short_name' => $product['product_shortName'],
                'auction_name' => $product['auction_name'],
                'product_name' => $product['product_name'],
                'auction_country' => $product['location_country'],
                'product_shortloc' => $product['product_shortloc'],
                'product_public_price' => $product['product_publicPrice'],
                'product_sector' => $product['sectorName'],
                'product_region' => $product['regionName'],
                'product_state' => $product['stateName'],
                'product_nbPeople' => $product['nbPassenger']
            ];
        }, $onlineProducts);

        $output = $this->app['twig']->render('feed/google.csv.twig', ['products' => $products]);

        // We clean line endings for code style purpose
        // We replace CSV format line ending to real carriage return
        $output = str_replace(["\n", "\r\n", 'RETURN'], ['', '', "\r\n"], $output);

        return $this->sendToView($output, 'text/csv');
    }
}
