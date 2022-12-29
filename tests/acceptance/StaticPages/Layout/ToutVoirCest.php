<?php

namespace acceptance\StaticPages\Layout;

use AcceptanceTester;

class ToutVoirCest
{
    public function _before(AcceptanceTester $I)
    {
    }

    public function _after(AcceptanceTester $I)
    {
    }

    // tests
    public function tryToTest(AcceptanceTester $I)
    {
        $I->amOnPage('/all');
        $I->see('Loisirs Enchères');
        $I->canSee('TOUT VOIR', 'div[id="navbar"] ul[class="nav navbar-nav"] li[class="bt active"]');
    }
}
