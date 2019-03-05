# rhapi-rdv
Une application de gestion de RDV pour RHAPI

[Tester la démo en ligne](https://static.rhapi.net/demos/rdv/#Praticiens)


## Note pour intégration

Il est possible d'intégrer un lien vers la prise de RDV en ligne, directement sur le site Web d'un cabinet ou sur les pages affichées par des services comme Google Maps.

**Exemple** : 

Pour un site de prise de rendez-vous dont l'URL est _**www.mon-appli-rdv.fr**_, le lien d'intégration à placer sur le site du praticien (ou toute autre page Web en ligne) sera du type _**www.mon-appli-rdv.fr/rdv/#Patients/@dr-durand**_, ou plus simplement _**www.mon-appli-rdv.fr/rdv/#Patients/dr-durand**_.

Où **_dr-durand_** est l'identifiant du praticien pour **mon-appli-rdv**.

Le patient ne disposant pas d'indentifiant remplira les champs **Nom**, **Prénom**, **E-mail** et **Téléphone mobile** et pourra prendre un rendez-vous.

S'il dispose d'un identifiant personnel, il pourra cocher le champ "**Je dispose d'un identifiant personnel**" et se connectera avec son **_identifiant_** complet (l'identifiant complet du patient est son numéro IPP - identifiant personnel du patient - suivi par **_@_** et le nom du cabinet avec par exemple "**_50@dr-durand_**"). Il devra bien sûr également saisir son **_mot de passe_**.

L'autre possibilité d'accès à la prise de rendez-vous, pour un patient connu du cabinet, sera de passer directement par le lien **_www.mon-appli-rdv.fr/rdv/#Patients/50:abcdefghij@dr-durand_**. Où **_50_** est l'identifiant du patient dans la base de données et **_abcdefghij_** son mot de passe. Ce lien aura généralement été fourni au patient par SMS ou e-mail.
