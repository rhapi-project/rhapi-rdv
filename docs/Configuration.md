# rhapi-rdv
Une application de gestion de RDV pour RHAPI

La configuration des agendas se fait depuis le menu Configuration du site : 

![alt text](images/1523621501-capture-d-ecran-2018-04-13-a-14-11-00.png)

Dans cette page, plusieurs options sont disponibles.

Tout d’abord, il est possible de définir un nom pour le planning. 
Pour cela, il suffit de le saisir dans le champ « Titre » :

![alt text](https://image.noelshack.com/fichiers/2018/15/5/1523621170-capture-d-ecran-2018-04-10-a-16-35-16.png)


On pourra également ajouter une description au Planning ainsi qu'une couleur par défaut pour les rendez-vous.

Toute modification effectuée dans le menu de configuration devra être enregistrée via le bouton "Sauvegarder" en bas de page.

# Utilisateurs et droits d'accès

Cette rubrique permet de définir les propriétaires et l'administrateur du planning sélectionné.

L'administrateur est unique et il ne peut donc y en avoir qu'un.
C'est lui qui définit quels sont les propriétaires d'un agenda. C'est à dire ceux ayant la possibilité d'accéder au planning et de pouvoir gérer celui-ci.
L'administrateur peut ajouter autant de propriétaires qu'il le souhaite en passant par le menu de configuration.
Pour ajouter un nouveau propriétaire, il suffit de saisir son nom dans la liste. 
Au cas où il y aurait plusieurs propriétaires, il faudra séparer chaque propriétaire par un espace.

Exemple : 

![alt text](https://image.noelshack.com/fichiers/2018/15/5/1523621730-capture-d-ecran-2018-04-13-a-14-14-36.png)



Il est cependant possible de changer d'administrateur à tout moment.
Pour transférer les droits d'administration à un autre utilisateur, il suffit de saisir son nom dans le champ "Transfert des droits administrateur" et de cliquer ensuite sur "Transférer" ou "Sauvegarder" :

![alt text](https://image.noelshack.com/fichiers/2018/15/5/1523621959-capture-d-ecran-2018-04-13-a-14-18-45.png)


A partir de là, l'utilisateur indiqué dans "Transfert des droits administrateur" verra sur sa page un bouton "Transférer un planning :

![alt text](https://image.noelshack.com/fichiers/2018/15/5/1523622193-capture-d-ecran-2018-04-13-a-14-21-49.png)



Il n'aura donc plus qu'à cliquer sur ce bouton (qui lui demandera ensuite de confirmer ou non la prise de droits) pour devenir le nouvel administrateur :

![alt text](https://image.noelshack.com/fichiers/2018/15/5/1523622193-capture-d-ecran-2018-04-13-a-14-22-02.png)



Enfin, le message suivant apparaitra pour confirmer la réussite du transfert de droits :

![alt text](https://image.noelshack.com/fichiers/2018/15/5/1523622193-capture-d-ecran-2018-04-13-a-14-22-10.png)



Tant que la personne à qui les droits sont transférés n'a pas confirmer la récupération des droits administrateurs, c'est celui qui a initié le transfert qui restera administrateur. 
Cela dans le but d'éviter de perdre les droits administrateur en cas d'erreur dans le nom saisi pour le transfert.
