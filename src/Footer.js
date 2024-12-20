// Footer.jsx
import React from "react";
import "./Footer.css";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import logo from './images/logo.png';


const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section about">
          <h2>About Us</h2>
          <p>
            We are a leading platform for all your car needs, offering a wide range of
            car parts, accessories, and services. Dedicated to quality and
            customer satisfaction.
          </p>
          <img
            src={logo}
            alt="Car Website Logo"
            className="footer-logo"
          />
        </div>


        <div className="footer-section links">
          <h2>Quick Links</h2>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>


        <div className="footer-section contact">
          <h2>Contact Us</h2>
          <p>Email: support@carwebsite.com</p>
          <p>Phone: +123-456-7890</p>
          <p>Address: 123 Car Street, Auto City, CA 12345</p>
        </div>


        <div className="footer-section social">
          <h2>Follow Us</h2>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Car Website. All rights reserved.</p>
      </div>
    </footer>
  );
};


export default Footer;
