<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UserAuctionController extends BaseController
{
    public function edit(Request $request, int $userId, int $auctionId)
    {
        if ($request->isXmlHttpRequest()) {
            return new JsonResponse($this->getDefaultClient()->put("/user/$userId/auction/$auctionId", $request->query->all())->getContent());
        }
    }
}
