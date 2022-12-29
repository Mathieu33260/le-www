<?php

namespace acceptance\StaticPages\UsefulLinks;

use AcceptanceTester;

class MobileAppCest
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
        $I->amOnPage('/c/application-mobile-bon-plan-voyage-sejour-vacances-weekend');
        $I->see('Loisirs Enchères');
        $I->see('Enchérissez où vous voulez, quand vous voulez !');
    }
}
