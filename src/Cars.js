import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios';
import './Car.css'; // Link to your new styles
//import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './images/logo.png';
import auto_logos from './images/auto_logos.png'
import Footer from './Footer';


const Cars = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions,setSuggestions] = useState([]);
  
  const resultsRef = useRef(null);
  const [filters, setFilters] = useState({
    color: '',
    fuel_type: '',
    car_type: '',
    tier_type: '',
    seats: '',
    price: '',
    engine_model: '',
    made:'',
  });


  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carImages = [
    require('./images/carimage1.jpg'),
    require('./images/carimage2.jpg'),
    require('./images/carimage3.jpg'),
    require('./images/carimage4.jpg'),
    require('./images/carimage5.jpg'),
    require('./images/carimage6.jpg'),
    require('./images/carimage7.jpg'),
    require('./images/carimage8.jpg'),
    require('./images/carimage9.jpg'),
    require('./images/carimage12.jpg'),
    require('./images/carimage13.jpg'),
    require('./images/carimage14.jpg')
  ];


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carImages.length);
    }, 3000); // Change image every 3 seconds


    return () => clearInterval(interval); // Cleanup on component unmount
  }, [carImages.length]);


  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };


  // Apply filters
  const applyFilters = async () => {
    try {
      const response = await axios.get('http://localhost:5000/car_tb', {
        params: filters, // Pass filters as query parameters
      });
      setCars(response.data);
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }

    } catch (error) {
      console.error('Error during the request:', error.message);
    }
  };

  // Fetch suggestions as the user types
    const fetchSuggestions = async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
    
      try {
        const response = await axios.post("http://localhost:5000/cars/suggestions", { query });
        setSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error.message);
        setSuggestions([]);
      }
    };


  const applySearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await axios.post("http://localhost:5000/cars/search", { query: searchQuery });
      if (Array.isArray(response.data)) {
        setCars(response.data);
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }

      } else {
        //setError("No cars found for your search");
      }
    } catch (error) {
      console.error("Error during search:", error.message);
      setError("An error occurred while fetching the cars.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion); // Set the clicked suggestion as the query
    setSuggestions([]);
    applySearch(); // Clear suggestions after selection
  };




  // Apply search
  // const applySearch = async () => {
  //   try {
  //     const response = await axios.post('http://localhost:5000/cars/search', { query: searchQuery });
  //     setCars(response.data);
  //   } catch (error) {
  //     console.error('Error during search:', error.message);
  //   }
  // };

  

  return (
    <div className='body-section'> <center>
      <div className="containe">
    <div className="menu-bar">
      <div className="name-logo">
        <img src={logo} alt="Website Logo" className="logo-img" />
        <h1 className="logo-title">Dream Cars</h1>
      </div>


      <div className="ai-search">
      <input
        type="text"
        className="search-input"
        placeholder="Find your best match...!!"
        value={searchQuery || ''}
        onChange={(e) => {
          const value = e.target.value;
          setSearchQuery(value);
          fetchSuggestions(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            applySearch();
          }
        }}
        aria-label="Search"
      />
      <button
        className="search-btn"
        onClick={applySearch}
        aria-label="Apply Search"
      >
        <i className="bi bi-search"></i>
      </button>

{suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
            {suggestion}
          </li>
          ))}
        </ul>
      )}


      {loading && <p>Loading...</p>}
  {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>




      <nav className="menu-links">
        <a href="#latest" className="menu-link"><h4>Latest</h4></a>
        <a href="#used" className="menu-link"><h4>Used</h4></a>
        <a href="#login" className="menu-link login-link">
          <i className="bi bi-person-fill"></i> <h4>Login</h4>
        </a>
      </nav>
    </div>
 <div className="banner" >
 <div className="slider" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
        {carImages.map((image, index) => (
          <div
            key={index}
            className="slide"
            style={{ backgroundImage: `url(${image})` }}
          ></div>
        ))}
      </div>
 <div className="filters">
            <h2>Customize</h2>
            <select name="color" onChange={handleFilterChange}>
              <option value="">Color</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
              <option value="Yellow">Yellow</option>
              <option value="Grey">Grey</option>
              <option value="Green">Green</option>
              <option value="Silver">Silver</option>
            </select>


            <select name="fuel_type" onChange={handleFilterChange}>
              <option value="">Fuel Type</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Natural Gas">Natural Gas</option>
            </select>


            <select name="car_type" onChange={handleFilterChange}>
              <option value="">Car Type</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Sports">Sports</option>
              <option value="SUV">SUV</option>
              <option value="Convertible">Convertible</option>
              <option value="Coupe">Coupe</option>
              <option value="Wagon">Wagon</option>
              <option value="Minivan">Minivan</option>
              <option value="Luxury">Luxury</option>
            </select>


            <select name="brand" onChange={handleFilterChange}>
              <option value="">Brand</option>
              <option value="Tata">Tata</option>
              <option value="Skoda">Skoda</option>
              <option value="Toyota">Toyota</option>
              <option value="Hyundai">Hyundai</option>
              <option value="Porsche">Porsche</option>
              <option value="Honda">Honda</option>
              <option value="Mercedes-Benz">Mercedes-Benz</option>
              <option value="Ford">Ford</option>
              <option value="BMW">BMW</option>
              <option value="Maruti">Maruti Suzuki</option>
              <option value="Rolls-Royce">Rolls-Royce</option>
              <option value="Audi">Audi</option>
              <option value="Lexus">Lexus</option>
              <option value="Kia">Kia</option>
              <option value="Renault">Renault</option>
              <option value="Tesla">Tesla</option>
              <option value="Skoda">Skoda</option>
              <option value="Ferrari">Ferrari</option>
              <option value="Audi">Audi</option>
              <option value="Nissan">Nissan</option>
              <option value="Jaguar">Jaguar</option>
              <option value="Lamborghini">Lamborghini</option>
              <option value="Volkswagen">Volkswagen</option>
              <option value="Land-Rover">Land Rover</option>
            </select>



            <select name="made" onChange={handleFilterChange}>
            <option value="">Made In</option>
              <option value="India">India</option>
              <option value="South Korea">South Korea</option>
              <option value="Germany">Germany</option>
              <option value="Japan">Japan</option>
              <option value="USA">USA</option>
              <option value="Czech Republic">Czech Republic</option>
              <option value="Italy">Italy</option>
              <option value="UK">UK</option>
            </select>


            <select name="seats" onChange={handleFilterChange}>
              <option value="">Seats</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>

            <select name="airbags" onChange={handleFilterChange}>
              <option value="">Airbags</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>


            <select name="price" onChange={handleFilterChange}>
              <option value="">Price Range</option>
              <option value="3L to 10L">3L to 10L</option>
              <option value="10L to 20L">10L to 20L</option>
              <option value="20L to 40L">20L to 40L</option>
              <option value="above 50L">Above 50L</option>
            </select>


            <select name="engine_model" onChange={handleFilterChange}>
              <option value="">Engine Model</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>


            <button onClick={applyFilters}>Apply Filters</button>
          </div>
    </div>
      </div>


      <div className='ads-section'> <center>
      <h2> Planning to buy a new car?</h2>
          <p>
         
 
 Looking for your new car? Welcome to CarDekho.com! We at CarDekho understand its one of the most important decision as you choose your car.
 A loads of tools will help you zero in to your dream car. Check out complete car specs, expert review, user reviews, pictures, videos, 360 views and road tests done by our experts. Complete dealer information is available readily.
 Once you zero into a few cars we understand the comparison is what comes to the mind first. CarDekho offers a comprehensive comparison tool for new cars which will help you choose car of your choice.
 Apart from this we also provide great deals on new car loans and insurance. We hope you are able to find your dream car here!
          </p></center>
      </div>
     


      <div ref={resultsRef} className="results">
       
        <div className="car-container-list">
          {cars.length > 0 ? (
            cars.map((car, index) => (
              <div key={index} className="car-container">
                <img
                  src={car.image}
                  alt={car.model}
                  className="car-image"
                  style={{ width: '330px', height: 'auto' }}
                />
                <div className="car-details">
                  <h3 className="car-name">{car.model}</h3>
                  <p className="car-price"><b>Rs. {car.price}</b></p>
                  <p className="car-type">Type: {car.car_type}</p>
                 
                  <p className="car-mileage">Mileage: {car.mileage}</p>
                  <p className="car-fuel">Fuel Type: {car.fuel_type}</p>
                 
                  <button className="view-details-btn">View Details</button>
                </div>
              </div>
            ))
          ) : (
            <p>No results found</p>
          )}
        </div>
      </div>
     
      <div className='brand-logo'>
          <center>
           
            <img src={auto_logos} alt='brand-logos'></img>
          </center>
      </div>


      <div className='footer-section'><Footer/></div>
     
      </center>
    </div>
  );
};


export default Cars;