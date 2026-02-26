/**
 * Category-aware answer relevance checking.
 *
 * Enumerable categories (Animals, Countries, etc.) are validated against known
 * word lists. Open-ended categories ("Things in a Kitchen") always pass since
 * they're too subjective to enumerate.
 */

type CategoryType =
  | 'name'
  | 'city'
  | 'country'
  | 'animal'
  | 'food'
  | 'sport'
  | 'clothing'
  | 'show'
  | 'occupation'
  | 'flower'
  | 'tree'
  | 'color'
  | 'instrument'
  | 'car'
  | 'holiday'
  | 'superhero'
  | 'emotion'
  | 'language'
  | 'insect'
  | 'bird'
  | 'fish'
  | 'reptile'
  | 'dance'
  | 'open';

function classifyCategory(category: string): CategoryType {
  const lower = category.toLowerCase();

  if (lower.includes('name') || lower.includes('people') || lower.includes('famous') || lower.includes('athlete') || lower.includes('leader') || lower.includes('comedian') || lower.includes('scientist')) return 'name';
  if (lower.includes('city') || lower.includes('cities')) return 'city';
  if (lower.includes('countr')) return 'country';
  if (lower.includes('language')) return 'language';
  if (lower.includes('insect')) return 'insect';
  if (lower.includes('bird')) return 'bird';
  if (lower.includes('fish') && !lower.includes('dish')) return 'fish';
  if (lower.includes('reptile')) return 'reptile';
  if (lower.includes('animal') || lower.includes('dog breed') || lower.includes('zoo')) return 'animal';
  if (lower.includes('flower')) return 'flower';
  if (lower.includes('tree') && !lower.includes('street')) return 'tree';
  if (lower.includes('color')) return 'color';
  if (lower.includes('instrument')) return 'instrument';
  if (lower.includes('car brand')) return 'car';
  if (lower.includes('holiday')) return 'holiday';
  if (lower.includes('superhero')) return 'superhero';
  if (lower.includes('emotion')) return 'emotion';
  if (lower.includes('dance') && !lower.includes('at a')) return 'dance';
  if (lower.includes('fruit')) return 'food';
  if (lower.includes('vegetable')) return 'food';
  if (lower.includes('sport') && !lower.includes('at a')) return 'sport';
  if (lower.includes('cloth') || lower === 'things you wear on your head') return 'clothing';
  if (lower.includes('occupation') || lower.includes('job')) return 'occupation';

  return 'open';
}

const KNOWN_WORDS: Record<string, Set<string>> = {};

function buildSet(words: string[]): Set<string> {
  return new Set(words.map((w) => w.toLowerCase()));
}

function getKnownWords(type: CategoryType): Set<string> | null {
  if (type === 'open') return null;

  if (!KNOWN_WORDS[type]) {
    KNOWN_WORDS[type] = buildSet(WORD_LISTS[type] ?? []);
  }
  return KNOWN_WORDS[type]!.size > 0 ? KNOWN_WORDS[type]! : null;
}

function fuzzyMatch(answer: string, knownSet: Set<string>): boolean {
  const norm = answer.trim().toLowerCase();
  if (knownSet.has(norm)) return true;

  const words = norm.split(/\s+/);
  if (words.length > 1) {
    for (const word of words) {
      if (word.length >= 3 && knownSet.has(word)) return true;
    }
  }

  for (const known of knownSet) {
    if (known.length >= 4 && norm.includes(known)) return true;
    if (norm.length >= 4 && known.includes(norm)) return true;
  }

  return false;
}

export function isCategoryRelevant(answer: string, category: string): boolean {
  if (!answer.trim()) return false;

  const type = classifyCategory(category);
  const knownSet = getKnownWords(type);

  if (!knownSet) return true;

  return fuzzyMatch(answer, knownSet);
}

const WORD_LISTS: Partial<Record<CategoryType, string[]>> = {
  name: [
    'Aaron', 'Abigail', 'Adam', 'Adrian', 'Agnes', 'Albert', 'Alex', 'Alexander', 'Alice', 'Alison', 'Amanda', 'Amber', 'Amy', 'Andrea', 'Andrew', 'Angela', 'Anna', 'Anne', 'Anthony', 'April', 'Arthur', 'Ashley', 'Audrey',
    'Barbara', 'Barry', 'Beatrice', 'Ben', 'Benjamin', 'Bernard', 'Beth', 'Betty', 'Beverly', 'Bill', 'Billy', 'Blake', 'Bob', 'Bobby', 'Bonnie', 'Brad', 'Bradley', 'Brandon', 'Brenda', 'Brian', 'Bridget', 'Brittany', 'Bruce', 'Bryan',
    'Calvin', 'Cameron', 'Carl', 'Carlos', 'Carmen', 'Carol', 'Caroline', 'Catherine', 'Chad', 'Charles', 'Charlie', 'Charlotte', 'Chelsea', 'Cheryl', 'Chris', 'Christian', 'Christina', 'Christine', 'Christopher', 'Cindy', 'Claire', 'Clara', 'Clarence', 'Clark', 'Claude', 'Clifford', 'Clinton', 'Clyde', 'Colin', 'Connie', 'Connor', 'Craig', 'Crystal', 'Curtis', 'Cynthia',
    'Dale', 'Dan', 'Dana', 'Daniel', 'Danielle', 'Danny', 'Darlene', 'Darren', 'Dave', 'David', 'Dawn', 'Dean', 'Debbie', 'Deborah', 'Debra', 'Dennis', 'Derek', 'Diana', 'Diane', 'Don', 'Donald', 'Donna', 'Doris', 'Dorothy', 'Doug', 'Douglas', 'Drew', 'Dustin', 'Dylan',
    'Earl', 'Ed', 'Eddie', 'Edgar', 'Edith', 'Edmund', 'Edward', 'Edwin', 'Eileen', 'Elaine', 'Eleanor', 'Elena', 'Eli', 'Elizabeth', 'Ellen', 'Elmer', 'Emily', 'Emma', 'Eric', 'Erica', 'Erik', 'Erin', 'Ernest', 'Esther', 'Ethan', 'Eugene', 'Eva', 'Evan', 'Evelyn',
    'Faith', 'Felix', 'Fiona', 'Florence', 'Floyd', 'Frances', 'Francis', 'Frank', 'Franklin', 'Fred', 'Frederick',
    'Gabriel', 'Gail', 'Gary', 'Gene', 'George', 'Gerald', 'Geraldine', 'Gilbert', 'Gina', 'Gladys', 'Glen', 'Glenn', 'Gloria', 'Gordon', 'Grace', 'Grant', 'Greg', 'Gregory', 'Gwen', 'Gwendolyn',
    'Hank', 'Hannah', 'Harold', 'Harriet', 'Harry', 'Harvey', 'Hazel', 'Heather', 'Hector', 'Helen', 'Henry', 'Herbert', 'Herman', 'Holly', 'Homer', 'Howard', 'Hugh', 'Hugo',
    'Ian', 'Ida', 'Irene', 'Iris', 'Isaac', 'Ivan', 'Ivy',
    'Jack', 'Jackie', 'Jacob', 'James', 'Jamie', 'Jane', 'Janet', 'Janice', 'Jared', 'Jason', 'Jay', 'Jean', 'Jeff', 'Jeffrey', 'Jennifer', 'Jenny', 'Jeremy', 'Jerome', 'Jerry', 'Jesse', 'Jessica', 'Jill', 'Jim', 'Jimmy', 'Joan', 'Joanne', 'Joe', 'Joel', 'John', 'Johnny', 'Jon', 'Jonathan', 'Jordan', 'Jose', 'Joseph', 'Joshua', 'Joy', 'Joyce', 'Juan', 'Judith', 'Judy', 'Julia', 'Julian', 'Julie', 'June', 'Justin',
    'Karen', 'Karl', 'Kate', 'Katherine', 'Kathleen', 'Kathy', 'Katie', 'Kay', 'Keith', 'Kelly', 'Ken', 'Kenneth', 'Kent', 'Kevin', 'Kim', 'Kimberly', 'Kirk', 'Kristen', 'Kristin', 'Kurt', 'Kyle',
    'Lance', 'Larry', 'Laura', 'Lauren', 'Lawrence', 'Leah', 'Lee', 'Leo', 'Leon', 'Leonard', 'Leslie', 'Lester', 'Lewis', 'Lillian', 'Linda', 'Lindsay', 'Lisa', 'Lloyd', 'Logan', 'Lois', 'Lorraine', 'Louis', 'Louise', 'Lucas', 'Lucille', 'Lucy', 'Luke', 'Luther', 'Lynn',
    'Mabel', 'Mack', 'Madison', 'Malcolm', 'Mandy', 'Marc', 'Marcus', 'Margaret', 'Maria', 'Marian', 'Marie', 'Marilyn', 'Marion', 'Mark', 'Marlene', 'Marsha', 'Marshall', 'Martha', 'Martin', 'Marvin', 'Mary', 'Matt', 'Matthew', 'Maureen', 'Max', 'Maxine', 'Megan', 'Melanie', 'Melissa', 'Michael', 'Michele', 'Michelle', 'Mike', 'Mildred', 'Milton', 'Miriam', 'Mitchell', 'Molly', 'Monica', 'Morgan', 'Morris', 'Myra', 'Myrtle',
    'Nancy', 'Natalie', 'Nathan', 'Nathaniel', 'Neal', 'Neil', 'Nelson', 'Nicholas', 'Nick', 'Nicole', 'Nina', 'Noah', 'Nora', 'Norma', 'Norman',
    'Oliver', 'Olivia', 'Omar', 'Oscar', 'Owen',
    'Pam', 'Pamela', 'Pat', 'Patricia', 'Patrick', 'Paul', 'Paula', 'Pauline', 'Pearl', 'Peggy', 'Penny', 'Perry', 'Pete', 'Peter', 'Phil', 'Philip', 'Phillip', 'Phyllis',
    'Rachel', 'Ralph', 'Ramona', 'Randall', 'Randy', 'Ray', 'Raymond', 'Rebecca', 'Regina', 'Renee', 'Rex', 'Rhonda', 'Ricardo', 'Richard', 'Rick', 'Rita', 'Rob', 'Robert', 'Robin', 'Rod', 'Rodney', 'Roger', 'Roland', 'Ron', 'Ronald', 'Rosa', 'Rose', 'Rosemary', 'Ross', 'Roy', 'Ruby', 'Russ', 'Russell', 'Ruth', 'Ryan',
    'Sally', 'Sam', 'Samantha', 'Samuel', 'Sandra', 'Sandy', 'Sara', 'Sarah', 'Scott', 'Sean', 'Shane', 'Shannon', 'Sharon', 'Shawn', 'Sheila', 'Shelley', 'Sherry', 'Shirley', 'Sidney', 'Simon', 'Sophia', 'Spencer', 'Stacy', 'Stanley', 'Stella', 'Stephanie', 'Stephen', 'Steve', 'Steven', 'Stuart', 'Sue', 'Susan', 'Suzanne', 'Sylvia',
    'Tammy', 'Tanya', 'Tara', 'Ted', 'Teresa', 'Terri', 'Terry', 'Thelma', 'Theodore', 'Thomas', 'Tim', 'Timothy', 'Tina', 'Todd', 'Tom', 'Tommy', 'Tony', 'Tracy', 'Travis', 'Trevor', 'Troy', 'Tyler',
    'Valerie', 'Vanessa', 'Vera', 'Verna', 'Vernon', 'Veronica', 'Vicki', 'Victor', 'Victoria', 'Vincent', 'Viola', 'Violet', 'Virginia', 'Vivian',
    'Wade', 'Wallace', 'Walter', 'Wanda', 'Warren', 'Wayne', 'Wendy', 'Wesley', 'Whitney', 'Wilbur', 'William', 'Willie', 'Wilma', 'Winston', 'Wyatt',
  ],
  country: [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burma', 'Burundi',
    'Cambodia', 'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Czechia',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'England', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Korea', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Samoa', 'Saudi Arabia', 'Scotland', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican', 'Venezuela', 'Vietnam',
    'Wales',
    'Yemen',
    'Zambia', 'Zimbabwe',
  ],
  animal: [
    'Aardvark', 'Albatross', 'Alligator', 'Alpaca', 'Anaconda', 'Angelfish', 'Ant', 'Anteater', 'Antelope', 'Ape', 'Armadillo',
    'Baboon', 'Badger', 'Barracuda', 'Bat', 'Bear', 'Beaver', 'Bee', 'Beetle', 'Bison', 'Boar', 'Bobcat', 'Buffalo', 'Bull', 'Bunny', 'Butterfly',
    'Camel', 'Canary', 'Capybara', 'Cardinal', 'Caribou', 'Cat', 'Caterpillar', 'Chameleon', 'Cheetah', 'Chicken', 'Chimpanzee', 'Chinchilla', 'Chipmunk', 'Clam', 'Cobra', 'Cockatoo', 'Cod', 'Condor', 'Coral', 'Cougar', 'Cow', 'Coyote', 'Crab', 'Crane', 'Cricket', 'Crocodile', 'Crow', 'Cuttlefish',
    'Deer', 'Dingo', 'Dog', 'Dolphin', 'Donkey', 'Dove', 'Dragonfly', 'Duck',
    'Eagle', 'Eel', 'Elephant', 'Elk', 'Emu',
    'Falcon', 'Ferret', 'Finch', 'Firefly', 'Flamingo', 'Flea', 'Flounder', 'Fly', 'Fox', 'Frog',
    'Gazelle', 'Gecko', 'Gerbil', 'Giraffe', 'Gnu', 'Goat', 'Goldfish', 'Goose', 'Gorilla', 'Grasshopper', 'Grizzly', 'Groundhog', 'Grouper', 'Grouse', 'Guinea pig',
    'Hamster', 'Hare', 'Hawk', 'Hedgehog', 'Heron', 'Hippo', 'Hippopotamus', 'Hornet', 'Horse', 'Hound', 'Hummingbird', 'Hyena',
    'Ibis', 'Iguana', 'Impala',
    'Jackal', 'Jackrabbit', 'Jaguar', 'Jay', 'Jellyfish',
    'Kangaroo', 'Kingfisher', 'Kiwi', 'Koala', 'Komodo',
    'Ladybug', 'Lamb', 'Lark', 'Lemur', 'Leopard', 'Lion', 'Lizard', 'Llama', 'Lobster', 'Locust', 'Loon', 'Lynx',
    'Macaw', 'Mackerel', 'Magpie', 'Manatee', 'Mandrill', 'Manta', 'Mantis', 'Marlin', 'Marmot', 'Meerkat', 'Mink', 'Minnow', 'Mole', 'Mongoose', 'Monkey', 'Moose', 'Mosquito', 'Moth', 'Mouse', 'Mule', 'Muskrat', 'Mussel',
    'Narwhal', 'Newt', 'Nightingale',
    'Ocelot', 'Octopus', 'Opossum', 'Orangutan', 'Orca', 'Oriole', 'Osprey', 'Ostrich', 'Otter', 'Owl', 'Ox', 'Oyster',
    'Panda', 'Panther', 'Parakeet', 'Parrot', 'Partridge', 'Peacock', 'Pelican', 'Penguin', 'Perch', 'Pheasant', 'Pig', 'Pigeon', 'Pike', 'Piranha', 'Platypus', 'Polar bear', 'Pony', 'Porcupine', 'Porpoise', 'Possum', 'Prairie dog', 'Prawn', 'Puffin', 'Puma', 'Python',
    'Quail', 'Quokka',
    'Rabbit', 'Raccoon', 'Ram', 'Rat', 'Rattlesnake', 'Raven', 'Ray', 'Reindeer', 'Rhinoceros', 'Robin', 'Rooster',
    'Salamander', 'Salmon', 'Sardine', 'Scorpion', 'Sea horse', 'Sea lion', 'Seahorse', 'Seal', 'Shark', 'Sheep', 'Shrimp', 'Skunk', 'Sloth', 'Slug', 'Snail', 'Snake', 'Sparrow', 'Spider', 'Squid', 'Squirrel', 'Stallion', 'Starfish', 'Stingray', 'Stork', 'Sturgeon', 'Swan', 'Swordfish',
    'Tapir', 'Tarantula', 'Termite', 'Tern', 'Tiger', 'Toad', 'Tortoise', 'Toucan', 'Trout', 'Tuna', 'Turkey', 'Turtle',
    'Viper', 'Vulture',
    'Wallaby', 'Walrus', 'Warthog', 'Wasp', 'Weasel', 'Whale', 'Wolf', 'Wolverine', 'Wombat', 'Woodpecker', 'Worm', 'Wren',
    'Yak',
    'Zebra',
  ],
  color: [
    'Amber', 'Amethyst', 'Apricot', 'Aqua', 'Aquamarine', 'Azure',
    'Beige', 'Black', 'Blue', 'Blush', 'Bronze', 'Brown', 'Burgundy',
    'Caramel', 'Cardinal', 'Carmine', 'Celadon', 'Cerulean', 'Champagne', 'Charcoal', 'Chartreuse', 'Cherry', 'Chestnut', 'Chocolate', 'Cinnamon', 'Cobalt', 'Copper', 'Coral', 'Cornflower', 'Cream', 'Crimson', 'Cyan',
    'Denim',
    'Ebony', 'Ecru', 'Eggplant', 'Emerald',
    'Fawn', 'Fern', 'Fuchsia',
    'Garnet', 'Ginger', 'Gold', 'Golden', 'Gray', 'Green',
    'Hazel', 'Heather', 'Honey', 'Hot pink',
    'Indigo', 'Ivory',
    'Jade', 'Jet',
    'Khaki',
    'Lavender', 'Lemon', 'Lilac', 'Lime', 'Linen',
    'Magenta', 'Mahogany', 'Maize', 'Maroon', 'Mauve', 'Mint', 'Mocha', 'Moss', 'Mulberry', 'Mustard',
    'Navy',
    'Ochre', 'Olive', 'Onyx', 'Orange', 'Orchid',
    'Peach', 'Pearl', 'Periwinkle', 'Persimmon', 'Pink', 'Platinum', 'Plum', 'Puce', 'Purple',
    'Red', 'Rose', 'Ruby', 'Rust',
    'Saffron', 'Sage', 'Salmon', 'Sand', 'Sapphire', 'Scarlet', 'Seafoam', 'Sepia', 'Silver', 'Slate', 'Steel',
    'Tan', 'Tangerine', 'Taupe', 'Teal', 'Terracotta', 'Thistle', 'Topaz', 'Turquoise',
    'Umber',
    'Vanilla', 'Vermilion', 'Violet',
    'White', 'Wine', 'Wisteria',
    'Yellow',
  ],
  sport: [
    'Archery', 'Badminton', 'Baseball', 'Basketball', 'Biathlon', 'Billiards', 'Bobsled', 'Bocce', 'Bowling', 'Boxing',
    'Canoeing', 'Climbing', 'Cricket', 'Croquet', 'Cross country', 'Curling', 'Cycling',
    'Darts', 'Decathlon', 'Diving', 'Dodgeball',
    'Equestrian',
    'Fencing', 'Field hockey', 'Figure skating', 'Fishing', 'Football', 'Frisbee',
    'Golf', 'Gymnastics',
    'Handball', 'Hang gliding', 'High jump', 'Hiking', 'Hockey', 'Horseback riding', 'Hurdles',
    'Ice hockey', 'Ice skating',
    'Javelin', 'Jogging', 'Judo',
    'Karate', 'Kayaking', 'Kickball', 'Kickboxing',
    'Lacrosse', 'Long jump', 'Luge',
    'Marathon', 'Martial arts',
    'Netball',
    'Paintball', 'Parkour', 'Pickleball', 'Ping pong', 'Polo', 'Pool',
    'Racquetball', 'Rafting', 'Rock climbing', 'Rodeo', 'Roller skating', 'Rowing', 'Rugby', 'Running',
    'Sailing', 'Shooting', 'Shot put', 'Skateboarding', 'Skating', 'Skiing', 'Skydiving', 'Snowboarding', 'Soccer', 'Softball', 'Squash', 'Surfing', 'Swimming', 'Synchronized swimming',
    'Table tennis', 'Taekwondo', 'Tennis', 'Track', 'Track and field', 'Triathlon',
    'Volleyball',
    'Water polo', 'Weightlifting', 'Wrestling',
  ],
  clothing: [
    'Anorak', 'Apron',
    'Bandana', 'Bathrobe', 'Beanie', 'Belt', 'Beret', 'Bermuda shorts', 'Bikini', 'Blazer', 'Blouse', 'Bonnet', 'Boots', 'Bow tie', 'Boxers', 'Bra', 'Briefs',
    'Caftan', 'Camisole', 'Cap', 'Cape', 'Capris', 'Cardigan', 'Cargo pants', 'Cloak', 'Clogs', 'Coat', 'Corset', 'Cowboy boots', 'Cowboy hat', 'Cummerbund',
    'Dress', 'Dungarees',
    'Earmuffs', 'Espadrilles',
    'Fedora', 'Flip flops', 'Fleece',
    'Galoshes', 'Garters', 'Gloves', 'Gown',
    'Hat', 'Headband', 'Heels', 'High heels', 'Hood', 'Hoodie', 'Housecoat',
    'Jacket', 'Jeans', 'Jersey', 'Jodhpurs', 'Jumpsuit',
    'Khakis', 'Kimono', 'Kilt', 'Knee socks',
    'Leggings', 'Leotard', 'Loafers',
    'Mittens', 'Moccasins', 'Muumuu',
    'Necktie', 'Nightgown',
    'Overall', 'Overalls', 'Overcoat', 'Oxford shoes',
    'Pajamas', 'Pants', 'Parka', 'Peacoat', 'Petticoat', 'Polo', 'Poncho', 'Pullover', 'Pumps',
    'Raincoat', 'Robe', 'Romper',
    'Sandals', 'Sarong', 'Scarf', 'Shawl', 'Shirt', 'Shoes', 'Shorts', 'Skirt', 'Slacks', 'Slippers', 'Sneakers', 'Socks', 'Stockings', 'Stole', 'Suit', 'Sundress', 'Suspenders', 'Sweater', 'Sweatpants', 'Sweatshirt',
    'Tank top', 'Tie', 'Tights', 'Top', 'Trench coat', 'Trousers', 'T-shirt', 'Tunic', 'Turban', 'Turtleneck', 'Tuxedo',
    'Uniform',
    'Vest', 'Visor',
    'Windbreaker', 'Wrap',
  ],
  occupation: [
    'Accountant', 'Actor', 'Actuary', 'Administrator', 'Analyst', 'Anesthesiologist', 'Animator', 'Archaeologist', 'Architect', 'Artist', 'Astronaut', 'Astronomer', 'Attorney', 'Auditor',
    'Baker', 'Banker', 'Barber', 'Bartender', 'Biologist', 'Blacksmith', 'Bookkeeper', 'Botanist', 'Bricklayer', 'Broker', 'Bus driver', 'Butcher', 'Butler',
    'Cabinetmaker', 'Captain', 'Carpenter', 'Cashier', 'Chaplain', 'Chef', 'Chemist', 'Chiropractor', 'Coach', 'Comedian', 'Composer', 'Conductor', 'Consultant', 'Cook', 'Copywriter', 'Coroner', 'Counselor', 'Curator',
    'Dancer', 'Dean', 'Dentist', 'Deputy', 'Designer', 'Detective', 'Dietitian', 'Director', 'Dispatcher', 'Doctor', 'Doorman', 'Driver',
    'Economist', 'Editor', 'Electrician', 'Engineer', 'Entrepreneur', 'Examiner', 'Executive',
    'Farmer', 'Firefighter', 'Fisherman', 'Flight attendant', 'Florist', 'Forester',
    'Gardener', 'Geographer', 'Geologist', 'Graphic designer', 'Guard', 'Guide',
    'Hairdresser', 'Historian', 'Housekeeper',
    'Illustrator', 'Inspector', 'Instructor', 'Interpreter', 'Investigator',
    'Janitor', 'Jeweler', 'Journalist', 'Judge',
    'Landscaper', 'Lawyer', 'Librarian', 'Lifeguard', 'Linguist', 'Locksmith', 'Logger',
    'Machinist', 'Manager', 'Marine', 'Mason', 'Mathematician', 'Mayor', 'Mechanic', 'Mediator', 'Meteorologist', 'Midwife', 'Minister', 'Missionary', 'Model', 'Mortician', 'Musician',
    'Navigator', 'Neurologist', 'Notary', 'Nurse', 'Nutritionist',
    'Obstetrician', 'Officer', 'Operator', 'Optician', 'Optometrist', 'Orthodontist',
    'Painter', 'Paleontologist', 'Paralegal', 'Paramedic', 'Pastor', 'Pathologist', 'Pediatrician', 'Pharmacist', 'Philosopher', 'Photographer', 'Physician', 'Physicist', 'Pilot', 'Plumber', 'Poet', 'Police officer', 'Politician', 'Porter', 'Postman', 'President', 'Principal', 'Producer', 'Professor', 'Programmer', 'Psychiatrist', 'Psychologist', 'Publisher',
    'Rabbi', 'Radiologist', 'Rancher', 'Ranger', 'Realtor', 'Receptionist', 'Reporter', 'Researcher',
    'Sailor', 'Salesman', 'Scientist', 'Sculptor', 'Secretary', 'Senator', 'Sheriff', 'Singer', 'Social worker', 'Soldier', 'Stockbroker', 'Surgeon', 'Surveyor',
    'Tailor', 'Teacher', 'Technician', 'Therapist', 'Trainer', 'Translator', 'Treasurer', 'Truck driver', 'Tutor',
    'Undertaker', 'Usher',
    'Veterinarian',
    'Waiter', 'Waitress', 'Warden', 'Welder', 'Writer',
    'Zoologist',
  ],
  flower: [
    'Acacia', 'Amaryllis', 'Anemone', 'Aster', 'Azalea',
    'Begonia', 'Bluebell', 'Bougainvillea', 'Buttercup',
    'Camellia', 'Carnation', 'Chrysanthemum', 'Clematis', 'Clover', 'Columbine', 'Cornflower', 'Cosmos', 'Crocus',
    'Daffodil', 'Dahlia', 'Daisy', 'Dandelion', 'Delphinium',
    'Edelweiss',
    'Forget-me-not', 'Foxglove', 'Freesia', 'Fuchsia',
    'Gardenia', 'Geranium', 'Gladiolus', 'Goldenrod',
    'Heather', 'Hibiscus', 'Hollyhock', 'Honeysuckle', 'Hyacinth', 'Hydrangea',
    'Iris',
    'Jasmine', 'Jonquil',
    'Lavender', 'Lilac', 'Lily', 'Lotus', 'Lupine',
    'Magnolia', 'Marigold', 'Morning glory',
    'Narcissus', 'Nasturtium',
    'Orchid',
    'Pansy', 'Peony', 'Periwinkle', 'Petunia', 'Plumeria', 'Poinsettia', 'Poppy', 'Primrose',
    'Ranunculus', 'Rose',
    'Snapdragon', 'Snowdrop', 'Sunflower', 'Sweet pea',
    'Thistle', 'Tulip',
    'Verbena', 'Violet',
    'Wisteria',
    'Zinnia',
  ],
  tree: [
    'Acacia', 'Alder', 'Almond', 'Apple', 'Ash', 'Aspen',
    'Balsa', 'Bamboo', 'Banyan', 'Baobab', 'Beech', 'Birch', 'Boxwood',
    'Cedar', 'Cherry', 'Chestnut', 'Coconut', 'Cottonwood', 'Cypress',
    'Dogwood',
    'Ebony', 'Elder', 'Elm', 'Eucalyptus',
    'Fig', 'Fir',
    'Ginkgo', 'Gum',
    'Hawthorn', 'Hazel', 'Hemlock', 'Hickory', 'Holly', 'Hornbeam',
    'Ironwood',
    'Joshua', 'Juniper',
    'Larch', 'Laurel', 'Lemon', 'Lime', 'Linden', 'Locust',
    'Magnolia', 'Mahogany', 'Mango', 'Maple', 'Mesquite', 'Mulberry',
    'Nutmeg',
    'Oak', 'Olive', 'Orange',
    'Palm', 'Peach', 'Pear', 'Pecan', 'Pine', 'Pistachio', 'Plum', 'Poplar',
    'Redwood', 'Rosewood',
    'Sassafras', 'Sequoia', 'Spruce', 'Sumac', 'Sycamore',
    'Tamarack', 'Teak',
    'Walnut', 'Willow',
    'Yew',
  ],
  instrument: [
    'Accordion',
    'Bagpipes', 'Banjo', 'Bass', 'Bassoon', 'Bells', 'Bongo', 'Bugle',
    'Castanets', 'Cello', 'Chimes', 'Clarinet', 'Clavichord', 'Concertina', 'Cornet', 'Cowbell', 'Cymbal',
    'Didgeridoo', 'Drum', 'Dulcimer',
    'Euphonium',
    'Fiddle', 'Fife', 'Flute', 'French horn',
    'Glockenspiel', 'Gong', 'Guitar',
    'Harmonica', 'Harp', 'Harpsichord',
    'Kazoo', 'Keyboard', 'Kettledrum',
    'Lute', 'Lyre',
    'Mandolin', 'Maracas', 'Marimba', 'Melodica',
    'Oboe', 'Ocarina', 'Organ',
    'Pan flute', 'Piano', 'Piccolo',
    'Recorder',
    'Saxophone', 'Sitar', 'Snare drum', 'Steel drum', 'Synthesizer',
    'Tambourine', 'Timpani', 'Triangle', 'Trombone', 'Trumpet', 'Tuba',
    'Ukulele',
    'Viola', 'Violin',
    'Xylophone',
    'Zither',
  ],
  car: [
    'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi',
    'Bentley', 'BMW', 'Buick', 'Bugatti',
    'Cadillac', 'Chevrolet', 'Chrysler', 'Citroën',
    'Datsun', 'Dodge',
    'Ferrari', 'Fiat', 'Ford',
    'Genesis', 'GMC',
    'Honda', 'Hummer', 'Hyundai',
    'Infiniti', 'Isuzu',
    'Jaguar', 'Jeep',
    'Kia',
    'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus',
    'Maserati', 'Mazda', 'McLaren', 'Mercedes', 'Mercury', 'Mini', 'Mitsubishi',
    'Nissan',
    'Oldsmobile',
    'Peugeot', 'Plymouth', 'Pontiac', 'Porsche',
    'Ram', 'Renault', 'Rolls Royce', 'Rover',
    'Saab', 'Saturn', 'Scion', 'Subaru', 'Suzuki',
    'Tesla', 'Toyota',
    'Volkswagen', 'Volvo',
  ],
  holiday: [
    'April Fools', 'Arbor Day', 'Ash Wednesday',
    'Boxing Day',
    'Christmas', 'Cinco de Mayo', 'Columbus Day',
    'Diwali',
    'Easter', 'Earth Day', 'Election Day',
    'Fathers Day', 'Flag Day', 'Fourth of July',
    'Good Friday', 'Groundhog Day',
    'Halloween', 'Hanukkah',
    'Independence Day',
    'Juneteenth',
    'Kwanzaa',
    'Labor Day', 'Lent', 'Lunar New Year',
    'Martin Luther King Day', 'May Day', 'Memorial Day', 'Mothers Day',
    'New Years',
    'Palm Sunday', 'Passover', 'Patriots Day', 'Presidents Day',
    'Ramadan', 'Rosh Hashanah',
    'St Patricks Day',
    'Thanksgiving',
    'Valentines Day', 'Veterans Day',
    'Yom Kippur',
  ],
  superhero: [
    'Ant-Man', 'Aquaman',
    'Batgirl', 'Batman', 'Black Panther', 'Black Widow',
    'Captain America', 'Captain Marvel', 'Catwoman', 'Cyclops',
    'Daredevil', 'Deadpool', 'Doctor Strange',
    'Elektra',
    'Falcon', 'Flash',
    'Gambit', 'Green Arrow', 'Green Lantern', 'Groot',
    'Hawkeye', 'Hulk', 'Human Torch',
    'Invisible Woman', 'Iron Man',
    'Jean Grey',
    'Loki',
    'Magneto', 'Mystique',
    'Nightcrawler',
    'Phoenix', 'Professor X', 'Punisher',
    'Robin', 'Rocket', 'Rogue',
    'Scarlet Witch', 'Shazam', 'Silver Surfer', 'Spider-Man', 'Star-Lord', 'Storm', 'Supergirl', 'Superman',
    'Thanos', 'Thing', 'Thor',
    'Vision', 'Venom',
    'War Machine', 'Wasp', 'Wolverine', 'Wonder Woman',
  ],
  emotion: [
    'Admiration', 'Adoration', 'Affection', 'Agitation', 'Agony', 'Alarm', 'Amazement', 'Amusement', 'Anger', 'Anguish', 'Annoyance', 'Anticipation', 'Anxiety', 'Apathy', 'Apprehension', 'Awe',
    'Bewilderment', 'Bitterness', 'Bliss', 'Boredom',
    'Calm', 'Caution', 'Cheerfulness', 'Compassion', 'Confidence', 'Confusion', 'Contempt', 'Contentment', 'Courage', 'Curiosity',
    'Defeat', 'Defiance', 'Delight', 'Depression', 'Desire', 'Despair', 'Determination', 'Disappointment', 'Disbelief', 'Discomfort', 'Disgust', 'Dismay', 'Distress', 'Doubt', 'Dread',
    'Eagerness', 'Ecstasy', 'Elation', 'Embarrassment', 'Empathy', 'Enthusiasm', 'Envy', 'Euphoria', 'Exasperation', 'Excitement', 'Exhaustion',
    'Faith', 'Fear', 'Fondness', 'Frustration', 'Fury',
    'Giddiness', 'Gladness', 'Glee', 'Gloom', 'Gratitude', 'Greed', 'Grief', 'Guilt',
    'Happiness', 'Hatred', 'Hope', 'Hopelessness', 'Horror', 'Hostility', 'Humiliation', 'Hurt', 'Hysteria',
    'Impatience', 'Indifference', 'Indignation', 'Insecurity', 'Inspiration', 'Interest', 'Irritation',
    'Jealousy', 'Joy', 'Jubilation',
    'Kindness',
    'Loneliness', 'Longing', 'Love', 'Lust',
    'Melancholy', 'Misery', 'Moodiness',
    'Nervousness', 'Nostalgia',
    'Optimism', 'Outrage', 'Overwhelm',
    'Panic', 'Passion', 'Patience', 'Peace', 'Pity', 'Pleasure', 'Pride',
    'Rage', 'Regret', 'Rejection', 'Relief', 'Reluctance', 'Remorse', 'Resentment', 'Resignation', 'Restlessness', 'Revulsion',
    'Sadness', 'Satisfaction', 'Scorn', 'Serenity', 'Shame', 'Shock', 'Sorrow', 'Spite', 'Stress', 'Stubbornness', 'Surprise', 'Suspicion', 'Sympathy',
    'Tenderness', 'Tension', 'Terror', 'Thrill', 'Timidity', 'Tolerance', 'Torment', 'Triumph', 'Trust',
    'Uncertainty', 'Unease',
    'Vanity', 'Vengeance', 'Vulnerability',
    'Warmth', 'Weariness', 'Woe', 'Wonder', 'Worry', 'Wrath',
    'Yearning',
    'Zeal', 'Zest',
  ],
  food: [
    'Almond', 'Apple', 'Apricot', 'Artichoke', 'Asparagus', 'Avocado',
    'Bacon', 'Bagel', 'Banana', 'Beans', 'Beef', 'Beet', 'Berry', 'Biscuit', 'Blackberry', 'Blueberry', 'Bread', 'Broccoli', 'Brownie', 'Bruschetta', 'Burrito', 'Butter',
    'Cabbage', 'Cake', 'Candy', 'Cantaloupe', 'Caramel', 'Carrot', 'Cashew', 'Cauliflower', 'Celery', 'Cereal', 'Cheese', 'Cherry', 'Chicken', 'Chili', 'Chips', 'Chocolate', 'Clam', 'Cobbler', 'Coconut', 'Cookie', 'Corn', 'Crab', 'Cracker', 'Cranberry', 'Cream', 'Crepe', 'Croissant', 'Cucumber', 'Cupcake', 'Curry',
    'Danish', 'Date', 'Donut', 'Dumpling',
    'Eclair', 'Egg', 'Eggplant', 'Enchilada',
    'Falafel', 'Fig', 'Fish', 'Flan', 'Focaccia', 'Fondue', 'Fries', 'Frittata', 'Frosting', 'Fudge',
    'Garlic', 'Gelato', 'Ginger', 'Gnocchi', 'Granola', 'Grape', 'Grapefruit', 'Gravy', 'Grits', 'Guacamole', 'Gumbo',
    'Ham', 'Hamburger', 'Honey', 'Hot dog', 'Hummus',
    'Ice cream',
    'Jam', 'Jelly', 'Jerky',
    'Kale', 'Kebab', 'Ketchup', 'Kiwi',
    'Lamb', 'Lasagna', 'Lemon', 'Lentil', 'Lettuce', 'Lime', 'Lobster',
    'Macaroni', 'Mango', 'Maple syrup', 'Marshmallow', 'Meatball', 'Melon', 'Milk', 'Mousse', 'Muffin', 'Mushroom', 'Mustard',
    'Nachos', 'Noodles', 'Nutella', 'Nuts',
    'Oatmeal', 'Olive', 'Omelet', 'Onion', 'Orange', 'Oreo',
    'Pancake', 'Papaya', 'Pasta', 'Peach', 'Peanut', 'Pear', 'Peas', 'Pecan', 'Pepper', 'Pickle', 'Pie', 'Pineapple', 'Pizza', 'Plum', 'Popcorn', 'Pork', 'Potato', 'Pretzel', 'Prune', 'Pudding', 'Pumpkin',
    'Quiche', 'Quinoa',
    'Raisin', 'Raspberry', 'Ravioli', 'Rice', 'Risotto', 'Roll',
    'Salad', 'Salmon', 'Salsa', 'Sandwich', 'Sausage', 'Scone', 'Shrimp', 'Smoothie', 'Sorbet', 'Soup', 'Spaghetti', 'Spinach', 'Squash', 'Steak', 'Stew', 'Strawberry', 'Sushi', 'Sweet potato',
    'Taco', 'Tangerine', 'Toast', 'Tofu', 'Tomato', 'Tortilla', 'Truffle', 'Tuna', 'Turkey', 'Turnip',
    'Vanilla',
    'Waffle', 'Walnut', 'Watermelon', 'Wheat',
    'Yogurt',
    'Zucchini',
  ],
  city: [
    'Albuquerque', 'Anchorage', 'Atlanta', 'Austin',
    'Baltimore', 'Boise', 'Boston', 'Buffalo',
    'Charlotte', 'Chicago', 'Cincinnati', 'Cleveland', 'Columbus',
    'Dallas', 'Denver', 'Detroit', 'Durham',
    'El Paso', 'Eugene',
    'Fort Worth', 'Fresno',
    'Glendale', 'Greensboro',
    'Hartford', 'Honolulu', 'Houston',
    'Indianapolis', 'Irvine',
    'Jacksonville', 'Jersey City',
    'Kansas City', 'Knoxville',
    'Las Vegas', 'Lexington', 'Long Beach', 'Los Angeles', 'Louisville',
    'Memphis', 'Mesa', 'Miami', 'Milwaukee', 'Minneapolis',
    'Nashville', 'New Orleans', 'New York', 'Newark', 'Norfolk',
    'Oakland', 'Oklahoma City', 'Omaha', 'Orlando',
    'Philadelphia', 'Phoenix', 'Pittsburgh', 'Portland',
    'Raleigh', 'Richmond', 'Riverside',
    'Sacramento', 'Salt Lake City', 'San Antonio', 'San Diego', 'San Francisco', 'San Jose', 'Santa Fe', 'Savannah', 'Seattle', 'St Louis', 'St Paul', 'Stockton',
    'Tampa', 'Toledo', 'Tucson', 'Tulsa',
    'Virginia Beach',
    'Washington', 'Wichita',
  ],
  language: [
    'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian',
    'Basque', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese',
    'Cantonese', 'Catalan', 'Cebuano', 'Chinese', 'Croatian', 'Czech',
    'Danish', 'Dutch',
    'English', 'Esperanto', 'Estonian',
    'Farsi', 'Filipino', 'Finnish', 'French',
    'Gaelic', 'Georgian', 'German', 'Greek', 'Guarani', 'Gujarati',
    'Haitian', 'Hausa', 'Hawaiian', 'Hebrew', 'Hindi', 'Hmong', 'Hungarian',
    'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian',
    'Japanese', 'Javanese',
    'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish',
    'Lao', 'Latin', 'Latvian', 'Lithuanian',
    'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Mandarin', 'Maori', 'Marathi', 'Mongolian',
    'Navajo', 'Nepali', 'Norwegian',
    'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi',
    'Quechua',
    'Romanian', 'Russian',
    'Samoan', 'Sanskrit', 'Serbian', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish',
    'Tagalog', 'Tajik', 'Tamil', 'Telugu', 'Thai', 'Tibetan', 'Turkish', 'Turkmen',
    'Ukrainian', 'Urdu', 'Uzbek',
    'Vietnamese',
    'Welsh',
    'Xhosa',
    'Yiddish', 'Yoruba',
    'Zulu',
  ],
  insect: [
    'Ant', 'Aphid',
    'Bee', 'Beetle', 'Bedbug', 'Bumblebee', 'Butterfly',
    'Caterpillar', 'Centipede', 'Cicada', 'Cockroach', 'Cricket',
    'Dragonfly',
    'Earwig',
    'Firefly', 'Flea', 'Fly',
    'Gnat', 'Grasshopper', 'Grub',
    'Hornet', 'Horsefly',
    'Katydid',
    'Ladybug', 'Larva', 'Locust', 'Louse',
    'Maggot', 'Mantis', 'Mayfly', 'Midge', 'Millipede', 'Mite', 'Mosquito', 'Moth',
    'Pill bug',
    'Roach',
    'Scorpion', 'Silverfish', 'Spider', 'Stink bug',
    'Termite', 'Tick',
    'Wasp', 'Weevil', 'Worm',
  ],
  bird: [
    'Albatross',
    'Blackbird', 'Bluebird', 'Blue jay', 'Budgie', 'Buzzard',
    'Canary', 'Cardinal', 'Chickadee', 'Cockatoo', 'Condor', 'Cormorant', 'Crane', 'Crow', 'Cuckoo',
    'Dove', 'Duck',
    'Eagle', 'Egret', 'Emu',
    'Falcon', 'Finch', 'Flamingo',
    'Goldfinch', 'Goose', 'Grouse', 'Gull',
    'Hawk', 'Heron', 'Hummingbird',
    'Ibis',
    'Jay',
    'Kestrel', 'Kingfisher', 'Kiwi',
    'Lark', 'Loon',
    'Macaw', 'Magpie', 'Mallard', 'Martin', 'Mockingbird',
    'Nightingale',
    'Oriole', 'Osprey', 'Ostrich', 'Owl',
    'Parakeet', 'Parrot', 'Partridge', 'Peacock', 'Pelican', 'Penguin', 'Pheasant', 'Pigeon', 'Plover', 'Puffin',
    'Quail',
    'Raven', 'Robin', 'Rooster',
    'Sandpiper', 'Seagull', 'Sparrow', 'Starling', 'Stork', 'Swallow', 'Swan',
    'Tern', 'Thrush', 'Toucan', 'Turkey', 'Turtledove',
    'Vulture',
    'Warbler', 'Woodpecker', 'Wren',
  ],
  fish: [
    'Anchovy', 'Angelfish',
    'Barracuda', 'Bass', 'Blowfish', 'Bluefish', 'Bream',
    'Carp', 'Catfish', 'Clownfish', 'Cod', 'Crab',
    'Dory',
    'Eel',
    'Flounder',
    'Goldfish', 'Grouper', 'Guppy',
    'Haddock', 'Halibut', 'Herring',
    'Koi',
    'Lobster',
    'Mackerel', 'Mahi mahi', 'Marlin', 'Minnow', 'Mullet', 'Mussel',
    'Octopus', 'Oyster',
    'Perch', 'Pike', 'Piranha',
    'Ray',
    'Salmon', 'Sardine', 'Sea bass', 'Seahorse', 'Shark', 'Shrimp', 'Snapper', 'Sole', 'Squid', 'Starfish', 'Sturgeon', 'Swordfish',
    'Tilapia', 'Trout', 'Tuna',
    'Walleye', 'Whale',
  ],
  reptile: [
    'Alligator', 'Anaconda',
    'Boa', 'Box turtle',
    'Caiman', 'Chameleon', 'Cobra', 'Copperhead', 'Coral snake', 'Cottonmouth', 'Crocodile',
    'Dragon',
    'Gecko', 'Gila monster',
    'Iguana',
    'King cobra', 'King snake', 'Komodo dragon',
    'Lizard',
    'Mamba', 'Monitor',
    'Python',
    'Rattlesnake',
    'Salamander', 'Sea turtle', 'Skink', 'Slider', 'Snapping turtle',
    'Terrapin', 'Tortoise', 'Tuatara', 'Turtle',
    'Viper',
  ],
  dance: [
    'Ballet', 'Ballroom', 'Bolero', 'Breakdancing', 'Cha cha',
    'Disco',
    'Flamenco', 'Foxtrot',
    'Hip hop', 'Hustle',
    'Jazz', 'Jive',
    'Lambada', 'Line dance', 'Lindy hop',
    'Mambo', 'Merengue', 'Minuet',
    'Polka',
    'Quickstep',
    'Rumba',
    'Salsa', 'Samba', 'Square dance', 'Swing',
    'Tango', 'Tap', 'Two step', 'Twist',
    'Waltz',
  ],
  show: [
    'American Idol', 'Avatar',
    'Breaking Bad', 'Bridgerton', 'Brooklyn Nine-Nine',
    'CSI', 'Cobra Kai', 'Criminal Minds',
    'Dexter', 'Downton Abbey',
    'ER',
    'Fleabag', 'Frasier', 'Friends',
    'Game of Thrones', 'Gilmore Girls', 'Greys Anatomy',
    'House', 'How I Met Your Mother',
    'Inception',
    'Jeopardy', 'Jurassic Park',
    'Kill Bill',
    'Law and Order', 'Lost',
    'Matrix', 'Modern Family',
    'NCIS',
    'Office', 'Ozark',
    'Parks and Recreation', 'Pulp Fiction',
    'Seinfeld', 'Shrek', 'Stranger Things', 'Suits', 'Survivor',
    'The Bachelor', 'The Simpsons', 'Titanic', 'Top Gun',
    'Walking Dead', 'Wednesday', 'Wheel of Fortune',
  ],
};
