const WORD_BANK: Record<string, string[]> = {
  name: [
    'Aaron', 'Abigail', 'Adam', 'Alice', 'Amanda', 'Andrew', 'Anna', 'Anthony',
    'Barbara', 'Benjamin', 'Beth', 'Blake', 'Brad', 'Brian', 'Bridget', 'Bruce',
    'Carl', 'Caroline', 'Chad', 'Charlie', 'Chris', 'Claire', 'Craig', 'Crystal',
    'Daniel', 'Danielle', 'David', 'Debra', 'Derek', 'Diana', 'Donald', 'Dorothy',
    'Edward', 'Eleanor', 'Elizabeth', 'Emily', 'Eric', 'Ethan', 'Eva', 'Evelyn',
    'Frank', 'Frances', 'Frederick', 'Faith', 'Felix', 'Fiona',
    'Gary', 'George', 'Gloria', 'Grace', 'Grant', 'Greg', 'Gwen',
    'Harold', 'Heather', 'Helen', 'Henry', 'Holly', 'Howard', 'Hugo',
    'Ian', 'Irene', 'Isaac', 'Ivan', 'Ivy',
    'Jack', 'James', 'Jane', 'Jason', 'Jennifer', 'Jessica', 'John', 'Julia',
    'Karen', 'Kate', 'Keith', 'Kelly', 'Ken', 'Kevin', 'Kim', 'Kyle',
    'Larry', 'Laura', 'Leo', 'Linda', 'Lisa', 'Logan', 'Louis', 'Lucy',
    'Marcus', 'Margaret', 'Maria', 'Mark', 'Martha', 'Michael', 'Michelle', 'Monica',
    'Nancy', 'Nathan', 'Neil', 'Nicholas', 'Nicole', 'Nina', 'Noah', 'Nora',
    'Oliver', 'Oscar', 'Owen',
    'Patricia', 'Patrick', 'Paul', 'Penny', 'Peter', 'Philip',
    'Rachel', 'Ralph', 'Raymond', 'Rebecca', 'Richard', 'Robert', 'Roger', 'Ruth',
    'Samuel', 'Sandra', 'Sarah', 'Scott', 'Sharon', 'Simon', 'Sophia', 'Steven',
    'Teresa', 'Thomas', 'Timothy', 'Tina', 'Tracy', 'Tyler',
    'Walter', 'Wendy', 'William', 'Winston',
  ],
  city: [
    'Atlanta', 'Austin', 'Albuquerque', 'Anchorage',
    'Boston', 'Baltimore', 'Boise', 'Buffalo',
    'Chicago', 'Charlotte', 'Cleveland', 'Columbus',
    'Dallas', 'Denver', 'Detroit', 'Durham',
    'El Paso', 'Eugene',
    'Fresno', 'Fort Worth',
    'Greensboro', 'Glendale',
    'Houston', 'Honolulu', 'Hartford',
    'Indianapolis', 'Irvine',
    'Jacksonville', 'Jersey City',
    'Kansas City', 'Knoxville',
    'Las Vegas', 'Los Angeles', 'Louisville', 'Lexington',
    'Memphis', 'Miami', 'Milwaukee', 'Minneapolis',
    'Nashville', 'Newark', 'Norfolk', 'New Orleans',
    'Oakland', 'Orlando', 'Omaha',
    'Philadelphia', 'Phoenix', 'Pittsburgh', 'Portland',
    'Raleigh', 'Richmond', 'Riverside',
    'Sacramento', 'San Diego', 'Seattle', 'St Louis',
    'Tampa', 'Tucson', 'Tulsa',
    'Washington', 'Wichita',
  ],
  country: [
    'Argentina', 'Australia', 'Austria',
    'Belgium', 'Brazil', 'Bulgaria',
    'Canada', 'Chile', 'China', 'Colombia', 'Cuba',
    'Denmark', 'Dominican Republic',
    'Ecuador', 'Egypt', 'Ethiopia',
    'Finland', 'France',
    'Germany', 'Greece', 'Guatemala',
    'Honduras', 'Hungary',
    'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
    'Japan', 'Jordan',
    'Kenya', 'Kuwait',
    'Latvia', 'Lebanon', 'Libya',
    'Malaysia', 'Mexico', 'Morocco',
    'Nepal', 'Netherlands', 'Nigeria', 'Norway',
    'Pakistan', 'Panama', 'Peru', 'Poland', 'Portugal',
    'Romania', 'Russia',
    'Spain', 'Sweden', 'Switzerland',
    'Thailand', 'Turkey',
    'Wales',
  ],
  animal: [
    'Alligator', 'Ant', 'Armadillo',
    'Bear', 'Beaver', 'Butterfly', 'Buffalo',
    'Cat', 'Cheetah', 'Chicken', 'Cow', 'Crab',
    'Deer', 'Dog', 'Dolphin', 'Duck',
    'Eagle', 'Elephant', 'Elk', 'Emu',
    'Fox', 'Frog', 'Flamingo',
    'Giraffe', 'Goat', 'Gorilla', 'Goose',
    'Horse', 'Hamster', 'Hawk', 'Hippo',
    'Iguana', 'Impala',
    'Jaguar', 'Jellyfish',
    'Kangaroo', 'Koala',
    'Lion', 'Llama', 'Lobster', 'Leopard',
    'Monkey', 'Moose', 'Mouse',
    'Narwhal', 'Newt',
    'Octopus', 'Ostrich', 'Otter', 'Owl',
    'Penguin', 'Pig', 'Puma', 'Panda',
    'Rabbit', 'Raccoon', 'Raven', 'Robin',
    'Shark', 'Snake', 'Spider', 'Squirrel', 'Swan',
    'Tiger', 'Turtle', 'Toucan',
    'Walrus', 'Wolf', 'Whale', 'Wombat',
  ],
  food: [
    'Apple', 'Avocado', 'Asparagus',
    'Banana', 'Bread', 'Broccoli', 'Brownie', 'Burrito',
    'Cake', 'Carrot', 'Cereal', 'Cheese', 'Chicken', 'Cookie', 'Corn',
    'Donut', 'Dumpling',
    'Egg', 'Enchilada',
    'Fries', 'Fudge',
    'Granola', 'Grapes', 'Grilled Cheese',
    'Hamburger', 'Honey', 'Hot Dog',
    'Ice Cream',
    'Jam', 'Jerky',
    'Kale', 'Ketchup',
    'Lasagna', 'Lemon', 'Lettuce',
    'Mango', 'Muffin', 'Mushroom',
    'Nachos', 'Noodles', 'Nutella',
    'Oatmeal', 'Orange', 'Oreos',
    'Pancake', 'Pasta', 'Pizza', 'Pretzel',
    'Rice', 'Ravioli',
    'Salad', 'Sandwich', 'Spaghetti', 'Steak', 'Sushi',
    'Taco', 'Toast', 'Tomato',
    'Waffle', 'Watermelon',
  ],
  thing: [
    'Alarm', 'Album', 'Anchor',
    'Blanket', 'Book', 'Bottle', 'Box', 'Broom', 'Bucket',
    'Candle', 'Chair', 'Clock', 'Couch', 'Cup',
    'Door', 'Desk', 'Drill',
    'Envelope', 'Eraser',
    'Fan', 'Flag', 'Fork', 'Frame',
    'Glove', 'Guitar',
    'Hat', 'Hammer', 'Hook',
    'Iron',
    'Jacket', 'Jar',
    'Key', 'Knife', 'Kite',
    'Lamp', 'Ladder', 'Lock',
    'Mirror', 'Mop', 'Mug',
    'Nail', 'Napkin', 'Needle',
    'Oven',
    'Pen', 'Pillow', 'Plate',
    'Rug', 'Ruler', 'Rope',
    'Scissors', 'Shelf', 'Soap', 'Sponge', 'Spoon', 'Stool',
    'Towel', 'Trash can',
    'Wrench',
  ],
  sport: [
    'Archery', 'Baseball', 'Basketball', 'Bowling', 'Boxing',
    'Cricket', 'Cycling', 'Curling',
    'Diving', 'Dodgeball',
    'Fencing', 'Football',
    'Golf', 'Gymnastics',
    'Hockey', 'Hiking',
    'Ice Skating',
    'Javelin', 'Judo',
    'Karate', 'Kayaking',
    'Lacrosse',
    'Marathon',
    'Netball',
    'Polo',
    'Rowing', 'Rugby', 'Running',
    'Sailing', 'Skiing', 'Soccer', 'Softball', 'Swimming',
    'Tennis', 'Track',
    'Weightlifting', 'Wrestling',
  ],
  clothing: [
    'Anorak',
    'Blouse', 'Boots', 'Belt', 'Blazer',
    'Cardigan', 'Cap', 'Coat',
    'Dress',
    'Earmuffs',
    'Fleece',
    'Gloves', 'Gown',
    'Hat', 'Hoodie',
    'Jacket', 'Jeans',
    'Khakis', 'Kimono',
    'Leggings', 'Loafers',
    'Mittens', 'Moccasins',
    'Necktie',
    'Overalls',
    'Pants', 'Parka', 'Polo',
    'Robe',
    'Sandals', 'Scarf', 'Shorts', 'Skirt', 'Socks', 'Sweater',
    'Tie', 'Tank top', 'Turtleneck',
    'Windbreaker',
  ],
  show: [
    'American Idol',
    'Breaking Bad', 'Brooklyn Nine-Nine',
    'Criminal Minds', 'CSI',
    'Dexter', 'Downtown Abbey',
    'ER',
    'Friends', 'Frasier',
    'Game of Thrones', 'Gilmore Girls', 'Grey\'s Anatomy',
    'House', 'How I Met Your Mother',
    'Jeopardy',
    'Law and Order', 'Lost',
    'Modern Family',
    'NCIS',
    'Office', 'Ozark',
    'Parks and Recreation',
    'Seinfeld', 'Stranger Things', 'Suits', 'Survivor',
    'The Bachelor', 'The Simpsons',
    'Walking Dead', 'Wheel of Fortune',
  ],
  occupation: [
    'Accountant', 'Architect', 'Artist', 'Astronaut',
    'Baker', 'Barber', 'Biologist', 'Butler',
    'Carpenter', 'Chef', 'Coach', 'Counselor',
    'Dentist', 'Designer', 'Detective', 'Doctor',
    'Editor', 'Electrician', 'Engineer',
    'Farmer', 'Firefighter', 'Florist',
    'Gardener', 'Geologist',
    'Historian',
    'Inspector', 'Interpreter',
    'Janitor', 'Journalist', 'Judge',
    'Lawyer', 'Librarian', 'Locksmith',
    'Mechanic', 'Musician',
    'Nurse', 'Navigator',
    'Optometrist',
    'Painter', 'Paramedic', 'Pharmacist', 'Pilot', 'Plumber', 'Professor',
    'Receptionist', 'Reporter',
    'Scientist', 'Surgeon',
    'Teacher', 'Therapist', 'Translator',
    'Writer',
  ],
};

function categorize(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('name') || lower.includes('people') || lower.includes('famous') || lower.includes('athlete') || lower.includes('leader') || lower.includes('comedian') || lower.includes('scientist')) return 'name';
  if (lower.includes('city') || lower.includes('cities') || lower.includes('vacation') || lower.includes('spot')) return 'city';
  if (lower.includes('countr') || lower.includes('language')) return 'country';
  if (lower.includes('animal') || lower.includes('insect') || lower.includes('bird') || lower.includes('fish') || lower.includes('reptile') || lower.includes('dog breed') || lower.includes('zoo')) return 'animal';
  if (lower.includes('food') || lower.includes('fruit') || lower.includes('vegetable') || lower.includes('breakfast') || lower.includes('dessert') || lower.includes('snack') || lower.includes('candy') || lower.includes('pizza') || lower.includes('pasta') || lower.includes('cereal') || lower.includes('seafood') || lower.includes('baked') || lower.includes('ice cream') || lower.includes('sandwich') || lower.includes('condiment') || lower.includes('beverage')) return 'food';
  if (lower.includes('sport') || lower.includes('hobb') || lower.includes('dance') || lower.includes('game')) return 'sport';
  if (lower.includes('cloth') || lower.includes('wear')) return 'clothing';
  if (lower.includes('tv') || lower.includes('show') || lower.includes('movie') || lower.includes('song') || lower.includes('cartoon') || lower.includes('character') || lower.includes('villain') || lower.includes('superhero') || lower.includes('book') || lower.includes('magazine')) return 'show';
  if (lower.includes('occupation') || lower.includes('job') || lower.includes('major')) return 'occupation';
  return 'thing';
}

function getMatchingWords(bank: string[], letter: string): string[] {
  const l = letter.toUpperCase();
  return bank.filter((w) => w.toUpperCase().startsWith(l));
}

export interface AIPlayer {
  id: string;
  name: string;
  skill: number;
}

const AI_NAMES = [
  'Bot Alpha', 'Bot Beta', 'Bot Gamma',
  'Robo Rex', 'Robo Ray', 'Robo Rox',
  'CPU Carl', 'CPU Cleo', 'CPU Chip',
];

export function createAIPlayers(count: number): AIPlayer[] {
  const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => ({
    id: `ai-${i + 1}`,
    name: shuffled[i] ?? `Bot ${i + 1}`,
    skill: 0.4 + Math.random() * 0.45,
  }));
}

export function generateAIAnswers(
  ai: AIPlayer,
  categories: string[],
  letter: string,
): string[] {
  return categories.map((cat) => {
    if (Math.random() > ai.skill) return '';

    const bankKey = categorize(cat);
    const bank = WORD_BANK[bankKey] ?? WORD_BANK['thing']!;
    const matches = getMatchingWords(bank, letter);

    if (matches.length === 0) return '';

    return matches[Math.floor(Math.random() * matches.length)]!;
  });
}
