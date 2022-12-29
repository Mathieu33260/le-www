<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class VipConfirmationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('code', 'text', array('label' => 'Code','required' => true, 'attr' => array('placeholder' => 'Code', 'class' => 'form-control')))
            ->add('save', 'submit', array('label' => "Confirmer", 'attr' => array('class' => 'btn btn-cyan')));
    }

    public function getName()
    {
        return 'vipconfirmation';
    }
}
