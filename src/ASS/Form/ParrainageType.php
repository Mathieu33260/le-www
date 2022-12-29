<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class ParrainageType extends AbstractType
{
    public $message = "Bonjour,

Rejoins moi sur Loisirs Enchères, le premier site français qui te permet de choisir le prix de tes loisirs et vacances. Et en guise de bienvenue, Loisirs Enchères t'offre 10 euros lors du paiement de ta première enchère !

A bientôt sur Loisirs Enchères";

    public function getMessage()
    {
        return $this->message;
    }

    public function getName()
    {
        return 'parrainage';
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add(
            'godson',
            'text',
            array(
                'required'  => true,
                'attr'      => array(
                    'placeholder'   => "exemple@loisirsencheres.com, exemple2@loisirsencheres.com",
                    'class'         => 'form-control'
                ),
                'label_attr'=> array('class'=>'hide')
            )
        )
        ->add(
            'message',
            'textarea',
            array(
                'label_attr'    => array('class'=>'hide'),
                'required'      => true,
                'attr'          => array(
                    'placeholder'   => 'Votre message',
                    'class'         => 'form-control',
                    'rows'          => '6'
                ),
                'data'          => $this->message
            )
        )
        ->add(
            'firstName',
            'text',
            array(
                    'label_attr' => array('class'=>'hide'),
                    'required' => true,
                    'attr' => array(
                        'placeholder' => 'Prénom',
                        'class'       => 'form-control',
                    )
                )
        )
        ->add(
            'lastName',
            'text',
            array(
                    'label_attr' => array('class'=>'hide'),
                    'required' => true,
                    'attr' => array(
                        'placeholder' => 'Nom',
                        'class'       => 'form-control',
                    ),
                )
        )
        ->add(
            'save',
            'submit',
            array(
                'label' => 'ENVOYEZ VOTRE INVITATION',
                'attr' => array('class' => 'btn btn-primary')
            )
        );
    }
}
