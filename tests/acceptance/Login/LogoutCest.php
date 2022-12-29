<?php

namespace acceptance\Login;

use AcceptanceTester;

class LogoutCest
{
    /**
     * We have to login before test bid
     *
     * @param AcceptanceTester $I
     * @throws \Exception
     */
    public function _before(AcceptanceTester $I)
    {
        $I->amOnPage('/');
        $I->waitForElementVisible('button[class="btn btn-sm login btn-transparent"]', 30);
        $I->click('button[class="btn btn-sm login btn-transparent"]');
        $I->waitForElementVisible('#loginModal', 30);
        $I->submitForm('#loginModal form', [
            '_username' => 'user@loisirsencheres.com',
            '_password' => 'testtest',
        ], '#btn_connect_popup button');
        $I->waitForElementVisible('button[id="userMenuBtn"]', 30);
        $I->waitForText("User", 30);
        $I->see("Mon compte");
    }

    public function _after(AcceptanceTester $I)
    {
    }

    /**
     * Test logout
     *
     * @param AcceptanceTester $I
     * @throws \Exception
     */
    public function tryToTest(AcceptanceTester $I)
    {
        $I->waitForElementVisible('button[id="userMenuBtn"]', 30);
        $I->click('button[id="userMenuBtn"]');
        $I->amOnPage('/user/logout');
        $I->see('Connexion', 'button[class="btn btn-sm login btn-transparent"]');
    }
}
