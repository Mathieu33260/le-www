<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class MailType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('email', 'email', array('label'=>'Email', 'required' => true, 'attr' => array('class' => 'form-control')));
        $builder->add('submit', 'submit');
    }

    public function getName()
    {
        return 'mail';
    }
}
