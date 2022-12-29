<?php

namespace ASS\Controller\Admin;

use ASS\Controller\BaseController;
use Symfony\Component\HttpFoundation\Request;

class ProductController extends BaseController
{
    public function auction($id)
    {
        $this->reguiresAuthenticated();
        $this->requireRole(['admin', 'product', 'sales'], 'Vous n\'avez pas accès à cette fonctionnalité');

        return $this->getAuctionService()->showProductAuction($id, $for = 'admin');
    }

    public function auctionPrint($id, Request $request)
    {
        if (!$request->query->has('secret')) {
            $this->reguiresAuthenticated();
            $this->requireRole(['admin', 'product', 'sales'], 'Vous n\'avez pas accès à cette fonctionnalité');
        } elseif ($request->get('secret') !== sha1(md5($id.$this->app['admin']['productSecret']))) {
            return $this->app->redirect('homepage');
        }

        return $this->getAuctionService()->showProductAuction($id, $for = 'print');
    }
}
