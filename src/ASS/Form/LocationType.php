<?php

namespace ASS\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

class LocationType extends AbstractType
{
    private $options = [];

    public function __construct(array $options = array())
    {
        $this->options = $options;
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('street', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Adresse','required' => true, 'attr' => array('placeholder' => 'Adresse')))
            ->add('city', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Ville','required' => true, 'attr' => array('placeholder' => 'Ville')))
            ->add('zipcode', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Code Postal','required' => true, 'attr' => array('placeholder' => 'Code Postal')));
        if (isset($this->options['country']) && $this->options['country'] == 'blocked') {
            $builder->add(
                'country',
                ChoiceType::class,
                [
                    'choices' => ['FR' => 'France'],
                    'label_attr' => [
                        'class' => 'sr-only'
                    ],
                    'required' => true,
                    'label' => 'Pays',
                    'data' => 'FR',
                    'attr' => [
                        'placeholder' => 'Country'
                    ],
                    'read_only' => true
                ]
            );
        } else {
            $builder->add('country', 'country', array('label_attr'=> ['class'=>'sr-only'],'required' => true,'label' => 'Pays','preferred_choices' => array('FR'), 'attr' => array('placeholder' => 'Country')));
        }
        $builder->add('save', 'submit', array('label' => 'Mettre à jour', 'attr' => array('class' => 'btn btn-primary')));
    }

    public function getName()
    {
        return 'location';
    }
}
