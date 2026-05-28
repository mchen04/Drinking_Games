export interface TriviaQuestion {
  q: string;
  options: [string, string, string, string];
  /** zero-based index of the correct option */
  answer: number;
  category: string;
}

export const QUESTIONS: TriviaQuestion[] = [
  // General knowledge
  {
    q: "What is the capital city of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    answer: 2,
    category: "General",
  },
  {
    q: "How many sides does a hexagon have?",
    options: ["5", "7", "8", "6"],
    answer: 3,
    category: "General",
  },
  {
    q: "Which planet is closest to the Sun?",
    options: ["Venus", "Earth", "Mercury", "Mars"],
    answer: 2,
    category: "General",
  },
  {
    q: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: 2,
    category: "General",
  },
  {
    q: "In what year did World War II end?",
    options: ["1943", "1944", "1946", "1945"],
    answer: 3,
    category: "General",
  },
  {
    q: "Which country gifted the Statue of Liberty to the United States?",
    options: ["Italy", "United Kingdom", "France", "Spain"],
    answer: 2,
    category: "General",
  },
  {
    q: "How many bones are in the adult human body?",
    options: ["206", "182", "215", "198"],
    answer: 0,
    category: "General",
  },
  {
    q: "What is the longest river in the world?",
    options: ["Amazon", "Mississippi", "Yangtze", "Nile"],
    answer: 3,
    category: "General",
  },
  // Pop culture
  {
    q: "Which TV show features characters named Walter White and Jesse Pinkman?",
    options: ["Dexter", "Breaking Bad", "Ozark", "Narcos"],
    answer: 1,
    category: "Pop Culture",
  },
  {
    q: "How many Infinity Stones are there in the Marvel Cinematic Universe?",
    options: ["5", "7", "6", "8"],
    answer: 2,
    category: "Pop Culture",
  },
  {
    q: "Which singer released the album '1989'?",
    options: ["Ariana Grande", "Katy Perry", "Taylor Swift", "Dua Lipa"],
    answer: 2,
    category: "Pop Culture",
  },
  {
    q: "What is the name of Tony Stark's AI assistant in Iron Man (2008)?",
    options: ["Friday", "Jarvis", "Vision", "Ultron"],
    answer: 1,
    category: "Pop Culture",
  },
  {
    q: "In 'Friends', what is the name of Ross's pet monkey?",
    options: ["Bananas", "Bubbles", "Marcel", "Bobo"],
    answer: 2,
    category: "Pop Culture",
  },
  {
    q: "Which movie features the line 'You can't handle the truth!'?",
    options: ["The Godfather", "A Few Good Men", "Goodfellas", "Scarface"],
    answer: 1,
    category: "Pop Culture",
  },
  {
    q: "Who played Jack Dawson in Titanic (1997)?",
    options: ["Brad Pitt", "Matt Damon", "Tom Hanks", "Leonardo DiCaprio"],
    answer: 3,
    category: "Pop Culture",
  },
  {
    q: "What is the best-selling video game of all time?",
    options: ["Minecraft", "Tetris", "GTA V", "Wii Sports"],
    answer: 1,
    category: "Pop Culture",
  },
  // Booze facts
  {
    q: "What country produces Champagne wine?",
    options: ["Italy", "Spain", "Germany", "France"],
    answer: 3,
    category: "Booze Facts",
  },
  {
    q: "What is the main ingredient in whiskey?",
    options: ["Grapes", "Potatoes", "Grain", "Sugarcane"],
    answer: 2,
    category: "Booze Facts",
  },
  {
    q: "Tequila is made from which plant?",
    options: ["Cactus", "Agave", "Aloe vera", "Yucca"],
    answer: 1,
    category: "Booze Facts",
  },
  {
    q: "What gives red wine its color?",
    options: ["Added dye", "Oak barrels", "Grape skins", "Stems and seeds only"],
    answer: 2,
    category: "Booze Facts",
  },
  {
    q: "In what country was Guinness stout first brewed?",
    options: ["England", "Scotland", "Ireland", "Wales"],
    answer: 2,
    category: "Booze Facts",
  },
  {
    q: "What liquor is used in a classic Margarita?",
    options: ["Rum", "Vodka", "Gin", "Tequila"],
    answer: 3,
    category: "Booze Facts",
  },
  {
    q: "How many standard drinks are in a bottle of wine (750 ml, ~13% ABV)?",
    options: ["3", "10", "5", "7"],
    answer: 2,
    category: "Booze Facts",
  },
  {
    q: "Which cocktail is made with vodka, ginger beer and lime juice?",
    options: ["Dark 'n' Stormy", "Moscow Mule", "Mojito", "Tom Collins"],
    answer: 1,
    category: "Booze Facts",
  },
  // Fun / random
  {
    q: "How many legs does a spider have?",
    options: ["6", "10", "12", "8"],
    answer: 3,
    category: "Fun",
  },
  {
    q: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Greyhound", "Pronghorn"],
    answer: 1,
    category: "Fun",
  },
  {
    q: "How many colors are in a rainbow?",
    options: ["5", "8", "7", "6"],
    answer: 2,
    category: "Fun",
  },
  {
    q: "What is the most spoken language in the world by native speakers?",
    options: ["English", "Spanish", "Hindi", "Mandarin Chinese"],
    answer: 3,
    category: "Fun",
  },
  {
    q: "Which planet has the most moons in our solar system?",
    options: ["Jupiter", "Neptune", "Uranus", "Saturn"],
    answer: 3,
    category: "Fun",
  },
  {
    q: "How many hearts does an octopus have?",
    options: ["1", "4", "3", "2"],
    answer: 2,
    category: "Fun",
  },
  {
    q: "What is the smallest country in the world by area?",
    options: ["Monaco", "Liechtenstein", "San Marino", "Vatican City"],
    answer: 3,
    category: "Fun",
  },
  {
    q: "What percentage of the Earth's surface is covered by water?",
    options: ["55%", "80%", "71%", "63%"],
    answer: 2,
    category: "Fun",
  },
  {
    q: "Which element has the atomic number 1?",
    options: ["Helium", "Oxygen", "Carbon", "Hydrogen"],
    answer: 3,
    category: "Fun",
  },
  {
    q: "Which band performed 'Bohemian Rhapsody'?",
    options: ["Led Zeppelin", "The Rolling Stones", "Queen", "The Beatles"],
    answer: 2,
    category: "Fun",
  },
  {
    q: "What does 'www' stand for in a web address?",
    options: ["World Wide Web", "Wide World Web", "Web Wide World", "World Web Wide"],
    answer: 0,
    category: "Fun",
  },
  {
    q: "In poker, what is the highest possible hand?",
    options: ["Four of a Kind", "Straight Flush", "Royal Flush", "Full House"],
    answer: 2,
    category: "Fun",
  },
];
