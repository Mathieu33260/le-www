<?php

namespace acceptance\StaticPages\Informations;

use AcceptanceTester;

class EquipeCest
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
        $I->amOnPage('/content/equipe');
        $I->see('Loisirs Enchères');
        $I->see('L\'équipe Loisirs Enchères');
        $I->see('Michael');
    }
}
