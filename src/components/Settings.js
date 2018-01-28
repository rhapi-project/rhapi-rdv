/*
 * maxWidth : Largeur de la colonne centrale
 * (d'autres largeurs sont définies
 *  comme des fractions de maxWidth)
 */

const maxWidth = 500;

/*
 * psize : Preferred Semantic UI Form size 
 * hsize : Preferred Semantic UI Header/Title Size
 */

const fsize = "big";
const hsize = "large";

/* 
 * defaultPlanning : Planning par défaut
 */

const defaultPlanning = {
  titre: "Nouveau planning",
  description: "Description du nouveau planning",
  couleur: "white",
  optionsJO: {
    plages: {
      duree: 30,
      horaires: [
        [],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      ]
    },
    reservation: {
      autorisationMin: 0,
      autorisationMax: 1,
      congesFeries: true,
      conges: [
        {
          start: "2018-08-01",
          end: "2018-08-20"
        },
        {
          start: "2018-12-20",
          end: "2019-01-02"
        }
      ],
      couleur: "",
      dateMax: "2019-03-15",
      delaiPrevenance: 48,
      denominationFormat: "NP",
      denominationDefaut: "Anonyme",
      motifs: [
        {
          autorisationMin: 0,
          couleur: "",
          duree: 10,
          motif: "Première consultation"
        },
        {
          autorisationMin: 0,
          couleur: "",
          duree: 10,
          motif: "Je suis adressé(e) pour avis par un médecin/un dentiste"
        },
        {
          autorisationMin: 1,
          couleur: "",
          duree: 15,
          motif: "Consultation de suivi"
        },
        {
          autorisationMin: 1,
          couleur: "",
          duree: 30,
          motif: "Détartrage"
        },
        {
          autorisationMin: 1,
          couleur: "",
          duree: 30,
          motif:
            "J'envisage la réalisation du plan de traitement qui m'a été proposé"
        },
        {
          autorisationMin: 1,
          couleur: "",
          duree: 20,
          motif: "Je pense avoir un problème à une dent"
        },
        {
          autorisationMin: 1,
          couleur: "",
          duree: 20,
          motif: "Je pense avoir un problème à la gencive"
        },
        {
          autorisationMin: 1,
          couleur: "",
          duree: 10,
          motif: "Je pense avoir des problèmes avec une prothèse"
        }
      ],
      horaires: [
        [
          [],
          [],
          [
            {
              start: "14:00",
              end: "19:00"
            }
          ],
          [],
          [],
          [],
          []
        ],
        [
          [],
          [
            {
              start: "09:00",
              end: "12:00"
            },
            {
              start: "14:00",
              end: "19:00"
            }
          ],
          [
            {
              start: "09:00",
              end: "12:00"
            },
            {
              start: "14:00",
              end: "19:00"
            }
          ],
          [
            {
              start: "09:00",
              end: "12:00"
            },
            {
              start: "14:00",
              end: "19:00"
            }
          ],
          [],
          [
            {
              start: "09:00",
              end: "12:00"
            },
            {
              start: "14:00",
              end: "19:00"
            }
          ],
          []
        ],
        [],
        []
      ]
    }
  }
};

export { maxWidth, fsize, hsize, defaultPlanning };
