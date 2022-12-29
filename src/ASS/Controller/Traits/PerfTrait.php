<?php

namespace ASS\Controller\Traits;

use Symfony\Component\Stopwatch\Stopwatch;

trait PerfTrait
{
    /**
     * @return Stopwatch
     */
    public function getStopWatch()
    {
        return isset($this->app['stopwatch'])?$this->app['stopwatch']:new Stopwatch();
    }
}
