# Loisirs Enchères main website

[![CircleCI](https://circleci.com/gh/Loisirsencheres/ASS-Web.svg?style=svg&circle-token=6eb4adadc45a6068968107282c651d8536a6291a)](https://circleci.com/gh/Loisirsencheres/ASS-Web)

## Build webpack in dev environment

    yarn encore dev --watch
    
## Eslint
Installer nodejs sur votre ordinateur
Ajouter ESLint dans la configuration de votre projet.

Avec PHPStorm :
  1) Languages & Frameworks
  2) JavaScript
  3) Code Quality Tools
  4) ESLint
  
Detaille de la configuration :   
  1) Cocher la case "Enable"
  2) dans Node interpreter, sélectionnez l'éxécuteur de node, une mise à jour sera peut-être nécessaire. La version minimal recommandé est la "10.15.1".
  3) Dans ESLint package, sélectionnez le package "eslint" présent dans le dossier "node_module" de votre dossier "www".
  4) Choisissez Configuration file et sélectionnez le fichier ".eslintrc.json" présent à la racine du dossier "www". Si vous ne le voyez pas, cliquer sur l'icon oeil, afin d'afficher les fichiers et dossiers caché.

## Tests fonctionnels avec Codeception et BrowserStack

#### En local
Dans votre docker allez dans le dossier `www` puis lancez :
```
vendor/bin/codecept run acceptance --env browserstack --debug
```
Cela va lancer tous les tests fonctionnels en local, vous pouvez suivre plus en détails le déroulement de ces tests depuis l'interface web BrowserStack. 

Pour lancer un test spécifique en local lancez (remplacez PATH_TO_CLASSCEST.PHP par tests/acceptance/StaticPages/HomeCest.php par exemple):
```
vendor/bin/codecept run acceptance [PATH_TO_CLASSCEST.PHP] --env browserstack --debug
```

#### Sur CircleCI
Les tests fonctionnels sont lancés automatiquement uniquement sur `develop` ou sur une branche dont le nom commence par `qa/` ou via un tag commençant par `qa`.

## Apps & webviews
#### Identifier un user depuis un token app natif
Créer un cookie avec le token natif pour déclencher le Oauth grant switch :
```
curl -kX GET \
  'https://local-www.loisirsentest.com/product/1?onlyview=1' \
  -H 'Cookie: oauth_mobile=app2-android:magic-app2-android-member'
```