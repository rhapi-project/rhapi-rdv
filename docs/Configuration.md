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



# Plages horaires d'ouverture

Ce menu permet la configuration complète des plages d'ouverture du cabinet.

Trois paramètres sont modifiables, indépendament des journées :
La "Durée par défaut d'un RDV", qui correspond au temps par défaut pour le créneau d'un nouveau rendez-vous, et la "Durée minimale d'un RDV", qui correspond à la durée visible des créneaux horaires dans l'agenda.
Le troisième paramètre est la couleur, qui sera ainsi la couleur par défaut des rendez-vous.

Une fois ces paramètres saisis, il est possible de configurer les plages horaires d'ouverture soit pour la semaine entière directement, soit journée par journée.

Pour la partie semaine :
à compléter.

Pour configurer journée par journée, il suffit de cliquer sur le jour souhaité puis de cliquer sur le bouton "+", afin de définir les plages horaires souhaitées.
Il est par exemple possible d'ouvrir le lundi, de 9h à 12h et de 14h à 18h :

![alt text](images/Plages-horaires.png)


Pour supprimer une plage horaire, il faut simplement cliquer sur le bouton "-" en bout de ligne.

Une fois toutes les plages configurées, il ne reste plus qu'à tout valider via le bouton "Sauvegarder" en bas de page.


# Evènements récurrents

Il est possible de créer des évenènements récurrents qui apparaitront ensuite dans le planning et qui permettront d'indiquer ce qu'on a prévu de faire à tel jour et tel créneau horaire.
Pour créer un évènement récurrent, il suffit de cliquer sur le bouton "+ Ajouter un évènement" :

![alt text](images/evenement-recurrent.png)

Il faut ensuite donner un nom à l'évènement, lui choisir une couleur et indiquer si cette couleur apparaitra en arrière plan ou non.
Arrière plan signifie que la couleur sera beaucoup plus transparente. Sans l'option arrière plan, la couleur sera de la même intensité que celles des rendez-vous.

Exemple sans l'option arrière plan :

![alt text](images/evenement-arriere-plan-on.png)


Exemple avec l'option arrière plan :

![alt text](images/evenement-arriere-plan-off.png)

Une fois ces paramètres validés, il faut maintenant indique les créneaux horaires concernés par l'évènement.
Le fonctionnement pour cela est le même que pour les plages horaires d'ouverture : on sélectionne une journée, on clique sur le bouton "+" et on mentionne le créneau horaire souhaité.

Exemple : 

![alt text](images/exemple-evenement-recurrent.png)

Toutefois, il est possible d'indiquer qu'un évnèement s'applique à une journée entière plut^ qu'un créneau horaire.
Pour cela, il faut cocher l'option "Toute la journée" :

![alt text](images/evenement-journee-config.png)

L'évènement récurrent s'affichera ainsi dans la zone "Toute la journée" de l'agenda :

![alt text](images/evenement-journee-agenda.png)













