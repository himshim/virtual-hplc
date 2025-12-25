export const samples = {
  caffeine: {
    name: "Caffeine",
    components: [
      {
        name: "Caffeine",
        hydrophobicity: 0.55,
        response: 1.0,
        uvMax: 273
      }
    ]
  },

  paracetamol: {
    name: "Paracetamol",
    components: [
      {
        name: "Paracetamol",
        hydrophobicity: 0.35,
        response: 0.9,
        uvMax: 243
      }
    ]
  },

  mixture_pc: {
    name: "Paracetamol + Caffeine",
    components: [
      {
        name: "Paracetamol",
        hydrophobicity: 0.35,
        response: 0.9,
        uvMax: 243
      },
      {
        name: "Caffeine",
        hydrophobicity: 0.55,
        response: 1.0,
        uvMax: 273
      }
    ]
  },

  mixture_icp: {
    name: "Ibuprofen + Caffeine + Paracetamol",
    components: [
      {
        name: "Ibuprofen",
        hydrophobicity: 0.85,
        response: 1.2,
        uvMax: 222
      },
      {
        name: "Caffeine",
        hydrophobicity: 0.55,
        response: 1.0,
        uvMax: 273
      },
      {
        name: "Paracetamol",
        hydrophobicity: 0.35,
        response: 0.9,
        uvMax: 243
      }
    ]
  }
};