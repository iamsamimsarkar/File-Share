const CRUST_STYLES = [
  'crispy', 'thin-crust', 'wood-fired', 'deep-dish', 'sourdough', 
  'garlic-stuffed', 'golden', 'rustic', 'hand-tossed', 'smoky',
  'blistered', 'artisan', 'fluffy', 'charred', 'buttery'
];

const CHEESES_AND_SAUCES = [
  'mozzarella', 'parmesan', 'marinara', 'pesto', 'ricotta',
  'gorgonzola', 'provolone', 'san-marzano', 'fontina', 'vodka-sauce',
  'burrata', 'mascarpone', 'asiago', 'pecorino', 'smoked-gouda'
];

const TOPPINGS = [
  'basil', 'pepperoni', 'jalapeno', 'mushroom', 'black-olive',
  'prosciutto', 'bell-pepper', 'oregano', 'truffle', 'red-onion',
  'sun-dried-tomato', 'artichoke', 'anchovy', 'rosemary', 'hot-honey'
];

export function generatePizzaRoomId(): string {
  const crust = CRUST_STYLES[Math.floor(Math.random() * CRUST_STYLES.length)];
  const cheese = CHEESES_AND_SAUCES[Math.floor(Math.random() * CHEESES_AND_SAUCES.length)];
  const topping = TOPPINGS[Math.floor(Math.random() * TOPPINGS.length)];
  const randNum = Math.floor(Math.random() * 899 + 100);
  return `${crust}-${cheese}-${topping}-${randNum}`;
}

export interface PizzaRecipe {
  id: string;
  name: string;
  description: string;
  crustColor: string;
  sauceColor: string;
  cheeseColor: string;
  toppings: ('pepperoni' | 'mushroom' | 'olive' | 'basil' | 'pepper')[];
}

export const PIZZA_RECIPES: PizzaRecipe[] = [
  {
    id: 'pepperoni-classic',
    name: 'Pepperoni Classic',
    description: 'Crispy cup-and-char pepperoni with mozzarella on rich tomato marinara',
    crustColor: '#D97706',
    sauceColor: '#DC2626',
    cheeseColor: '#FEF08A',
    toppings: ['pepperoni', 'basil'],
  },
  {
    id: 'margherita-fresh',
    name: 'Margherita DOC',
    description: 'San Marzano tomatoes, fresh buffalo mozzarella, aromatic basil & extra virgin olive oil',
    crustColor: '#D97706',
    sauceColor: '#EF4444',
    cheeseColor: '#FEF9C3',
    toppings: ['basil', 'olive'],
  },
  {
    id: 'diavola-fire',
    name: 'Spicy Diavola',
    description: 'Calabrian hot chili flakes, spicy soppressata & fire-roasted peppers',
    crustColor: '#B45309',
    sauceColor: '#B91C1C',
    cheeseColor: '#FDE047',
    toppings: ['pepperoni', 'pepper'],
  },
  {
    id: 'truffle-funghi',
    name: 'Truffle & Forest Funghi',
    description: 'Earthy cremini mushrooms, fontina cheese, fresh thyme & black truffle drizzle',
    crustColor: '#CA8A04',
    sauceColor: '#E2E8F0', // white pizza
    cheeseColor: '#FEF08A',
    toppings: ['mushroom', 'olive', 'basil'],
  },
  {
    id: 'garden-supreme',
    name: 'Ortolana Supreme',
    description: 'Crisp bell peppers, button mushrooms, kalamata olives & sweet red onion',
    crustColor: '#D97706',
    sauceColor: '#DC2626',
    cheeseColor: '#FEF08A',
    toppings: ['pepper', 'mushroom', 'olive', 'basil'],
  },
];
