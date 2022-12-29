<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class PreferencesType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add(
            'mail_settings',
            'choice',
            array(
                    'required' => true,
                    'multiple' => true,
                    'expanded' => true,
                    'choices' => array(
                        'email_allow_auction_overbid' => 'M\'avertir par email lorsque quelqu\'un surenchéri' ,
                        'engine_optin_status' => 'Je veux recevoir la newsletter par email',
                    ),
                    'attr' => array(
                        'class' => 'checkbox'
                    )
            )
        )
        ->add('save', 'submit', array('label' => 'Mettre à jour', 'attr' => array('class' => 'btn btn-primary')));
    }
    
    public function getName()
    {
        return 'preferences';
    }
}
