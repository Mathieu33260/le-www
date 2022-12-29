<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class ProfileType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {

        $builder->add('gender', 'choice', array('label' => 'Civilité', 'required' => true, 'choices' => array('mr' => 'M.', 'mme' => 'Mme.', 'mlle' => 'Mlle.'), 'expanded' => true, 'multiple' => false))
            ->add('firstName', 'text', array('label' => 'Prénom','required' => true, 'attr' => array('placeholder' => 'Prénom')))
            ->add('lastName', 'text', array('label' => 'Nom','required' => true, 'attr' => array('placeholder' => 'Nom')))
            ->add('birthday', 'date', ['format' => 'dd/MM/yyyy', 'label' => 'Date de naissance', 'widget' => 'single_text', 'input' => 'string', 'required' => false])
            ->add('street', 'text', array('label' => 'Adresse','required' => false, 'attr' => array('placeholder' => 'Adresse')))
            ->add('zipcode', 'text', array('label' => 'Code Postal','required' => false, 'attr' => array('placeholder' => 'Code Postal')))
            ->add('showZipcode', 'checkbox', array('label' => 'J\'accepte que mon code postal soit visible lorsque j\'enchéris','required' => false))
            ->add('housenumber', 'hidden', array('required' => false,'attr' => array('value' => ' ')))
            ->add('city', 'text', array('label' => 'Ville','required' => false, 'attr' => array('placeholder' => 'Ville')))
            ->add('country', 'country', array('required' => true,'label' => 'Pays','preferred_choices' => array('FR'), 'attr' => array('placeholder' => 'Country')))
            ->add('save', 'submit', array('label' => 'Mettre à jour', 'attr' => array('class' => 'btn btn-primary')));
    }

    public function getName()
    {
        return 'profile';
    }
}
