<?php

namespace acceptance\Auction;

use AcceptanceTester;

class WinAuctionCest
{
//    public function _before(AcceptanceTester $I)
//    {
//        $I->amOnPage('/');
//        $I->wait(2);
//        $I->click('button[class="btn btn-sm login btn-transparent"]');
//        $I->waitForElementVisible('#loginModal', 30);
//        $I->submitForm('#loginModal form', [
//            '_username' => 'mathieu.dumez@loisirsencheres.com',
//            '_password' => 'testtest',
//        ], '#btn_connect_popup button');
//        $I->waitForElementVisible('button[id="userMenuBtn"]', 30);
//        $I->see("Mat");
//        $I->see("Mon compte");
//    }
//
//    public function _after(AcceptanceTester $I)
//    {
//    }
//
//    // tests
//    public function tryToTest(AcceptanceTester $I)
//    {
//        $I->wait(2);
//
//        $I->amOnPage("/all");
//
//        $I->wait(2);
//
//        $I->click("#auctionsList > .auction:last-child");
//
//        $I->waitForElementVisible('div[id="bidmodule"]', 30);
//
////        $I->waitForElementVisible('.btInput', 30);
////
////        $I->clickWithLeftButton('.btInput > button:last-child');
////
////        $I->waitForElementVisible('div[id="confirmBid"]', 10);
////        $I->wait(0.5);
////        $I->canSee('', 'form[id="confirmBidSteps"]');
////
////        $I->submitForm('form[id="confirmBidSteps"]', [
////            'engagement' => true
////        ], ['class="btn-warning button"']);
////        $I->wait(0.5);
////        $I->cantSee('Une erreur est survenue.', 'div[class="error_unknown"]');
////        $I->wait(2);
//
//        $continueBid = true;
//
//        $amount = $I->grabTextFrom('span[class="bid-amount"]');
//        $price = $I->grabTextFrom('span[itemprop="price"]');
//        $I->fillField('bid', $amount + (ceil($price / 6)));
//        $I->clickWithLeftButton('button[class="btn btn-block btn-warning bid-btn animationRipple"]');
//        $I->waitForElementVisible('div[id="confirmBid"]', 10);
//        $I->wait(0.5);
//        $I->canSee('', 'form[id="confirmBidSteps"]');
//
//        $I->submitForm('form[id="confirmBidSteps"]', [
//            'engagement' => true
//        ], ['class="btn-warning button"']);
//        $I->wait(0.5);
//        $I->cantSee('Une erreur est survenue.', 'div[class="error_unknown"]');
//        $I->wait(2);
//
//        while ($continueBid) {
//            $I->wait(3);
//            $amount = $I->grabTextFrom('span[class="bid-amount"]');
//            $price = $I->grabTextFrom('span[itemprop="price"]');
//            $I->fillField('bid', $amount + (ceil($price / 6)));
//            $I->clickWithLeftButton('button[class="btn btn-block btn-warning bid-btn animationRipple"]');
//            $I->waitForElementVisible('div[id="confirmBid"]', 10);
//            $I->wait(0.5);
//            $I->canSee('', 'form[id="confirmBidSteps"]');
//
//            $I->submitForm('form[id="confirmBidSteps"]', [
//                'engagement' => true
//            ], ['class="btn-warning button"']);
//            $I->wait(0.5);
//            $I->cantSee('Une erreur est survenue.', 'div[class="error_unknown"]');
//            $I->wait(2);
//            try {
//                $I->canSee('*', 'span[class="asterisque"]');
//                $continueBid = true;
//            } catch (Exception $e) {
//                $continueBid = false;
//            }
//        }
//
//        $timerSecond = $I->grabTextFrom('span[class="time-countdown is-countdown"] span:last-child');
//        $timerMinute = $I->grabTextFrom('span[class="time-countdown is-countdown"] span:nth-child(2)');
//
//        $I->waitForText('FÉLICITATIONS', 5 + ($timerMinute * 60) + $timerSecond);
//    }
}
