// dev et tests sur static/demo01
const site = {
  appToken: "bXlhcHA6bXlhcHBteWFwcA",
  authUrl: "https://auth-dev.rhapi.net",
  user: "demouser", // Utilisateur par défaut (dev et tests)
  password: "demouser", // Password de l' utilisateur par défaut (dev et tests)
  title: "Accueil", // Titre du lien vers le site principal
  url: "", // Url du site principal
  support: "", // Url de la page support (ou contact) du site principal
  hideCreatePatientButton: false, // Masque la possibilité de créer un patient
  hideDeletePatientButton: false, // Masque la possibilité de supprimer un patient
  evolution: {
    actes: {
      devisTitre: "Plan de traitement",
      fseTitre: "Nouvelle FSE"
    },
    periode: {
      startingYear: 2015
    }
  } // élargissement à d'autres fonctionnalités que la prise de RDV si
  // l'objet evolution est défini (des options pourront également y être définies)
};

export default site;
