<?php

namespace ASS\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;

class CasinoType extends AbstractType
{
    private $options = [];

    public function __construct(array $options = array())
    {
        $this->options = $options;
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('userGender', 'choice', array('label' => 'Civilité', 'required' => true, 'choices' => array('1' => 'M.', '2' => 'Mme.'), 'expanded' => true, 'multiple' => false))
            ->add('userFirstName', 'text', array('label' => 'Prénom','required' => true, 'attr' => array('placeholder' => 'Prénom')))
            ->add('userLastName', 'text', array('label' => 'Nom','required' => true, 'attr' => array('placeholder' => 'Nom')))
            ->add('userMaidenName', 'text', array('label' => 'Nom de jeune fille','required' => false, 'attr' => array('placeholder' => 'Nom de jeune fille')))
            ->add('location', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Adresse','required' => true, 'attr' => array('placeholder' => 'Adresse')))
            ->add('street', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Adresse','required' => true, 'attr' => array('placeholder' => 'Adresse')))
            ->add('city', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Ville','required' => true, 'attr' => array('placeholder' => 'Ville')))
            ->add('zipcode', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Code Postal','required' => true, 'attr' => array('placeholder' => 'Code Postal')))
            ->add('userPhone', 'text', array('label' => 'Téléphone','required' => true, 'attr' => array('placeholder' => 'Téléphone')))
            ->add('phoneType', 'hidden')
            ->add('userDateOfBirth', 'date', ['format' => 'dd-MM-yyyy', 'label' => 'Date de naissance', 'widget' => 'single_text', 'input' => 'string', 'required' => true, 'attr'=>array('placeholder' => 'Date de naissance')])
            ->add('userBirthZipcode', 'text', array('label_attr'=> ['class'=>'sr-only'],'label' => 'Code Postal de votre ville de naissance','required' => true, 'attr' => array('placeholder' => 'Code Postal de votre ville de naissance')));

        if (isset($this->options['choice'])) {
            $builder->add(
                'method',
                HiddenType::class,
                array('data' => $this->options['choice'])
            );
        }
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
        return 'casino';
    }
}
