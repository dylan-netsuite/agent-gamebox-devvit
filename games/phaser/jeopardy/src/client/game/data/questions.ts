export interface Question {
  category: string;
  value: number;
  question: string;
  answer: string;
}

export const CATEGORIES = [
  'Science',
  'History',
  'Geography',
  'Pop Culture',
  'Sports',
  'Technology',
];

/**
 * 6 categories x 5 values = 30 questions.
 * Each inner array contains 5 questions for one category ($200–$1000).
 */
export const QUESTIONS: Question[][] = [
  // Science
  [
    {
      category: 'Science',
      value: 200,
      question: 'This planet is known as the Red Planet.',
      answer: 'What is Mars?',
    },
    {
      category: 'Science',
      value: 400,
      question: 'This element has the chemical symbol "O".',
      answer: 'What is Oxygen?',
    },
    {
      category: 'Science',
      value: 600,
      question: 'This force keeps us on the ground and planets in orbit.',
      answer: 'What is gravity?',
    },
    {
      category: 'Science',
      value: 800,
      question:
        'This scientist developed the theory of general relativity.',
      answer: 'Who is Albert Einstein?',
    },
    {
      category: 'Science',
      value: 1000,
      question:
        'This subatomic particle has no electric charge and roughly the same mass as a proton.',
      answer: 'What is a neutron?',
    },
  ],

  // History
  [
    {
      category: 'History',
      value: 200,
      question:
        'This ocean liner sank on its maiden voyage in 1912.',
      answer: 'What is the Titanic?',
    },
    {
      category: 'History',
      value: 400,
      question:
        'This ancient wonder was located in the city of Alexandria.',
      answer: 'What is the Lighthouse of Alexandria?',
    },
    {
      category: 'History',
      value: 600,
      question:
        'This wall was built to protect northern China from invasions.',
      answer: 'What is the Great Wall of China?',
    },
    {
      category: 'History',
      value: 800,
      question:
        'This document, signed in 1215, limited the power of the English king.',
      answer: 'What is the Magna Carta?',
    },
    {
      category: 'History',
      value: 1000,
      question:
        'This empire was ruled by Genghis Khan at its peak in the 13th century.',
      answer: 'What is the Mongol Empire?',
    },
  ],

  // Geography
  [
    {
      category: 'Geography',
      value: 200,
      question: 'This is the largest continent by area.',
      answer: 'What is Asia?',
    },
    {
      category: 'Geography',
      value: 400,
      question: 'This river is the longest in Africa.',
      answer: 'What is the Nile?',
    },
    {
      category: 'Geography',
      value: 600,
      question:
        'This country has the most natural lakes in the world.',
      answer: 'What is Canada?',
    },
    {
      category: 'Geography',
      value: 800,
      question:
        'This desert is the largest hot desert in the world.',
      answer: 'What is the Sahara?',
    },
    {
      category: 'Geography',
      value: 1000,
      question:
        'This mountain range separates Europe from Asia.',
      answer: 'What are the Ural Mountains?',
    },
  ],

  // Pop Culture
  [
    {
      category: 'Pop Culture',
      value: 200,
      question:
        'This wizard attends Hogwarts School of Witchcraft and Wizardry.',
      answer: 'Who is Harry Potter?',
    },
    {
      category: 'Pop Culture',
      value: 400,
      question:
        'This animated film features a clownfish searching for his son.',
      answer: 'What is Finding Nemo?',
    },
    {
      category: 'Pop Culture',
      value: 600,
      question:
        'This band released the album "Abbey Road" in 1969.',
      answer: 'Who are The Beatles?',
    },
    {
      category: 'Pop Culture',
      value: 800,
      question:
        'This TV series features dragons, ice zombies, and the Iron Throne.',
      answer: 'What is Game of Thrones?',
    },
    {
      category: 'Pop Culture',
      value: 1000,
      question:
        'This director is known for films like "Inception", "Interstellar", and "The Dark Knight".',
      answer: 'Who is Christopher Nolan?',
    },
  ],

  // Sports
  [
    {
      category: 'Sports',
      value: 200,
      question:
        'This sport is played with a round orange ball and a hoop.',
      answer: 'What is basketball?',
    },
    {
      category: 'Sports',
      value: 400,
      question:
        'This country has won the most FIFA World Cup titles.',
      answer: 'What is Brazil?',
    },
    {
      category: 'Sports',
      value: 600,
      question:
        'This tennis tournament is played on grass courts in London.',
      answer: 'What is Wimbledon?',
    },
    {
      category: 'Sports',
      value: 800,
      question:
        'This boxer was known as "The Greatest" and changed his name from Cassius Clay.',
      answer: 'Who is Muhammad Ali?',
    },
    {
      category: 'Sports',
      value: 1000,
      question:
        'This Olympic event combines cross-country skiing and rifle shooting.',
      answer: 'What is the biathlon?',
    },
  ],

  // Technology
  [
    {
      category: 'Technology',
      value: 200,
      question:
        'This company created the iPhone.',
      answer: 'What is Apple?',
    },
    {
      category: 'Technology',
      value: 400,
      question:
        'This programming language shares its name with an island in Indonesia.',
      answer: 'What is Java?',
    },
    {
      category: 'Technology',
      value: 600,
      question:
        'This protocol, abbreviated HTTP, is the foundation of data communication on the web.',
      answer: 'What is HyperText Transfer Protocol?',
    },
    {
      category: 'Technology',
      value: 800,
      question:
        'This computer scientist is considered the father of artificial intelligence and designed a famous test.',
      answer: 'Who is Alan Turing?',
    },
    {
      category: 'Technology',
      value: 1000,
      question:
        'This type of database uses key-value, document, or graph models instead of tables.',
      answer: 'What is a NoSQL database?',
    },
  ],
];

export const DJ_CATEGORIES = [
  'World Capitals',
  'Literature',
  'Music',
  'Food & Drink',
  'Movies',
  'Nature',
];

/**
 * Double Jeopardy: 6 categories x 5 values = 30 questions ($400–$2000).
 */
export const DJ_QUESTIONS: Question[][] = [
  // World Capitals
  [
    { category: 'World Capitals', value: 400, question: 'This city is the capital of Australia.', answer: 'What is Canberra?' },
    { category: 'World Capitals', value: 800, question: 'This South American capital sits at over 11,000 feet elevation.', answer: 'What is La Paz?' },
    { category: 'World Capitals', value: 1200, question: 'This city replaced Lagos as the capital of Nigeria in 1991.', answer: 'What is Abuja?' },
    { category: 'World Capitals', value: 1600, question: 'This capital city straddles two continents.', answer: 'What is Istanbul?' },
    { category: 'World Capitals', value: 2000, question: 'This is the northernmost capital city in the world.', answer: 'What is Reykjavik?' },
  ],
  // Literature
  [
    { category: 'Literature', value: 400, question: 'This author wrote "Pride and Prejudice".', answer: 'Who is Jane Austen?' },
    { category: 'Literature', value: 800, question: 'This Russian novel follows the Karenin family and begins "Happy families are all alike."', answer: 'What is Anna Karenina?' },
    { category: 'Literature', value: 1200, question: 'This Colombian author wrote "One Hundred Years of Solitude".', answer: 'Who is Gabriel Garcia Marquez?' },
    { category: 'Literature', value: 1600, question: 'This Shakespeare play features the characters Prospero and Ariel on a remote island.', answer: 'What is The Tempest?' },
    { category: 'Literature', value: 2000, question: 'This 1922 novel by James Joyce takes place entirely on June 16 in Dublin.', answer: 'What is Ulysses?' },
  ],
  // Music
  [
    { category: 'Music', value: 400, question: 'This Austrian composer wrote "The Magic Flute" and died at age 35.', answer: 'Who is Mozart?' },
    { category: 'Music', value: 800, question: 'This Motown group featured Diana Ross as lead singer.', answer: 'Who are The Supremes?' },
    { category: 'Music', value: 1200, question: 'This instrument has 88 keys.', answer: 'What is the piano?' },
    { category: 'Music', value: 1600, question: 'This Swedish group won Eurovision in 1974 with "Waterloo".', answer: 'Who is ABBA?' },
    { category: 'Music', value: 2000, question: 'This term describes a composition for nine performers.', answer: 'What is a nonet?' },
  ],
  // Food & Drink
  [
    { category: 'Food & Drink', value: 400, question: 'This Italian dish is made of layers of pasta, meat sauce, and cheese.', answer: 'What is lasagna?' },
    { category: 'Food & Drink', value: 800, question: 'This spice, derived from the crocus flower, is the most expensive by weight.', answer: 'What is saffron?' },
    { category: 'Food & Drink', value: 1200, question: 'This French term means "put in place" and refers to preparing ingredients before cooking.', answer: 'What is mise en place?' },
    { category: 'Food & Drink', value: 1600, question: 'This Japanese rice wine is brewed, not distilled.', answer: 'What is sake?' },
    { category: 'Food & Drink', value: 2000, question: 'This blue-veined Italian cheese is made from unskimmed cow\'s milk.', answer: 'What is Gorgonzola?' },
  ],
  // Movies
  [
    { category: 'Movies', value: 400, question: 'This 1994 film stars Tom Hanks on a park bench telling his life story.', answer: 'What is Forrest Gump?' },
    { category: 'Movies', value: 800, question: 'This director made "2001: A Space Odyssey" and "The Shining".', answer: 'Who is Stanley Kubrick?' },
    { category: 'Movies', value: 1200, question: 'This 1972 film, based on a Mario Puzo novel, follows the Corleone family.', answer: 'What is The Godfather?' },
    { category: 'Movies', value: 1600, question: 'This actress won the Academy Award for Best Actress for "La La Land"... briefly.', answer: 'Who is Emma Stone?' },
    { category: 'Movies', value: 2000, question: 'This Japanese animator directed "Spirited Away" and "My Neighbor Totoro".', answer: 'Who is Hayao Miyazaki?' },
  ],
  // Nature
  [
    { category: 'Nature', value: 400, question: 'This is the largest mammal on Earth.', answer: 'What is the blue whale?' },
    { category: 'Nature', value: 800, question: 'This process allows plants to convert sunlight into energy.', answer: 'What is photosynthesis?' },
    { category: 'Nature', value: 1200, question: 'This largest living structure on Earth is visible from space off the coast of Australia.', answer: 'What is the Great Barrier Reef?' },
    { category: 'Nature', value: 1600, question: 'This element, atomic number 79, has the chemical symbol Au.', answer: 'What is gold?' },
    { category: 'Nature', value: 2000, question: 'This phenomenon occurs when the Earth passes through the shadow of the Moon.', answer: 'What is a solar eclipse?' },
  ],
];
