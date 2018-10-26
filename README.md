# rhapi-rdv
Une application de gestion de RDV pour RHAPI

[Tester la démo sur GitHub.io](https://rhapi-project.github.io/rhapi-rdv)


## Note pour intégration

Il est possible d'intégrer la prise de rendez-vous en ligne à un site web existant afin de permettre aux patients d'un praticien de prendre rendez vous à distance.
Le praticien pourra définir différents niveaux d'autorisations selon les patients, même pour ceux n'étant pas connu du cabinet.


**Exemple** : 

Pour un site de prise de rendez-vous dont l'URL est _**www.mon-appli-rdv.fr**_, le lien d'intgration à placer sur le site du praticien ou sur tout autre support en ligne sera _**www.mon-appli-rdv.fr/rdv/#Patients/@durand**_

Où **_durand_** est l'identifiant du praticien pour **mon-appli-rdv**.

Le patient remplira les champs **Nom**, **Prénom**, **E-mail** et **Téléphone mobile** et pourra prendre un rendez-vous.

S'il dispose d'un identifiant personnel, il pourra cocher le champ "**Je dispose d'un identifiant personnel**" et il se connectera avec son **_identifiant_** préfixé par "**_@durand_**" et son **_mot de passe_**.

Une autre possibilité d'accès à la prise de rendez-vous si le patient dispose d'un identifiant sera passer par le lien **_www.mon-appli-rdv.fr/rdv/#Patients/50:abcdefghij@durand_** 

Où **_50_** est l'identifiant du patient dans la base de données et **_abcdefghij_** son mot de passe.