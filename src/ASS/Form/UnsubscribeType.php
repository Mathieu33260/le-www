<?php

namespace ASS\Form;

use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\AbstractType;

class UnsubscribeType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('avis', 'choice', array('label' => false, 'required' => true,
            'choices' => array(
                'unParJourCestTrop' => 'Une newsletter par jour… C’est trop !',
                'pasDemandeNewsletter' => 'Je ne me souviens pas avoir demandé à recevoir les newsletters de Loisirs Enchères',
                'pasDansMaRegion' => 'Je ne reçois pas d’offres dans ma région',
                'pasDoffrePerso' => 'Je ne reçois pas d’offres personnalisées',
            ), 'expanded' => true, 'multiple' => false));
        $builder->add('submit', 'submit', array('label' => "Continuer", 'attr' => array('class' => 'btn btn-comfirmer')));
    }

    public function getName()
    {
        return 'unsubscribe';
    }
}
