import React from 'react';
import { Mail, Github, Linkedin, Facebook, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer({ sidebarMarginClass = '' }) {
  return (
    <footer className="w-full bg-green-900 text-white pt-16 pb-8 px-4 pl-50 mt-auto relative overflow-hidden transition-all duration-300">
      {/* Animated/static background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEigB8iI5tb8WSVBuVUGc9UjjB8O0708X7Fdic_4O1LT4CmLHoiwhanLXiRhe82yw0R7LgACQ2IhZaTY0hhmGi0gYp_Ynb49CVzfmXtYHUVKgXXpWvJ_oYT8cB4vzsnJLe3iCwuzj-w6PeYq_JaHmy_CoGoa6nw0FBo-2xLdOPvsLTh_fmYH2xhkaZ-OGQ/s16000/footer_bg.png"
          alt="footer bg"
          className="w-full h-64 object-cover absolute bottom-0 left-0 opacity-30"
        />
      </div>
      <div className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 relative z-10 ${sidebarMarginClass.replace('ml-', 'pl-')}`}>
        {/* Get in Touch */}
        <div>
          <h3 className="font-bold text-lg mb-4">Get in Touch</h3>
          <p className="text-gray-200 text-sm mb-4">Don't miss any updates of our new templates and extensions!</p>
          <form className="flex flex-col gap-2">
            <input type="email" placeholder="Email" className="rounded-lg px-4 py-2 bg-green-800 text-white placeholder:text-green-200 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400" />
            <button type="submit" className="rounded-lg px-4 py-2 bg-white text-green-900 font-bold hover:bg-green-100 transition">Subscribe</button>
          </form>
        </div>
        {/* Download */}
        <div>
          <h3 className="font-bold text-lg mb-4">Download</h3>
          <ul className="flex flex-col gap-2 text-gray-200 text-sm">
            <li><a href="#" className="hover:text-white transition">Company</a></li>
            <li><a href="#" className="hover:text-white transition">Android App</a></li>
            <li><a href="#" className="hover:text-white transition">iOS App</a></li>
            <li><a href="#" className="hover:text-white transition">Desktop</a></li>
            <li><a href="#" className="hover:text-white transition">Projects</a></li>
            <li><a href="#" className="hover:text-white transition">My tasks</a></li>
          </ul>
        </div>
        {/* Help */}
        <div>
          <h3 className="font-bold text-lg mb-4">Help</h3>
          <ul className="flex flex-col gap-2 text-gray-200 text-sm">
            <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            <li><a href="#" className="hover:text-white transition">Terms & Conditions</a></li>
            <li><a href="#" className="hover:text-white transition">Reporting</a></li>
            <li><a href="#" className="hover:text-white transition">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition">Support Policy</a></li>
            <li><a href="#" className="hover:text-white transition">Privacy</a></li>
          </ul>
        </div>
        {/* Team Solutions / Social */}
        <div>
          <h3 className="font-bold text-lg mb-4">Team Solutions</h3>
          <div className="flex gap-3 mb-4">
            <a href="#" className="rounded-full bg-green-800 p-2 hover:bg-green-700 transition"><Facebook className="h-5 w-5 text-white" /></a>
            <a href="#" className="rounded-full bg-green-800 p-2 hover:bg-green-700 transition"><Twitter className="h-5 w-5 text-white" /></a>
            <a href="#" className="rounded-full bg-green-800 p-2 hover:bg-green-700 transition"><Linkedin className="h-5 w-5 text-white" /></a>
            <a href="#" className="rounded-full bg-green-800 p-2 hover:bg-green-700 transition"><Github className="h-5 w-5 text-white" /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 border-t border-green-800 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-300 relative z-10">
        <div>&copy; {new Date().getFullYear()} Rentify. All rights reserved.</div>
        <div>Made with <span className="text-red-400">&#10084;</span> for property lovers.</div>
      </div>
    </footer>
  );
}

export default Footer; 