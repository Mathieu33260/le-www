<?php

namespace ASS\Service;

class FlowService
{
    public function getStepFolder($flow, $step)
    {
        if ($flow !== 'delivery') {
            $folder = 'classic';
        } else {
            $folder = $flow;
        }

        if ($folder === 'classic' && $step > 2) {
            throw new \Exception('Step '.$step.' impossible for folder ' . $folder);
        }

        return $folder;
    }
}
