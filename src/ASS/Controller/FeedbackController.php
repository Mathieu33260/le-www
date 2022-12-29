<?php

namespace ASS\Controller;

use Symfony\Component\HttpFoundation\Request;
use ASS\Controller\BaseController;

class FeedbackController extends BaseController
{

    public function homeFeedback(Request $request)
    {
        return $this->pageFeedback($request, 1);
    }

    public function pageFeedback(Request $request, $numpage = 1)
    {
        $params = ['published'=>1];
        $infos = $this->app['apiclient.feedback']->getFeedbacksContent($params+['infoOnly'=>1]);

        $params['numberResults'] = 10;
        $params['page'] = $numpage;
        $feedBacks = $this->app['apiclient.feedback']->getFeedbacksContent($params);

        $pagination['actual_page'] = $numpage ? (int)$numpage : 1;
        $pagination['nb_items'] = $infos['nb'];
        $pagination['per_page'] = $params['numberResults']; // API will query with limit
        $pagination['nb_pages'] = ceil((int)$pagination['nb_items'] / (int)$pagination['per_page']);

        if ($pagination['actual_page'] > 1) {
            $pagination['prev_page'] = $pagination['actual_page']-1;
        }
        if ($pagination['nb_pages'] > $pagination['actual_page']) {
            $pagination['next_page'] = $pagination['actual_page']+1;
        }

        return $this->app['twig']->render('feedback/feedbackHome.twig', [
            'feedbacks'=>$feedBacks,
            'average' => $infos['average'],
            'nb' => $infos['nb'],
            'pagination' => $pagination,
            'stylesheets' => [
                'style',
            ],
        ]);
    }
}
