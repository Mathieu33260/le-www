<?php
/**
 * Created by PhpStorm.
 * User: hadrien
 * Date: 16/05/18
 * Time: 10:02
 */

namespace ASS\Service;

class BreadCrumbService
{
    const BREADCRUMB_TITLE = 'title';

    public static $breadcrumbsSteps = [
            'classic' => [
                1 => [self::BREADCRUMB_TITLE => "Mon enchère"],
                2 => [self::BREADCRUMB_TITLE => 'Validation'],
                3 => [self::BREADCRUMB_TITLE => 'Paiement']
            ],
            'delivery' => [
                1 => [self::BREADCRUMB_TITLE => "Mon enchère"],
                2 => [self::BREADCRUMB_TITLE => 'Mon adresse'],
                3 => [self::BREADCRUMB_TITLE => 'Récapitulatif'],
                4 => [self::BREADCRUMB_TITLE => 'Paiement']
            ],
            'bookable' => [
                1 => [self::BREADCRUMB_TITLE => "Mon enchère"],
                2 => [self::BREADCRUMB_TITLE => 'Réservation'],
                3 => [self::BREADCRUMB_TITLE => 'Validation'],
                4 => [self::BREADCRUMB_TITLE => 'Paiement']
            ],
            'postpayment' => [
                1 => [self::BREADCRUMB_TITLE => 'Ma réservation'],
                2 => [self::BREADCRUMB_TITLE => 'Confirmation']
            ]
        ];

    public static function getBreadCrumbByFlow($flow)
    {
        if (in_array($flow, ['bookable_calendar_insurance', 'bookable_calendar'])) {
            $breadCrumb['steps'] = self::$breadcrumbsSteps['bookable'];
            $breadCrumb['breadcrumbFakeFirstStep'] = true;
        } elseif (in_array($flow, ['calendar_post_payment_with_stock_with_city',
            'calendar_post_payment_with_stock_without_city',
            'calendar_post_payment_without_stock_with_city',
            'calendar_post_payment_without_stock_without_city'
        ])) {
            $breadCrumb['steps'] = self::$breadcrumbsSteps['postpayment'];
            $breadCrumb['breadcrumbFakeFirstStep'] = false;
        } else if ($flow === 'delivery') {
            $breadCrumb['steps'] = self::$breadcrumbsSteps['delivery'];
            $breadCrumb['breadcrumbFakeFirstStep'] = true;
        } else {
            $breadCrumb['steps'] = self::$breadcrumbsSteps['classic'];
            $breadCrumb['breadcrumbFakeFirstStep'] = true;
        }

        return $breadCrumb;
    }
}
