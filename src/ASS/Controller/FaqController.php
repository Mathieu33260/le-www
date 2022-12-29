<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Zendesk\API\HttpClient as ZendeskAPI;
use ASS\Controller\BaseController;

class FaqController extends BaseController
{
    private $subdomain = "loisirsencheres";
    private $username  = "cecile@loisirsencheres.com";
    private $token     = "Ss85R17a0bwUSuXcE89gP6d9pbDbBKNRH2BvqPXp";
    private $client;
    private $categorie;
    private $section;

    public function __construct($app)
    {
        parent::__construct($app);
        // Connect to Zendesk
        $this->client = new ZendeskAPI($this->subdomain);
        $this->client->setAuth('basic', ['username' => $this->username, 'token' => $this->token]);
    }

    public function faq(Request $request)
    {
        try {
            $data = [
                'stylesheets' => [
                    'style',
                    'faq',
                ],
            ];

            if ($request->query->has('query')) {
                $term = $request->query->get('query');

                $queryArticles = $this->getZdData("/api/v2/help_center/articles/search.json?locale=fr&query=$term");

                $data['term'] = $term;
                $data['result'] = $queryArticles;
                $data['articles'] = $data['articlesContent'] = $queryArticles->results;
            } else {
                $categories = $this->getZdData("api/v2/help_center/fr/categories.json", 'categories');
                foreach ($categories as $key => $categorie) {
                    $sections = $this->getZdData("api/v2/help_center/fr/categories/{$categorie->id}/sections.json", 'sections');
                    foreach ($sections as $key2 => $section) {
                        $sections[$key2]->articles = $this->getZdData("api/v2/help_center/fr/sections/{$section->id}/articles.json", 'articles');
                    }
                    $categories[$key]->sections = $sections;
                }
                $data['onlyview'] = $this->isApp($request)?1:0;
                $data['categories'] = $categories;
            }

            return $this->app['twig']->render('content/faq.twig', $data);
        } catch (Exception $ex) {
            $this->app['logger']->error($ex);
            $response = new Response();
            $response->setStatusCode(500);
            return $response;
        }
    }

    public function section(Request $request, $section)
    {
        try {
            $data = [
                'stylesheets' => [
                    'style',
                    'faq',
                ],
            ];
            $data['onlyview'] = $this->isApp($request)?1:0;
            $sectionId = $this->getId($section);

            $data['section'] = $this->getZdData("/api/v2/help_center/fr/sections/$sectionId.json", 'section');
            if ($data['section'] == null) {
                if ($request->query->has('query')) {
                    $term = $request->query->get('query');

                    $queryArticles = $this->getZdData("/api/v2/help_center/articles/search.json?locale=fr&query=$term");

                    $data['term'] = $term;
                    $data['result'] = $queryArticles;
                    $data['articles'] = $data['articlesContent'] = $queryArticles->results;
                }
                return $this->app['twig']->render('content/faq/section.twig', $data);
            }

            if ($request->query->has('query')) {
                $term = $request->query->get('query');

                $queryArticles = $this->getZdData("/api/v2/help_center/articles/search.json?locale=fr&section=$sectionId&query=$term");

                $data['term'] = $term;
                $data['result'] = $queryArticles;
                $data['articles'] = $data['articlesContent'] = $queryArticles->results;
            } else {
                // Get articles for all sections
                $queryArticles = $this->getZdData("/api/v2/help_center/fr/sections/$sectionId/articles.json", 'articles');

                $data['articles'] = $queryArticles;
                // Get content of all articles
                foreach ($queryArticles as $article) {
                    $data['articlesContent'][] = $this->getZdData("/api/v2/help_center/fr/articles/{$article->id}.json", 'article');
                }
            }

            return $this->app['twig']->render('content/faq/section.twig', $data);
        } catch (Exception $ex) {
            $this->app['logger']->error($ex);
            $response = new Response();
            $response->setStatusCode(500);
            return $response;
        }
    }

    public function centreAide(Request $request)
    {
        try {
            $data = [
                'hideBreadcrumb' => true,
                'stylesheets' => [
                    'style',
                    'helpCenter',
                ],
            ];
            $data['categories'] = $this->getZdData("api/v2/help_center/fr/categories.json", 'categories');
            $data['onlyview'] = $this->isApp($request)?1:0;
            if ($this->categorie !== null) {
                // Auto select btn
                // Get section
                $data['sections'] = $this->getZdData("api/v2/help_center/fr/sections/{$this->categorie}.json", 'section');
            } elseif ($this->section !== null) {
                // Auto select btn
                // Get section
                $data['articles'] = $this->getZdData("api/v2/help_center/fr/sections/{$this->categorie}.json", 'section');
            }
            return $this->app['twig']->render('content/centre-aide.twig', $data);
        } catch (Exception $ex) {
            $this->app['logger']->error($ex);
            $response = new Response();
            $response->setStatusCode(500);
            return $response;
        }
    }

    public function centreAideCategorie(Request $request, $categorieId)
    {
        try {
            if ($request->isXmlHttpRequest()) {
                // Get section
                $query = $this->getZdData("api/v2/help_center/fr/categories/$categorieId/sections.json", 'sections');
                return new JsonResponse([
                    'sections' => $query
                ]);
            } else {
                $this->categorie = $categorieId;
                return $this->centreAide($request);
            }
        } catch (Exception $ex) {
            $this->app['logger']->error($ex);
            $response = new Response();
            $response->setStatusCode(500);
            return $response;
        }
    }

    public function centreAideArticles(Request $request, $sectionId)
    {
        try {
            if ($request->isXmlHttpRequest()) {
                // Get section
                $query = $this->getZdData("api/v2/help_center/fr/sections/$sectionId/articles.json", 'articles');
                return new JsonResponse([
                    'articles' => $query
                ]);
            } else {
                $this->section = $sectionId;
                return $this->centreAide($request);
            }
        } catch (Exception $ex) {
            $this->app['logger']->error($ex);
            $response = new Response();
            $response->setStatusCode(500);
            return $response;
        }
    }

    /** Privates functions **/
    private function getId($str)
    {
        $re = '/[0-9]+$/';
        preg_match($re, $str, $matches);
        return $matches[0];
    }

    private function getZdData($url, $method = null)
    {
        $version = "-20170810-1"; // Cache buster if format changes
        $ttl = 3600;
        $graceTtl = 3*24*60*60;
        $refresh = false; // Flag

        $query = json_decode($this->app['predis']['api-cache']->get($url. $version));

        if ($query !== null && $query->ttl < time()) {
            $query->ttl = time() + $ttl;
            $this->app['predis']['api-cache']->setex($url. $version, $graceTtl, json_encode($query)); // Send expired data to other request
            $refresh = true;
        }

        if ($query === null || $refresh) {
            try {
                $result = $this->client->get($url);

                $query = [];
                $query['data'] = $result;

                if ($method !== null) {
                    $query['data'] = $query['data']->$method;
                }
                $query = (object) $query;
            } catch (\Zendesk\API\Exceptions\ApiResponseException $ex) {
                $this->app['logger']->warning('Zendesk api error', array('exception' => $ex));
                // Zendesk exception stops the execution without that
            }

            if ($query != null) {
                $query->ttl = time() + $ttl;
                $this->app['predis']['api-cache']->setex($url . $version, $graceTtl, json_encode($query));
            } else {
                return null;
            }
        }
        return $query->data;
    }
}
