import type { Order } from '../../../shared/types/orders';
import type { Country, Season } from '../../../shared/types/game';

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  highlightProvinces?: string[];
  /** If set, step auto-advances after this many ms (for informational steps) */
  autoAdvanceMs?: number;
  /** If true, step waits for user to click "Next" */
  waitForNext?: boolean;
  /** If set, step advances when player stages an order from this province */
  waitForOrderFrom?: string;
  /** If set, step advances when all player orders are submitted */
  waitForSubmit?: boolean;
  /** If set, step advances when retreats are submitted */
  waitForRetreat?: boolean;
  /** If set, step advances when builds are submitted */
  waitForBuild?: boolean;
  /** Point to a UI element */
  pointTo?: 'orders-panel' | 'mode-row' | 'submit-btn';
}

export interface TutorialTurn {
  year: number;
  season: Season;
  phase: 'orders' | 'retreats' | 'builds';
  botOrders: Record<Country, Order[]>;
  steps: TutorialStep[];
}

function moveOrder(country: Country, unitType: 'Army' | 'Fleet', from: string, to: string, coast?: 'NC' | 'SC' | 'EC'): Order {
  return { type: 'move', country, unitType, province: from, destination: to, ...(coast ? { coast } : {}) } as Order;
}

function holdOrder(country: Country, unitType: 'Army' | 'Fleet', from: string): Order {
  return { type: 'hold', country, unitType, province: from } as Order;
}

function supportOrder(country: Country, unitType: 'Army' | 'Fleet', from: string, supported: string, dest?: string): Order {
  return { type: 'support', country, unitType, province: from, supportedProvince: supported, ...(dest ? { supportedDestination: dest } : {}) } as Order;
}

export const TUTORIAL_TURNS: TutorialTurn[] = [
  // ═══════════════════════════════════════════════
  // SPRING 1901 — Basic Movement
  // ═══════════════════════════════════════════════
  {
    year: 1901,
    season: 'Spring',
    phase: 'orders',
    botOrders: {
      AUSTRIA: [
        moveOrder('AUSTRIA', 'Army', 'VIE', 'GAL'),
        moveOrder('AUSTRIA', 'Army', 'BUD', 'SER'),
        moveOrder('AUSTRIA', 'Fleet', 'TRI', 'ADR'),
      ],
      ENGLAND: [
        moveOrder('ENGLAND', 'Fleet', 'LON', 'ENG'),
        moveOrder('ENGLAND', 'Fleet', 'EDI', 'NTH'),
        moveOrder('ENGLAND', 'Army', 'LVP', 'YOR'),
      ],
      FRANCE: [
        moveOrder('FRANCE', 'Army', 'PAR', 'BUR'),
        moveOrder('FRANCE', 'Army', 'MAR', 'SPA'),
        moveOrder('FRANCE', 'Fleet', 'BRE', 'MAO'),
      ],
      GERMANY: [
        moveOrder('GERMANY', 'Army', 'BER', 'PRU'),
        moveOrder('GERMANY', 'Army', 'MUN', 'RUH'),
        moveOrder('GERMANY', 'Fleet', 'KIE', 'DEN'),
      ],
      ITALY: [], // Player controls Italy
      RUSSIA: [
        moveOrder('RUSSIA', 'Army', 'MOS', 'UKR'),
        moveOrder('RUSSIA', 'Fleet', 'SEV', 'BLA'),
        moveOrder('RUSSIA', 'Army', 'WAR', 'SIL'),
        moveOrder('RUSSIA', 'Fleet', 'STP', 'BOT', 'SC'),
      ],
      TURKEY: [
        moveOrder('TURKEY', 'Fleet', 'ANK', 'BLA'),
        moveOrder('TURKEY', 'Army', 'CON', 'BUL'),
        moveOrder('TURKEY', 'Army', 'SMY', 'CON'),
      ],
    },
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Diplomacy!',
        message: 'You are playing as Italy in this tutorial. Over the next few game years, you\'ll learn how to command armies and fleets, capture supply centers, support allies, convoy troops, and more.\n\nThe map shows Europe in 1901. Each colored region belongs to one of 7 Great Powers.',
        waitForNext: true,
      },
      {
        id: 'map-overview',
        title: 'Understanding the Map',
        message: 'Provinces come in three types: land (beige), coastal (land with sea access), and water (blue). Stars mark supply centers — control 18 to win.\n\nYou start with 3 units: Army in Rome, Army in Venice, and Fleet in Naples.',
        highlightProvinces: ['ROM', 'VEN', 'NAP'],
        waitForNext: true,
      },
      {
        id: 'movement-intro',
        title: 'Issuing Move Orders',
        message: 'Each turn, you give orders to all your units. The most basic order is Move — click a unit, then click where you want it to go.\n\nTry it now: click your Army in Rome, then click Apulia (APU) to move there.',
        highlightProvinces: ['ROM', 'APU'],
        waitForOrderFrom: 'ROM',
      },
      {
        id: 'second-order',
        title: 'Keep Going!',
        message: 'Now move your Army in Venice to Tyrolia (TYR). This positions you to expand northward.',
        highlightProvinces: ['VEN', 'TYR'],
        waitForOrderFrom: 'VEN',
      },
      {
        id: 'third-order',
        title: 'Fleet Movement',
        message: 'Fleets move through water and coastal provinces. Move your Fleet in Naples to the Ionian Sea (ION). This will let you project power across the Mediterranean.',
        highlightProvinces: ['NAP', 'ION'],
        waitForOrderFrom: 'NAP',
      },
      {
        id: 'submit-orders',
        title: 'Submit Your Orders',
        message: 'All 3 units have orders. Click "Submit Orders" in the panel on the right to lock them in. All nations\' orders resolve simultaneously — no one gets an advantage from going first.',
        pointTo: 'submit-btn',
        waitForSubmit: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // FALL 1901 — Capturing Supply Centers + Hold
  // ═══════════════════════════════════════════════
  {
    year: 1901,
    season: 'Fall',
    phase: 'orders',
    botOrders: {
      AUSTRIA: [
        holdOrder('AUSTRIA', 'Army', 'SER'),
        moveOrder('AUSTRIA', 'Army', 'GAL', 'RUM'),
        moveOrder('AUSTRIA', 'Fleet', 'ADR', 'ALB'),
      ],
      ENGLAND: [
        moveOrder('ENGLAND', 'Fleet', 'ENG', 'BEL'),
        moveOrder('ENGLAND', 'Fleet', 'NTH', 'NOR'),
        moveOrder('ENGLAND', 'Army', 'YOR', 'LON'),
      ],
      FRANCE: [
        holdOrder('FRANCE', 'Army', 'SPA'),
        moveOrder('FRANCE', 'Army', 'BUR', 'MAR'),
        moveOrder('FRANCE', 'Fleet', 'MAO', 'POR'),
      ],
      GERMANY: [
        holdOrder('GERMANY', 'Fleet', 'DEN'),
        moveOrder('GERMANY', 'Army', 'PRU', 'WAR'),
        moveOrder('GERMANY', 'Army', 'RUH', 'HOL'),
      ],
      ITALY: [],
      RUSSIA: [
        moveOrder('RUSSIA', 'Army', 'UKR', 'RUM'),
        moveOrder('RUSSIA', 'Fleet', 'BLA', 'CON'),
        moveOrder('RUSSIA', 'Army', 'SIL', 'MUN'),
        moveOrder('RUSSIA', 'Fleet', 'BOT', 'SWE'),
      ],
      TURKEY: [
        moveOrder('TURKEY', 'Fleet', 'BLA', 'CON'),
        moveOrder('TURKEY', 'Army', 'BUL', 'GRE'),
        moveOrder('TURKEY', 'Army', 'CON', 'SMY'),
      ],
    },
    steps: [
      {
        id: 'fall-intro',
        title: 'Fall 1901 — Capture Supply Centers',
        message: 'Your units moved successfully! Now it\'s Fall — after this turn, supply centers change ownership based on who occupies them.\n\nNeutral supply centers like Tunis (TUN) and Greece (GRE) are up for grabs. Let\'s grab Tunis with your fleet!',
        highlightProvinces: ['TUN'],
        waitForNext: true,
      },
      {
        id: 'move-to-tun',
        title: 'Capture Tunis',
        message: 'Move your Fleet from the Ionian Sea to Tunis (TUN). Fleets can move to coastal provinces.',
        highlightProvinces: ['ION', 'TUN'],
        waitForOrderFrom: 'ION',
      },
      {
        id: 'hold-intro',
        title: 'The Hold Order',
        message: 'Sometimes you want a unit to stay put and defend. Switch to "Hold" mode in the orders panel, then click your Army in Apulia to hold position.',
        highlightProvinces: ['APU'],
        pointTo: 'mode-row',
        waitForOrderFrom: 'APU',
      },
      {
        id: 'tyr-move',
        title: 'Expand North',
        message: 'Switch back to "Move" mode and move your Army in Tyrolia to Vienna (VIE) — an Austrian home supply center!',
        highlightProvinces: ['TYR', 'VIE'],
        waitForOrderFrom: 'TYR',
      },
      {
        id: 'submit-fall',
        title: 'Submit Fall Orders',
        message: 'Submit your orders. After Fall turns, supply center ownership updates and you may get to build new units!',
        pointTo: 'submit-btn',
        waitForSubmit: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // FALL 1901 BUILDS
  // ═══════════════════════════════════════════════
  {
    year: 1901,
    season: 'Fall',
    phase: 'builds',
    botOrders: {
      AUSTRIA: [], ENGLAND: [], FRANCE: [], GERMANY: [], ITALY: [], RUSSIA: [], TURKEY: [],
    },
    steps: [
      {
        id: 'builds-intro',
        title: 'Build Phase — New Units!',
        message: 'You captured new supply centers! When you control more supply centers than you have units, you can build new ones.\n\nYou can only build in your HOME supply centers (Rome, Naples, Venice) that are unoccupied. Choose what to build in the panel.',
        highlightProvinces: ['ROM', 'NAP', 'VEN'],
        waitForNext: true,
      },
      {
        id: 'do-build',
        title: 'Build a Unit',
        message: 'Use the build panel on the right to build a new Army or Fleet in one of your open home centers. Armies fight on land, Fleets control the seas.',
        waitForBuild: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // SPRING 1902 — Support Orders
  // ═══════════════════════════════════════════════
  {
    year: 1902,
    season: 'Spring',
    phase: 'orders',
    botOrders: {
      AUSTRIA: [
        moveOrder('AUSTRIA', 'Army', 'SER', 'TRI'),
        moveOrder('AUSTRIA', 'Fleet', 'ALB', 'ION'),
      ],
      ENGLAND: [
        holdOrder('ENGLAND', 'Fleet', 'BEL'),
        holdOrder('ENGLAND', 'Fleet', 'NOR'),
        holdOrder('ENGLAND', 'Army', 'LON'),
      ],
      FRANCE: [
        holdOrder('FRANCE', 'Army', 'SPA'),
        holdOrder('FRANCE', 'Army', 'MAR'),
        holdOrder('FRANCE', 'Fleet', 'POR'),
      ],
      GERMANY: [
        holdOrder('GERMANY', 'Fleet', 'DEN'),
        holdOrder('GERMANY', 'Army', 'HOL'),
        moveOrder('GERMANY', 'Army', 'MUN', 'TYR'),
      ],
      ITALY: [],
      RUSSIA: [
        holdOrder('RUSSIA', 'Fleet', 'SWE'),
        holdOrder('RUSSIA', 'Army', 'RUM'),
        holdOrder('RUSSIA', 'Army', 'MUN'),
        holdOrder('RUSSIA', 'Fleet', 'CON'),
      ],
      TURKEY: [
        holdOrder('TURKEY', 'Army', 'GRE'),
        holdOrder('TURKEY', 'Army', 'SMY'),
      ],
    },
    steps: [
      {
        id: 'support-intro',
        title: 'Spring 1902 — Support Orders',
        message: 'A unit attacking alone has strength 1. A unit defending has strength 1. To break through, you need support!\n\nA support order adds +1 strength to another unit\'s move or hold. Let\'s use support to take Trieste.',
        waitForNext: true,
      },
      {
        id: 'support-explain',
        title: 'How Support Works',
        message: 'Switch to "S Move" (Support Move) mode. Then:\n1. Click the SUPPORTING unit (the helper)\n2. Click the unit being SUPPORTED\n3. Click the DESTINATION\n\nLet\'s support your Army in Vienna to move to Trieste. Use your Army in Apulia as the supporter.',
        highlightProvinces: ['APU', 'VIE', 'TRI'],
        pointTo: 'mode-row',
        waitForOrderFrom: 'APU',
      },
      {
        id: 'do-attack',
        title: 'Order the Supported Move',
        message: 'Now switch back to "Move" mode and order your Army in Vienna to move to Trieste. With support, you\'ll have strength 2 vs their strength 1!',
        highlightProvinces: ['VIE', 'TRI'],
        waitForOrderFrom: 'VIE',
      },
      {
        id: 'other-units-1902',
        title: 'Order Remaining Units',
        message: 'Give orders to your remaining units. Move or hold as you see fit — you can experiment! Units without explicit orders will hold automatically.',
        waitForSubmit: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // FALL 1902 — Convoy
  // ═══════════════════════════════════════════════
  {
    year: 1902,
    season: 'Fall',
    phase: 'orders',
    botOrders: {
      AUSTRIA: [
        moveOrder('AUSTRIA', 'Fleet', 'ION', 'TYS'),
      ],
      ENGLAND: [
        holdOrder('ENGLAND', 'Fleet', 'BEL'),
        holdOrder('ENGLAND', 'Fleet', 'NOR'),
        holdOrder('ENGLAND', 'Army', 'LON'),
      ],
      FRANCE: [
        holdOrder('FRANCE', 'Army', 'SPA'),
        holdOrder('FRANCE', 'Army', 'MAR'),
        holdOrder('FRANCE', 'Fleet', 'POR'),
      ],
      GERMANY: [
        holdOrder('GERMANY', 'Fleet', 'DEN'),
        holdOrder('GERMANY', 'Army', 'HOL'),
        holdOrder('GERMANY', 'Army', 'TYR'),
      ],
      ITALY: [],
      RUSSIA: [
        holdOrder('RUSSIA', 'Fleet', 'SWE'),
        holdOrder('RUSSIA', 'Army', 'RUM'),
        holdOrder('RUSSIA', 'Fleet', 'CON'),
      ],
      TURKEY: [
        moveOrder('TURKEY', 'Army', 'GRE', 'ALB'),
        holdOrder('TURKEY', 'Army', 'SMY'),
      ],
    },
    steps: [
      {
        id: 'convoy-intro',
        title: 'Fall 1902 — Convoy Orders',
        message: 'Armies can\'t cross water on their own, but Fleets can carry them! A Convoy order lets a Fleet in a sea zone transport an Army across water.\n\nYou need: a Fleet in a sea zone + an Army on a coast + a destination coast.',
        waitForNext: true,
      },
      {
        id: 'convoy-explain',
        title: 'Set Up the Convoy',
        message: 'Switch to "Convoy" mode. Then:\n1. Click your FLEET in a sea zone\n2. Click the ARMY to be transported\n3. Click the DESTINATION\n\nThe army also needs a matching move order to the same destination. Give your other units orders too, then submit.',
        pointTo: 'mode-row',
        waitForSubmit: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // SPRING 1903 — Retreats (engineered dislodgement)
  // ═══════════════════════════════════════════════
  {
    year: 1903,
    season: 'Spring',
    phase: 'orders',
    botOrders: {
      AUSTRIA: [
        moveOrder('AUSTRIA', 'Fleet', 'TYS', 'ION'),
      ],
      ENGLAND: [
        holdOrder('ENGLAND', 'Fleet', 'BEL'),
        holdOrder('ENGLAND', 'Fleet', 'NOR'),
        holdOrder('ENGLAND', 'Army', 'LON'),
      ],
      FRANCE: [
        holdOrder('FRANCE', 'Army', 'SPA'),
        holdOrder('FRANCE', 'Army', 'MAR'),
        holdOrder('FRANCE', 'Fleet', 'POR'),
      ],
      GERMANY: [
        moveOrder('GERMANY', 'Fleet', 'DEN', 'KIE'),
        holdOrder('GERMANY', 'Army', 'HOL'),
        moveOrder('GERMANY', 'Army', 'TYR', 'VEN'),
        supportOrder('GERMANY', 'Army', 'HOL', 'TYR', 'VEN'),
      ],
      ITALY: [],
      RUSSIA: [
        holdOrder('RUSSIA', 'Fleet', 'SWE'),
        holdOrder('RUSSIA', 'Army', 'RUM'),
        holdOrder('RUSSIA', 'Fleet', 'CON'),
      ],
      TURKEY: [
        holdOrder('TURKEY', 'Army', 'ALB'),
        holdOrder('TURKEY', 'Army', 'SMY'),
      ],
    },
    steps: [
      {
        id: 'retreat-setup',
        title: 'Spring 1903 — A Tough Turn',
        message: 'Germany is attacking Venice with support! If their attack succeeds, your unit there will be "dislodged" and must retreat.\n\nGive your units orders as best you can. Sometimes you lose ground — that\'s part of Diplomacy!',
        highlightProvinces: ['VEN'],
        waitForSubmit: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // SPRING 1903 RETREATS
  // ═══════════════════════════════════════════════
  {
    year: 1903,
    season: 'Spring',
    phase: 'retreats',
    botOrders: {
      AUSTRIA: [], ENGLAND: [], FRANCE: [], GERMANY: [], ITALY: [], RUSSIA: [], TURKEY: [],
    },
    steps: [
      {
        id: 'retreat-explain',
        title: 'Retreat Phase',
        message: 'Your unit was dislodged! When a unit is forced out, you must retreat it to an adjacent empty province — or disband it.\n\nYou cannot retreat to the province the attacker came from, or to a province where a standoff occurred. Use the retreat panel to choose.',
        waitForNext: true,
      },
      {
        id: 'do-retreat',
        title: 'Choose Your Retreat',
        message: 'Select a retreat destination from the dropdown, then submit. If no valid retreats exist, the unit is disbanded.',
        waitForRetreat: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // FALL 1903 — Final turn + Builds
  // ═══════════════════════════════════════════════
  {
    year: 1903,
    season: 'Fall',
    phase: 'orders',
    botOrders: {
      AUSTRIA: [
        holdOrder('AUSTRIA', 'Fleet', 'ION'),
      ],
      ENGLAND: [
        holdOrder('ENGLAND', 'Fleet', 'BEL'),
        holdOrder('ENGLAND', 'Fleet', 'NOR'),
        holdOrder('ENGLAND', 'Army', 'LON'),
      ],
      FRANCE: [
        holdOrder('FRANCE', 'Army', 'SPA'),
        holdOrder('FRANCE', 'Army', 'MAR'),
        holdOrder('FRANCE', 'Fleet', 'POR'),
      ],
      GERMANY: [
        holdOrder('GERMANY', 'Fleet', 'KIE'),
        holdOrder('GERMANY', 'Army', 'HOL'),
        holdOrder('GERMANY', 'Army', 'VEN'),
      ],
      ITALY: [],
      RUSSIA: [
        holdOrder('RUSSIA', 'Fleet', 'SWE'),
        holdOrder('RUSSIA', 'Army', 'RUM'),
        holdOrder('RUSSIA', 'Fleet', 'CON'),
      ],
      TURKEY: [
        holdOrder('TURKEY', 'Army', 'ALB'),
        holdOrder('TURKEY', 'Army', 'SMY'),
      ],
    },
    steps: [
      {
        id: 'final-turn',
        title: 'Fall 1903 — Final Tutorial Turn',
        message: 'This is the last turn of the tutorial. Give your units their orders. After this, we\'ll see the supply center adjustment and you\'ll have learned all the core mechanics!',
        waitForSubmit: true,
      },
    ],
  },
];
