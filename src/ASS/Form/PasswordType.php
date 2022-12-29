<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class PasswordType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('oldPassword', 'password', array('label'=>'Mot de passe actuel', 'required' => true, 'attr' => array('placeholder' => 'Mot de passe actuel', 'class' => 'form-control')));
        $builder->add('password', 'password', array('label'=>'Nouveau mot de passe','required' => true, 'attr' => array('placeholder' => 'Nouveau mot de passe', 'class' => 'form-control')));
        $builder->add('checkPassword', 'password', array('label'=>'Confirmation mot de passe', 'required' => true, 'attr' => array('placeholder' => 'Confirmation mot de passe', 'class' => 'form-control')));
        $builder->add('save', 'submit', array('label' => 'Changer mot de passe', 'attr' => array('class' => 'default-button')));
    }

    public function getName()
    {
        return 'password';
    }
}
