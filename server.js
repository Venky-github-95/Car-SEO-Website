import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import nlp from 'compromise';

dotenv.config({ path: '.env' });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Schema for Cars
const carSchema = new mongoose.Schema(
  {
    price: Number,
    color: String,
    seats: Number,
    fuel_type: String,
    tierType: String,
    model: String,
    car_type: String,
    mileage: String,
    brand: String,
    engine_model: String,
    image: String, // Field for storing image URLs
    made: String,
    airbags: Number,
  },
  { collection: 'cars_table' }
);

carSchema.index({
  brand: 'text',
  made: 'text',
  car_type: 'text',
  color: 'text',
  fuel_type: 'text',
}); // Text index for prioritization

const Car = mongoose.model('cars_table', carSchema);

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Save uploaded files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename with timestamp
  },
});
const upload = multer({ storage });

// Use import.meta.url to get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static route for serving uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Endpoints

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  const filePath = `/uploads/${req.file.filename}`;
  // Save the file path in MongoDB (in the image field)
  const newCar = new Car({
    image: filePath, // Save the image URL to the database
    // Include other fields if necessary
  });

  newCar.save()
    .then(() => {
      res.json({
        message: 'File uploaded successfully',
        filePath,
      });
    })
    .catch((err) => res.status(500).send('Error saving image to database: ' + err));
});

// Get cars with filters
app.get('/car_tb', async (req, res) => {
  const filters = {};

  // Parse filters from query params
  Object.entries(req.query).forEach(([key, value]) => {
    if (value) {
      if (key === 'price') {
        // Handle price ranges
        if (value === '3L to 10L') {
          filters.price = { $gte: 300000, $lte: 1000000 };
        } else if (value === '10L to 20L') {
          filters.price = { $gte: 1000000, $lte: 2000000 };
        } else if (value === '20L to 40L') {
          filters.price = { $gte: 2000000, $lte: 4000000 };
        } else if (value === 'above 50L') {
          filters.price = { $gte: 5000000 };
        }
      } else if (key === 'seats') {
        filters.seats = parseInt(value);
      } else {
        filters[key] = value;
      }
    }
  });

  try {
    const cars = await Car.find(filters);

    // Prepend base URL to image path
    cars.forEach(car => {
      if (car.image) {
        car.image = `http://127.0.0.1:5000${car.image}`;
      }
    });

    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving cars', error: err });
  }
});



app.post("/cars/suggestions", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.json([]);
    }

    // Use NLP to extract potential keywords from the sentence
    const doc = nlp(query);
    const keywords = [
      ...doc.match("#Color").out("array"), // Extract colors
      ...doc.match("#Noun").out("array"), // Extract nouns (could be models/brands)
    ];

    // Fallback to regex-based approach if NLP doesn't extract much
    const searchTerms = keywords.length ? keywords : query.split(/\s+/);

    // Create a dynamic query using extracted terms
    const searchQuery = {
      $or: searchTerms.map((term) => ({
        $or: [
          { model: { $regex: term, $options: "i" } },
          { brand: { $regex: term, $options: "i" } },
          { color: { $regex: term, $options: "i" } },
          { fuel_type: { $regex: term, $options: "i" } },
          { car_type: { $regex: term, $options: "i" } },
        ],
      })),
    };

    // Fetch suggestions from the database
    const suggestions = await Car.find(searchQuery);

    // Apply scoring to prioritize exact matches
    const scoredSuggestions = suggestions
      .map((car) => {
        let score = 0;
        searchTerms.forEach((term) => {
          if (car.model?.toLowerCase().includes(term.toLowerCase())) score += 2;
          if (car.brand?.toLowerCase().includes(term.toLowerCase())) score += 2;
          if (car.color?.toLowerCase().includes(term.toLowerCase())) score += 1;
          if (car.fuel_type?.toLowerCase().includes(term.toLowerCase())) score += 1;
          if (car.car_type?.toLowerCase().includes(term.toLowerCase())) score += 1;
        });
        return { car, score };
      })
      .sort((a, b) => b.score - a.score) // Sort by descending score
      .map((entry) => entry.car); // Extract cars from scored entries

    // Limit to top 5 suggestions
    const suggestionList = scoredSuggestions.slice(0, 5).map(
      (car) => `${car.brand} ${car.model} ${car.car_type} ${car.fuel_type}`
      
    );

    res.json(suggestionList);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.post('/cars/search', async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query is required' });
  }

 
  let lowerCaseQuery = query.trim().toLowerCase();
  const filters = {};
  
  // Handle common phrases like "I want a", "car with", "looking for", etc.
  const commonPhrases = [
    { phrase: 'i want a', replacement: '' },
    { phrase: 'car with', replacement: '' },
    { phrase: 'looking for', replacement: '' },
    { phrase: 'find me', replacement: '' },
    { phrase: 'show me', replacement: '' },
    { phrase: 'buy a', replacement: '' },
    { phrase: 'search for', replacement: '' },
    { phrase: 'looking for a', replacement: '' },
    { phrase: 'need a', replacement: '' },
  ];

  // Remove common phrases from the query
  commonPhrases.forEach((item) => {
    if (lowerCaseQuery.includes(item.phrase)) {
      lowerCaseQuery = lowerCaseQuery.replace(item.phrase, item.replacement);
    }
  });

  // Handle car brands
  const brandMap = { 
    tata : 'Tata',
    skoda : 'Skoda',
    maruti : 'Maruti',
    toyota: 'Toyota',
    honda: 'Honda',
    porsche: 'Porsche',
    bmw: 'BMW',
    ford: 'Ford',
    tesla: 'Tesla',
    mercedes: 'Mercedes-Benz',
    audi: 'Audi',
    nissan: 'Nissan',
    volkswagen: 'Volkswagen',
    hyundai: 'Hyundai',
    kia: 'Kia',
    chevrolet: 'Chevrolet',
    jeep: 'Jeep',
    porsche: 'Porsche',
    jaguar: 'Jaguar',
    lexus: 'Lexus',
    ferrari: 'Ferrari',
    lamborghini: 'Lamborghini',
    rollsroyce:'Rolls-Royce',
    renault: 'Renault',
  };

  for (const [key, value] of Object.entries(brandMap)) {
    if (lowerCaseQuery.includes(key)) {
      filters.brand = { $regex: `^${value}$`, $options: 'i' }; // Case-insensitive exact match for brand
      break;
    }
  }


  //Handle Car Made

  const carMade={
    india: 'India',
    southkorea: 'South Korea',
    germany: 'Germany',
    japan: 'Japan',
    usa: 'USA',
    czechRepublic :'Czech Republic',
    italy :'Italy',
    uk : 'UK'
  }

  for (const [key, value] of Object.entries(carMade)) {
    if (lowerCaseQuery.includes(key)) {
      filters.made = { $regex: `^${value}$`, $options: 'i' }; // Match car type
      break;
    }
  }


  // Handle custom phrases for car types
  const carTypeMap = {
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    suv: 'SUV',
    sports: 'Sports',
    convertible: 'Convertible',
    coupe: 'Coupe',
    minivan: 'Minivan',
    wagon: 'Wagon',
    luxury: 'Luxury',
    compact: 'Compact',
    familyCar: 'Family Car',
    twoseater: 'Sports', // Custom phrase for 2-seater cars
    familyFriendly: 'Family Car',
    affordableCar: 'Compact',
    highendcar: 'Luxury',
    ecofriendlyCar: 'Electric', // Assuming eco-friendly refers to Electric cars
  };

  for (const [key, value] of Object.entries(carTypeMap)) {
    if (lowerCaseQuery.includes(key)) {
      filters.car_type = { $regex: `^${value}$`, $options: 'i' }; // Match car type
      break;
    }
  }

  // Handle custom phrases for seats (e.g., "2-seater", "family car", etc.)
  const seatMap = {
    couple: 2,        // "Couple" maps to 2 seats
    small: 2,         // "Small" may refer to 2-seater cars
    compact: 4,       // "Compact" typically refers to 4-seater cars
    family: 4,        // "Family" usually refers to 4-seater cars
    luxury: 5,        // "Luxury" typically refers to cars with 5 seats
    sports: 2,        // "Sports" cars usually have 2 seats
    minivan: 7,       // "Minivan" usually has 7 seats
    threeseater: 3,    // Custom phrase for 3-seater cars
    fourseater: 4,    // Custom phrase for 4-seater cars
  };

  for (const [key, value] of Object.entries(seatMap)) {
    if (lowerCaseQuery.includes(key)) {
      filters.seats = value;
      break;
    }
  }

  // Handle color search (Expanded to support more colors)
  const colorMap = {
    red: 'Red',
    blue: 'Blue',
    white: 'White',
    black: 'Black',
    yellow: 'Yellow',
    green: 'Green',
    gray: 'Gray',
    silver: 'Silver',
    brown: 'Brown',
    orange: 'Orange',
    purple: 'Purple',
    gold: 'Gold',      // Added Gold as a color
    beige: 'Beige',    // Added Beige as a color
  };

  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerCaseQuery.includes(key)) {
      filters.color = value;
      break;
    }
  }


  // Handle price ranges or exact values
if (lowerCaseQuery.match(/(\d+)\s*(l|lakhs)/)) {
  const priceValue = parseInt(lowerCaseQuery.match(/(\d+)/)[0]) * 100000; // Convert lakhs to absolute numbers
  if (lowerCaseQuery.includes('under')) {
    filters.price = { $lte: priceValue };
  } else if (lowerCaseQuery.includes('above')) {
    filters.price = { $gte: priceValue };
  } else {
    // Handle range queries like "10L to 20L"
    const rangeMatch = lowerCaseQuery.match(/(\d+)\s*(l|lakhs)\s*to\s*(\d+)\s*(l|lakhs)/);
    if (rangeMatch) {
      const minPrice = parseInt(rangeMatch[1]) * 100000;
      const maxPrice = parseInt(rangeMatch[3]) * 100000;
      filters.price = { $gte: minPrice, $lte: maxPrice };
    } else {
      // Exact match (e.g., "15L car")
      filters.price = { $gte: priceValue, $lte: priceValue + 100000 }; // Approximation
    }
  }
}


  // Handle fuel types (Expanded to include more types)
  const fuelTypeMap = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
    naturalGas: 'Natural Gas',  // Added Natural Gas as a fuel type
  };

  for (const [key, value] of Object.entries(fuelTypeMap)) {
    if (lowerCaseQuery.includes(key)) {
      filters.fuel_type = value;
      break;
    }
  }

  const airbagsMap = {
    '2 airbags': 2,
    '3 airbags': 3,    // "2 airbags" maps to 2 airbags
    '4 airbags': 4, 
    '5 airbags': 5,   // "4 airbags" maps to 4 airbags
    '6 airbags': 6,
    '7 airbags': 7,    // "6 airbags" maps to 6 airbags
    '8 airbags': 8,    // "8 airbags" maps to 8 airbags
  };

  for (const [key, value] of Object.entries(airbagsMap)) {
    if (lowerCaseQuery.includes(key)) {
      filters.airbags = value;
      break;
    }
  }

  // Handle engine models
  if (lowerCaseQuery.includes('manual')) filters.engine_model = 'Manual';
  if (lowerCaseQuery.includes('automatic')) filters.engine_model = 'Automatic';

  // If no valid filters are set (i.e., no car type, color, or other attributes), return an error message
  if (Object.keys(filters).length === 0) {
    return res.json({ message: "No valid filters or car type found." });
  }

  try {
    // Use text search for relevance scoring
    let cars = await Car.find(
      { $text: { $search: lowerCaseQuery } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } }) // Sort by text relevance
      .lean(); // Return plain JavaScript objects for manipulation

    // If text search results are empty, fallback to manual relevance scoring
    if (cars.length === 0) {
      cars = await Car.find(filters).lean(); // Regular find without text search
    }

    // Add manual relevance scoring for exact matches
    const relevanceScore = (car) => {
      let score = 0;
      if (lowerCaseQuery.includes(car.brand?.toLowerCase())) score += 3;
      if (lowerCaseQuery.includes(car.model?.toLowerCase())) score += 3;
      if (lowerCaseQuery.includes(car.car_type?.toLowerCase())) score += 2;
      if (lowerCaseQuery.includes(car.fuel_type?.toLowerCase())) score += 1;
      return score;
    };

    // If cars are found from manual search or text search, apply custom scoring
    cars.forEach((car) => {
      car.customScore = relevanceScore(car);
    });

    // Sort cars based on the custom relevance score
    cars.sort((a, b) => b.customScore - a.customScore);

    // Prepend base URL to image path for each car
    cars.forEach((car) => {
      if (car.image) {
        car.image = `http://127.0.0.1:5000${car.image}`;
      }
    });

    // If cars are found, return them
    if (cars.length > 0) {
      return res.json(cars);
    } else {
      return res.json({ message: "No cars found based on the search criteria." });
    }

  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).send("Error occurred while searching for cars.");
  }
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
